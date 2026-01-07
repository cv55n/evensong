#![deny(unsafe_code)]
#![deny(clippy::clone_on_ref_ptr)]

pub mod addr;
pub mod error;

// re-exportações
pub use crate::error::Error;
pub use authc::AuthClientError;
pub use common_net::msg::ServerInfo;

pub use specs::{
    Builder, DispatcherBuilder, Entity as EcsEntity, Join, LendJoin, ReadStorage, World, WorldExt
};

use crate::addr::ConnectionArgs;
use byteorder::{ByteOrder, LittleEndian};

use common::{
    character::{CharacterId, CharacterItem},

    comp::{
        self, AdminRole, CharacterState, ChatMode, ControlAction, ControlEvent, Controller,
        ControllerInputs, GroupManip, Hardcore, InputKind, InventoryAction, InventoryEvent,
        InventoryUpdateEvent, MapMarkerChange, PresenceKind, UtteranceKind,
        chat::KillSource,
        controller::CraftEvent,
        gizmos::Gizmos,
        group,

        inventory::{
            InventorySortOrder,
            item::{ItemKind, modular, tool}
        },

        invite::{InviteKind, InviteResponse},
        skills::Skill,
        slot::{EquipSlot, InvSlotId, Slot},
    },

    event::{EventBus, LocalEvent, PluginHash, UpdateCharacterMetadata},
    grid::Grid,
    link::Is,
    lod,
    map::Marker,
    mounting::{Rider, VolumePos, VolumeRider},
    outcome::Outcome,
    recipe::{ComponentRecipeBook, RecipeBookManifest, RepairRecipeBook},
    resources::{BattleMode, GameMode, PlayerEntity, Time, TimeOfDay},
    rtsim,
    shared_server_config::ServerConstants,
    spiral::Spiral2d,

    terrain::{
        BiomeKind, CoordinateConversions, SiteKindMeta, SpriteKind, TerrainChunk, TerrainChunkSize,
        TerrainGrid, block::Block, map::MapConfig, neighbors
    },
    
    trade::{PendingTrade, SitePrices, TradeAction, TradeId, TradeResult},
    uid::{IdMaps, Uid},
    vol::RectVolSize,
    weather::{CompressedWeather, SharedWeatherGrid, Weather, WeatherGrid},
};

#[cfg(feature = "tracy")] use common_base::plot;
use common_base::{prof_span, span};
use common_i18n::Content;

use common_net::{
    msg::{
        ChatTypeContext, ClientGeneral, ClientMsg, ClientRegister, DisconnectReason, InviteAnswer,
        Notification, PingMsg, PlayerInfo, PlayerListUpdate, RegisterError, ServerGeneral,
        ServerInit, ServerRegisterAnswer,
        server::ServerDescription,
        world_msg::{EconomyInfo, PoiInfo, SiteId}
    },

    sync::WorldSyncExt
};

pub use common_net::msg::ClientType;
use common_state::State;

#[cfg(feature = "plugins")]
use common_state::plugin::PluginMgr;
use common_systems::add_local_systems;
use comp::BuffKind;
use hashbrown::{HashMap, HashSet};
use hickory_resolver::{Resolver, config::ResolverConfig, name_server::TokioConnectionProvider};
use image::DynamicImage;
use network::{ConnectAddr, Network, Participant, Pid, Stream};
use num::traits::FloatConst;
use rayon::prelude::*;
use rustls::client::danger::ServerCertVerified;
use specs::Component;

use std::{
    collections::{BTreeMap, VecDeque},
    fmt::Debug,
    mem,
    path::PathBuf,
    sync::Arc,
    time::{Duration, Instant}
};

use tokio::runtime::Runtime;
use tracing::{debug, error, trace, warn};
use vek::*;

pub const MAX_SELECTABLE_VIEW_DISTANCE: u32 = 65;

const PING_ROLLING_AVERAGE_SECS: usize = 10;

/// eventos front-end do cliente
///
/// esses eventos são retornados ao front-end que agrada
/// ao cliente
#[derive(Debug)]
pub enum Event {
    Chat(comp::ChatMsg),
    GroupInventoryUpdate(comp::FrontendItem, Uid),
    
    InviteComplete {
        target: Uid,
        answer: InviteAnswer,
        kind: InviteKind
    },

    TradeComplete {
        result: TradeResult,
        trade: PendingTrade
    },
    
    Disconnect,
    DisconnectionNotification(u64),
    InventoryUpdated(Vec<InventoryUpdateEvent>),
    Notification(UserNotification),
    SetViewDistance(u32),
    Outcome(Outcome),
    CharacterCreated(CharacterId),
    CharacterEdited(CharacterId),
    CharacterJoined(UpdateCharacterMetadata),
    CharacterError(String),
    MapMarker(comp::MapMarkerUpdate),
    StartSpectate(Vec3<f32>),
    SpectatePosition(Vec3<f32>),
    PluginDataReceived(Vec<u8>),
    Dialogue(Uid, rtsim::Dialogue<true>),
    Gizmos(Vec<Gizmos>)
}

/// uma mensagem para o usuário a ser mostrada dentro da ui
///
/// esse tipo reflete o tipo [`common_net::msg::notification`],
/// mas não inclui qualquer dado que a ui não necessite
#[derive(Debug)]
pub enum UserNotification {
    WaypointUpdated
}

#[derive(Debug)]
pub enum ClientInitStage {
    /// uma conexão com o servidor está sendo criada
    ConnectionEstablish,

    /// aguardando a versão do servidor
    WatingForServerVersion,
    
    /// estamos atualmente autenticando com o servidor
    Authentication,
    
    /// carregando dados do mapa, informações do local,
    /// informações da receita e outros dados de inicialização
    LoadingInitData,
    
    /// preparação dos dados recebidos pelo servidor para
    /// serem usados pelo cliente (inserir dados no ecs,
    /// renderizar mapa)
    StartingClient
}

pub struct WorldData {
    /// apenas a camada "base" para lod; atualmente inclui
    /// cores e nada mais. no futuro, adicionaremos mais
    /// camadas, como sombras, rios e provavelmente folhagens,
    /// cidades, estradas e outras estruturas
    pub lod_base: Grid<u32>,
    
    /// a camada de "altura" para lod (nível de detalhe);
    /// atualmente inclui apenas altitudes terrestres, mas no
    /// futuro deverá incluir também a profundidade da água e
    /// provavelmente outras informações
    pub lod_alt: Grid<u32>,
    
    /// a camada de "sombra" para lod. inclui os ângulos do
    /// horizonte leste e oeste e uma altura máxima aproximada
    /// do oclusor, que usamos para tentar aproximar sombras
    /// suaves e volumétricas
    pub lod_horizon: Grid<u32>,

    /// uma imagem de mapa totalmente renderizada para uso com
    /// o mapa e o minimapa; observe que ela pode ser
    /// construída dinamicamente combinando as camadas de
    /// dados do mapa-múndi (por exemplo, com dados de mapa de
    /// sombras ou dados de rios), mas, no momento, optamos
    /// por não fazer isso
    ///
    /// os dois primeiros elementos da tupla são os mapas
    /// regular e topográfico, respectivamente. o terceiro
    /// elemento da tupla é o tamanho do mundo (como uma grade
    /// 2d, em chunks), e o quarto elemento contém a altura
    /// mínima de qualquer chunk de terra (ou seja, o nível do
    /// mar) em sua coordenada x, e a altura máxima da terra
    /// acima dessa altura (ou seja, a altura máxima) em sua
    /// coordenada y
    map: (Vec<Arc<DynamicImage>>, Vec2<u16>, Vec2<f32>)
}

impl WorldData {
    pub fn chunk_size(&self) -> Vec2<u16> { self.map.1 }

    pub fn map_layers(&self) -> &Vec<Arc<DynamicImage>> { &self.map.0 }

    pub fn map_image(&self) -> &Arc<DynamicImage> { &self.map.0[0] }

    pub fn topo_map_image(&self) -> &Arc<DynamicImage> { &self.map.0[1] }

    pub fn min_chunk_alt(&self) -> f32 { self.map.2.x }

    pub fn max_chunk_alt(&self) -> f32 { self.map.2.y }
}

pub struct SiteMarker {
    pub marker: Marker,
    pub economy: Option<EconomyInfo>
}

struct WeatherLerp {
    old: (SharedWeatherGrid, Instant),
    new: (SharedWeatherGrid, Instant),
    
    old_local_wind: (Vec2<f32>, Instant),
    new_local_wind: (Vec2<f32>, Instant),
    
    local_wind: Vec2<f32>
}

impl WeatherLerp {
    fn local_wind_update(&mut self, wind: Vec2<f32>) {
        self.old_local_wind = mem::replace(&mut self.new_local_wind, (wind, Instant::now()));
    }

    fn update_local_wind(&mut self) {
        // pressupõe que as atualizações sejam regulares
        let t = (self.new_local_wind.1.elapsed().as_secs_f32() / self.new_local_wind.1.duration_since(self.old_local_wind.1).as_secs_f32()).clamp(0.0, 1.0);

        self.local_wind = Vec2::lerp_unclamped(self.old_local_wind.0, self.new_local_wind.0, t);
    }

    fn weather_update(&mut self, weather: SharedWeatherGrid) {
        self.old = mem::replace(&mut self.new, (weather, Instant::now()));
    }

    // todo: é preciso aprimorar essa interpolação, pois seu
    // principal problema é assumir que as atualizações
    // ocorrem em intervalos regulares
    fn update(&mut self, to_update: &mut WeatherGrid) {
        prof_span!("WeatherLerp::update");

        self.update_local_wind();
        
        let old = &self.old.0;
        let new = &self.new.0;
        
        if new.size() == Vec2::zero() {
            return;
        }
        
        if to_update.size() != new.size() {
            *to_update = WeatherGrid::from(new);
        }
        
        if old.size() == new.size() {
            // assume que as atualizaões são regulares
            let t = (self.new.1.elapsed().as_secs_f32() / self.new.1.duration_since(self.old.1).as_secs_f32()).clamp(0.0, 1.0);

            to_update
                .iter_mut()
                .zip(old.iter().zip(new.iter()))
                .for_each(|((_, current), ((_, old), (_, new)))| {
                    *current = CompressedWeather::lerp_unclamped(old, new, t);
                    // o parâmetro `local_wind` está configurado para todas
                    // as células meteorológicas no cliente, o que ainda
                    // resultará em imprecisões fora da área "local"
                    current.wind = self.local_wind;
                });
        }
    }
}

impl Default for WeatherLerp {
    fn default() -> Self {
        let old = Instant::now();
        let new = Instant::now();
        
        Self {
            old: (SharedWeatherGrid::new(Vec2::zero()), old),
            new: (SharedWeatherGrid::new(Vec2::zero()), new),
            
            old_local_wind: (Vec2::zero(), old),
            new_local_wind: (Vec2::zero(), new),
            
            local_wind: Vec2::zero()
        }
    }
}

pub struct Client {
    client_type: ClientType,
    registered: bool,
    presence: Option<PresenceKind>,
    runtime: Arc<Runtime>,
    server_info: ServerInfo,

    /// mensagem do dia e regras do servidor localizadas
    server_description: ServerDescription,
    world_data: WorldData,
    weather: WeatherLerp,
    player_list: HashMap<Uid, PlayerInfo>,
    character_list: CharacterList,
    character_being_deleted: Option<CharacterId>,
    sites: HashMap<SiteId, SiteMarker>,
    extra_markers: Vec<Marker>,
    possible_starting_sites: Vec<SiteId>,
    pois: Vec<PoiInfo>,
    pub chat_mode: ChatMode,
    component_recipe_book: ComponentRecipeBook,
    repair_recipe_book: RepairRecipeBook,
    available_recipes: HashMap<String, Option<SpriteKind>>,
    lod_zones: HashMap<Vec2<i32>, lod::Zone>,
    lod_last_requested: Option<Instant>,
    lod_pos_fallback: Option<Vec2<f32>>,
    force_update_counter: u64,

    role: Option<AdminRole>,
    max_group_size: u32,
    
    // o cliente recebeu um convite (id do remetente, tempo
    // limite instantâneo)
    invite: Option<(Uid, Instant, Duration, InviteKind)>,
    group_leader: Option<Uid>,
    
    // nota: potencialmente representável com um componente
    // exclusivo do cliente
    group_members: HashMap<Uid, group::Role>,
    
    // convites pendentes que este cliente enviou
    pending_invites: HashSet<Uid>,

    // a transação pendente na qual o cliente será envolvido e seu id
    pending_trade: Option<(TradeId, PendingTrade, Option<SitePrices>)>,
    waypoint: Option<String>,

    network: Option<Network>,
    participant: Option<Participant>,
    general_stream: Stream,
    ping_stream: Stream,
    register_stream: Stream,
    character_screen_stream: Stream,
    in_game_stream: Stream,
    terrain_stream: Stream,

    client_timeout: Duration,
    last_server_ping: f64,
    last_server_pong: f64,
    last_ping_delta: f64,
    ping_deltas: VecDeque<f64>,

    tick: u64,
    state: State,

    flashing_lights_enabled: bool,

    /// distância da visão do terreno
    server_view_distance_limit: Option<u32>,
    view_distance: Option<u32>,
    lod_distance: f32,

    // todo: mover para o voxygen
    loaded_distance: f32,

    pending_chunks: HashMap<Vec2<i32>, Instant>,
    target_time_of_day: Option<TimeOfDay>,
    dt_adjustment: f64,

    connected_server_constants: ServerConstants,

    /// plugins solicitados, mas ainda não recebidos
    missing_plugins: HashSet<PluginHash>,
    
    /// plugins armazenados em cache localmente, necessários
    /// para o servidor
    local_plugins: Vec<PathBuf>
}
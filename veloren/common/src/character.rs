//! structs representando um personagem jogável

use crate::{comp, comp::inventory::Inventory};
use serde::{Deserialize, Serialize};

/// o limite de quantos personagens um jogador pode ter
pub const MAX_CHARACTERS_PER_PLAYER: usize = 8;

#[derive(Copy, Clone, Debug, Serialize, Deserialize, PartialEq, Eq, Hash, PartialOrd, Ord)]
#[serde(transparent)]
pub struct CharacterId(pub i64);

/// o mínimo de dados necessários para criar um novo
/// personagem no servidor
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Character {
    pub id: Option<CharacterId>,
    pub alias: String
}

/// dados necessários para renderizar um único item de um
/// personagem na lista de personagens presentes na seleção
/// de personagem
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CharacterItem {
    pub character: Character,
    pub body: comp::Body,
    pub hardcore: bool,
    pub inventory: Inventory,
    
    // Essa string alterna entre a representação no banco de dados e o nome legível para humanos em server.tick
    pub location: Option<String>
}
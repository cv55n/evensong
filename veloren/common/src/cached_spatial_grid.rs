use crate::util::SpatialGrid;

/// [`spatialgrid`] em cache para reutilização em diferentes
/// sistemas ecs durante um ciclo. isso é usado para acelerar
/// consultas em entidades dentro de uma área específica
///
/// atualizado dentro do sistema de física [`phys::sys`]
///
/// apóso cálculo das novas posições das entidades para o
/// ciclo. portanto, quaisquer modificações de posição fora do
/// sistema de física não serão refletidas aqui até o próximo
/// ciclo, quando o sistema de física for executado
///
/// [`phys::sys`]: veloren_common_systems::phys::sys
pub struct CachedSpatialGrid(pub SpatialGrid);

impl Default for CachedSpatialGrid {
    fn default() -> Self {
        let lg2_cell_size = 5; // 32
        let lg2_large_cell_size = 6; // 64
        let radius_cutoff = 8;

        let spatial_grid = SpatialGrid::new(lg2_cell_size, lg2_large_cell_size, radius_cutoff);

        Self(spatial_grid)
    }
}
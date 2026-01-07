use crate::path::Path;
use core::{
    cmp::Ordering::{self, Equal},
    fmt,
    hash::{BuildHasher, Hash}
};
use hashbrown::HashMap;
use std::collections::BinaryHeap;

#[derive(Copy, Clone, Debug)]
pub struct PathEntry<S> {
    // custo até o momento + heurística
    cost_estimate: f32,
    node: S
}

impl<S: Eq> PartialEq for PathEntry<S> {
    fn eq(&self, other: &PathEntry<S>) -> bool {
        self.node.eq(&other.node)
    }
}

impl<S: Eq> Eq for PathEntry<S> {}

impl<S: Eq> Ord for PathEntry<S> {
    // este método implementa a ordenação inversa, de forma
    // que o item de menor custo seja ordenado primeiro
    fn cmp(&self, other: &PathEntry<S>) -> Ordering {
        other
            .cost_estimate
            .partial_cmp(&self.cost_estimate)
            .unwrap_or(Equal)
    }
}

impl<S: Eq> PartialOrd for PathEntry<S> {
    fn partial_cmp(&self, other: &PathEntry<S>) -> Option<Ordering> {
        Some(self.cmp(other))
    }

    // isso é particularmente problemático em `binaryheap::pop`
    // então fornecer esta implementação
    //
    // nota: provavelmente isso não lida com casos extremos
    // como `nans` de maneira consistente com `ord`, mas acho
    // que não é preciso se preocupar com isso aqui (?)
    //
    // veja a nota sobre a ordem inversa acima
    fn le(&self, other: &PathEntry<S>) -> bool {
        other.cost_estimate <= self.cost_estimate
    }
}

pub enum PathResult<T> {
    /// nenhum dos nodes acessíveis foi satisfatório
    ///
    /// contém o path para o node com o menor valor heurístico
    /// (dentre os nodes explorados)
    None(Path<T>),

    /// tanto max_iters quanto max_cost foi alcançado
    ///
    /// contém o path para o node com o menor valor heurístico
    /// (dentre os nodes explorados)
    Exhausted(Path<T>),

    /// path encontrado com sucesso
    ///
    /// segundo field é o custo
    Path(Path<T>, f32),
    Pending
}

impl<T> PathResult<T> {
    /// retorna `some((path, cost))` se um path alcançando o
    /// alvo for encontrado com sucesso
    pub fn into_path(self) -> Option<(Path<T>, f32)> {
        match self {
            PathResult::Path(path, cost) => Some((path, cost)), _ => None
        }
    }

    pub fn map<U>(self, f: impl FnOnce(Path<T>) -> Path<U>) -> PathResult<U> {
        match self {
            PathResult::None(p) => PathResult::None(f(p)),
            PathResult::Exhausted(p) => PathResult::Exhausted(f(p)),
            PathResult::Path(p, cost) => PathResult::Path(f(p), cost),
            PathResult::Pending => PathResult::Pending
        }
    }
}

// se a entrada do node existe, isso foi visitado
#[derive(Clone, Debug)]
struct NodeEntry<S> {
    /// o node anterior no path mais barato (conhecido até
    /// agora) que vai do início para este node
    ///
    /// se `came_from == self`, este é o node inicial (para
    /// evitar inflar o tamanho com `option`)
    came_from: S,

    /// custo para alcançar este node desde o início seguindo
    /// o path mais barato conhecido até agora. este é a soma
    /// dos custos de transição entre todos os nodes neste path
    cost: f32
}

#[derive(Clone)]
pub struct Astar<S, Hasher> {
    iter: usize,
    max_iters: usize,
    max_cost: usize,
    potential_nodes: BinaryHeap<PathEntry<S>>, // custo, pares de node
    visited_nodes: HashMap<S, NodeEntry<S>, Hasher>,

    /// node com o menor valor heurístico até o momento
    ///
    /// (node, valor heurístico)
    closest_node: Option<(S, f32)>
}

/// nota: é necessário derivar manualmente, pois o hasher não
/// implementa essa função
impl<S: Clone + Eq + Hash + fmt::Debug, H: BuildHasher> fmt::Debug for Astar<S, H> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Astar")
            .field("iter", &self.iter)
            .field("max_iters", &self.max_iters)
            .field("potential_nodes", &self.potential_nodes)
            .field("visited_nodes", &self.visited_nodes)
            .field("closest_node", &self.closest_node)
            .finish()
    }
}

impl<S: Clone + Eq + Hash, H: BuildHasher + Clone> Astar<S, H> {
    pub fn new(max_iters: usize, start: S, hasher: H) -> Self {
        Self {
            max_iters,
            max_cost: f32::MAX,
            iter: 0,

            potential_nodes: core::iter::once(PathEntry {
                cost_estimate: 0.0,
                node: start.clone()
            }).collect(),

            visited_nodes: {
                let mut s = HashMap::with_capacity_and_hasher(1, hasher);
                
                s.extend(core::iter::once((start.clone(), NodeEntry {
                    came_from: start,
                    cost: 0.0
                })));
                
                s
            },

            closest_node: None
        }
    }

    pub fn with_max_cost(mut self, max_cost: f32) -> Self {
        self.max_cost = max_cost;

        self
    }

    pub fn set_max_iters(&mut self, max_iters: usize) {
        self.max_iters = max_iters;
    }

    /// para garantir um path ótimo, a função heurística precisa ser
    /// [admissível](https://en.wikipedia.org/wiki/A*_search_algorithm#Admissibility)
    pub fn poll<I>(
        &mut self,
        iters: usize,

        // calcula a distância que nos separa do alvo
        mut heuristic: impl FnMut(&S) -> f32,
        
        // obtém os nodes vizinhos
        mut neighbors: impl FnMut(&S) -> I,
        
        // atingimos o alvo?
        mut satisfied: impl FnMut(&S) -> bool
    ) -> PathResult<S> where I: Iterator<Item = (S, f32)>, // (node, custo de transição) {
        let iter_limit = self.max_iters.min(self.iter + iters);

        while self.iter < iter_limit {
            if let Some(PathEntry {
                node,
                cost_estimate
            }) = self.potential_nodes.pop() {
                let (node_cost, came_from) = self
                    .visited_nodes
                    .get(&node)
                    .map(|n| (n.cost, n.came_from.clone()))
                    .expect("todos os nodes na fila devem ser incluídos em `visited_nodes`");

                if satisfied(&node) {
                    return PathResult::Path(self.reconstruct_path_to(node), node_cost);
                // observe que assumimos que cost_estimate não é uma superestimação
                // (ou seja, que a heurística não superestima)
                } else if cost_estimate > self.max_cost {
                    return PathResult::Exhausted(
                        self.closest_node
                            .clone()
                            .map(|(lc, _)| self.reconstruct_path_to(lc))
                            .unwrap_or_default()
                    );
                } else {
                    for (neighbor, transition_cost) in neighbors(&node) {
                        if neighbor == came_from {
                            continue;
                        }

                        let neighbor_cost = self
                            .visited_nodes
                            .get(&neighbor)
                            .map_or(f32::MAX, |n| n.cost);

                        // calcula o custo de travessia até cada vizinho
                        let cost = node_cost + transition_cost;

                        if cost < neighbor_cost {
                            let previously_visited = self
                                .visited_nodes
                                .insert(neighbor.clone(), NodeEntry {
                                    came_from: node.clone(),
                                    cost
                                })
                                .is_some();

                            let h = heuristic(&neighbor);

                            // observar que o campo `cost` não inclui a heurística;
                            // a fila de prioridade inclui a heurística
                            let cost_estimate = cost + h;

                            if self
                                .closest_node
                                .as_ref()
                                .map(|&(_, ch)| h < ch)
                                .unwrap_or(true)
                            {
                                self.closest_node = Some((node.clone(), h));
                            };

                            // não é preciso reconsiderar nodes já visitados, pois o astar
                            // encontra o path mais curto para um node na primeira vez que
                            // ele é visitado, assumindo que a função heurística seja
                            // admissível
                            if !previously_visited {
                                self.potential_nodes.push(PathEntry {
                                    cost_estimate,
                                    node: neighbor
                                });
                            }
                        }
                    }
                }
            } else {
                return PathResult::None(
                    self.closest_node
                        .clone()
                        .map(|(lc, _)| self.reconstruct_path_to(lc))
                        .unwrap_or_default()
                );
            }

            self.iter += 1
        }

        if self.iter >= self.max_iters {
            PathResult::Exhausted(
                self.closest_node
                    .clone()
                    .map(|(lc, _)| self.reconstruct_path_to(lc))
                    .unwrap_or_default()
            )
        } else {
            PathResult::Pending
        }
    }

    fn reconstruct_path_to(&mut self, end: S) -> Path<S> {
        let mut path = vec![end.clone()];
        let mut cnode = &end;

        while let Some(node) = self
            .visited_nodes
            .get(cnode)
            .map(|n| &n.came_from)
            .filter(|n| *n != cnode)
        {
            path.push(node.clone());
            cnode = node;
        }

        path.into_iter().rev().collect()
    }
}
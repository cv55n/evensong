use std::net::SocketAddr;
use tokio::net::lookup_host;
use tracing::trace;

#[derive(Clone, Debug)]
pub enum ConnectionArgs {
    /// hostname: `(hostname|ip):[<port>]`
    Quic {
        hostname: String,
        prefer_ipv6: bool,
        validate_tls: bool
    },

    /// hostname: `(hostname|ip):[<port>]`
    Tcp {
        hostname: String,
        prefer_ipv6: bool
    },

    /// srv lookup
    ///
    /// as pesquisas srv não podem conter uma porta, mas
    /// conseguirão se conectar automaticamente à porta
    /// configurada. se uma conexão com uma porta foi
    /// fornecida, o sistema recorrerá ao tcp como alternativa
    Srv {
        hostname: String,
        prefer_ipv6: bool,
        validate_tls: bool,
        use_quic: bool
    },

    Mpsc(u64)
}

impl ConnectionArgs {
    const DEFAULT_PORT: u16 = 14004;
}

/// analisa o endereço de ip ou resolve o nome do host
///
/// observação: se você usar um endereço ipv6, o número após
/// os dois pontos finais será usado como a porta, a menos que
/// você use colchetes ([]) em torno do endereço
pub(crate) async fn resolve(
    address: &str,
    prefer_ipv6: bool
) -> Result<Vec<SocketAddr>, std::io::Error> {
    // `lookup_host` tentará internamente analisá-lo como um
    // socketaddr
    //
    // 1. assumir que é um hostname + porta
    match lookup_host(address).await {
        Ok(s) => {
            trace!("pesquisa de host bem-sucedida")

            Ok(sort_ipv6(s, prefer_ipv6))
        },

        Err(e) => {
            // 2. assumir que é um hostname sem a porta
            match lookup_host((address, ConnectionArgs::DEFAULT_PORT)).await {
                Ok(s) => {
                    trace!("pesquisa de host sem porta bem-sucedida");
                    
                    Ok(sort_ipv6(s, prefer_ipv6))
                }

                Err(_) => Err(e) // todo: avaliar ao retornar erros em ambos
            }
        }
    }
}

pub(crate) async fn try_connect<F>(
    network: &network::Network,
    address: &str,
    override_port: Option<u16>,
    prefer_ipv6: bool,
    f: F
) -> Result<network::Participant, crate::error::Error> where
    F: Fn(SocketAddr) -> network::ConnectAddr
{
    use crate::error::Error;

    let mut participant = None;

    for mut addr in resolve(address, prefer_ipv6)
        .await
        .map_err(Error::HostnameLookupFailed)?
    {
        // substitui a porta se uma tiver sido passada. usado
        // para pesquisas srv que obtêm informações de porta
        // fora da banda
        if let Some(port) = override_port {
            addr.set_port(port);
        }

        match network.connect(f(addr)).await {
            Ok(p) => {
                participant = Some(Ok(p));

                break;
            },

            Err(e) => participant = Some(Err(Error::NetworkErr(e)))
        }
    }

    participant.unwrap_or_else(|| Err(Error::Other("nenhum endereço de ip fornecido".to_string())))
}

fn sort_ipv6(s: impl Iterator<Item = SocketAddr>, prefer_ipv6: bool) -> Vec<SocketAddr> {
    let (mut first_addrs, mut second_addrs) = s.partition::<Vec<_>, _>(|a| a.is_ipv6() == prefer_ipv6);
    
    Iterator::chain(first_addrs.drain(..), second_addrs.drain(..)).collect::<Vec<_>>()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};

    #[tokio::test]
    async fn resolve_localhost() {
        let args = resolve("localhost", false).await.expect("falha na resolução");

        assert!(args.len() == 1 || args.len() == 2);
        assert_eq!(args[0].ip(), IpAddr::V4(Ipv4Addr::LOCALHOST));
        assert_eq!(args[0].port(), 14004);

        let args = resolve("localhost:666", false).await.expect("falha na resolução");

        assert!(args.len() == 1 || args.len() == 2);
        assert_eq!(args[0].port(), 666);
    }

    #[tokio::test]
    async fn resolve_ipv6() {
        let args = resolve("localhost", true).await.expect("falha na resolução");

        assert!(args.len() == 1 || args.len() == 2);
        assert_eq!(args[0].ip(), Ipv6Addr::LOCALHOST);
        assert_eq!(args[0].port(), 14004);
    }

    #[tokio::test]
    async fn tresolve() {
        let args = resolve("google.com", false).await.expect("falha na resolução");
        
        assert!(!args.is_empty());
        assert_eq!(args[0].port(), 14004);

        let args = resolve("127.0.0.1", false).await.expect("falha na resolução");
        
        assert_eq!(args.len(), 1);
        assert_eq!(args[0].port(), 14004);
        assert_eq!(args[0].ip(), IpAddr::V4(Ipv4Addr::LOCALHOST));

        let args = resolve("55.66.77.88", false).await.expect("falha na resolução");
        
        assert_eq!(args.len(), 1);
        assert_eq!(args[0].port(), 14004);
        assert_eq!(args[0].ip(), IpAddr::V4(Ipv4Addr::new(55, 66, 77, 88)));

        let args = resolve("127.0.0.1:776", false).await.expect("falha na resolução");
        
        assert_eq!(args.len(), 1);
        assert_eq!(args[0].port(), 776);
        assert_eq!(args[0].ip(), IpAddr::V4(Ipv4Addr::LOCALHOST));
    }
}
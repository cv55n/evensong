use regex::Regex;
use std::process::Command;

// obtém o githash + timestamp atual
//
// nota: irá comparar os commits. enquanto as alterações
// enviadas não divergirem do servidor, nenhuma mudança de
// versão será detectada
fn get_git_hash_timestamp() -> Result<String, String> {
    let output = Command::new("git")
        .args(["log", "-n", "1", "--pretty=format:%h/%ct", "--abbrev=8"])
        .output()
        .map_err(|e| format!("o comando `git version` não pôde ser executado e apresentou o seguinte erro: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "comando de versão do git mal-sucedido: {}",

            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let hash_timestamp = String::from_utf8(output.stdout)
        .map_err(|e| format!("output do comando da versão do git não é um utf-8 válido: {}", e))?;

    let hash = hash_timestamp
        .split('/')
        .next()
        .ok_or("git hash não encontrado".to_string())?;

    // se usa apenas os primeiros 32 bits do hash do git
    if hash.len() != 8 {
        Ok(format!(
            "{}/{}",

            hash.get(..8)
                .ok_or("git hash não é longo o bastante".to_string())?,

            hash_timestamp
                .split('/')
                .nth(1)
                .ok_or("git timestamp não encontrado".to_string())?
        ))
    } else {
        Ok(hash_timestamp)
    }
}

// obtém a gittag atual
fn get_git_tag() -> Option<String> {
    let output = Command::new("git")
        .args(["describe", "--exact-match", "--tags", "HEAD"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let tag = String::from_utf8(output.stdout).ok()?;

    if Regex::new(r"/^v[0-9]+\.[0-9]+\.[0-9]+$/")
        .unwrap()
        .is_match(&tag)
    {
        Some(tag)
    } else {
        None
    }
}

fn main() {
    // se essa variável de ambiente existir, ela será usada
    if option_env!("VELOREN_GIT_VERSION").is_none() {
        let hash_timestamp = match get_git_hash_timestamp() {
            Ok(hash_timestamp) => hash_timestamp,

            Err(e) => {
                println!("cargo::error={}", e);

                println!(
                    "cargo::error=é altamente recomendável compilar o veloren a partir do repositório git \
                    clonado, utilizando o comando git disponível, para que o jogo tenha acesso às \
                    informações de versionamento corretas"
                );

                println!(
                    "cargo::error=no entanto, se você ainda assim desejar prosseguir com a compilação \
                    do veloren, pode definir a variável de ambiente \"VELOREN_GIT_VERSION\" para \"/0/0\" \
                    antes de executar novamente o comando cargo (o procedimento específico para isso \
                    dependerá do seu shell). observe que isso compilará o jogo com o hash e o timestamp \
                    do commit do git definidos como 0, o que causará avisos de incompatibilidade de \
                    versão quando aplicável, independentemente de a versão estar realmente incorreta ou não"
                );

                return;
            }
        };

        let tag = get_git_tag().unwrap_or("".to_string());

        // formato: <git-tag?>/<git-hash>/<git-timestamp>
        println!(
            "cargo::rustc-env=VELOREN_GIT_VERSION={}/{}",
            &tag, &hash_timestamp
        );
    }
}
# c8

cobertura de código v8 nativo

[![ci](https://github.com/bcoe/c8/actions/workflows/ci.yaml/badge.svg)](https://github.com/bcoe/c8/actions/workflows/ci.yaml)
![configuração nycrc no github](https://img.shields.io/nycrc/bcoe/c8)
[![commits convencionais](https://img.shields.io/badge/commits%20convencionais-1.0.0-yellow.svg)](https://www.conventionalcommits.org/)

cobertura de código usando a [funcionalidade integrada do node.js](https://nodejs.org/dist/latest-v10.x/docs/api/cli.html#cli_node_v8_coverage_dir), compatível com os [reports de istanbul](https://istanbul.js.org/docs/advanced/alternative-reporters/).

assim como o [nyc](https://github.com/istanbuljs/nyc), c8 apenas magicamente funciona:

```
npm i c8 -g

c8 node foo.js
```

o exemplo acima exibirá as métricas de cobertura para `foo.js`.

## opções/configuração da cli

o c8 pode ser configurado por meio de parâmetros de linha de comando, uma seção `c8` no arquivo `package.json` ou um arquivo de configuração json no disco.

um arquivo de configuração pode ser especificado passando seu caminho na linha de comando com `--config` ou `-c`. se nenhuma opção de configuração for fornecida, o c8 procura por arquivos com os nomes ``.c8rc``, ``.c8rc.json``, ``.nycrc`` ou ``.nycrc.json``, começando do `cwd` e percorrendo a árvore do sistema de arquivos.

ao usar a configuração ``package.json`` ou um arquivo de configuração dedicado, omita o prefixo ``--`` da forma longa da opção de linha de comando desejada.

segue uma lista de opções comuns. execute `c8 --help` para obter a lista completa e a documentação.

| opção | descrição | tipo | padrão |
| ----- | --------- | ---- | ------ |
| `-c`, `--config` | caminho para o arquivo de configuração json | `string` | veja acima |
| `-r`, `--reporter` | repórter(es) de cobertura a usar | `Array<string>` | `['text']` |
| `-o`, `--reports-dir`, `--report-dir` | diretório onde os relatórios de cobertura serão gerados | `string` | `./coverage` |
| `--all` | veja a [seção abaixo](https://github.com/bcoe/c8/blob/main/README.md#checking-for-full-source-coverage-using---all) para mais informações | `string` | `false` |
| `src` | veja a [seção abaixo](https://github.com/bcoe/c8/blob/main/README.md#checking-for-full-source-coverage-using---all) para mais informações | `Array<string>` | `[process.cwd()]` |
| `-n`, `--include` | veja a [seção abaixo](https://github.com/bcoe/c8/blob/main/README.md#checking-for-full-source-coverage-using---all) para mais informações | `Array<string>` | `[]` (inclui todos os arquivos) |
| `-x`, `--exclude` | veja a [seção abaixo](https://github.com/bcoe/c8/blob/main/README.md#checking-for-full-source-coverage-using---all) para mais informações | `Array<string>` | [lista](https://github.com/istanbuljs/schema/blob/master/default-exclude.js) |
| `--exclude-after-remap` | veja a [seção abaixo](https://github.com/bcoe/c8/blob/main/README.md#checking-for-full-source-coverage-using---all) para mais informações | `boolean` | `false` |
| `-e`, `--extension` | somente arquivos com essas extensões mostrarão a cobertura | `string \| Array<string>` | [lista](https://github.com/istanbuljs/schema/blob/master/default-extension.js) |
| `--skip-full` | não mostra os arquivos com 100% de cobertura de instruções, ramificações e funções | `boolean` | `false` |
| `--check-coverage` | verifica se a cobertura está dentro dos limites estabelecidos | `boolean` | `false` |
| `--per-file` | verifica os limites por arquivo | `boolean` | `false` |
| `--temp-directory` | os dados de cobertura do diretório v8 são gravados e lidos a partir dele | `string` | `process.env.node_v8_coverage` |
| `--clean` | se os arquivos temporários devem ser excluídos antes da execução do script | `boolean` | `true` |
| `--experimental-monocart` | veja a [seção abaixo](https://github.com/bcoe/c8/blob/main/README.md#checking-for-full-source-coverage-using---all) para mais informações | `boolean` | `false` |

## checando a cobertura "completa" da fonte usando `--all`

por padrão, o v8 só fornece cobertura para os arquivos carregados pelo mecanismo. Se houver arquivos de origem no seu projeto que são flexibilizados em produção, mas não nos seus testes, os números de cobertura não refletirão isso. por exemplo, se o arquivo `main.js` do seu projeto carrega `a.js` e `b.js`, mas seus testes unitários carregam apenas `a.js`, a cobertura total pode mostrar `100%` para `a.js`, quando na verdade tanto `main.js` quanto `b.js` não são cobertos.

ao fornecer a opção `--all` para o comando c8, todos os arquivos nos diretórios especificados com `--src` (o padrão é `cwd`) que passarem nas verificações das flags `--include` e `--exclude` serão carregados no relatório. se algum desses arquivos permanecer sem cobertura, ele será considerado no relatório com uma cobertura padrão de 0%.

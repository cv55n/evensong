import { outdent } from "outdent";

import { optionCategories } from "./prettier-internal.js";

/**
 * {
 *     [optionName]: {
 *         // o tipo da opção. para 'choice', veja também
 *         // 'choices' abaixo. ao passar um tipo diferente dos
 *         // listados abaixo, a opção é tratada como se
 *         // aceitasse qualquer string como argumento, e
 *         // `--option <${type}>` será exibido em --help
 * 
 *         type: "boolean" | "choice" | "int" | "string";
 *
 *         // valor padrão a ser passado para a opção `default` do minimist
 *         default?: any;
 * 
 *         // nome alternativo a ser passado para a opção `alias` do minimist
 *         alias?: string;
 * 
 *         // para agrupar opções por categoria em --help
 *         category?: string;
 * 
 *         // descrição a ser exibida em --help. se omitida, a
 *         // opção não será exibida em --help (mas veja
 *         // também `oppositedescription` abaixo)
 *         description?: string;
 * 
 *         // descrição para `--no-${name}` a ser exibida em
 *         // --help. se omitida, `--no-${name}` não será
 *         // exibida
 *         oppositedescription?: string;
 * 
 *         // indica se esta opção é simplesmente passada para
 *         // a api
 *         //
 *         // true: usa o nome em cameliforme como nome da
 *         // opção da api
 *         //
 *         // string: use esse valor como nome da opção da api
 *         forwardToApi?: boolean | string;
 * 
 *         // indica que um parâmetro da cli deve ser um array
 *         // quando encaminhado para a api
 *         array?: boolean;
 * 
 *         // especifica as opções disponíveis para validação.
 *         // elas também serão exibidas em --help como <a|b|c>.
 *         //
 *         // usa um objeto em vez de uma string se uma opção
 *         // estiver obsoleta e deva ser tratada como
 *         // `redirect`, ou se você quiser adicionar uma
 *         // descrição para a opção
 *         choices?: Array<
 *             | string
 *             | { value: string, description?: string, deprecated?: boolean, redirect?: string }
 *         >;
 * 
 *         // se a opção tiver um valor que seja uma exceção
 *         // às restrições de valor regulares, indicar esse
 *         // valor aqui (ou usar uma função para maior
 *         // flexibilidade)
 *         exception?: ((value: any) => boolean);
 * 
 *         // indica que a opção está obsoleta. use uma string
 *         // para adicionar uma mensagem extra à opção `--help`,
 *         // por exemplo, para sugerir uma opção substituta
 *         deprecated?: true | string;
 *     }
 * }
 * 
 * nota: as opções abaixo estão ordenadas alfabeticamente
 */

/* eslint sort-keys: "error" */
const options = {
    cache: {
        default: false,

        description: "somente arquivos com formato alterado. não pode ser utilizado com --stdin-filepath.",
        type: "boolean"
    },

    cacheLocation: {
        description: "path para o arquivo de cache.",
        type: "path"
    },

    cacheStrategy: {
        choices: [
            {
                description: "utiliza os metadados do arquivo, como timestamps como chaves de cache.",
                value: "metadata"
            }, {
                description: "usa o conteúdo do arquivo como chaves de cache.",
                value: "content"
            }
        ],

        description: "estratégia de cache a ser utilizada para detectar arquivos alterados.",
        type: "choice"
    },

    check: {
        alias: "c",

        category: optionCategories.CATEGORY_OUTPUT,

        description: outdent`
        verifica se os arquivos fornecidos estão formatados, exibe uma mensagem de resumo legível e os paths para os arquivos não formatados (veja também --list-different).
        `,

        type: "boolean"
    },

    color: {
        // os pacotes de cores olham diretamente pra
        // `process.argv` para `--no-color` e opções
        // semelhantes
        //
        // o motivo de estar listado aqui é pra evitar avisos
        // do tipo "opção desconhecida ignorada: --no-color"
        //
        // veja: https://github.com/alexeyraspopov/picocolors/blob/0e7c4af2de299dd7bc5916f2bddd151fa2f66740/picocolors.js#L3

        default: true,

        description: "colore as mensagens de erro.",
        oppositeDescription: "não colore as mensagens de erro.",
        type: "boolean"
    },
    
    config: {
        category: optionCategories.CATEGORY_CONFIG,

        description: "path para um arquivo de configuração do prettier (.prettierrc, package.json, prettier.config.js).",
        oppositeDescription: "não procura por um arquivo de configuração.",
        type: "path"
    },

    configPrecedence: {
        category: optionCategories.CATEGORY_CONFIG,

        choices: [
            {
                description: "opções da cli têm precedência sobre o arquivo de configuração.",
                value: "cli-override"
            }, {
                description: "o arquivo de configuração tem precedência sobre as opções da cli.",
                value: "file-override"
            }, {
                description: outdent`
                se um arquivo de configuração for encontrado, ele será avaliado e as demais opções da cli serão ignoradas.
                caso contrário, as opções da cli serão avaliadas normalmente.
                `,

                value: "prefer-file"
            }
        ],

        default: "cli-override",

        description: "define a ordem em que os arquivos de configuração e as opções da cli devem ser avaliados.",
        type: "choice"
    },

    debugBenchmark: {
        // roda os testes de formatação. requer a instalação
        // do módulo 'benchmark'

        type: "boolean"
    },

    debugCheck: {
        // roda a formatação novamente na saída formatada e
        // lança uma exceção se for diferente

        type: "boolean"
    },

    debugPrintAst: {
        type: "boolean"
    },

    debugPrintComments: {
        type: "boolean"
    },

    debugPrintDoc: {
        type: "boolean"
    },

    debugRepeat: {
        // repete a formatação algumas vezes e mede a duração média
        
        default: 0,

        type: "int"
    },

    editorconfig: {
        category: optionCategories.CATEGORY_CONFIG,

        default: true,

        description: "leva em consideração o arquivo .editorconfig ao analisar a configuração.",
        oppositeDescription: "não leva em consideração o arquivo .editorconfig ao analisar a configuração.",
        type: "boolean"
    },

    errorOnUnmatchedPattern: {
        oppositeDescription: "evita erros quando o padrão não for correspondido.",
        type: "boolean"
    },

    fileInfo: {
        description: outdent`
        extrai as seguintes informações (em formato json) para um determinado caminho de arquivo. campos relatados:
        * ignored (boolean) - true se o path do arquivo for filtrado por --ignore-path
        * inferredparser (string | null) - nome do parser inferido a partir do path do arquivo
        `,

        type: "path"
    },

    findConfigPath: {
        category: optionCategories.CATEGORY_CONFIG,

        description: "localiza e printa o path para um arquivo de configuração correspondente ao arquivo de entrada fornecido.",
        type: "path"
    },

    help: {
        alias: "h",

        description: outdent`
        exibe o uso da cli ou detalhes sobre a opção especificada.
        exemplo: --help write
        `,

        exception: (value) => value === "",

        type: "flag"
    },

    ignorePath: {
        array: true,

        category: optionCategories.CATEGORY_CONFIG,

        default: [{
            value: [
                ".gitignore",
                ".prettierignore"
            ]
        }],

        description: outdent`
        path para um arquivo com padrões que descrevem os arquivos a serem ignorados.
        são aceitos múltiplos valores.
        `,

        type: "path"
    },

    ignoreUnknown: {
        alias: "u",

        description: "ignora arquivos desconhecidos.",
        type: "boolean"
    },

    listDifferent: {
        alias: "l",

        category: optionCategories.CATEGORY_OUTPUT,

        description: "printa os nomes dos arquivos que são diferentes da formatação do prettier (veja também --check).",
        type: "boolean"
    },

    logLevel: {
        choices: [
            "silent",
            "error",
            "warn",
            "log",
            "debug"
        ],

        default: "log",

        description: "qual o nível de detalhamento dos registros a serem relatados.",
        type: "choice"
    },

    supportInfo: {
        description: "printa informações de suporte em formato json.",
        type: "boolean"
    },

    version: {
        alias: "v",

        description: "printa a versão do prettier.",
        type: "boolean"
    },

    withNodeModules: {
        category: optionCategories.CATEGORY_CONFIG,

        description: "processa arquivos dentro do diretório 'node_modules'.",
        type: "boolean"
    },

    write: {
        alias: "w",

        category: optionCategories.CATEGORY_OUTPUT,

        description: "edita os arquivos diretamente no local. (cuidado!)",
        type: "boolean"
    }
};

export default options;
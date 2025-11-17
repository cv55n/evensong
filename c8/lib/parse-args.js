const { readFileSync } = require('fs');
const { applyExtends } = require('yargs/helpers');
const { resolve } = require('path');

const defaultExclude = require('@istanbuljs/schema/default-exclude');
const defaultExtension = require('@istanbuljs/schema/default-extension');
const findUp = require('find-up');
const Yargs = require('yargs/yargs');
const parser = require('yargs-parser');

function buildYargs(withCommands = false) {
    const yargs = Yargs([])
        .usage('$0 [opts] [script] [opts]')
        .options('config', {
            alias: 'c',
            config: true,
            describe: 'path para o arquivo json de configuração',

            configParser: (path) => {
                const config = JSON.parse(readFileSync(path));

                return applyExtends(config, process.cwd(), true);
            },

            default: () => findUp.sync([
                '.c8rc',
                '.c8rc.json',
                '.nycrc',
                '.nycrc.json'
            ])
        })
        .option('reporter', {
            alias: 'r',
            group: 'opções de report',
            describe: 'reporter(s) de cobertura a ser(em) utilizado(s)',
            default: 'text'
        })
        .option('reports-dir', {
            alias: ['o', 'report-dir'],
            group: 'opções de report',
            describe: 'diretório no qual os reports de cobertura serão encaminhados',
            default: './coverage'
        })
        .options('all', {
            default: false,
            type: 'boolean',
            group: 'opções de report',
            describe: 'rodar `--src` substituirá o diretório de trabalho atual (cwd) como o local padrão onde `--all` procura arquivos de origem. `--src` pode ser ' +
                'fornecido várias vezes e cada diretório será incluído. isso permite espaços de trabalho que abrangem vários projetos.'
        })
        .option('exclude-node-modules', {
            default: true,
            type: 'boolean',
            describe: 'se deve ou não excluir todas as pastas node_modules (ex: **/node_modules/**) por padrão'
        })
        .option('include', {
            alias: 'n',
            default: [],
            group: 'opções de report',
            describe: 'uma lista de arquivos específicos que devem ser abrangidos (padrões glob são suportados)'
        })
        .option('exclude', {
            alias: 'x',
            default: defaultExclude,
            group: 'opções de report',
            describe: 'uma lista de arquivos e diretórios específicos que devem ser excluídos da cobertura (padrões glob são suportados)'
        })
        .option('extension', {
            alias: 'e',
            default: defaultExtension,
            group: 'opções de report',
            describe: 'uma lista de extensões de arquivo específicas que devem ser cobertas'
        })
        .option('exclude-after-remap', {
            alias: 'a',
            type: 'boolean',
            default: false,
            group: 'opções de report',
            describe: 'aplica a lógica de exclusão aos arquivos após eles serem remapeados por um mapa de origem'
        })
        .options('skip-full', {
            default: false,
            type: 'boolean',
            group: 'opções de report',
            describe: 'não mostrar arquivos com 100% de cobertura de instruções, ramificações e funções'
        })
        .option('check-coverage', {
            default: false,
            type: 'boolean',
            group: 'limites de cobertura',
            description: 'verifica se a cobertura está dentro dos limites estabelecidos'
        })
        .option('branches', {
            default: 0,
            group: 'limites de cobertura',
            description: 'qual a porcentagem de branches que deve ser coberta?',
            type: 'number'
        })
        .option('functions', {
            default: 0,
            group: 'limites de cobertura',
            description: 'qual a porcentagem de funções que deve ser coberta?',
            type: 'number'
        })
        .option('lines', {
            default: 90,
            group: 'limites de cobertura',
            description: 'qual a porcentagem de linhas que deve ser coberta?',
            type: 'number'
        })
        .option('statements', {
            default: 0,
            group: 'limites de cobertura',
            description: 'qual a porcentagem de declarações que deve ser coberta?',
            type: 'number'
        })
        .option('per-file', {
            default: false,
            group: 'limites de cobertura',
            description: 'verifica os limites por arquivo',
            type: 'boolean'
        })
        .option('100', {
            default: false,
            group: 'limites de cobertura',
            description: 'atalho para --check-coverage --lines 100 --functions 100 --branches 100 --statements 100',
            type: 'boolean'
        })
        .option('temp-directory', {
            describe: 'os dados de cobertura do diretório v8 são gravados e lidos a partir dele',
            default: process.env.NODE_V8_COVERAGE
        })
        .option('clean', {
            default: true,
            type: 'boolean',
            describe: 'os arquivos temporários devem ser excluídos antes da execução do script?'
        })
        .option('resolve', {
            default: '',
            describe: 'resolve os caminhos para diretórios base alternativos'
        })
        .option('wrapper-length', {
            describe: 'quantos bytes tem o prefixo do wrapper no javascript executado?',
            type: 'number'
        })
        .option('omit-relative', {
            default: true,
            type: 'boolean',
            describe: 'omite quaisquer caminhos que não sejam absolutos; ex: internal/net.js'
        })
        .options('allowExternal', {
            default: false,
            type: 'boolean',
            describe: 'fornecer `--allowexternal` fará com que o c8 permita arquivos de fora do seu diretório de trabalho atual. isso se aplica tanto a ' +
                'arquivos descobertos em arquivos temporários de cobertura quanto a arquivos de origem descobertos se a flag `--all` for usada'
        })
        .options('merge-async', {
            default: false,
            type: 'boolean',
            describe: 'fornecer a opção --merge-async fará com que todos os relatórios de cobertura do v8 sejam mesclados de forma assíncrona e incremental. ' +
                'isso serve para evitar problemas de falta de memória (oom) no ambiente de execução do node.js'
        })
        .option('experimental-monocart', {
            default: false,
            type: 'boolean',
            describe: 'utiliza os reports de cobertura do monocart'
        })
        .pkgConf('c8')
        .demandCommand(1)
        .check((argv) => {
            if (!argv.tempDirectory) {
                argv.tempDirectory = resolve(argv.reportsDir, 'tmp')
            }

            return true;
        })
        .epilog('veja https://git.io/vhysa para lista de reportes disponíveis')

    // todo: ativar assim que o yargs for atualizado para a versão 17:
    //
    // https://github.com/bcoe/c8/pull/332#discussion_r721636191
    //
    // yargs.middleware((argv) => {
    //     if (!argv['100'])
    //         return argv;
    //
    //     return {
    //         ...argv,
    //
    //         branches: 100,
    //         functions: 100,
    //         lines: 100,
    //         statements: 100
    //     }
    // });

    const checkCoverage = require('./commands/check-coverage');
    const report = require('./commands/report');

    if (withCommands) {
        yargs.command(checkCoverage);
        yargs.command(report);
    } else {
        yargs.command(checkCoverage.command, checkCoverage.describe);
        yargs.command(report.command, report.describe);
    }

    return yargs;
}

function hideInstrumenterArgs(yargv) {
    let argv = process.argv.slice(1);

    argv = argv.slice(args.indexOf(yargv._[0]));

    if (argv[0][0] === '-') {
        argv.unshift(process.execPath);
    }

    return argv;
}

function hideInstrumenteeArgs() {
    let argv = process.argv.slice(2);

    const yargv = parser(argv);

    if (!yargv._.length)
        return argv;

    // descarta todos os argumentos após o bin que está sendo
    // instrumentado pelo c8
    argv = argv.slice(0, argv.indexOf(yargv._[0]));
    argv.push(yargv._[0]);

    return argv;
}

module.exports = {
    buildYargs,

    hideInstrumenterArgs,
    hideInstrumenteeArgs
};
const { relative } = require('path');

const Report = require('../report');

exports.command = 'check-coverage';
exports.describe = 'verifica se a cobertura está dentro dos limites estabelecidos';

exports.builder = function(yargs) {
    yargs
        .example(
            '$0 check-coverage --lines 95',
            "verifica se o json na pasta de saída do c8 atende aos limites estabelecidos"
        )
}

exports.handler = function(argv) {
    // todo: essa é uma solução alternativa até que o yargs
    // seja atualizado para a versão 17. veja:
    //
    // https://github.com/bcoe/c8/pull/332#discussion_r721636191

    if (argv['100']) {
        argv.lines = 100;
        argv.functions = 100;
        argv.branches = 100;
        argv.statements = 100;
    }

    const report = Report({
        include: argv.include,
        exclude: argv.exclude,
        extension: argv.extension,
        reporter: Array.isArray(argv.reporter) ? argv.reporter : [argv.reporter],
        reportsDirectory: argv['reports-dir'],
        tempDirectory: argv.tempDirectory,
        watermarks: argv.watermarks,
        resolve: argv.resolve,
        omitRelative: argv.omitRelative,
        wrapperLength: argv.wrapperLength,
        all: argv.all
    });

    exports.checkCoverages(argv, report);
}

exports.checkCoverages = async function(argv, report) {
    const thresholds = {
        lines: argv.lines,
        functions: argv.functions,
        branches: argv.branches,
        statements: argv.statements
    };

    const map = await report.getCoverageMapFromAllCoverageFiles();

    if (argv.perFile) {
        map.files().forEach(file => {
            checkCoverage(map.fileCoverageFor(file).toSummary(), thresholds, file);
        });
    } else {
        checkCoverage(map.getCoverageSummary(), thresholds);
    }
}

function checkCoverage(summary, thresholds, file) {
    Object.keys(thresholds).forEach(key => {
        const coverage = summary[key].pct;

        if (coverage < thresholds[key]) {
            process.exitCode = 1;

            if (file) {
                console.error(
                    'erro: cobertura para ' + key + ' (' + coverage + '%) não atinge o limite (' + thresholds[key] + '%) para ' + relative('./', file).replace(/\\/g, '/')

                    // path padronizado para o windows
                );
            } else {
                console.error('erro: cobertura para ' + key + ' (' + coverage + '%) não atinge o limite global (' + thresholds[key] + '%)');
            }
        }
    });
}
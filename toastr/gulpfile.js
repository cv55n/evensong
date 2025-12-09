/* jshint node:true, camelcase:false */
var gulp = require('gulp');
var karma = require('karma').server;
var merge = require('merge-stream');
var plug = require('gulp-load-plugins')();

var paths = {
    js: './toastr.js',
    less: './toastr.less',
    
    report: './report',
    build: './build'
};

var log = plug.util.log;

/**
 * lista as tasks gulp disponíveis
 */
gulp.task('help', plug.taskListing);

/**
 * verifica o código, cria report de cobertura e um visualizador
 * 
 * @return {Stream}
 */
gulp.task('analyze', function() {
    log('analisando a fonte com jshint e jscs');

    var jshint = analyzejshint([paths.js]);
    var jscs = analyzejscs([paths.js]);

    return merge(jshint, jscs);
});

/**
 * minimiza e empacota o javascript do app
 * 
 * @return {Stream}
 */
gulp.task('js', function() {
    log('empacotando, minimizando e copiando o javascript do app');

    return gulp
        .src(paths.js)
        .pipe(plug.sourcemaps.init())
        .pipe(plug.bytediff.start())
        .pipe(plug.uglify({}))
        .pipe(plug.bytediff.stop(bytediffFormatter))
        .pipe(plug.sourcemaps.write('.'))
        .pipe(plug.rename(function (path) {
            if (path.extname === '.js') {
                path.basename += '.min';
            }
        }))
        .pipe(gulp.dest(paths.build));
});

/**
 * minimiza e empacota o css
 * 
 * @return {Stream}
 */
gulp.task('css', function() {
    log('empacotando, minimizando e copiando o css do app');

    return gulp
        .src(paths.less)
        .pipe(plug.less())
        .pipe(gulp.dest(paths.build))
        .pipe(plug.bytediff.start())
        .pipe(plug.minifyCss({}))
        .pipe(plug.bytediff.stop(bytediffFormatter))
        .pipe(plug.rename('toastr.min.css'))
        .pipe(gulp.dest(paths.build));
});

/**
 * constrói o js e css
 */
gulp.task('default', ['js', 'css'], function() {
    log('analisa e constrói o css e js');
});

/**
 * remove todos os arquivos da pasta build
 * 
 * um jeito de rodar de forma limpa antes de todas as tasks
 * rodarem na linha de comando: gulp clean && gulp build
 * 
 * @return {Stream}
 */
gulp.task('clean', function() {
    log('limpando: ' + plug.util.colors.blue(paths.report));
    log('limpando: ' + plug.util.colors.blue(paths.build));

    var delPaths = [paths.build, paths.report];

    del(delPaths, cb);
});

/**
 * executa os specs uma vez e encerra
 * 
 * para iniciar os servidores e rodar as specs:
 * 
 * gulp test --startServers
 * 
 * @return {Stream}
 */
gulp.task('test', function(done) {
    startTests(true /* singlerun */, done);
});

/**
 * executa o jshint ao receber os arquivos fonte
 * 
 * @param {Array} sources
 * @param {String} overrideRcFile
 * 
 * @return {Stream}
 */
function analyzejshint(sources, overrideRcFile) {
    var jshintrcFile = overrideRcFile || './.jshintrc';

    log('rodando jshint');

    return gulp
        .src(sources)
        .pipe(plug.jshin(jshintrcFile))
        .pipe(plug.jshint.reporter('jshint-stylish'));
}

/**
 * executa o jscs ao receber os arquivos fonte
 * 
 * @param {Array} sources
 * 
 * @return {Stream}
 */
function analyzejscs(sources) {
    log('rodando jscs');

    return gulp
        .src(sources)
        .pipe(plug.jscs('./.jscsrc'));
}

/**
 * inicia os testes utilizando o karma
 * 
 * @param {boolean} singleRun - true = rodar uma vez e finalizar (ci) ou manter rodando (dev)
 * @param {Function} done - callback para disparar quando o karma estiver pronto
 * 
 * @return {undefined}
 */
function startTests(singleRun, done) {
    karma.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: !!singleRun
    }, karmaCompleted);

    function karmaCompleted(exitCode) {
        if (exitCode === 0) {
            done();
        } else {
            process.exit(exitCode);
        }
    }
}

/**
 * formatador para o bytediff para mostrar as mudanças de
 * tamanho depois do processamento
 * 
 * @param {Object} data - dados em bytes
 * 
 * @return {String} diferença em bytes, formatado
 */
function bytediffFormatter(data) {
    var difference = (data.savings > 0) ? ' smaller.' : ' larger.';

    return data.fileName + ' foi de ' +
        (data.startSize / 1000).toFixed(2) + ' kb para ' + (data.endSize / 1000).toFixed(2) + ' kb' +
        ' e é ' + formatPercent(1 - data.percent, 2) + '%' + difference;
}

/**
 * formata um número como uma porcentagem
 * 
 * @param {Number} num número a ser formatado como porcentagem
 * @param {Number} precision precisão do decimal
 * 
 * @return {Number} porcentagem formatada
 */
function formatPercent(num, precision) {
    return (num * 100).toFixed(precision);
}
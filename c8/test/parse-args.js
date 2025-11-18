/* descrição global */

const {
    buildYargs,
    hideInstrumenteeArgs,
    hideInstrumenterArgs
} = require('../lib/parse-args');

const { join, resolve } = require('path');

describe('parse-args', () => {
    describe('hideInstrumenteeArgs', () => {
        it('oculta os argumentos passados ​​para o aplicativo instrumentado', () => {
            process.argv = [
                'node',
                'c8',
                '--foo=99',
                'my-app',
                '--help'
            ];

            const instrumenterArgs = hideInstrumenteeArgs();

            instrumenterArgs.should.eql([
                '--foo=99',
                'my-app'
            ]);
        });
    });

    describe('hideInstrumenterArgs', () => {
        it('oculta os argumentos passados para o binário do c8', () => {
            process.argv = [
                'node',
                'c8',
                '--foo=99',
                'my-app',
                '--help'
            ];

            const argv = buildYargs().parse(hideInstrumenteeArgs());
            const instrumenteeArgs = hideInstrumenterArgs(argv);

            instrumenteeArgs.should.eql([
                'my-app',
                '--help'
            ]);

            argv.tempDirectory.endsWith(join('coverage', 'tmp')).should.be.equal(true);
        });
    });

    describe('com node_v8_coverage já definido', () => {
        it('não deve sobrepor isso', () => {
            const NODE_V8_COVERAGE = process.env.NODE_V8_COVERAGE;

            process.env.NODE_V8_COVERAGE = './coverage/tmp_';
            
            process.argv = [
                'node',
                'c8',
                '--foo=99',
                'my-app',
                '--help'
            ];

            const argv = buildYargs().parse(hideInstrumenteeArgs());

            argv.tempDirectory.endsWith('/coverage/tmp_').should.be.equal(true);

            process.env.NODE_V8_COVERAGE = NODE_V8_COVERAGE;
        });
    });

    describe('--config', () => {
        it('deve resolver para .nycrc no cwd', () => {
            const argv = buildYargs().parse([
                'node',
                'c8',
                'my-app'
            ]);

            argv.lines.should.be.equal(95);
        });

        it('deve utilizar o arquivo de configuração especificado em --config', () => {
            const argv = buildYargs().parse([
                'node',
                'c8',
                '--config',

                require.resolve('./fixtures/config/.c8rc.json')
            ]);

            argv.lines.should.be.equal(101);
            argv.tempDirectory.should.be.equal('./foo');
        });

        it('deve possuir -c como um alias', () => {
            const argv = buildYargs().parse([
                'node',
                'c8',
                '-c',

                require.resolve('./fixtures/config/.c8rc.json')
            ]);

            argv.lines.should.be.equal(101);
            argv.tempDirectory.should.be.equal('./foo');
        });

        it('deve respeitar as opções da linha de comando em vez do arquivo de configuração', () => {
            const argv = buildYargs().parse([
                'node',
                'c8',
                '--lines',
                '100',
                '--config',
                
                require.resolve('./fixtures/config/.c8rc.json')
            ]);

            argv.lines.should.be.equal(100);
        });

        it('deve permitir que os arquivos de configuração se estendam mutuamente', () => {
            const argv = buildYargs().parse([
                'node',
                'c8',
                '--lines',
                '100',
                '--config',
                
                require.resolve('./fixtures/config/.c8rc-base.json')
            ]);
            
            argv.branches.should.be.equal(55);
            argv.lines.should.be.equal(100);
            argv.functions.should.be.equal(24);
        });

        it('deve permitir diretórios de relatórios de caminho relativo', () => {
            const argsArray = [
                'node',
                'c8',
                '--lines',
                '100',
                '--reports-dir',
                './coverage_'
            ];
            
            const argv = buildYargs().parse(argsArray);

            argv.reportsDir.should.be.equal('./coverage_');
        });

        it('deve permitir diretórios temporários com caminhos relativos', () => {
            const argsArray = [
                'node',
                'c8',
                '--lines',
                '100',
                '--temp-directory',
                './coverage/tmp_'
            ];
            
            const argv = buildYargs().parse(argsArray);

            argv.tempDirectory.should.be.equal('./coverage/tmp_');
        });

        it('deve permitir diretórios de relatórios de caminho absoluto', () => {
            const tmpDir = resolve(process.cwd(), 'coverage_');

            const argsArray = [
                'node',
                'c8',
                '--lines',
                '100',
                '--reports-dir',
                
                tmpDir
            ];
            
            const argv = buildYargs().parse(argsArray);

            argv.reportsDir.should.be.equal(tmpDir);
        });

        it('deve permitir diretórios temporários com caminho absoluto', () => {
            const tmpDir = resolve(process.cwd(), './coverage/tmp_');

            const argsArray = [
                'node',
                'c8',
                '--lines',
                '100',
                '--temp-directory',
                
                tmpDir
            ];

            const argv = buildYargs().parse(argsArray);

            argv.tempDirectory.should.be.equal(tmpDir);
        });
    });

    describe('--merge-async', () => {
        it('deve ser padronizado como falso', () => {
            const argv = buildYargs().parse([
                'node',
                'c8'
            ]);

            argv.mergeAsync.should.be.equal(false);
        });

        it('deve ser definido como true quando a flag existir', () => {
            const argv = buildYargs().parse([
                'node',
                'c8',
                '--merge-async'
            ]);

            argv.mergeAsync.should.be.equal(true);
        });
    });
});
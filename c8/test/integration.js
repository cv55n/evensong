/* describe, before, beforeach e it globais  */

const { readFileSync } = require('fs');
const { resolve } = require('path');
const { spawnSync } = require('child_process');
const { statSync, rm } = require('fs');
const { dirname } = require('path');

const c8Path = require.resolve('../bin/c8');
const chaiJestSnapshot = require('chai-jest-snapshot');

const nodePath = process.execPath;
const tsNodePath = './node_modules/.bin/ts-node';

require('chai')
    .use(chaiJestSnapshot)
    .should()

before(cb => rm('tmp', {
    recursive: true,
    force: true
}, cb));

beforeEach(function() {
    chaiJestSnapshot.configureUsingMochaContext(this);
});

;[false, true].forEach((mergeAsync) => {
    const title = mergeAsync ? 'c8 mergeasync' : 'c8';

    describe(title, () => {
        it('reports de cobertura para script que termina normalmente', () => {
            const { output } = spawnSync(nodePath, [
                c8Path,

                '--exclude="test/*.js"',
                '--temp-directory=tmp/normal',
                '--clean=false',
                `--merge-async=${mergeAsync}`,

                nodePath,

                require.resolve('./fixtures/normal')
            ]);

            output.toString('utf8').should.matchSnapshot();
        });

        it('suporta a configuração externa de node_v8_coverage', () => {
            const { output } = spawnSync(nodePath, [
                c8Path,

                '--exclude="test/*.js"',
                '--clean=true',
                `--merge-async=${mergeAsync}`,

                nodePath,

                require.resolve('./fixtures/normal')
            ], {
                env: {
                    NODE_V8_COVERAGE: 'tmp/override'
                }
            });

            const stats = statSync('tmp/override');

            stats.isDirectory().should.equal(true);

            output.toString('utf8').should.matchSnapshot();
        });

        it('combina reports de subprocessos juntos', () => {
            const { output } = spawnSync(nodePath, [
                c8Path,

                '--exclude="test/*.js"',
                '--temp-directory=tmp/multiple-spawn',
                '--clean=false',
                `--merge-async=${mergeAsync}`,

                nodePath,

                require.resolve('./fixtures/multiple-spawn')
            ]);

            output.toString('utf8').should.matchSnapshot();
        });

        it('permite a inclusão de arquivos relativos', () => {
            const { output } = spawnSync(nodePath, [
                c8Path,

                '--exclude="test/*.js"',
                '--temp-directory=tmp/multiple-spawn-2',
                '--omit-relative=false',
                '--clean=false',
                `--merge-async=${mergeAsync}`,

                nodePath,

                require.resolve('./fixtures/multiple-spawn')
            ], {
                env: {
                    NODE_DEBUG: 'c8'
                }
            });

            output.toString('utf8').should.match(
                /erro: enoent: não existe tal arquivo ou diretório.*loader\.js/
            );
        });
    });
});
var assert = require('assert');
var ourProcess = require('./browser');

describe('teste contra nosso processo', function() {
    test(ourProcess);
});

if (!process.browser) {
    describe('teste contra o node', function() {
        test(process);
    });

    vmtest();
}

function test(ourProcess) {
    describe('argumentos de teste', function() {
        it('funciona', function(done) {
            var order = 0;

            ourProcess.nextTick(function(num) {
                assert.equal(num, order++, 'o primeiro funciona');

                ourProcess.nextTick(function(num) {
                    assert.equal(num, order++, 'recursivo é o quarto');
                }, 3);
            }, 0);

            ourProcess.nextTick(function(num) {
                assert.equal(num, order++, 'o segundo inicia');

                ourProcess.nextTick(function(num) {
                    assert.equal(num, order++, 'esse é o terceiro');

                    ourProcess.nextTick(function(num) {
                        assert.equal(num, order++, 'esse é o último');

                        done();
                    }, 5);
                }, 4);
            }, 1);

            ourProcess.nextTick(function(num) {
                assert.equal(num, order++, 'o terceiro acontece depois do erro');
            }, 2);
        });
    });

    if (!process.browser) {
        describe('erros de teste', function(t) {
            it('funciona', function(done) {
                var order = 0;

                process.removeAllListeners('uncaughtException');

                process.once('uncaughtException', function(err) {
                    assert.equal(2, order++, 'erro é o terceiro');

                    ourProcess.nextTick(function () {
                        assert.equal(5, order++, 'schedualed em erro é o último');

                        done();
                    });
                });

                ourProcess.nextTick(function() {
                    assert.equal(0, order++, 'o primeiro funciona');
                    
                    ourProcess.nextTick(function() {
                        assert.equal(4, order++, 'recursivo é o quarto');
                    });
                });
                
                ourProcess.nextTick(function() {
                    assert.equal(1, order++, 'o segundo inicia');
                
                    throw(new Error('um erro é disparado'));
                });
                
                ourProcess.nextTick(function() {
                    assert.equal(3, order++, 'o terceiro schedualed acontece depois do erro');
                });
            });
        });
    }

    describe('renomeação de globais', function(t) {
        var oldTimeout = setTimeout;
        var oldClear = clearTimeout;

        it('clearTimeout', function(done) {
            var ok = true;

            clearTimeout = function () {
                ok = false;
            }

            var ran = false;

            function cleanup() {
                clearTimeout = oldClear;

                var err;

                try {
                    assert.ok(ok, 'fake cleartimeout rodou');
                    assert.ok(ran, 'deveria ter rodado');
                } catch (e) {
                    err = e;
                }

                done(err);
            }

            setTimeout(cleanup, 1000);

            ourProcess.nextTick(function() {
                ran = true;
            });
        });

        it('apenas settimeout', function(done) {
            setTimeout = function() {
                setTimeout = oldTimeout;

                try {
                    assert.ok(false, 'fake settimeout chamado')
                } catch (e) {
                    done(e);
                }
            }

            ourProcess.nextTick(function() {
                setTimeout = oldTimeout;

                done();
            });
        });
    });
}

function vmtest() {
    var vm = require('vm');
    var fs = require('fs');

    var process = fs.readFileSync('./browser.js', {
        encoding: 'utf8'
    });

    describe('deve funcionar em vm no modo strict sem globais', function() {
        it('deve parsear', function(done) {
            var str = '"use strict";var module = {exports:{}};';

            str += process;
            str += 'this.works = process.browser;';

            var script = new vm.Script(str);

            var context = {
                works: false
            };

            script.runInNewContext(context);

            assert.ok(context.works);

            done();
        });

        it('settimeout dispara um erro', function(done) {
            var str = '"use strict";var module = {exports:{}};';

            str += process;
            str += 'try {process.nextTick(function () {})} catch (e){this.works = e;}';

            var script = new vm.Script(str);

            var context = {
                works: false
            };

            script.runInNewContext(context);

            assert.ok(context.works);

            done();
        });

        it('no geral deve funcionar', function(done) {
            var str = '"use strict";var module = {exports:{}};';
            
            str += process;
            str += 'process.nextTick(function () {assert.ok(true);done();})';
            
            var script = new vm.Script(str);

            var context = {
                clearTimeout: clearTimeout,
                setTimeout: setTimeout,
                done: done,
                assert: assert
            };

            script.runInNewContext(context);
        });

        it('defs settimeout atrasados', function(done) {
            var str = '"use strict";var module = {exports:{}};';
            
            str += process;
            str += 'var setTimeout = hiddenSetTimeout;process.nextTick(function () {assert.ok(true);done();})';
            
            var script = new vm.Script(str);
            
            var context = {
                clearTimeout: clearTimeout,
                hiddenSetTimeout: setTimeout,
                done: done,
                assert: assert
            };

            script.runInNewContext(context);
        });

        it('defs cleartimeout atrasados', function(done) {
            var str = '"use strict";var module = {exports:{}};';
            
            str += process;
            str += 'var clearTimeout = hiddenClearTimeout;process.nextTick(function () {assert.ok(true);done();})';
            
            var script = new vm.Script(str);
            
            var context = {
                hiddenClearTimeout: clearTimeout,
                setTimeout: setTimeout,
                done: done,
                assert: assert
            };

            script.runInNewContext(context);
        });

        it('defs settimeout atrasados e então redefinir', function(done) {
            var str = '"use strict";var module = {exports:{}};';
            
            str += process;
            str += 'var setTimeout = hiddenSetTimeout;process.nextTick(function () {setTimeout = function (){throw new Error("foo")};hiddenSetTimeout(function(){process.nextTick(function (){assert.ok(true);done();});});});';
            
            var script = new vm.Script(str);

            var context = {
                clearTimeout: clearTimeout,
                hiddenSetTimeout: setTimeout,
                done: done,
                assert: assert
            };

            script.runInNewContext(context);
        });
    });
}
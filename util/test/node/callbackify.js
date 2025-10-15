'use strict';

// esse teste checa se as semânticas de `util.callbackify` são
// descritas nas documentações de api

var common = require('./common');
var assert = require('assert');
var callbackify = require('../../').callbackify;
var execFile = require('child_process').execFile;

if (typeof Promise === 'undefined') {
    console.log('nenhuma promise global encontrada, pulando testes de callbackify');
    
    return;
}

var values = [
    'hello world',
    null,
    undefined,
    false,
    0,
    {},
    { key: 'value' },
    function ok() {},
    ['array', 'com', 4, 'valores'],
    new Error('boo')
];

if (typeof Symbol !== 'undefined') {
    values.push(Symbol('eu sou um símbolo'));
}

{
    // testar se o valor da resolução é passado como segundo argumento para a callback
    values.forEach(function(value) {
        // testar a factory da promise
        function promiseFn() {
            return Promise.resolve(value);
        }

        var cbPromiseFn = callbackify(promiseFn);
        
        cbPromiseFn(common.mustCall(function(err, ret) {
            assert.ifError(err);
        
            assert.strictEqual(ret, value);
        }));

        // testar a thenable
        function thenableFn() {
            return {
                then: function(onRes, onRej) {
                    onRes(value);
                }
            };
        }

        var cbThenableFn = callbackify(thenableFn);
        
        cbThenableFn(common.mustCall(function(err, ret) {
            assert.ifError(err);
            
            assert.strictEqual(ret, value);
        }));
    });
}

{
    // testar se a razão da rejeição é passada como primeiro argumento para a callback
    values.forEach(function(value) {
        // testar uma factory da promise
        function promiseFn() {
            return Promise.reject(value);
        }

        var cbPromiseFn = callbackify(promiseFn);

        cbPromiseFn(common.mustCall(function(err, ret) {
            assert.strictEqual(ret, undefined);

            if (err instanceof Error) {
                if ('reason' in err) {
                    assert(!value);

                    assert.strictEqual(err.message, 'a promise foi rejeitada com um valor falso');
                    assert.strictEqual(err.reason, value);
                } else {
                    assert.strictEqual(String(value).slice(-err.message.length), err.message);
                }
            } else {
                assert.strictEqual(err, value);
            }
        }));

        // testar a thenable
        function thenableFn() {
            return {
                then: function (onRes, onRej) {
                    onRej(value);
                }
            };
        }

        var cbThenableFn = callbackify(thenableFn);

        cbThenableFn(common.mustCall(function(err, ret) {
            assert.strictEqual(ret, undefined);
            
            if (err instanceof Error) {
                if ('reason' in err) {
                    assert(!value);

                    assert.strictEqual(err.message, 'a promise foi rejeitada com um valor falso');
                    assert.strictEqual(err.reason, value);
                } else {
                    assert.strictEqual(String(value).slice(-err.message.length), err.message);
                }
            } else {
                assert.strictEqual(err, value);
            }
        }));
    });
}

{
    // testar se os argumentos passados ​​para a função callbackified são passados ​​para a função original
    values.forEach(function(value) {
        function promiseFn(arg) {
            assert.strictEqual(arg, value);

            return Promise.resolve(arg);
        }

        var cbPromiseFn = callbackify(promiseFn);

        cbPromiseFn(value, common.mustCall(function(err, ret) {
            assert.ifError(err);
            
            assert.strictEqual(ret, value);
        }));
    });
}

{
    // testar se a ligação `this` é a mesma para callbackified e a original
    values.forEach(function(value) {
        var iAmThis = {
            fn: function(arg) {
                assert.strictEqual(this, iAmThis);

                return Promise.resolve(arg);
            }
        };
        
        iAmThis.cbFn = callbackify(iAmThis.fn);
        
        iAmThis.cbFn(value, common.mustCall(function(err, ret) {
            assert.ifError(err);
            
            assert.strictEqual(ret, value);
            assert.strictEqual(this, iAmThis);
        }));
    });
}

// esses testes não são necessários no navegador
if (false) {
    // testar se a callback emite um evento `uncaughtexception`
    var fixture = fixtures.path('uncaught-exceptions', 'callbackify1.js');

    execFile(
        process.execPath,
        
        [fixture],

        common.mustCall(function (err, stdout, stderr) {
            assert.strictEqual(err.code, 1);
            assert.strictEqual(Object.getPrototypeOf(err).name, 'Error');
            assert.strictEqual(stdout, '');

            var errLines = stderr.trim().split(/[\r\n]+/);
            var errLine = errLines.find(function (l) { return /^Error/.exec(l) });
            
            assert.strictEqual(errLine, 'Error: ' + fixture);
        })
    );
}

if (false) {
    // testar se o `uncaughtexception` auxiliado funciona e se passa a razão da rejeição
    var fixture = fixtures.path('uncaught-exceptions', 'callbackify2.js');

    execFile(
        process.execPath,

        [fixture],

        common.mustCall(function(err, stdout, stderr) {
            assert.ifError(err);

            assert.strictEqual(stdout.trim(), fixture);
            assert.strictEqual(stderr, '');
        })
    );
}

{
    // verificar se os inputs não funcionais são acionados
    ['foo', null, undefined, false, 0, {}, typeof Symbol !== 'undefined' ? Symbol() : undefined, []].forEach(function(value) {
        common.expectsError(function() {
            callbackify(value);
        }, {
            code: 'ERR_INVALID_ARG_TYPE',
            type: TypeError,
            message: 'o argumento "original" deve ser do tipo function'
        });
    });
}

if (require('is-async-supported')()) {
    require('./callbackify-async');
}
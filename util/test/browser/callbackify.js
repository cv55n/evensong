'use strict';

var test = require('tape');
var callbackify = require('../../').callbackify;

if (typeof Promise === 'undefined') {
    console.log('nenhuma promise global encontrada, pulando testes de fallbackify');

    return;
}

function after(n, cb) {
    var i = 0;

    return function() {
        if (++i === n)
            cb();
    }
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

test('valor de resolução do util.callbackify é passado como segundo argumento para a callback', function(t) {
    var end = after(values.length * 2, t.end);

    // teste que o valor da resolução é passado como segundo argumento para a callback
    values.forEach(function(value) {
        // testando a factory da promise
        function promiseFn() {
            return Promise.resolve(value);
        }

        var cbPromiseFn = callbackify(promiseFn);

        cbPromiseFn(function(err, ret) {
            t.ifError(err);
            t.strictEqual(ret, value, 'cb ' + typeof value);

            end();
        });

        // testando o thenable
        function thenableFn() {
            return {
                then: function(onRes, onRej) {
                    onRes(value);
                }
            };
        }

        var cbThenableFn = callbackify(thenableFn);

        cbThenableFn(function(err, ret) {
            t.ifError(err);
            t.strictEqual(ret, value, 'thenable ' + typeof value);

            end();
        });
    });
});

test('a razão da rejeição de util.callbackify é passada como primeiro argumento para a callback', function(t) {
    var end = after(values.length * 2, t.end);

    // teste que a razão da rejeição é passada como primeiro argumento para a callback
    values.forEach(function(value) {
        // testando a factory da promise
        function promiseFn() {
            return Promise.reject(value);
        }

        var cbPromiseFn = callbackify(promiseFn);

        cbPromiseFn(function(err, ret) {
            t.strictEqual(ret, undefined, 'cb ' + typeof value);

            if (err instanceof Error) {
                if ('reason' in err) {
                    t.ok(!value);

                    t.strictEqual(err.message, 'promise foi rejeitada com um valor falso');
                    t.strictEqual(err.reason, value);
                } else {
                    t.strictEqual(String(value).slice(-err.message.length), err.message);
                }
            } else {
                t.strictEqual(err, value);
            }

            end();
        });

        // testando o thenable
        function thenableFn() {
            return {
                then: function(onRes, onRej) {
                    onRej(value);
                }
            };
        }

        var cbThenableFn = callbackify(thenableFn);

        cbThenableFn(function(err, ret) {
            t.strictEqual(ret, undefined, 'thenable ' + typeof value);
            
            if (err instanceof Error) {
                if ('reason' in err) {
                    t.ok(!value);

                    t.strictEqual(err.message, 'promise foi rejeitada com um valor falso');
                    t.strictEqual(err.reason, value);
                } else {
                    t.strictEqual(String(value).slice(-err.message.length), err.message);
                }
            } else {
                t.strictEqual(err, value);
            }

            end();
        });
    });
});

test('argumentos de util.callbackify passados para a função callbackified são passados para o original', function(t) {
    var end = after(values.length, t.end);

    // testa se os argumentos de util.callbackify passados para a função callbackified são passados para o original
    values.forEach(function(value) {
        function promiseFn(arg) {
            t.strictEqual(arg, value);

            return Promise.resolve(arg);
        }

        var cbPromiseFn = callbackify(promiseFn);

        cbPromiseFn(value, function(err, ret) {
            t.ifError(err);
            
            t.strictEqual(ret, value);

            end();
        });
    });
});

test('a ligação `this` de util.callbackify é a mesma para a callbackified e o original', function(t) {
    var end = after(values.length, t.end);

    // testa se a ligação `this` é a mesma para a callbackified e o original
    values.forEach(function(value) {
        var iAmThis = {
            fn: function(arg) {
                t.strictEqual(this, iAmThis);

                return Promise.resolve(arg);
            }
        };

        iAmThis.cbFn = callbackify(iAmThis.fn);

        iAmThis.cbFn(value, function(err, ret) {
            t.ifError(err);

            t.strictEqual(ret, value);
            t.strictEqual(this, iAmThis);

            end();
        });
    });
});

test('util.callbackify non-function inputs throw', function(t) {
    // verificar se os inputs não funcionais são acionados

    ['foo', null, undefined, false, 0, {}, typeof Symbol !== 'undefined' ? Symbol() : undefined, []].forEach(function(value) {
        t.throws(
            function() { callbackify(value); },

            'o argumento "original" deve ser do tipo function'
        );
    });

    t.end();
});
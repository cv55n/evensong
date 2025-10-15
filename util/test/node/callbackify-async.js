'use strict';

// separar arquivo de teste para testes utilizando uma nova
// sintaxe (async/await)

var common = require('./common');
var assert = require('assert');
var callbackify = require('../../').callbackify;
var execFile = require('child_process').execFile;

var values = [
    'hello world',
    null,
    undefined,
    false,
    0,
    {},
    { key: 'value' },
    Symbol('eu sou um símbolo'),
    function ok() {},
    ['array', 'com', 4, 'valores'],
    new Error('boo')
];

{
    // testar se o valor da resolução é passado como segundo argumento para a callback
    values.forEach(function(value) {
        // teste + `async function`
        async function asyncFn() {
            return value;
        }

        var cbAsyncFn = callbackify(asyncFn);

        cbAsyncFn(common.mustCall(function(err, ret) {
            assert.ifError(err);

            assert.strictEqual(ret, value);
        }));
    });
}

{
    // testar se a razão da rejeição é passada como primeiro argumento para a callback
    values.forEach(function(value) {
        // testar um `async function`
        async function asyncFn() {
            return Promise.reject(value);
        }

        var cbAsyncFn = callbackify(asyncFn);

        cbAsyncFn(common.mustCall(function(err, ret) {
            assert.strictEqual(ret, undefined);

            if (err instanceof Error) {
                if ('reason' in err) {
                    assert(!value);

                    assert.strictEqual(err.message, 'promise foi rejeitada com um valor falso');
                    assert.strictEqual(err.reason, value);
                } else {
                    assert.strictEqual(String(value).endsWith(err.message), true);
                }
            } else {
                assert.strictEqual(err, value);
            }
        }));
    });
}

{
    // testar se os argumentos passados para a função callbackfied são passados para o original
    values.forEach(function(value) {
        async function asyncFn(arg) {
            assert.strictEqual(arg, value);

            return arg;
        }

        var cbAsyncFn = callbackify(asyncFn);

        cbAsyncFn(value, common.mustCall(function(err, ret) {
            assert.ifError(err);
            assert.strictEqual(ret, value);
        }));
    });
}

{
    // testar se a ligação `this` é a mesma para a callbackified e o original
    values.forEach(function(value) {
        var iAmThat = {
            async fn(arg) {
                assert.strictEqual(this, iAmThat);

                return arg;
            }
        };

        iAmThat.cbFn = callbackify(iAmThat.fn);
        
        iAmThat.cbFn(value, common.mustCall(function(err, ret) {
            assert.ifError(err);

            assert.strictEqual(ret, value);
            assert.strictEqual(this, iAmThat);
        }));
    });
}

{
    async function asyncFn() {
        return 42;
    }

    var cb = callbackify(asyncFn);
    
    var args = [];

    // verificar se o último argumento para a função callbackfied
    // é de fato uma função
    ['foo', null, undefined, false, 0, {}, Symbol(), []].forEach(function(value) {
        args.push(value);

        common.expectsError(function() {
            cb(...args);
        }, {
            code: 'ERR_INVALID_ARG_TYPE',
            type: TypeError,
            message: 'o último argumento deve ser do tipo function'
        });
    });
}
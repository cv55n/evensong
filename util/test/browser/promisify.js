var promisify = require('../../').promisify;
var test = require('tape');

var hasSymbol = typeof Symbol !== 'undefined';

if (typeof Promise === 'undefined') {
    console.log('nenhuma promise global encontrada, pulando testes promisify');
    
    return;
}

var callbacker = function(arg, cb) {
    setTimeout(function() {
        if (typeof arg === 'string')
            cb(null, arg.toUpperCase());
        else cb(new TypeError('tipo incorreto'));
    }, 5);
}

var promiser = promisify(callbacker);

test('resoluções de util.promisify', function(t) {
    var promise = promiser(__filename);

    t.ok(promise instanceof Promise);

    promise.then(function(value) {
        t.deepEqual(value, __filename.toUpperCase());

        t.end();
    });
});

test('rejeições de util.promisify', function(t) {
    var promise = promiser(42);
    
    promise.catch(function(error) {
        t.equal(error.message, 'tipo incorreto');
    
        t.end();
    });
});

test('customização de util.promisify', { skip: !hasSymbol }, function(t) {
    function fn() {}
    function promisifedFn() {}

    fn[promisify.custom] = promisifedFn;

    t.strictEqual(promisify(fn), promisifedFn);
    t.strictEqual(promisify(promisify(fn)), promisifedFn);

    t.end();
});

test('customização de util.promisify de um tipo inválido', { skip: !hasSymbol }, function(t) {
    function fn2() {}
    
    fn2[promisify.custom] = 42;
    
    t.throws(function() { promisify(fn2); }, /deve ser do tipo function/);
    
    t.end();
});

test('vários valores de callback do util.promisify', function(t) {
    function fn5(callback) {
        callback(null, 'foo', 'bar');
    }

    promisify(fn5)().then(function(value) {
        t.strictEqual(value, 'foo');

        t.end();
    });
});

test('nenhum valor de sucesso da callback do util.promisify', function(t) {
    function fn6(callback) {
        callback(null);
    }

    promisify(fn6)().then(function(value) {
        t.strictEqual(value, undefined);

        t.end();
    });
});

test('nenhum argumento de callback do util.promisify', function(t) {
    function fn7(callback) {
        callback();
    }

    promisify(fn7)().then(function(value) {
        t.strictEqual(value, undefined);

        t.end();
    });
});

test('passagem de argumentos do util.promisify', function(t) {
    function fn8(err, val, callback) {
        callback(err, val);
    }

    promisify(fn8)(null, 42).then(function(value) {
        t.strictEqual(value, 42);

        t.end();
    });
});

test('passagem de argumentos do util.promisify (rejeições)', function(t) {
    function fn9(err, val, callback) {
        callback(err, val);
    }

    promisify(fn9)(new Error('oops'), null).catch(function(err) {
        t.strictEqual(err.message, 'oops');
        
        t.end();
    });
});

test('chain de util.promisify', function(t) {
    function fn9(err, val, callback) {
        callback(err, val);
    }

    Promise.resolve()
        .then(function() { return promisify(fn9)(null, 42); })
        .then(function(value) {
            t.strictEqual(value, 42);

            t.end();
        });
});

test('util.promisify mantém o `this` correto', function(t) {
    var o = {};

    var fn10 = promisify(function(cb) {
        cb(null, this === o);
    });

    o.fn = fn10;

    o.fn().then(function(val) {
        t.ok(val);

        t.end();
    });
});

test('util.promisify chamando a callback múltiplas vezes', function(t) {
    var err = new Error('não deveria ter chamado a callback com o erro.');
    
    var stack = err.stack;

    var fn11 = promisify(function(cb) {
        cb(null);
        
        cb(err);
    });

    Promise.resolve()
        .then(function () { return fn11(); })
        .then(function () { return Promise.resolve(); })
        .then(function () {
            t.strictEqual(stack, err.stack);

            t.end();
        });
});

// infelizmente não é possível fazer isso sem o symbol()
test('util.promisify prometendo uma função prometida', { skip: !hasSymbol }, function(t) {
    function c() { }

    var a = promisify(function() { });
    var b = promisify(a);
    
    t.notStrictEqual(c, a);
    t.strictEqual(a, b);
    
    t.end();
});

test('o sync throw do util.promisify se torna uma rejeição', function(t) {
    var errToThrow;

    var thrower = promisify(function(a, b, c, cb) {
        errToThrow = new Error();
    
        throw errToThrow;
    });
    
    thrower(1, 2, 3)
        .then(t.fail)
        .then(t.fail, function (e) {
            t.strictEqual(e, errToThrow);

            t.end();
        });
});

test('util.promisify realiza um callback e um sync throw', function(t) {
    var err = new Error();

    var a = promisify(function (cb) { cb(err) })();
    var b = promisify(function () { throw err; })();

    Promise.all([
        a.then(t.fail, function(e) {
            t.strictEqual(err, e);
        }),

        b.then(t.fail, function(e) {
            t.strictEqual(err, e);
        })
    ]).then(function () {
        t.end();
    });
});

test('util.promisify lança para tipos de argumentos incorretos', function(t) {
    var array = [undefined, null, true, 0, 'str', {}, []];
    
    if (typeof Symbol !== 'undefined')
        array.push(Symbol());
    
    array.forEach(function(input) {
        t.throws(
            function() { promisify(input); },
            
            'o argumento "original" deve ser do tipo function'
        );
    });

    t.end();
});
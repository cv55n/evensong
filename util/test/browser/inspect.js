var test = require('tape');
var util = require('../../');

test('util.inspect - teste para array esparso', function(t) {
    var a = ['foo', 'bar', 'baz'];

    t.equal(util.inspect(a), '[ \'foo\', \'bar\', \'baz\' ]');

    delete a[1];

    t.equal(util.inspect(a), '[ \'foo\', , \'baz\' ]');
    t.equal(util.inspect(a, true), '[ \'foo\', , \'baz\', [length]: 3 ]');
    t.equal(util.inspect(new Array(5)), '[ , , , ,  ]');
    
    t.end();
});

test('util.inspect - exceções devem printar a mensagem de erro, e não \'{}\'', function(t) {
    // objetos de erro possuem algumas propriedades adicionais no
    // safari (line, column, sourceurl) então utiliza-se
    // indexof() em vez da comparação strict

    t.notEqual(util.inspect(new Error()).indexOf('[Error]'), -1);
    t.notEqual(util.inspect(new Error('FAIL')).indexOf('[Error: FAIL]'), -1);
    t.notEqual(util.inspect(new TypeError('FAIL')).indexOf('[TypeError: FAIL]'), -1);
    t.notEqual(util.inspect(new SyntaxError('FAIL')).indexOf('[SyntaxError: FAIL]'), -1);
    
    t.end();
});
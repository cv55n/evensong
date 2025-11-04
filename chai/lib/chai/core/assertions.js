/*!
 * chai
 * 
 * https://chaijs.com
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

import { Assertion } from '../assertion.js';
import { AssertionError } from 'assertion-error';
import { config } from '../config.js';

import * as _ from '../utils/index.js';

const { flag } = _;

/**
 * ### chains de linguagem
 * 
 * os seguintes métodos são fornecidos como getters encadeáveis para
 * melhorar a legibilidade de suas asserções
 * 
 * **chains**
 * 
 * - to
 * - be
 * - been
 * - is
 * - that
 * - which
 * - and
 * - has
 * - have
 * - with
 * - at
 * - of
 * - same
 * - but
 * - does
 * - still
 * - also
 * 
 * @name chains de linguagem
 * 
 * @namespace BDD
 * 
 * @public
 */

[
    'to',
    'be',
    'been',
    'is',
    'and',
    'has',
    'have',
    'with',
    'that',
    'which',
    'at',
    'of',
    'same',
    'but',
    'does',
    'still',
    'also'
].forEach(function(chain) {
    Assertion.addProperty(chain);
});

/**
 * ### .not
 * 
 * nega todas as afirmações subsequentes na cadeia
 * 
 * expect(function() {}).to.not.throw();
 * expect({ a: 1 }).to.not.have.property('b');
 * expect([1, 2]).to.be.an('array').that.does.not.include(3);
 * 
 * só porque você pode negar qualquer asserção com `.not` não
 * significa que você deva fazê-lo. muitas vezes, é melhor
 * afirmar que o resultado esperado foi produzido, em vez de
 * afirmar que um dos inúmeros resultados inesperados não foi
 * produzido. consulte as asserções individuais para obter
 * orientações específicas
 * 
 * expect(2).to.equal(2); // recomendado
 * expect(2).to.not.equal(1); // não recomendado
 * 
 * @name not
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('not', function() {
    flag(this, 'negate', true);
});

/**
 * ### .deep
 * 
 * faz com que todas as asserções `.equal`, `.include`,
 * `.members`, `.keys` e `.property` subsequentes na cadeia
 * usem igualdade profunda em vez de igualdade estrita (`===`)
 * 
 * veja a página do projeto `deep-eql` para obter informações
 * sobre o algoritmo de igualdade profunda:
 * 
 * https://github.com/chaijs/deep-eql
 * 
 * // o objeto alvo é profundamente (mas não estritamente) igual a `{a: 1}`
 * expect({a: 1}).to.deep.equal({a: 1});
 * expect({a: 1}).to.not.equal({a: 1});
 * 
 * // o array alvo inclui profundamente (mas não estritamente) `{a: 1}`
 * expect([{a: 1}]).to.deep.include({a: 1});
 * expect([{a: 1}]).to.not.include({a: 1});
 *
 * // o objeto alvo inclui profundamente (mas não estritamente) `x: {a: 1}`
 * expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
 * expect({x: {a: 1}}).to.not.include({x: {a: 1}});
 *
 * // o array alvo possui profundamente (mas não estritamente) o membro `{a: 1}`
 * expect([{a: 1}]).to.have.deep.members([{a: 1}]);
 * expect([{a: 1}]).to.not.have.members([{a: 1}]);
 *
 * // o conjunto de destino definido profundamente (mas não estritamente) possui a chave `{a: 1}`
 * expect(new Set([{a: 1}])).to.have.deep.keys([{a: 1}]);
 * expect(new Set([{a: 1}])).to.not.have.keys([{a: 1}]);
 *
 * // o objeto alvo possui, em profundidade (mas não estritamente), a propriedade `x: {a: 1}`
 * expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
 * expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
 * 
 * @name deep
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('deep', function() {
    flag(this, 'deep', true);
});

/**
 * ### .nested
 * 
 * habilita a notação de ponto e colchetes em todas as
 * asserções `.property` e `.include` subsequentes na
 * cadeia
 * 
 * expect({ a: { b: ['x', 'y'] } }).to.have.nested.property('a.b[1]');
 * expect({ a: { b: ['x', 'y'] } }).to.nested.include({ 'a.b[1]': 'y' });
 * 
 * se `.` ou `[]` fizerem parte de um nome de propriedade
 * real, eles podem ser escapados adicionando duas barras
 * invertidas antes deles
 * 
 * expect({ '.a': { '[b]': 'x' } }).to.have.nested.property('\\.a.\\[b\\]');
 * expect({ '.a': { '[b]': 'x' } }).to.nested.include({ '\\.a.\\[b\\]': 'x' });
 * 
 * `.nested` não pode ser combinado com `.own`
 * 
 * @name nested
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('nested', function() {
    flag(this, 'nested', true);
});

/**
 * ### .own
 * 
 * faz com que todas as asserções `.property` e `.include`
 * subsequentes na cadeia ignorem as propriedades herdadas
 * 
 * object.prototype.b = 2;
 * 
 * expect({ a: 1 }).to.have.own.property('a');
 * expect({ a: 1 }).to.have.property('b');
 * expect({ a: 1 }).to.not.have.own.property('b');
 * 
 * expect({ a: 1 }).to.own.include({ a: 1 });
 * expect({ a: 1 }).to.include({ b: 2 }).but.not.own.include({ b: 2 });
 * 
 * `.own` não pode ser combinado com `.nested`
 * 
 * @name own
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('own', function() {
    flag(this, 'own', true);
});

/**
 * ### .ordered
 * 
 * faz com que todas as asserções `.members` subsequentes na
 * cadeia exijam que os membros estejam na mesma ordem
 * 
 * expect([1, 2]).to.have.ordered.members([1, 2])
 *     .but.not.have.ordered.members([2, 1]);
 * 
 * quando `.include` e `.ordered` são combinados, a ordenação
 * começa no início de ambos os arrays
 * 
 * expect([1, 2, 3]).to.include.ordered.members([1, 2])
 *     .but.not.include.ordered.members([2, 3]);
 * 
 * @name ordered
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('ordered', function() {
    flag(this, 'ordered', true);
});

/**
 * ### .any
 * 
 * faz com que todas as asserções `.keys` subsequentes na
 * cadeia exijam apenas que o alvo possua pelo menos uma das
 * chaves fornecidas. Isso é o oposto de `.all`, que exige
 * que o alvo possua todas as chaves fornecidas
 * 
 * expect({ a: 1, b: 2 }).to.not.have.any.keys('c', 'd');
 * 
 * consulte a documentação do parâmetro `.keys` para obter
 * orientações sobre quando usar `.any` ou `.all`
 * 
 * @name any
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('any', function() {
    flag(this, 'any', true);
    flag(this, 'all', false);
});

/**
 * ### .all
 * 
 * faz com que todas as asserções `.keys` subsequentes na
 * cadeia exijam que o alvo possua todas as chaves fornecidas.
 * isso é o oposto de `.any`, que exige apenas que o alvo
 * possua pelo menos uma das chaves fornecidas
 * 
 * expect({ a: 1, b: 2 }).to.have.all.keys('a', 'b');
 * 
 * note que `.all` é usado por padrão quando nem `.all` nem
 * `.any` são adicionados anteriormente na cadeia. no entanto,
 * muitas vezes é melhor adicionar `.all` mesmo assim, pois
 * melhora a legibilidade
 * 
 * consulte a documentação do parâmetro `.keys` para obter
 * orientações sobre quando usar `.any` ou `.all`
 * 
 * @name all
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('all', function() {
    flag(this, 'all', true);
    flag(this, 'any', false);
});

const functionTypes = {
    function: [
        'function',
        'asyncfunction',
        'generatorfunction',
        'asyncgeneratorfunction'
    ],

    asyncfunction: [
        'asyncfunction',
        'asyncgeneratorfunction'
    ],

    generatorfunction: [
        'generatorfunction',
        'asyncgeneratorfunction'
    ],

    asyncgeneratorfunction: [
        'asyncgeneratorfunction'
    ]
};

/**
 * ### .a(type[, msg])
 * 
 * verifica se o tipo do alvo é igual à string fornecida
 * `type`. os tipos não diferenciam maiúsculas de minúsculas.
 * consulte o arquivo utilitário `./type-detect.js` para
 * obter informações sobre o algoritmo de detecção de tipo
 * 
 * expect('foo').to.be.a('string');
 * expect({a: 1}).to.be.an('object');
 * expect(null).to.be.a('null');
 * expect(undefined).to.be.an('undefined');
 * expect(new Error).to.be.an('error');
 * expect(Promise.resolve()).to.be.a('promise');
 * expect(new Float32Array).to.be.a('float32array');
 * expect(Symbol()).to.be.a('symbol');
 * 
 * `.a` suporta objetos que possuem um tipo personalizado
 * definido por meio de `symbol.tostringtag`
 * 
 * var myObj = {
 *     [Symbol.toStringTag]: 'myCustomType'
 * };
 * 
 * expect(myObj).to.be.a('myCustomType').but.not.an('object');
 * 
 * geralmente, é melhor usar `.a` para verificar o tipo de
 * um alvo antes de fazer mais asserções sobre o mesmo alvo.
 * dessa forma, você evita comportamentos inesperados de
 * qualquer asserção que execute ações diferentes com base
 * no tipo do alvo
 * 
 * expect([1, 2, 3]).to.be.an('array').that.includes(2);
 * expect([]).to.be.an('array').that.is.empty;
 * 
 * adicione `.not` mais cedo na cadeia para negar `.a`. no
 * entanto, muitas vezes é melhor afirmar que o alvo é o tipo
 * esperado, em vez de afirmar que não é um dos muitos tipos
 * inesperados
 * 
 * expect('foo').to.be.a('string'); // recomendado
 * expect('foo').to.not.be.an('array'); // não recomendado
 * 
 * `.a` aceita um argumento opcional `msg`, que é uma mensagem
 * de erro personalizada a ser exibida quando a asserção
 * falhar. a mensagem também pode ser fornecida como o segundo
 * argumento de `expect`
 * 
 * expect(1).to.be.a('string', 'nãooooo... falhou...');
 * expect(1, 'nãooooo... falhou...').to.be.a('string');
 * 
 * `.a` também pode ser usado como uma cadeia de linguagem
 * para melhorar a legibilidade de suas afirmações
 * 
 * expect({b: 2}).to.have.a.property('b');
 * 
 * o alias `.an` pode ser usado indistintamente com `.a`
 * 
 * @name a
 * 
 * @alias an
 * 
 * @param {string} type
 * @param {string} msg _opcional_
 * 
 * @namespace BDD
 * 
 * @public
 */

function an(type, msg) {
    if (msg)
        flag(this, 'message', msg);

    type = type.toLowerCase();

    let obj = flag(this, 'object'),
        article = ~['a', 'e', 'i', 'o', 'u'].indexOf(type.charAt(0)) ? 'an ' : 'a ';

    const detectedType = _.type(obj).toLowerCase();

    if (functionTypes['function'].includes(type)) {
        this.assert(
            functionTypes[type].includes(detectedType),
            
            'esperava-se que #{this} fosse ' + article + type,
            'esperava-se que #{this} não fosse ' + article + type
        );
    } else {
        this.assert(
            type === detectedType,

            'esperava-se que #{this} fosse ' + article + type,
            'esperava-se que #{this} não fosse ' + article + type
        );
    }
}

Assertion.addChainableMethod('an', an);
Assertion.addChainableMethod('a', an);

/**
 * @param {unknown} a
 * @param {unknown} b
 * 
 * @returns {boolean}
 */
function SameValueZero(a, b) {
    return (_.isNaN(a) && _.isNaN(b)) || a === b;
}

/** */
function includeChainingBehavior() {
    flag(this, 'contains', true);
}

/**
 * ### .include(val[, msg])
 * 
 * quando o alvo é uma string, `.include` garante que a string
 * fornecida `val` é uma substring do alvo
 * 
 * expect('foobar').to.include('foo');
 * 
 * quando o alvo é um array, `.include` garante que o `val`
 * fornecido é um membro do alvo
 * 
 * expect([1, 2, 3]).to.include(2);
 * 
 * quando o alvo é um objeto, `.include` garante que as
 * propriedades do objeto fornecido, `val`, são um subconjunto
 * das propriedades do alvo
 * 
 * expect({ a: 1, b: 2, c: 3 }).to.include({ a: 1, b: 2 });
 * 
 * quando o alvo é um set ou weakset, `.include` garante que o
 * `val` fornecido seja um membro do alvo. o algoritmo de
 * igualdade samevaluezero é usado
 * 
 * expect(new Set([1, 2])).to.include(2);
 * 
 * quando o alvo é um map, `.include` garante que o `val`
 * fornecido seja um dos valores do alvo. o algoritmo de
 * igualdade samevaluezero é utilizado
 * 
 * expect(new Map([['a', 1], ['b', 2]])).to.include(2);
 * 
 * como o método `.include` realiza funções diferentes
 * dependendo do tipo do arquivo de destino, é importante
 * verificar o tipo do arquivo de destino antes de usá-lo.
 * consulte a documentação do método `.a` para obter
 * informações sobre como verificar o tipo de um arquivo de
 * destino
 * 
 * expect([1, 2, 3]).to.be.an('array').that.includes(2);
 * 
 * por padrão, a igualdade estrita (`===`) é usada para
 * comparar membros de arrays e propriedades de objetos.
 * adicione `.deep` anteriormente na cadeia para usar a
 * igualdade profunda (alvos weakset não são suportados).
 * consulte a página do projeto `deep-eql` para obter
 * informações sobre o algoritmo de igualdade profunda:
 * 
 * - https://github.com/chaijs/deep-eql
 * 
 * // o array alvo inclui profundamente (mas não estritamente) `{a: 1}`
 * expect([{ a: 1 }]).to.deep.include({ a: 1 });
 * expect([{ a: 1 }]).to.not.include({ a: 1 });
 * 
 * // o objeto alvo inclui profundamente (mas não estritamente) `x: {a: 1}`
 * expect({ x: { a: 1 } }).to.deep.include({ x: { a: 1 } });
 * expect({ x: { a: 1 } }).to.not.include({ x: { a: 1 } });
 * 
 * por padrão, todas as propriedades do alvo são pesquisadas
 * ao trabalhar com objetos. isso inclui propriedades herdadas
 * e/ou não enumeráveis. adicione `.own` anteriormente na
 * cadeia para excluir as propriedades herdadas do alvo da
 * pesquisa
 * 
 * object.prototype.b = 2;
 * 
 * expect({ a: 1 }).to.own.include({ a: 1 });
 * expect({ a: 1 }).to.include({ b: 2 }).but.not.own.include({ b: 2 });
 * 
 * note que um objeto alvo é sempre pesquisado apenas pelas
 * propriedades enumeráveis do próprio `val`
 * 
 * `.deep` e `.own` não podem ser combinados
 * 
 * expect({ a: { b: 2 } }).to.deep.own.include({ a: { b: 2 } });
 * 
 * adicione `.nested` mais cedo na cadeia para habilitar a
 * notação de ponto e colchetes ao referenciar propriedades
 * aninhadas
 * 
 * expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
 * 
 * se `.` ou `[]` fizerem parte de um nome de propriedade real,
 * eles podem ser escapados adicionando duas barras invertidas
 * antes deles
 * 
 * expect({'.a': {'[b]': 2}}).to.nested.include({'\\.a.\\[b\\]': 2});
 * 
 * `.deep` e `.nested` podem ser combinados
 * 
 * expect({a: {b: [{c: 3}]}}).to.deep.nested.include({'a.b[0]': {c: 3}});
 * 
 * `.own` e `.nested` não podem ser combinados
 * 
 * adicione `.not` mais cedo na cadeia para negar `.include`
 * 
 * expect('foobar').to.not.include('taco');
 * expect([1, 2, 3]).to.not.include(4);
 * 
 * no entanto, é perigoso negar `.include` quando o alvo é um
 * objeto. o problema é que isso cria expectativas incertas,
 * afirmando que o objeto alvo não possui todos os pares
 * chave/valor de `val`, mas pode ou não possuir alguns deles.
 * muitas vezes, é melhor identificar a saída exata esperada
 * e, em seguida, escrever uma asserção que aceite apenas essa
 * saída exata
 * 
 * quando não se espera que o objeto de destino tenha as
 * chaves de `val`, muitas vezes é melhor afirmar exatamente
 * isso
 * 
 * expect({ c: 3 }).to.not.have.any.keys('a', 'b'); // recomendado
 * expect({ c: 3 }).to.not.include({ a: 1, b: 2 }); // não recomendado
 * 
 * quando se espera que o objeto de destino tenha as chaves de
 * `val`, geralmente é melhor afirmar que cada uma das
 * propriedades tem o valor esperado, em vez de afirmar que
 * cada propriedade não tem um dos muitos valores inesperados
 * 
 * expect({ a: 3, b: 4 }).to.include({ a: 3, b: 4 }); // recomendado
 * expect({ a: 3, b: 4 }).to.not.include({ a: 1, b: 2 }); // não recomendado
 * 
 * o método `.include` aceita um argumento opcional `msg`, que
 * é uma mensagem de erro personalizada a ser exibida quando a
 * asserção falhar. a mensagem também pode ser fornecida como
 * segundo argumento para a função `expect`
 * 
 * expect([1, 2, 3]).to.include(4, 'nãooooo... falhou...');
 * expect([1, 2, 3], 'nãooooo... falhou...').to.include(4);
 * 
 * `.include` também pode ser usado como uma cadeia de
 * linguagem, fazendo com que todas as asserções `.members` e
 * `.keys` subsequentes na cadeia exijam que o alvo seja um
 * superconjunto do conjunto esperado, em vez de um conjunto
 * idêntico. observe que `.members` ignora duplicatas no
 * subconjunto quando `.include` é adicionado
 * 
 * // as chaves do objeto alvo são um superconjunto de ['a', 'b'], mas não idênticas
 * expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
 * expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
 * 
 * // o array alvo é um superconjunto de [1, 2], mas não idêntico
 * expect([1, 2, 3]).to.include.members([1, 2]);
 * expect([1, 2, 3]).to.not.have.members([1, 2]);
 * 
 * // os duplicados no subconjunto são ignorados
 * expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
 * 
 * note que adicionar `.any` anteriormente na cadeia faz com
 * que a asserção `.keys` ignore `.include`
 * 
 * // ambas asserções são idênticas
 * expect({a: 1}).to.include.any.keys('a', 'b');
 * expect({a: 1}).to.have.any.keys('a', 'b');
 * 
 * os aliases `.includes`, `.contain` e `.contains` podem ser
 * usados de forma intercambiável com `.include`
 * 
 * @name include
 * 
 * @alias contain
 * @alias includes
 * @alias contains
 * 
 * @param {unknown} val
 * @param {string} msg _opcional_
 * 
 * @namespace BDD
 * 
 * @public
 */

function include(val, msg) {
    if (msg)
        flag(this, 'message', msg);

    let obj = flag(this, 'object'),
        objType = _.type(obj).toLowerCase(),
        flagMsg = flag(this, 'message'),
        negate = flag(this, 'negate'),
        ssfi = flag(this, 'ssfi'),
        isDeep = flag(this, 'deep'),
        descriptor = isDeep ? 'deep ' : '',
        isEql = isDeep ? flag(this, 'eql') : SameValueZero;

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    let included = false;

    switch (objType) {
        case 'string':
            included = obj.indexOf(val) !== -1;

            break;

        case 'weakset':
            if (isDeep) {
                throw new AssertionError(
                    flagMsg + 'não foi possível utilizar .deep.include com o weakset',
                    undefined,
                    ssfi
                );
            }

            included = obj.has(val);

            break;

        case 'map':
            obj.forEach(function(item) {
                included = included || isEql(item, val);
            });

            break;

        case 'set':
            if (isDeep) {
                obj.forEach(function(item) {
                    included = included || isEql(item, val);
                });
            } else {
                included = obj.has(val);
            }

            break;

        case 'array':
            if (isDeep) {
                included = obj.some(function(item) {
                    return isEql(item, val);
                });
            } else {
                included = obj.indexOf(val) !== -1;
            }

            break;

        default: {
            // este bloco serve para verificar um subconjunto
            // de propriedades em um objeto. `_.expectTypes`
            // não é usado aqui porque `.include` deve funcionar
            // com objetos que possuam um `@@tostringtag`
            // personalizado

            if (val !== Object(val)) {
                throw new AssertionError(
                    flagMsg +
                        'a combinação de argumentos fornecida (' +
                        objType +
                        ' e ' +
                        _.type(val).toLowerCase() +
                        ')' +
                        ' é inválida para essa asserção. ' +
                        'você pode utilizar um array, um map, um objeto, um set, uma string, ' +
                        'ou um weakset em vez de ' +
                        _.type(val).toLowerCase(),
                    
                    undefined,
                    ssfi
                );
            }

            let props = Object.keys(val);
            let firstErr = null;
            let numErrs = 0;

            props.forEach(function(prop) {
                let propAssertion = new Assertion(obj);

                _.transferFlags(this, propAssertion, true);

                flag(propAssertion, 'lockSsfi', true);

                if (!negate || props.length === 1) {
                    propAssertion.property(prop, val[prop]);

                    return;
                }

                try {
                    propAssertion.property(prop, val[prop]);
                } catch (err) {
                    if (!_.checkError.compatibleConstructor(err, AssertionError)) {
                        throw err;
                    }

                    if (firstErr === null)
                        firstErr = err;

                    numErrs++;
                }
            }, this);

            // ao validar `.not.include` com múltiplas propriedades,
            // queremos gerar um erro de asserção apenas se todas as
            // propriedades estiverem incluídas, caso em que geramos
            // o primeiro erro de asserção de propriedade encontrado

            if (negate && props.length > 1 && numErrs === props.length) {
                throw firstErr;
            }

            return;
        }
    }

    // verificar inclusão em coleção ou substring em uma string
    this.assert(
        included,

        'esperava-se que #{this} ' + descriptor + 'incluísse ' + _.inspect(val),
        'esperava-se que #{this} não ' + descriptor + 'incluísse ' + _.inspect(val)
    );
}

Assertion.addChainableMethod('include', include, includeChainingBehavior);
Assertion.addChainableMethod('contain', include, includeChainingBehavior);
Assertion.addChainableMethod('contains', include, includeChainingBehavior);
Assertion.addChainableMethod('includes', include, includeChainingBehavior);

/**
 * ### .ok
 * 
 * afirma que o alvo é um valor verdadeiro (considerado `true`
 * em um contexto booleano). no entanto, muitas vezes é melhor
 * afirmar que o alvo é estritamente (`===`) ou profundamente
 * igual ao seu valor esperado
 * 
 * expect(1).to.equal(1); // recomendado
 * expect(1).to.be.ok; // não recomendado
 * 
 * expect(true).to.be.true; // recomendado
 * expect(true).to.be.ok; // não recomendado
 * 
 * adicione `.not` mais cedo na cadeia para negar `.ok`
 * 
 * expect(0).to.equal(0); // recomendado
 * expect(0).to.not.be.ok; // não recomendado
 * 
 * expect(false).to.be.false; // recomendado
 * expect(false).to.not.be.ok; // não recomendado
 * 
 * expect(null).to.be.null); // recomendado
 * expect(null).to.not.be.ok; // não recomendado
 * 
 * expect(undefined).to.be.undefined; // recomendado
 * expect(undefined).to.not.be.ok; // não recomendado
 * 
 * uma mensagem de erro personalizada pode ser fornecida como
 * segundo argumento para `expect`
 * 
 * expect(false, 'nãooooo... falhou...').to.be.ok;
 * 
 * @name ok
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('ok', function() {
    this.assert(
        flag(this, 'object'),

        'esperava-se que #{this} fosse verdadeiro',
        'esperava-se que #{this} fosse falso'
    );
});

/**
 * ### .true
 * 
 * afirma que o alvo é estritamente (`===`) igual a `true`
 * 
 * expect(true).to.be.true;
 * 
 * adicione `.not` mais cedo na cadeia para negar `.true`. no
 * entanto, muitas vezes é melhor afirmar que o alvo é igual
 * ao seu valor esperado, em vez de diferente de `true`
 * 
 * expect(false).to.be.false; // recomendado
 * expect(false).to.not.be.true; // não recomendado
 * 
 * expect(1).to.equal(1); // recomendado
 * expect(1).to.not.be.true; // não recomendado
 * 
 * uma mensagem de erro personalizada pode ser fornecida como
 * segundo argumento para `expect`
 * 
 * expect(false, 'nãooooo... falhou...').to.be.true;
 * 
 * @name true
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('true', function() {
    this.assert(
        true === flag(this, 'object'),

        'esperava-se que #{this} fosse true',
        'esperava-se que #{this} fosse false',

        flag(this, 'negate') ? false : true
    );
});

Assertion.addProperty('numeric', function() {
    const object = flag(this, 'object');

    this.assert(
        ['Number', 'BigInt'].includes(_.type(object)),

        'esperava-se que #{this} fosse numérico',
        'esperava-se que #{this} não fosse numérico',

        flag(this, 'negate') ? false : true
    );
});

/**
 * ### .callable
 * 
 * afirma que o alvo é uma função chamável
 * 
 * expect(console.log).to.be.callable;
 * 
 * uma mensagem de erro personalizada pode ser fornecida como
 * segundo argumento para `expect`
 * 
 * expect('não é uma função', 'nãooooo... falhou...').to.be.callable;
 * 
 * @name callable
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('callable', function() {
    const val = flag(this, 'object');
    const ssfi = flag(this, 'ssfi');
    const message = flag(this, 'message');
    const msg = message ? `${message}: ` : '';
    const negate = flag(this, 'negate');

    const assertionMessage = negate
        ? `${msg}esperava-se que ${_.inspect(val)} não fosse uma função chamável`
        : `${msg}esperava-se que ${_.inspect(val)} fosse uma função chamável`;

    const isCallable = [
        'Function',
        'AsyncFunction',
        'GeneratorFunction',
        'AsyncGeneratorFunction'
    ].includes(_.type(val));

    if ((isCallable && negate) || (!isCallable && !negate)) {
        throw new AssertionError(assertionMessage, undefined, ssfi);
    }
});

/**
 * ### .false
 * 
 * afirma que o alvo é estritamente (`===`) igual a `false`
 * 
 * expect(false).to.be.false;
 * 
 * adicione `.not` mais cedo na cadeia para negar `.false`. no
 * entanto, muitas vezes é melhor afirmar que o alvo é igual
 * ao seu valor esperado, em vez de diferente de `false`
 * 
 * expect(true).to.be.true; // recomendado
 * expect(true).to.not.be.false; // não recomendado
 * 
 * expect(1).to.equal(1); // recomendado
 * expect(1).to.not.be.false; // não recomendado
 * 
 * uma mensagem de erro personalizada pode ser fornecida como
 * segundo argumento para `expect`
 * 
 * expect(true, 'nooo why fail??').to.be.false;
 * 
 * @name false
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('false', function() {
    this.assert(
        false === flag(this, 'object'),

        'esperava-se que #{this} fosse false',
        'esperava-se que #{this} fosse true',

        flag(this, 'negate') ? true : false
    );
});

/**
 * ### .null
 * 
 * afirma que o alvo é estritamente (`===`) igual a `null`
 * 
 * expect(null).to.be.null;
 * 
 * adicione `.not` mais cedo na cadeia para negar `.null`. no
 * entanto, muitas vezes é melhor afirmar que o alvo é igual
 * ao seu valor esperado, em vez de diferente de `null`
 * 
 * expect(1).to.equal(1); // recomendado
 * expect(1).to.not.be.null; // não recomendado
 * 
 * uma mensagem de erro personalizada pode ser fornecida como
 * segundo argumento para `expect`
 * 
 * expect(42, 'nãooooo... falhou...').to.be.null;
 * 
 * @name null
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('null', function() {
    this.assert(
        null === flag(this, 'object'),

        'esperava-se que #{this} fosse null',
        'esperava-se que ${this} não fosse null'
    );
});

/**
 * ### .undefined
 * 
 * afirma que o alvo é estritamente (`===`) igual a `undefined`
 * 
 * expect(undefined).to.be.undefined;
 * 
 * adicione `.not` mais cedo na cadeia para negar `.undefined`. no
 * entanto, muitas vezes é melhor afirmar que o alvo é igual
 * ao seu valor esperado, em vez de diferente de `undefined`
 * 
 * expect(1).to.equal(1); // recomendado
 * expect(1).to.not.be.undefined; // não recomendado
 * 
 * uma mensagem de erro personalizada pode ser fornecida como
 * segundo argumento para `expect`
 * 
 * expect(42, 'nãooooo... falhou...').to.be.undefined;
 * 
 * @name undefined
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('undefined', function() {
    this.assert(
        undefined === flag(this, 'object'),

        'esperava-se que #{this} fosse undefined',
        'esperava-se que ${this} não fosse undefined'
    );
});

/**
 * ### .nan
 * 
 * afirma que o alvo é estritamente (`===`) igual a `nan`
 * 
 * expect(nan).to.be.nan;
 * 
 * adicione `.not` mais cedo na cadeia para negar `.nan`. no
 * entanto, muitas vezes é melhor afirmar que o alvo é igual
 * ao seu valor esperado, em vez de diferente de `nan`
 * 
 * expect(1).to.equal(1); // recomendado
 * expect(1).to.not.be.nan; // não recomendado
 * 
 * uma mensagem de erro personalizada pode ser fornecida como
 * segundo argumento para `expect`
 * 
 * expect(42, 'nãooooo... falhou...').to.be.nan;
 * 
 * @name nan
 * 
 * @namespace BDD
 * 
 * @public
 */

Assertion.addProperty('NaN', function() {
    this.assert(
        _.isNaN(flag(this, 'object')),

        'esperava-se que #{this} fosse nan',
        'esperava-se que ${this} não fosse nan'
    );
});

/**
 * ### .exist
 * 
 * afirma que o alvo não é estritamente (`===`) igual a `null`
 * ou `undefined`. no entanto, muitas vezes é melhor afirmar
 * que o alvo é igual ao seu valor esperado
 * 
 * expect(1).to.equal(1); // recomendado
 * expect(1).to.exist; // não recomendado
 * 
 * expect(0).to.equal(0); // recomendado
 * expect(0).to.exist; // não recomendado
 * 
 * adicione `.not` mais cedo na cadeia para negar `.exist`
 * 
 * expect(null).to.be.null; // recomendado
 * expect(null).to.not.exist; // não recomendado
 * 
 * expect(undefined).to.be.undefined; // recomendado
 * expect(undefined).to.not.exist; // não recomendado
 * 
 * uma mensagem de erro personalizada pode ser fornecida como
 * segundo argumento para `expect`
 * 
 * expect(null, 'nãooooo... falhou...').to.exist;
 * 
 * o alias `.exists` pode ser usado de forma intercambiável
 * com `.exist`
 * 
 * @name exist
 * 
 * @alias exists
 * 
 * @namespace BDD
 * 
 * @public
 */

function assertExist() {
    let val = flag(this, 'object');

    this.assert(
        val !== null && val !== undefined,

        'esperava-se que #{this} existisse',
        'esperava-se que #{this} não existisse'
    );
}

Assertion.addProperty('exist', assertExist);
Assertion.addProperty('exists', assertExist);
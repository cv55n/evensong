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
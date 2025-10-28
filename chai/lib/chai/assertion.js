/**
 * chai
 * 
 * https://chaijs.com
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

import { AssertionError } from 'assertion-error';

import { config } from './config.js';

import * as util from './utils/index.js';

export class Assertion {
    /** @type {{}} */
    __flags = {};

    /**
     * cria um objeto para chaining
     * 
     * objetos `assertion` contêm metadados na forma de flags.
     * três flags podem ser atribuídos durante a instanciação passando
     * argumentos para este construtor:
     * 
     * - `object`: essa flag contém o alvo da asserção. por exemplo, na
     * asserção `expect(numkittens).to.equal(7);`, a flag `object`
     * conterá `numkittens` para que a asserção `equal` possa
     * referenciá-lo quando necessário
     * 
     * - `message`: essa flag contém uma mensagem de erro personalizada
     * opcional a ser anexada à mensagem de erro gerada pela asserção
     * quando ela falhar
     * 
     * - `ssfi`: essa flag significa "indicador de função de pilha
     * inicial". ela contém uma referência de função que serve como
     * ponto de partida para remover quadros do rastreamento de pilha
     * do erro criado pela asserção quando ela falha. o objetivo é
     * fornecer um rastreamento de pilha mais limpo para usuários
     * finais, removendo as funções internas do chai. observe que
     * ele só funciona em ambientes que suportam
     * `error.captureStacktrace` e somente quando
     * `chai.config.includestack` não foi definido como `false`.
     *
     * - `lockSsfi`: essa flag controla se a flag `ssfi` fornecida
     * deve ou não manter seu valor atual, mesmo que as asserções
     * sejam encadeadas a partir deste objeto. geralmente, é definido
     * como `true` ao criar uma nova asserção a partir de outra
     * asserção. também é definido temporariamente como `true` antes
     * de uma asserção substituída ser chamada pela asserção de
     * substituição
     * 
     * - `eql`: essa flag contém a função deepequal a ser usada
     * pela asserção
     *  
     * @param {unknown} obj alvo da asserção
     * @param {string} [msg] (opcional) mensagem de erro customizada
     * @param {Function} [ssfi] (opcional) ponto de partida para remoção de quadros de pilha
     * @param {boolean} [lockSsfi] (opcional) se a flag ssfi está bloqueada ou não
     */
    constructor(obj, msg, ssfi, lockSsfi) {
        util.flag(this, 'ssfi', ssfi || Assertion);
        util.flag(this, 'lockSsfi', lockSsfi);
        util.flag(this, 'object', obj);
        util.flag(this, 'message', msg);
        util.flag(this, 'eql', config.deepEqual || util.eql);

        return util.proxify(this);
    }

    /** @returns {boolean} */
    static get includeStack() {
        console.warn('assertion.includestack está desatualizado, utilize chai.config.includestack em vez disso.');

        return config.includeStack;
    }

    /** @param {boolean} value */
    static set includeStack(value) {
        console.warn('assertion.includestack está desatualizado, utilize chai.config.includestack em vez disso.');

        config.includeStack = value;
    }

    /** @returns {boolean} */
    static get showDiff() {
        console.warn('assertion.showdiff está desatualizado, utilize chai.config.showdiff em vez disso.');

        return config.showDiff;
    }

    /** @param {boolean} value */
    static set showDiff(value) {
        console.warn('assertion.showdiff está desatualizado, utilize chai.config.showdiff em vez disso.');

        config.showDiff = value;
    }

    /**
     * @param {string} name
     * @param {Function} fn
     */
    static addProperty(name, fn) {
        util.addProperty(this.prototype, name, fn);
    }

    /**
     * @param {string} name
     * @param {Function} fn
     */
    static addMethod(name, fn) {
        util.addMethod(this.prototype, name, fn);
    }

    /**
     * @param {string} name
     * @param {Function} fn
     * @param {Function} chainingBehavior
     */
    static addChainableMethod(name, fn, chainingBehavior) {
        util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
    }

    /**
     * @param {string} name
     * @param {Function} fn
     */
    static overwriteProperty(name, fn) {
        util.overwriteProperty(this.prototype, name, fn);
    }

    /**
     * @param {string} name
     * @param {Function} fn
     */
    static overwriteMethod(name, fn) {
        util.overwriteMethod(this.prototype, name, fn);
    }

    /**
     * @param {string} name
     * @param {Function} fn
     * @param {Function} chainingBehavior
     */
    static overwriteChainableMethod(name, fn, chainingBehavior) {
        util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
    }

    /**
     * ### .assert(expression, message, negateMessage, expected, actual, showDiff)
     * 
     * executa uma expressão e checa as expectativas.
     * lança um assertionerror para relatar se o teste não for aprovado
     * 
     * @name assert
     * 
     * @param {unknown} _expr a expressão a ser testada
     * @param {string | Function} msg mensagem ou função que retorna uma mensagem a ser mostrada caso a expressão falhe
     * @param {string | Function} _negateMsg mensagem ou função que retorna negatedmessage a ser mostrada caso a expresão falhe
     * @param {unknown} expected valor esperado (lembrar de checar pela negação)
     * @param {unknown} _actual (opcional) será default para `this.obj`
     * @param {boolean} showDiff (opcional) quando `true`, assert exibirá um diff além da mensagem se a expressão falhar
     * 
     * @returns {void}
     */
    assert(_expr, msg, _negateMsg, expected, _actual, showDiff) {
        const ok = util.test(this, arguments);

        if (false !== showDiff)
            showDiff = true;

        if (undefined === expected && undefined === _actual)
            showDiff = false;

        if (true !== config.showDiff)
            showDiff = false;

        if (!ok) {
            msg = util.getMessage(this, arguments);

            const actual = util.getActual(this, arguments);

            /** @type {Record<PropertyKey, unknown>} */
            const assertionErrorObjectProperties = {
                actual: actual,
                expected: expected,
                showDiff: showDiff
            };

            const operator = util.getOperator(this, arguments);

            if (operator) {
                assertionErrorObjectProperties.operator = operator;
            }

            throw new AssertionError(
                msg,
                assertionErrorObjectProperties,

                // @ts-expect-error ainda não tenho certeza do que fazer com esses types
                config.includeStack ? this.assert : util.flag(this, 'ssfi')
            );
        }
    }

    /**
     * uma rápida referência para o valor `actual` armazenado
     * para desenvolvedores de plugins
     * 
     * @returns {unknown}
     */
    get _obj() {
        return util.flag(this, 'object');
    }

    /**
     * uma rápida referência para o valor `actual` armazenado
     * para desenvolvedores de plugins
     * 
     * @param {unknown} val
     */
    set _obj(val) {
        util.flag(this, 'object', val);
    }
}
/*!
 * chai
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

import { Assertion } from '../assertion.js';
import { AssertionError } from 'assertion-error';

/**
 * @returns {void}
 */
function loadShould() {
    // define explicitamente este método como uma função para
    // que seu nome seja incluído como `ssfi`

    /**
     * @returns {Assertion}
     */
    function shouldGetter() {
        if (
            this instanceof String ||
            this instanceof Number ||
            this instanceof Boolean ||
            
            (typeof Symbol === 'function' && this instanceof Symbol) ||
            (typeof BigInt === 'function' && this instanceof BigInt)
        ) {
            return new Assertion(this.valueOf(), null, shouldGetter);
        }

        return new Assertion(this, null, shouldGetter);
    }

    /**
     * @param {unknown} value
     */
    function shouldSetter(value) {
        // https://github.com/chaijs/chai/issues/86
        //
        // isso faz com que `whatever.should = somevalue`
        // realmente defina `somevalue`, o que é especialmente
        // útil para `global.should = require('chai').should()`
        //
        // note que precisamos usar [[defineproperty]] em vez
        // de [[put]], pois, caso contrário, acionaríamos esse
        // mesmo setter

        Object.defineProperty(this, 'should', {
            value: value,
        
            enumerable: true,
            configurable: true,
            writable: true
        });
    }

    // modificando o object.prototype para incluir `should`
    Object.defineProperty(Object.prototype, 'should', {
        set: shouldSetter,
        get: shouldGetter,

        configurable: true
    });

    let should = {};

    /**
     * ### .fail([message])
     * ### .fail(actual, expected, [message], [operator])
     * 
     * lança uma falha
     * 
     * should.fail();
     * should.fail("mensagem de erro customizada");
     * should.fail(1, 2);
     * should.fail(1, 2, "mensagem de erro customizada");
     * should.fail(1, 2, "mensagem de erro customizada", ">");
     * should.fail(1, 2, undefined, ">");
     * 
     * @name fail
     * 
     * @param {unknown} actual
     * @param {unknown} expected
     * @param {string} message
     * @param {string} operator
     * 
     * @namespace BDD
     * 
     * @public
     */
    should.fail = function(actual, expected, message, operator) {
        if (arguments.length < 2) {
            message = actual;

            actual = undefined;
        }

        message = message || 'should.fail()';

        throw new AssertionError(
            message, {
                actual: actual,
                expected: expected,
                operator: operator
            },

            should.fail
        );
    };

    /**
     * ### .equal(actual, expected, [message])
     * 
     * afirma igualdade não estrita (`==`) entre `real` e `expected`
     * 
     * should.equal(3, '3', '== converte valores em strings');
     * 
     * @name equal
     * 
     * @param {unknown} actual
     * @param {unknown} expected
     * @param {string} message
     * 
     * @namespace Should
     * 
     * @public
     */
    should.equal = function(actual, expected, message) {
        new Assertion(actual, message).to.equal(expected);
    };

    /**
     * ### .throw(function, [constructor/string/regexp], [string/regexp], [message])
     * 
     * afirma que `function` lançará um erro que é uma instância
     * de `constructor`, ou alternativamente que lançará um erro
     * com uma mensagem que corresponde a `regexp`
     * 
     * should.throw(fn, 'a função gera um erro de referência.');
     * should.throw(fn, /a função gera um erro de referência./);
     * should.throw(fn, ReferenceError);
     * should.throw(fn, ReferenceError, 'a função gera um erro de referência.');
     * should.throw(fn, ReferenceError, /a função gera um erro de referência./);
     * 
     * @name throw
     * @alias Throw
     * 
     * @param {Function} fn
     * @param {Error} errt
     * @param {RegExp} errs
     * @param {string} msg
     * 
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * 
     * @namespace should
     * 
     * @public
     */
    should.throw = function(fn, errt, errs, msg) {
        new Assertion(fn, msg).to.Throw(errt, errs);
    };

    /**
     * ### .exist
     * 
     * afirma que o alvo não é `null` nem `undefined`
     * 
     * var foo = 'oi';
     * 
     * should.exist(foo, 'o foo existe');
     * 
     * @param {unknown} val
     * @param {string} msg
     * 
     * @name exist
     * 
     * @namespace Should
     * 
     * @public
     */
    should.exist = function(val, msg) {
        new Assertion(val, msg).to.exist;
    };

    // negação
    should.not = {};

    /**
     * ### .not.equal(actual, expected, [message])
     * 
     * afirma desigualdade não estrita (`!=`) entre `real` e
     * `expected`
     * 
     * should.not.equal(3, 4, 'esses números não são iguais');
     * 
     * @name not.equal
     * 
     * @param {unknown} actual
     * @param {unknown} expected
     * @param {string} msg
     * 
     * @namespace Should
     * 
     * @public
     */
    should.not.equal = function(actual, expected, msg) {
        new Assertion(actual, msg).to.not.equal(expected);
    };

    /**
     * ### .throw(function, [constructor/regexp], [message])
     * 
     * afirma que `function` _não_ lançará um erro que seja uma
     * instância de `constructor`, ou alternativamente que não
     * lançará um erro com mensagem correspondente a `regexp`
     * 
     * should.not.throw(fn, Error, 'a função não lança');
     * 
     * @name not.throw
     * @alias not.Throw
     * 
     * @param {Function} fn
     * @param {Error} errt
     * @param {RegExp} errs
     * @param {string} msg
     * 
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * 
     * @namespace Should
     * 
     * @public
     */
    should.not.Throw = function(fn, errt, errs, msg) {
        new Assertion(fn, msg).to.not.Throw(errt, errs);
    };

    /**
     * ### .not.exist
     * 
     * afirma que o alvo não é `null` nem `undefined`
     * 
     * var bar = null;
     * 
     * should.not.exist(bar, 'bar não existe');
     * 
     * @namespace Should
     * 
     * @name not.exist
     * 
     * @param {unknown} val
     * @param {string} msg
     * 
     * @public
     */
    should.not.exist = function(val, msg) {
        new Assertion(val, msg).to.not.exist;
    };

    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];

    return should;
}

export const should = loadShould;
export const Should = loadShould;
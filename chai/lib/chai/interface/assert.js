/*!
 * chai
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

import { AssertionError } from 'assertion-error';

import { Assertion } from '../assertion.js';
import { flag, inspect } from '../utils/index.js';

import * as chai from '../../chai.js';

/**
 * ### assert(expression, message)
 * 
 * escreve suas próprias expressões de teste
 * 
 * assert('foo' !== 'bar', 'foo não é bar');
 * assert(Array.isArray([]), 'arrays vazios são arrays');
 * 
 * @param {unknown} express - expressão para testar a veracidade
 * @param {string} errmsg - mensagem a ser exibida em caso de erro
 * 
 * @name assert
 * 
 * @namespace Assert
 * 
 * @public
 */
export function assert(express, errmsg) {
    let test = new Assertion(null, null, chai.assert, true);

    test.assert(express, errmsg, '[ mensagem de negação indisponível ]');
}

/**
 * ### .fail([message])
 * ### .fail(actual, exptected, [message], [operator])
 * 
 * lançar uma falha. compatível com o módulo `assert` do
 * node.js
 * 
 * assert.fail();
 * assert.fail("mensagem de erro customizada");
 * assert.fail(1, 2);
 * assert.fail(1, 2, "mensagem de erro customizada");
 * assert.fail(1, 2, "mensagem de erro customizada", ">");
 * assert.fail(1, 2, undefined, ">");
 * 
 * @name fail
 * 
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} message
 * @param {string} operator
 * 
 * @namespace Assert
 * 
 * @public
 */
assert.fail = function(actual, expected, message, operator) {
    if (arguments.length < 2) {
        // respeita a interface fail([message]) do node.js

        message = actual;
        actual = undefined;
    }

    message = message || 'assert.fail()';

    throw new AssertionError(message, {
        actual: actual,
        expected: expected,
        operator: operator
    }, assert.fail);
};

/**
 * ### .isok(object, [message])
 * 
 * afirma que `object` é verdadeiro
 * 
 * assert.isok('tudo', 'tudo está ok');
 * assert.isok(false, 'isso falhará');
 * 
 * @name isOk
 * 
 * @alias ok
 * 
 * @param {unknown} val objeto a ser testado
 * @param {string} msg
 * 
 * @namespace Assert
 * 
 * @public
 */
assert.isOk = function(val, msg) {
    new Assertion(val, msg, assert.isOk, true).is.ok;
};

/**
 * ### .isnotok(object, [message])
 * 
 * asserções onde `object` é falso
 * 
 * assert.isnotok('tudo', 'isso falhará');
 * assert.isnotok(false, 'isso passará');
 * 
 * @name isNotOk
 * 
 * @alias notOk
 * 
 * @param {unknown} val objeto a ser testado
 * @param {string} msg
 * 
 * @namespace Assert
 * 
 * @public
 */
assert.isNotOk = function(val, msg) {
    new Assertion(val, msg, assert.isNotOk, true).is.not.ok;
};
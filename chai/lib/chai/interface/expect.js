/*!
 * chai
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

import { Assertion } from '../assertion.js';
import { AssertionError } from 'assertion-error';

import * as chai from '../../chai.js';

/**
 * @param {unknown} val
 * @param {string} message
 * 
 * @returns {Assertion}
 */
function expect(val, message) {
    return new Assertion(val, message);
}

export { expect };

/**
 * ### .fail([message])
 * ### .fail(actual, expected, [message], [operator])
 * 
 * lança uma falha
 * 
 * expect.fail();
 * expect.fail("mensagemd de erro customizada");
 * expect.fail(1, 2);
 * expect.fail(1, 2, "mensagemd de erro customizada");
 * expect.fail(1, 2, "mensagemd de erro customizada", ">");
 * expect.fail(1, 2, undefined, ">");
 * 
 * @name fail
 * 
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} message
 * @param {string} operator
 * 
 * @namespace expect
 * 
 * @public
 */

expect.fail = function(actual, expected, message, operator) {
    if (arguments.length < 2) {
        message = actual;

        actual = undefined;
    }

    message = message || 'expect.fail()';

    throw new AssertionError(
        message, {
            actual: actual,
            expected: expected,
            operator: operator
        },

        chai.expect.fail
    );
};
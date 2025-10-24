/**!
 * chai
 * 
 * copyright (c) 2025 cavassani
 * 
 * licenciado pela mit license
 */

import { AssertionError } from 'assertion-error';

import { config } from './chai/config.js';
import { expect } from './chai/interface/expect.js';
import { Assertion } from './chai/assertion.js';
import { assert } from './chai/interface/assert.js';

import * as util from './chai/utils/index.js';
import './chai/core/assertions.js';
import * as should from './chai/interface/should.js';

const used = [];

// erro de asserção
export { AssertionError };

/**
 * # .use(function)
 * 
 * fornece um jeito de estender os internals do chai
 * 
 * @param {Function} fn
 * 
 * @returns {this} para chaining
 * 
 * @public
 */
export function use(fn) {
    const exports = {
        use,
        AssertionError,
        util,
        config,
        expect,
        assert,
        Assertion,
        ...should
    };

    if (!~used.indexOf(fn)) {
        fn(exports, util);

        used.push(fn);
    }

    return exports;
}

// funções de utilidade
export { util };

// configuração
export { config };

// protótipo `assertion` primário
export * from './chai/assertion.js';

// interface expect
export * from './chai/interface/expect.js';

// interface should
export * from './chai/interface/should.js';

// interface assert
export * from './chai/interface/assert.js';
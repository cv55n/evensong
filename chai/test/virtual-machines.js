import vm from 'node:vm';

import * as chai from '../index.js';
import { describe } from 'node:test';

const { assert } = chai;
const vmContext = { assert };

vm.createContext(vmContext);

/**
 * roda o código em um contexto virtual
 * 
 * @param {string} code código a ser rodado
 */
function runCodeInVm(code) {
    vm.runInContext(code, vmContext);
}

describe('máquinas virtuais do node', function() {
    it('throws', function() {
        const shouldNotThrow = [
            `assert.throws(function() { throw ''; }, /^$/);`,
            `assert.throws(function() { throw new Error('bleepbloop'); });`,
            `assert.throws(function() { throw new Error(''); });`,
            `assert.throws(function() { throw new Error('swoosh'); }, /swoosh/);`
        ];

        for (const code of shouldNotThrow) {
            assert.doesNotThrow(() => {
                runCodeInVm(code);
            });
        }
    });
});
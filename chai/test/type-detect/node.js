import * as chai from '../../index.js';

function assert (expr, msg) {
    if (!expr) {
        throw new Error(msg || 'afirmação falhou');
    }
}

const type = chai.util.type;

const isNode = typeof process !== 'undefined' && typeof process.release === 'object' && process.release.name;

function describeIf(condition) {
    return condition ? describe : describe.skip;
}

describeIf(isNode)('node específico', () => {
    it('global', () => {
        assert(type(global) === 'global');
    });

    it('process', () => {
        assert(type(process) === 'process');
    });
});
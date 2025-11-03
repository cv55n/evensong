import * as chai from '../../index.js';

function assert (expr, msg) {
    if (!expr) {
        throw new Error(msg || 'afirmação falhou');
    }
}

const type = chai.util.type

const symbolExists = typeof Symbol === 'function';
const symbolToStringTagExists = symbolExists && typeof Symbol.toStringTag !== 'undefined';

function describeIf(condition) {
    return condition ? describe : describe.skip;
}

describeIf(symbolToStringTagExists)('extras de tostringtag', () => {
    it('suporta tostringtag em arrays', () => {
        assert(type([]) === 'Array');
        
        const arr = [];
        
        arr[Symbol.toStringTag] = 'foo';
        
        assert(type(arr) === 'foo', 'type(arr) === "foo"');
    });
});
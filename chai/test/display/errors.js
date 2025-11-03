import * as chai from '../../index.js';

var expect = chai.expect;

chai.config.includeStack = true;

describe('display de erro', function() {
    it('mostra a linha de erro', function() {
        expect(4).to.equal(2);
    });
});
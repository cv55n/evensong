import * as chai from '../../index.js';

const expect = chai.expect;

var deepObj = {
    green: {
        tea: 'matcha'
    },

    teas: [
        'chai',
        'matcha',

        {
            tea: 'konacha'
        }
    ]
};

var deepObj2 = {
    green: {
        tea: 'matcha'
    },

    teas: [
        'chai',
        'oolong',

        {
            tea: 'konacha'
        }
    ]
};

chai.config.includeStack = true;

describe('display de objeto', function() {
    it('propriedade', function() {
        deepObj.should.have.property('chai');
    });

    it('igualdade profunda', function() {
        deepObj.should.deep.equal(deepObj2);
    });

    it('igualdade profunda sem diferença', function() {
        chai.config.showDiff = false;

        deepObj.should.deep.equal(deepObj2);

        chai.config.showDiff = true;
    });
});

describe('display de undefined/null', function() {
    it('undefined para atual', function() {
        expect(undefined).to.equal(null);
    });
});
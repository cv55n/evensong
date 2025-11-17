import { globalErr as err } from './bootstrap/index.js';

import * as chai from '../index.js';
import '../register-should.js'; 

describe('configuration', function() {
    var assert = chai.assert;
    var expect = chai.expect;

    var origConfig;

    beforeEach(function() {
        // realiza um backup da configuração atual
        function clone(o) {
            return JSON.parse(JSON.stringify(o));
        }

        origConfig = clone(chai.config);
    });

    afterEach(function() {
        // restaura a configuração
        Object.keys(origConfig).forEach(function(key) {
            chai.config[key] = origConfig[key];
        });
    });

    describe('includeStack', function() {
        // pula os testes se `error.capturestacktrace` não for
        // suportado

        if (typeof Error.captureStackTrace === 'undefined')
            return;

        try {
            throw Error();
        } catch (err) {
            // pula os testes se `err.stack` não for suportado
            if (typeof err.stack === 'undefined')
                return;
        }
    });
});
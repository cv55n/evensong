/*!
 * chai - utilidade expecttypes
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

import { AssertionError } from 'assertion-error';

import { flag } from './flag.js';
import { type } from './type-detect.js';

/**
 * ### .expecttypes(obj, types)
 * 
 * garante que o objeto que está sendo testado seja de um tipo
 * válido
 * 
 * utils.expecttypes(this, [
 *     'array',
 *     'object',
 *     'string'
 * ]);
 * 
 * @param {unknown} obj
 * 
 * @param {Array} types uma lista dos tipos permitidos para essa asserção
 * 
 * @namespace Utils
 * 
 * @name expectTypes
 * 
 * @public
 */
export function expectTypes(obj, types) {
    let flagMsg = flag(obj, 'message');
    let ssfi = flag(obj, 'ssfi');

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    obj = flag(obj, 'object');

    types = types.map(function(t) {
        return t.toLowerCase();
    });

    types.sort();

    // transforma ['lorem', 'ipsum'] em 'um lorem, ou um ipsum'
    let str = types.map(function(t, index) {
        let art = ~['a', 'e', 'i', 'o', 'u'].indexOf(t.charAt(0)) ? 'um' : 'um';
        let or = types.length > 1 && index === types.length - 1 ? 'ou ' : '';

        return or + art + ' ' + t;
    }).join(', ');

    let objType = type(obj).toLowerCase();

    if (!types.some(function(expected) {
        return objType === expected;
    })) {
        throw new AssertionError(
            flagMsg + 'objeto testado deve ser ' + str + ', mas ' + objType + ' fornecido',
            undefined,
            ssfi
        );
    }
}
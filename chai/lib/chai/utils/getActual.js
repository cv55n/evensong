/*!
 * chai - utilidade getactual
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

/**
 * ### .getactual(object, [actual])
 * 
 * retorna o valor `actual` para uma asserção
 * 
 * @param {object} obj objeto (asserção construída)
 * @param {unknown} args argumentos de chai.assertion.prototype.assert
 * 
 * @returns {unknown}
 * 
 * @namespace Utils
 * 
 * @name getActual
 */
export function getActual(obj, args) {
    return args.length > 4 ? args[4] : obj._obj;
}
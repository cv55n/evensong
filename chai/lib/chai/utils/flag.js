/*!
 * chai - utilidade flags
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

/**
 * ### .flag(object, key, [value])
 * 
 * obtém ou define o valor de uma flag em um objeto. se um
 * valor for fornecido, ele será definido; caso contrário,
 * retornará o valor atualmente definido ou `undefined` se o
 * valor não estiver definido
 * 
 * utils.flag(this, 'foo', 'bar'); // setter
 * utils.flag(this, 'foo'); // getter, retorna `bar`
 * 
 * @template {{__flags?: {[key: PropertyKey]: unknown}}} T
 * 
 * @param {T} obj objeto que constrói a asserção
 * @param {string} key
 * @param {unknown} [value]
 * 
 * @namespace Utils
 * 
 * @name flag
 * 
 * @returns {unknown | undefined}
 * 
 * @private
 */
export function flag(obj, key, value) {
    let flags = obj.__flags || (obj.__flags = Object.create(null));

    if (arguments.length === 3) {
        flags[key] = value;
    } else {
        return flags[key];
    }
}
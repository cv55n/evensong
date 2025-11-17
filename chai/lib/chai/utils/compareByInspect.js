/*!
 * chai - utilidade comparebyinspect
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

import { inspect } from './inspect.js';

/**
 * ### .comparebyinspect(mixed, mixed)
 * 
 * para ser usado como uma função de comparação com
 * `array.prototype.sort`. compara elementos usando `inspect`
 * em vez do comportamento padrão de usar `tostring`,
 * permitindo que símbolos e objetos com `tostring`
 * irregular/ausente ainda possam ser classificados sem um
 * typeerror
 * 
 * @param {unknown} a primeiro elemento a ser comparado
 * @param {unknown} b segundo elemento a ser comparado
 * 
 * @returns {number} -1 caso 'a' venha antes de 'b'; caso contrário, 1
 * 
 * @name compareByInspect
 * 
 * @namespace Utils
 * 
 * @public
 */
export function compareByInspect(a, b) {
    return inspect(a) < inspect(b) ? -1 : 1;
}
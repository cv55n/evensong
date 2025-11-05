import { assertDoc } from "../utilities/assert-doc.js";
import { DOC_TYPE_LABEL } from "./types.js";

/**
 * @import {Doc} from "./index.js";
 * 
 * @typedef {0 | 0n | '' | false | null | undefined} Falsy
 * 
 * @typedef {{
 *     readonly type: DOC_TYPE_LABEL,
 *     readonly label: any,
 *     readonly contents: Doc
 * }} Label
 */

/** 
 * marca um documento com um valor verdadeiro arbitrário
 * 
 * isso não afeta a forma como o documento é impresso, mas
 * pode ser útil para heurísticas baseadas na introspecção do
 * documento
 * 
 * @template {any} L
 * @template {Doc} D
 * 
 * @param {L} label caso falso, o doc `contents` é retornado
 * @param {D} contents conteúdos
 * 
 * @returns {Omit<Label, "label"> & {readonly label: L} | D}
 */
function label(label, contents) {
    assertDoc(contents);

    return label ? {
        type: DOC_TYPE_LABEL,
        label,
        contents
    } : contents;
}

export {
    label
};
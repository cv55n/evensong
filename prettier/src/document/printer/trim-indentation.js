// não usar uma expressão regular aqui porque expressões
// regulares para remover caracteres finais são conhecidas
// por apresentarem problemas de desempenho

/**
 * obtém o comprimento do recuo final
 * 
 * @param {string} text
 * 
 * @returns {number}
 */
function getTrailingIndentationLength(text) {
    let length = 0;

    for (let index = text.length - 1; index >= 0; index--) {
        const character = text[index];

        if (character === " " || character === "\t") {
            length++;
        } else {
            break;
        }
    }

    return length;
}

/**
 * remover tabulações `tab(u+0009)` e espaços `space(u+0020)` finais do texto
 * 
 * @param {string} text
 * 
 * @returns {{ text: string, count: number }}
 */
function trimIndentation(text) {
    const length = getTrailingIndentationLength(text);
    const trimmed = length === 0 ? text : text.slice(0, text.length - length);

    return {
        text: trimmed,
        count: length
    };
}

export { trimIndentation };
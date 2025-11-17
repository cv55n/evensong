const fnLengthDesc = Object.getOwnPropertyDescriptor(function () {}, 'length');

/*!
 * chai - utilidade addlengthguard
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

/**
 * ### .addlengthguard(fn, assertionname, ischainable)
 * 
 * define `length` como um getter para a asserção de método
 * não invocado fornecida. o getter atua como uma proteção
 * contra o encadeamento de `length` diretamente a partir de
 * uma asserção de método não invocado, o que é problemático
 * porque referencia a propriedade `length` nativa da função
 * em vez da asserção `length` do chai. quando o getter
 * detecta esse erro do usuário, ele lança uma exceção com uma
 * mensagem explicativa
 * 
 * existem duas maneiras de cometer esse erro. a primeira é
 * encadeando a asserção `length` diretamente a partir de um
 * método encadeável não invocado. nesse caso, chai sugere que
 * o usuário utilize `lengthof` em vez disso. a segunda
 * maneira é encadeando a asserção `length` diretamente a
 * partir de um método não encadeável não invocado. métodos
 * não encadeáveis devem ser invocados antes do encadeamento.
 * nesse caso, chai sugere que o usuário consulte a
 * documentação da asserção em questão
 * 
 * se a propriedade `length` das funções não for configurável,
 * retornar `fn` sem modificação
 * 
 * note que, no es6, a propriedade `length` da função é
 * configurável; portanto, quando o suporte para ambientes
 * legados for descontinuado, a propriedade `length` do chai
 * poderá substituir a propriedade `length` da função nativa,
 * e essa verificação de comprimento não será mais necessária.
 * enquanto isso, manter a consistência em todos os ambientes
 * é a prioridade
 * 
 * @param {Function} fn
 * @param {string} assertionName
 * @param {boolean} isChainable
 * 
 * @returns {unknown}
 * 
 * @namespace Utils
 * 
 * @name addLengthGuard
 */
export function addLengthGuard(fn, assertionName, isChainable) {
    if (!fnLengthDesc.configurable)
        return fn;

    Object.defineProperty(fn, 'length', {
        get: function() {
            if (isChainable) {
                throw Error(
                    'propriedade chai inválida: ' +
                        assertionName +
                        '.length. devido' +
                        ' a um erro de compatibilidade, "length" não pode seguir diretamente "' +
                        assertionName +
                        '". utilize "' +
                        '.lengthof" em vez disso.'
                );
            }

            throw Error(
                'propriedade chai inválida: ' +
                    assertionName +
                    '.length. veja' +
                    ' documentação para uso apropriado de "' +
                    assertionName +
                    '".'
            );
        }
    });

    return fn;
}
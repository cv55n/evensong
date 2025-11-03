import * as chai from '../../index.js';

var isStackSupported = false;

if (typeof Error.captureStackTrace !== 'undefined') {
    try {
        throw Error();
    } catch (err) {
        if (typeof err.stack !== 'undefined')
            isStackSupported = true;
    }
}

/**
 * valida se a função fornecida gera um erro
 * 
 * por padrão, também valida se o stack trace do erro lançado
 * não contém frames de implementação do chai. a validação
 * de stack trace pode ser desativada fornecendo o argumento
 * `skipstacktest` como verdadeiro
 * 
 * opcionalmente, valida algumas propriedades adicionais
 * do erro, como:
 * 
 * - se `val` for uma string, valida se `val` é igual à mensagem de erro
 * - se `val` for um regex, valida se `val` corresponde à mensagem de erro
 * - se `val` for um objeto, valida se as propriedades de `val` estão incluídas no objeto de erro
 * 
 * @param {Function} function função que deve lançar um erro
 * @param {Mixed} expected propriedades esperadas do erro esperado
 * @param {Boolean} skipStackTest caso verdadeiro, não valida o stack trace
 */
export function globalErr(fn, val, skipStackTest) {
    if (chai.util.type(fn) !== 'Function')
        throw new chai.AssertionError('fn inválida');

    try {
        fn();
    } catch (err) {
        if (isStackSupported && !skipStackTest) {
            chai.expect(err).to.have.property('stack')
                .that.has.string('globalErr')
                .but.does.not.match(
                    /(at [a-zA-Z]*(Getter|Wrapper|\.?assert)|\b[a-zA-Z]*(Getter|Wrapper|\.?assert\w*)@)/,
                    'frames de implementação não foram filtrados corretamente do stack trace'
                );
        }

        switch (chai.util.type(val).toLowerCase()) {
            case 'undefined': return;
            case 'string': return chai.expect(err.message).to.equal(val);
            case 'regexp': return chai.expect(err.message).to.match(val);
            case 'object': return Object.keys(val).forEach(function(key) {
                chai.expect(err).to.have.property(key).and.to.deep.equal(val[key]);
            });
        }

        throw new chai.AssertionError('val inválido');
    }

    throw new chai.AssertionError('esperava-se um erro');
};
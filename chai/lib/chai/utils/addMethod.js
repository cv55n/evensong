/*!
 * chai
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

import { addLengthGuard } from './addLengthGuard.js';
import { PluginEvent, events } from './events.js';
import { flag } from './flag.js';
import { proxify } from './proxify.js';
import { transferFlags } from './transferFlags.js';
import { Assertion } from '../assertion.js';

/**
 * ### .addmethod(ctx, name, method)
 * 
 * adiciona um método ao protótipo de um objeto
 * 
 * utils.addMethod(chai.Assertion.prototype, 'foo', function(str) {
 *     var obj = utils.flag(this, 'object');
 * 
 *     new chai.Assertion(obj).to.be.equal(str);
 * });
 * 
 * também pode ser acessado diretamente a partir de
 * `chai.assertion`
 * 
 * chai.assertion.addmethod('foo', fn);
 * 
 * então pode ser usado como qualquer outra asserção
 * 
 * expect(foostr).to.be.foo('bar');
 * 
 * @param {object} ctx objeto do qual o método é adicionado
 * @param {string} name nome do método a ser adicionado
 * @param {Function} method função a ser utilizada para o nome
 * 
 * @namespace Utils
 * 
 * @name addMethod
 * 
 * @public
 */
export function addMethod(ctx, name, method) {
    let methodWrapper = function() {
        // definir a flag `ssfi` como `methodwrapper` faz com
        // que esta função seja o ponto de partida para remover
        // os quadros de implementação do rastreamento de pilha
        // de uma asserção com falha
        //
        // no entanto, só queremos usar essa função como ponto
        // de partida se a flag `lockssfi` não estiver definida
        //
        // se a flag `lockssfi` estiver definida, significa que
        // esta asserção foi sobrescrita por outra asserção ou
        // que está sendo invocada de dentro de outra asserção.
        // no primeiro caso, a flag `ssfi` já foi definida pela
        // asserção que a sobrescreveu. no segundo caso, a flag
        // `ssfi` já foi definida pela asserção externa

        if (!flag(this, 'lockSsfi')) {
            flag(this, 'ssfi', methodWrapper);
        }

        let result = method.apply(this, arguments);

        if (result !== undefined)
            return result;

        let newAssertion = new Assertion();

        transferFlags(this, newAssertion);

        return newAssertion;
    };

    addLengthGuard(methodWrapper, name, false);

    ctx[name] = proxify(methodWrapper, name);

    events.dispatchEvent(new PluginEvent('addMethod', name, method));
}
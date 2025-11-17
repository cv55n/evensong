/*!
 * chai - utilidade addproperty
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

import { Assertion } from '../assertion.js';
import { PluginEvent, events } from './events.js';
import { flag } from './flag.js';
import { isProxyEnabled } from './isProxyEnabled.js';
import { transferFlags } from './transferFlags.js';

/**
 * ### .addproperty(ctx, name, getter)
 * 
 * adiciona uma propriedade ao protótipo de um objeto:
 * 
 * utils.addProperty(chai.Assertion.prototype, 'foo', function() {
 *     var obj = utils.flag(this, 'object');
 * 
 *     new chai.Assertion(obj).to.be.instanceof(Foo);
 * });
 * 
 * também pode ser acessado diretamente a partir de
 * `chai.assertion`:
 * 
 * chai.assertion.addproperty('foo', fn);
 * 
 * e então pode ser usado como qualquer outra asserção:
 * 
 * expect(myfoo).to.be.foo;
 * 
 * @param {object} ctx objeto ao qual a propriedade é adicionada
 * @param {string} name nome da propriedade a ser adicionada
 * @param {Function} getter função a ser utilizada
 * 
 * @namespace Utils
 * 
 * @name addProperty
 * 
 * @public
 */
export function addProperty(ctx, name, getter) {
    getter = getter === undefined ? function() {} : getter;

    Object.defineProperty(ctx, name, {
        get: function propertyGetter() {
            // definir a flag `ssfi` como `propertygetter` faz
            // com que esta função seja o ponto de partida
            // para remover os quadros de implementação do
            // rastreamento de pilha de uma asserção com falha
            //
            // no entanto, só queremos usar essa função como
            // ponto de partida se a flag `lockssfi` não
            // estiver definida e a proteção de proxy estiver
            // desativada
            //
            // se a flag `lockssfi` estiver definida, significa
            // que esta asserção foi sobrescrita por outra
            // asserção ou que está sendo invocada de dentro de
            // outra asserção. no primeiro caso, a flag `ssfi`
            // já foi definida pela asserção que a sobrescreveu.
            // no segundo caso, a flag `ssfi` já foi definida
            // pela asserção externa
            //
            // se a proteção por proxy estiver ativada, a flag
            // `ssfi` já terá sido definida pelo getter de proxy

            if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
                flag(this, 'ssfi', propertyGetter);
            }

            let result = getter.call(this);

            if (result !== undefined)
                return result;

            let newAssertion = new Assertion();

            transferFlags(this, newAssertion);

            return newAssertion;
        },

        configurable: true
    });

    events.dispatchEvent(new PluginEvent('addProperty', name, getter));
}
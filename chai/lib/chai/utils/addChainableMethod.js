/*!
 * chai - utilidade addchainablemethod
 * 
 * copyright (c) 2025 cavassani
 * 
 * licença mit
 */

import { Assertion } from '../assertion.js';
import { PluginEvent, events } from './events.js';
import { addLengthGuard } from './addLengthGuard.js';
import { flag } from './flag.js';
import { proxify } from './proxify.js';
import { transferFlags } from './transferFlags.js';

/**
 * variáveis de módulo
 */

// verifica se o `object.setprototypeof` é suportado
let canSetPrototype = typeof Object.setPrototypeOf === 'function';

// sem o suporte `object.setprototypeof`, esse módulo precisará
// adicionar propriedades a uma função. entretanto, algumas
// propriedades próprias das funções não são configuráveis e
// devem ser ignoradas

let testFn = function () {};

let excludedNames = Object.getOwnPropertyNames(testFn).filter(function(name) {
    let propDesc = Object.getOwnPropertyDescriptor(testFn, name);

    // nota: phantomjs 1.x inclui `callee` como uma das propriedades
    // próprias de `testfn`, mas então retorna `undefined` como o
    // descritor de propriedade para `callee`
    //
    // como solução alternativa, realizamos uma verificação de tipo
    // desnecessária para `propdesc` e então o filtramos se não for um
    // objeto como deveria ser

    if (typeof propDesc !== 'object')
        return true;

    return !propDesc.configurable;
});

// armazenar propriedades de `function`
let call = Function.prototype.call,
    apply = Function.prototype.apply;

export class PluginAddChainableMethodEvent extends PluginEvent {
    constructor(type, name, fn, chainingBehavior) {
        super(type, name, fn);

        this.chainingBehavior = chainingBehavior;
    }
}

/**
 * ### .addchainablemethod(ctx, name, method, chainingbehavior)
 * 
 * adiciona um método ao objeto, de modo que o método também possa ser encadeado
 * 
 * utils.addChainableMethod(chai.Assertion.prototype, 'foo', function(str) {
 *     var obj = utils.flag(this, 'object');
 * 
 *     new chai.Assertion(obj).to.be.equal(str);
 * });
 * 
 * também pode ser acessado diretamente de `chai.assertion`:
 * 
 * chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 * 
 * o resultado pode então ser usado como uma asserção de método, executando
 * `method` e `chainingbehavior`, ou como uma cadeia de linguagem, que executa
 * apenas `chainingbehavior`
 * 
 * expect(fooStr).to.be.foo('bar');
 * expect(fooStr).to.be.foo.equal('foo');
 * 
 * @param {object} ctx objeto a qual o método é adicionado
 * @param {string} name nome do método a ser adicionado
 * @param {Function} method função para ser utilizada para `name`, quando chamada
 * @param {Function} chainingBehavior função a ser chamada toda vez que uma propriedade é acessada
 * 
 * @namespace Utils
 * 
 * @name addChainableMethod
 * 
 * @public
 */
export function addChainableMethod(ctx, name, method, chainingBehavior) {
    if (typeof chainingBehavior !== 'function') {
        chainingBehavior = function() {};
    }

    let chainableBehavior = {
        method: method,
        chainingBehavior: chainingBehavior
    };

    // salva os métodos para poder reescrevê-los depois, caso necessário
    if (!ctx.__methods) {
        ctx.__methods = {};
    }

    ctx.__methods[name] = chainableBehavior;

    Object.defineProperty(ctx, name, {
        get: function chainableMethodGetter() {
            chainableBehavior.chainingBehavior.call(this);

            let chainableMethodWrapper = function() {
                // definir a flag `ssfi` como `chainablemethodwrapper` faz com
                // que esta função seja o ponto de partida para remover quadros
                // de implementação do rastreamento de pilha de uma asserção
                // com falha
                //
                // no entanto, só queremos usar essa função como ponto de
                // partida se a flag `lockssfi` não estiver definida
                //
                // se a flag `lockssfi` estiver definida, essa asserção será
                // invocada de dentro de outra asserção. Neste caso, a flag
                // `ssfi` já foi definida pela asserção externa
                //
                // observe que a substituição de um método encadeável apenas
                // substitui os métodos salvos em `ctx.__methods`, em vez de
                // substituir completamente a asserção substituída. portanto,
                // uma asserção de substituição não definirá as flags `ssfi`
                // ou `lockSsfi`

                if (!flag(this, 'lockSsfi')) {
                    flag(this, 'ssfi', chainableMethodWrapper);
                }

                let result = chainableBehavior.method.apply(this, arguments);

                if (result !== undefined) {
                    return result;
                }

                let newAssertion = new Assertion();

                transferFlags(this, newAssertion);

                return newAssertion;
            };

            addLengthGuard(chainableMethodWrapper, name, true);

            // utiliza `object.setprototypeof` caso disponível
            if (canSetPrototype) {
                // herda todas as propriedades do objeto substituindo o protótipo `function`
                let prototype = Object.create(this);

                // restaura os métodos `call` e `apply` de `function`
                prototype.call = call;
                prototype.apply = apply;

                Object.setPrototypeOf(chainableMethodWrapper, prototype);
            }

            // caso contrário, redefine todas as propriedades (lento)
            else {
                let asserterNames = Object.getOwnPropertyNames(ctx);

                asserterNames.forEach(function(asserterName) {
                    if (excludedNames.indexOf(asserterName) !== -1) {
                        return;
                    }

                    let pd = Object.getOwnPropertyDescriptor(ctx, asserterName);

                    Object.defineProperty(chainableMethodWrapper, asserterName, pd);
                });
            }

            transferFlags(this, chainableMethodWrapper);

            return proxify(chainableMethodWrapper);
        },

        configurable: true
    });

    events.dispatchEvent(new PluginAddChainableMethodEvent(
        'addChainableMethod',

        name,
        method,
        chainingBehavior
    ));
}
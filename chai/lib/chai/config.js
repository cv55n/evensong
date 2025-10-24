export const config = {
    /**
     * ### config.includestack
     * 
     * propriedade configurável pelo usuário, influencia se o rastreamento
     * de pilha é incluído na mensagem de erro de asserção
     * 
     * o padrão false suprime o rastreamento de pilha na mensagem de erro
     * 
     * chai.config.includestack = true; // habilita stack no erro
     * 
     * @param {boolean}
     * 
     * @public
     */
    includeStack: false,

    /**
     * ### config.showdiff
     * 
     * propriedade configurável pelo usuário, influencia se a flag
     * `showdiff` deve ou não ser incluída nos assertionerrors lançados
     * 
     * `false` sempre será `false`;
     * `true` será true quando a asserção solicitar um diff a ser
     * mostrado
     * 
     * @param {boolean}
     * 
     * @public
     */
    showDiff: true,

    /**
     * ### config.truncatethreshold
     * 
     * propriedade configurável pelo usuário, define o limite de
     * comprimento para valores reais e esperados em erros de
     * asserção. se esse limite for excedido, por exemplo, para
     * grandes estruturas de dados, o valor será substituído por
     * algo como `[ array(3) ]` ou `{ object (prop1, prop2) }`
     * 
     * defina como zero se quiser desabilitar o truncamento
     * completamente
     * 
     * isso é especialmente útil ao fazer asserções em arrays:
     * ter isso definido como um valor razoavelmente grande
     * torna as mensagens de falha facilmente inspecionáveis
     * 
     * // desabilitando truncamento
     * chai.config.truncatethreshold = 0;
     * 
     * @param {number}
     * 
     * @public
     */
    truncateThreshold: 40,

    /**
     * ### config.useproxy
     * 
     * propriedade configurável pelo usuário, define se o chai
     * usará um proxy para gerar um erro quando uma propriedade
     * inexistente for lida, o que protege os usuários de erros
     * de digitação ao usar asserções baseadas em propriedade
     * 
     * defina como false se quiser desabilitar esse recurso
     * 
     * // desabilitando o uso de proxy
     * chai.config.useproxy = false;
     * 
     * esse recurso é desabilitado automaticamente,
     * independentemente deste valor de configuração, em
     * ambientes que não oferecem suporte a proxies
     * 
     * @param {boolean}
     * 
     * @public
     */
    useProxy: true,

    /**
     * ### config.proxyexcludedkeys
     * 
     * propriedade configurável pelo usuário, define quais
     * propriedades devem ser ignoradas em vez de gerar um erro
     * se elas não existirem na asserção
     * 
     * isso só será aplicado se o ambiente em que o chai estiver
     * sendo executado suportar proxies e se a configuração
     * `useproxy` estiver habilitada
     * 
     * por padrão, `then` e `inspect` não gerarão um erro se não
     * existirem no objeto de asserção porque a propriedade
     * `.inspect` é lida por `util.inspect` (por exemplo, ao usar
     * `console.log` no objeto de asserção) e `.then` é
     * necessário para a verificação do tipo de promessa
     * 
     * // por padrão, essas chaves não gerarão um erro se não
     * // existirem no objeto de asserção
     * chai.config.proxyexcludedkeys = ['then', 'inspect'];
     * 
     * @param {Array}
     * 
     * @public
     */
    proxyExcludedKeys: ['then', 'catch', 'inspect', 'toJSON'],

    /**
     * ### config.deepequal
     * 
     * propriedade configurável pelo usuário, define qual
     * função personalizada usar para comparações deepequal
     * 
     * por padrão, a função usada é a do pacote `deep-eql`
     * sem comparador personalizado
     * 
     * // utilizando um comparador personalizado
     * chai.config.deepEqual = (expected, actual) => {
     *     return chai.util.eql(expected, actual, {
     *         comparator: (expected, actual) => {
     *             // para comparação não numérica, use o comportamento padrão
     *             if(typeof expected !== 'number')
     *                 return null;
     *                 
     *             // permite uma diferença de 10 entre os números comparados
     *             return typeof actual === 'number' && Math.abs(actual - expected) < 10
     *         }
     *     })
     * };
     * 
     * @param {Function}
     * 
     * @public
     */
    deepEqual: null
};
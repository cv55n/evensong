# util

> módulo [util](https://nodejs.org/docs/latest-v8.x/api/util.html) do node.js para todas as engines.

isso implementa o módulo [``util``](https://nodejs.org/docs/latest-v8.x/api/util.html) do node.js para ambientes que não possuem ele, como navegadores.

## instalação

normalmente, você não precisa instalar o `util`. se o seu código roda em node.js, o `util` já está integrado. se o seu código roda no navegador, bundlers como o [browserify](https://github.com/browserify/browserify) ou o [webpack](https://github.com/webpack/webpack) (até a versão 4 — veja [esta documentação](https://webpack.js.org/configuration/resolve/#resolvefallback) para saber como incluir polyfills como o `util` no webpack 5+) também incluem o módulo `util`.

mas se nenhum dos casos acima se aplica ao seu, com o `npm`, execute:

```
npm install util
```

## uso

```js
var util = require('util');
var EventEmitter = require('events');

function MyClass() {
    EventEmitter.call(this);
}

util.inherits(MyClass, EventEmitter);
```

## suporte ao navegador

o módulo `util` utiliza recursos do es5. se você precisar oferecer suporte a navegadores muito antigos, como o ie8, use um shim como o [`es5-shim`](https://www.npmjs.com/package/es5-shim). você precisa das versões shim e sham do `es5-shim`.

para usar ``util.promisify`` e ``util.callbackify``, as promises já devem estar disponíveis. se você precisar oferecer suporte a navegadores como o ie11, que não oferecem suporte a promises, use um shim. [es6-promise](https://github.com/stefanpenner/es6-promise) é um método popular, mas existem muitos outros disponíveis no npm.

## api

consulte a [documentação de utilidades do node.js](https://nodejs.org/docs/latest-v8.x/api/util.html). atualmente, o `util` oferece suporte à api lts do node 8. no entanto, alguns métodos estão desatualizados. os métodos ``inspect`` e ``format`` incluídos neste módulo são muito mais simples e básicos do que os do node.js.

## contribuindo

prs são muito bem-vindos. a principal forma de contribuir para o ``util`` é portando recursos, correções de bugs e testes do node.js. o ideal é que as contribuições de código para este módulo sejam copiadas e coladas do node.js e transpiladas para o es5, em vez de reimplementadas do zero. a correspondência máxima possível com o código do node.js simplifica a manutenção quando novas alterações são aplicadas ao node.js. este módulo pretende fornecer exatamente a mesma api do node.js, portanto, recursos que não estejam disponíveis no módulo principal do ``util`` não serão aceitos. solicitações de recursos devem ser direcionadas a [nodejs/node](https://github.com/nodejs/node) e serão adicionadas a este módulo assim que forem implementadas no node.js.

se houver alguma diferença de comportamento entre o módulo ``util`` do node.js e este módulo, abra um problema!

## licença

[mit](https://github.com/cv55n/evensong/util/LICENSE)

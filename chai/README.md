<h1 align="center">
    <a href="https://chaijs.com" title="documentação do chai">
        <img src="https://chaijs.com/img/chai-logo.png" alt="chaijs">
    </a>
    <br>
    chai
</h1>

<p align="center">
    o chai é uma biblioteca de asserções bdd/tdd para o <a href="https://nodejs.org">node</a> e navegador que pode ser perfeitamente combinada com qualquer estrutura de teste javascript.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/chai">
        <img src="https://img.shields.io/npm/dm/chai.svg?style=flat-square" alt="downloads:?">
    </a>
    <a href="https://www.npmjs.com/package/chai">
        <img src="https://img.shields.io/badge/node-%3E=18.0-blue.svg?style=flat-square" alt="node:?">
    </a>
    <br>
    <a href="https://chai-slack.herokuapp.com">
        <img src="https://img.shields.io/badge/slack-join%20chat-E2206F.svg?style=flat-square" alt="entre no chat do slack">
    </a>
    <a href="https://gitter.im/chaijs/chai">
        <img src="https://img.shields.io/badge/gitter-join%20chat-D0104D.svg?style=flat-square" alt="entre no chat do gitter">
    </a>
    <a href="https://opencollective.com/chaijs">
        <img src="https://opencollective.com/chaijs/backers/badge.svg?style=flat-square" alt="backers do opencollective">
    </a>
</p>

para mais informações ou para baixar plugins, veja a [documentação](https://chaijs.com).

## o que é o chai?

o chai é uma _biblioteca de asserções_, semelhante à `assert` integrada do node. ele facilita muito os testes, fornecendo diversas asserções que você pode executar no seu código.

## instalação

### node.js

`chai` está disponível no [npm](https://npmjs.org). para instalá-lo, digite:

    $ npm install --save-dev chai

### navegadores

você também pode usá-lo no navegador; instale via npm e use o arquivo `chai.js` encontrado no download. por exemplo:

```html
<script src="./node_modules/chai/chai.js"></script>
```

## uso

importe a biblioteca no seu código e escolha um dos estilos que você gostaria de usar - `assert`, `expect` ou `should`:

```js
import { assert } from 'chai'; // utilizando o estilo assert
import { expect } from 'chai'; // utilizando o estilo expect
import { should } from 'chai'; // utilizando o estilo should
```

### registre o estilo de teste de chai globalmente

```js
import 'chai/register-assert'; // utilizando o estilo assert
import 'chai/register-expect'; // utilizando o estilo expect
import 'chai/register-should'; // utilizando o estilo should
```

### importe os estilos de asserção como variáveis ​​locais

```js
import { assert } from 'chai'; // utilizando o estilo assert
import { expect } from 'chai'; // utilizando o estilo expect
import { should } from 'chai'; // utilizando o estilo should

should(); // modifica o `object.prototype`

import { expect, use } from 'chai'; // cria as variáveis locais `expect` e `use`; útil para usos de plugin
```

### uso via mocha

```bash
mocha spec.js --require chai/register-assert.js # utilizando o estilo assert
mocha spec.js --require chai/register-expect.js # utilizando o estilo expect
mocha spec.js --require chai/register-should.js # utilizando o estilo should
```

[leia mais sobre esses estilos na documentação](https://chaijs.com/guide/styles).

## plugins

o chai oferece uma arquitetura de plugin robusta para estender as asserções e interfaces do chai.

- precisa de um plugin? veja a [lista oficial de plugins](https://chaijs.com/plugins).
- quer criar um plugin? leia a [documentação de api de plugin](https://chaijs.com/guide/plugins).
- possui um plugin e quer listá-lo? basta adicionar as seguintes palavras-chave ao seu `package.json`:
    - `chai-plugin`
    - `browser` se o seu plugin funciona no navegador e também no node.js
    - `browser-only` se o seu plugin não funciona com o node.js

### projetos relacionados

- [chaijs / chai-docs](https://github.com/chaijs/chai-docs): código-fonte do site chaijs.com.
- [chaijs / assertion-error](https://github.com/chaijs/assertion-error): construtor `error` personalizado gerado quando uma asserção falha.
- [chaijs / deep-eql](https://github.com/chaijs/deep-eql): testes de equalidade profunda aprimorados para node.js e o navegador.
- [chaijs / check-error](https://github.com/chaijs/check-error): utilitário de comparação de erros e informações relacionadas ao node.js e ao navegador.
- [chaijs / loupe](https://github.com/chaijs/loupe): utilitário inspect para node.js e navegadores.
- [chaijs / pathval](https://github.com/chaijs/pathval): recuperação de valor de objeto dado um path de string.

### contribuindo

muito obrigado por considerar contribuir.

certifique-se de seguir nosso [código de conduta](https://github.com/cv55n/evensong/blob/main/chai/CODE_OF_CONDUCT.md) e também recomendamos fortemente a leitura do nosso [guia de contribuição](https://github.com/cv55n/evensong/blob/main/chai/CONTRIBUTING.md).

aqui estão alguns problemas que outros colaboradores frequentemente encontraram ao abrir solicitações de pull:

- por favor, não envie alterações para a compilação `chai.js`. Fazemos isso uma vez por lançamento.
- antes de enviar seus commits, certifique-se de [rebaseá-los](https://github.com/cv55n/evensong/blob/main/chai/CONTRIBUTING.md#pull-requests).

### colaboradores

por favor veja o [gráfico de colaboradores](https://github.com/cv55n/evensong/graphs/contributors) completo para a lista de colaboradores.

### colaboradores core

sinta-se à vontade para entrar em contato com qualquer um dos principais colaboradores caso tenha dúvidas ou preocupações. faremos o possível para responder o mais rápido possível.

[![keith cirkel](https://avatars3.githubusercontent.com/u/118266?v=3&s=50)](https://github.com/keithamus)
[![james garbutt](https://avatars3.githubusercontent.com/u/5677153?v=3&s=50)](https://github.com/43081j)
[![kristján oddsson](https://avatars3.githubusercontent.com/u/318208?v=3&s=50)](https://github.com/koddsson)

### colaborador alumni core

este projeto não seria o que é sem as contribuições dos nossos principais colaboradores anteriores, aos quais somos eternamente gratos:

[![jake luer](https://avatars3.githubusercontent.com/u/58988?v=3&s=50)](https://github.com/logicalparadox)
[![veselin todorov](https://avatars3.githubusercontent.com/u/330048?v=3&s=50)](https://github.com/vesln)
[![lucas fernandes da costa](https://avatars3.githubusercontent.com/u/6868147?v=3&s=50)](https://github.com/lucasfcosta)
[![grant snodgrass](https://avatars3.githubusercontent.com/u/17260989?v=3&s=50)](https://github.com/meeber)

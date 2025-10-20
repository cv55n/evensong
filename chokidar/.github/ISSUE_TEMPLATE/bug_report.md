| **nome** | **sobre** |
|---|---|
| report do bug | crie um report para nos ajudar a melhorar |

**descreva o bug**

uma descrição clara e concisa do que é o bug.

**versões (por favor complete as seguintes informações):**

- versão do chokidar [ex: 3.2.1 ou o hash do commit]
- versão do node.js [ex: 12.11.0, certifique-se de estar utilizando a última versão do node.js]
- versão do sistema operacional [ex: ubuntu 19.04 ou macos 10.15 ou windows 10]

**para reproduzir:**

etapas para reproduzir o comportamento. inclua o nome do arquivo e a configuração do chokidar.

o ideal é provar um problema isolando-o e tornando-o reproduzível com um programa de exemplo bem curto, que você pode colar aqui:

```js
const chokidar = require('chokidar');
const fs = require('fs');

// uma linha para arquivos e diretórios que começam com 'test'
chokidar.watch('test*', {}).on('all', (event, path) => {
    console.log(event, path);
});

fs.writeFileSync('test.txt', 'testing 1');

// em um comentário, descreva o output esperado em comparação ao problema observado
```

o mais valioso pode ser um ou mais casos de teste para [test.js](https://github.com/paulmillr/chokidar/blob/master/test.js) para demonstrar o problema.

**comportamento esperado** uma descrição clara e concisa do que você espera que aconteça.

**contexto adicional** adicione qualquer outro contexto sobre o problema aqui. opcionalmente, é interessante saber em qual projeto você está trabalhando.

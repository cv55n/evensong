# readdirp

versão recursiva do `fs.readdir`. expõe uma **api de stream** (com um pequeno footprint de ram e cpu) e uma **api de promise**.

```
npm install readdirp

jsr add jsr:@paulmillr/readdirp
```

```js
// utilizar streams para obter menor consumo de ram e cpu.

// 1) exemplo de streams com for-await
import readdirp from 'readdirp';

for await (const entry of readdirp('.')) {
    const {path} = entry;

    console.log(`${JSON.stringify({path})}`);
}

// 2) exemplo de streams sem for-await
//
// printa todos os arquivos javascript junto com seus tamanhos dentro da pasta atual e subpastas

import readdirp from 'readdirp';

readdirp('.', {alwaysStat: true, fileFilter: (f) => f.basename.endsWith('.js')})
    .on('data', (entry) => {
        const {path, stats: {size}} = entry;

        console.log(`${JSON.stringify({path, size})}`);
    })
    // opcionalmente, chame stream.destroy() em `warn()` para abortar e fazer com que 'close' seja emitido
    .on('warn', error => console.error('erro não fatal', error))
    .on('error', error => console.error('erro fatal', error))
    .on('end', () => console.log('feito'));

// 3) exemplo de promise. mais ram e cpu do que streams/for-await

import { readdirpPromise } from 'readdirp';

const files = await readdirpPromise('.');

console.log(files.map(file => file.path));

// outras opções

import readdirp from 'readdirp';

readdirp('test', {
    fileFilter: (f) => f.basename.endsWith('.js'),
    directoryFilter: (d) => d.basename !== '.git',
    // directoryFilter: (di) => di.basename.length === 9
    
    type: 'files_directories',
    
    depth: 1
});
```

## api

`const stream = readdirp(root[, options])` — **api de stream**

- lê o root fornecido recursivamente e retorna uma `stream` de [informações de entrada](https://github.com/paulmillr/readdirp/tree/master#entryinfo).
- opcionalmente pode ser utilizado como um `for await (const entry of stream)` com o node.js 10+ (`asynciterator`).
- `on('data', (entry) => {})` [informação de entrada](https://github.com/paulmillr/readdirp/tree/master#entryinfo) para cada arquivo/diretório.
- `on('warn', (error) => {})` `error` não fatal que previne que o arquivo/diretório de ser processado. exemplo: inacessível para o usuário.
- `on('error', (error) => {})` `error` fatal que também finaliza a stream. exemplo: opções ilegais onde foram passadas.
- `on('end')` — tudo feito. chamado quando todas as entradas foram encontradas e mais nenhuma será emitida.
- `on('close')` — a stream foi destruída via `stream.destroy()`. pode ser útil se você quiser abortar manualmente, mesmo em caso de erro não fatal. nesse ponto, a stream não é mais `readable` e nenhuma entrada, aviso ou erro é emitido.
- para aprender mais sobre streams, consulte a [documentação de streams do node.js](https://nodejs.org/api/stream.html) ou o [stream-handbook](https://github.com/substack/stream-handbook).

`const entries = await readdirp.promise(root[, options])` — **api da promise**.

retorna uma lista de [informações de entrada](https://github.com/paulmillr/readdirp/tree/master#entryinfo).

o primeiro argumento sempre será o `root`, path no qual iniciar a leitura e a recursividade em subdiretórios.

### opções

- `filefilter`: filtro para incluir ou excluir arquivos
    - **função**: uma função que recebe uma informação de entrada como parâmetro e retorna `true` para incluir ou `false` para excluir a entrada
- `directoryfilter`: filtro para incluir/excluir diretórios encontrados e para acesso recursivo. diretórios que não passarem por um filtro não serão acessados ​​recursivamente.
- `depth: 5`: profundidade na qual parar a recursão mesmo se mais subdiretórios forem encontrados
- `type: 'files'`: determina se os eventos de dados na stream devem ser emitidos para `'files'` (padrão), `'directories'`, `'files_directories'` ou `'all'`. definir como `'all'` também incluirá entradas para outros tipos de descritores de arquivo, como dispositivos de caracteres, soquetes unix e pipes nomeados.
- `alwaysstat: false`: sempre retornará a propriedade `stats` para cada arquivo. o padrão é `false`, o **readdirp** retornará entradas do `dirent`. definir como `true` pode dobrar o tempo de execução do readdir - use-o somente quando precisar de `size` de arquivo, `mtime`, etc. não pode ser habilitado no node.js <10.10.0.
- `lstat: false`: incluir entradas de links simbólicos na strema, juntamente com os arquivos. quando `true`, `fs.lstat` seria usado em vez de `fs.stat`.

## `entryinfo`

possui as seguintes propriedades:

- `path: 'assets/javascripts/react.js'`: path para o arquivo/diretório (relativo ao root fornecido)
- `fullPath: '/Users/dev/projects/app/assets/javascripts/react.js'`: path completo para o arquivo/diretório encontrado
- `basename: 'react.js'`: nome do arquivo/diretório
- `dirent: fs.dirent`: [objeto de entrada dir](https://nodejs.org/api/fs.html#fs_class_fs_dirent) integrado - apenas com `alwaysstat: false`
- `stats: fs.stats`: [objeto de estatísticas](https://nodejs.org/api/fs.html#fs_class_fs_stats) integrado - apenas com `alwaysstat: true`

## changelog

- 4.0 (25 de ago, 2024) reescrito em typescript, produzindo o módulo híbrido `common.js` / `esm`.
    - remoção de suporte `glob` e todas as dependências
    - certifique-se de estar utilizando `let {readdirp} = require('readdirp')` em `common.js`
- 3.5 (13 de out, 2020) não permite links simbólicos recursivos baseados em diretórios. antes, poderia entrar em um loop infinito.
- 3.4 (19 de mar, 2020) adiciona suporte para links simbólicos baseados em diretório.
- 3.3 (6 de dez, 2019) estabiliza o consumo de ram e permite o gerenciamento de desempenho com a opção `highwatermark`. corrige condições de corrida relacionadas ao loop `for-await`.
- 3.2 (14 de out, 2019) melhora o desempenho em 250% e torna a implementação de streams mais idiomática.
- 3.1 (7 de jul, 2019) traz suporte ao `bigint` para saída `stat` no windows. isso é incompatível com versões anteriores em alguns casos. cuidado. se você usar incorretamente, verá `"typeerror: não é possível misturar bigint e outros tipos, usar conversões explícitas"`.
- 3.0 traz grandes melhorias de desempenho e suporte para contrapressão da stream.
- aprimorando `2.x` para `3.x`:
    - assinatura alterada de `readdirp(options)` para `readdirp(root, options)`
    - api de callback substituída por api da promise
    - opção `entrytype` renomeada para `type`
    - `entrytype: 'both'` renomeado para `'files_directories'`
    - `entryinfo`
        - `stat` renomeado para `stats`
            - emitido apenas quando `alwaysstat: true`
            - `dirent` é emitido em vez de `stats` por padrão com `alwaysstat: false`
        - `name` renomeado para `basename`
        - remoção de `parentdir` e propriedades de `fullparentdir`
- versões node.js suportadas:
    - `4.x`: node.js 14+
    - `3.x`: node.js 8+
    - `2.x`: node.js 0.6+

## licença

copyright (c) 2025 cavassani

licença mit, veja o arquivo [license](https://github.com/cv55n/evensong/blob/main/readdirp/LICENSE).

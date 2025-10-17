# chokidar [![downloads semanais](https://img.shields.io/npm/dw/chokidar.svg)](https://github.com/paulmillr/chokidar)

biblioteca de observação de arquivos multiplataforma mínima e eficiente

## por que?

há muitos motivos para preferir o chokidar ao `fs.watch` / `fs.watchfile` cru em 2025:

- eventos são reportados apropriadamente
    - eventos do macos reportam nomes de arquivo
    - eventos não são reportados duas vezes
    - mudanças são reportadas como `add` / `change` / `unlink` em vez de um `rename` inútil
- escritas atômicas são suportadas, utilizando a opção `atomic`
    - alguns editores de arquivos a utilizam
- escritas chunkadas são suportadas, utilizando a opção `awaitwritefinish`
    - arquivos largos geralmente são escritos em chunks
- filtração de arquivo/diretório suportada
- links simbólicos são suportados
- watching recursivo é sempre suportado, em vez de parcial quando utiliza-se eventos crus
    - inclui um jeito de limitar a profundidade de recursividade

o chokidar depende do módulo `fs` do core do node.js, mas ao usar `fs.watch` e `fs.watchfile` para monitoramento, ele normaliza os eventos recebidos, frequentemente verificando a veracidade obtendo estatísticas de arquivos e/ou conteúdo de diretórios. a implementação baseada em `fs.watch` é a padrão, o que evita a consulta e mantém o uso da cpu baixo. esteja ciente de que o chokidar iniciará os observadores recursivamente para tudo dentro do escopo dos caminhos especificados, portanto, seja criterioso para não desperdiçar recursos do sistema monitorando muito mais do que o necessário. em alguns casos, o `fs.watchfile`, que utiliza consulta e consome mais recursos, é usado.

criado para o [brunch](https://brunch.io/) em 2012, ele agora é usado em cerca de [30 milhões de repositórios](https://www.npmjs.com/browse/depended/chokidar) e se provou eficaz em ambientes de produção.

**atualização (setembro de 2024)**: `v4` lançada! reduz a contagem de dependências de 13 para 1, remove o suporte para globs, adiciona suporte para módulos esm/common.js e aumenta a versão mínima do node.js da `v8` para a `v14`. confira a [atualização](https://github.com/paulmillr/chokidar/blob/main/README.md#upgrading).

## iniciando

instale via npm:

```
npm install chokidar
```

utilize no seu código:

```js
import chokidar from 'chokidar';

// uma linha para o diretório atual
chokidar.watch('.').on('all', (event, path) => {
    console.log(event, path);
});

// opções estendidas
// -----------------

// inicializando o watcher
const watcher = chokidar.watch('file, dir, or array', {
    ignored: (path, stats) => stats?.isFile() && !path.endsWith('.js'), // observar apenas arquivos js

    persistent: true
});

// algo para utilizar quando os eventos são recebidos
const log = console.log.bind(console);

// adição dos ouvintes de eventos
watcher
    .on('add', (path) => log(`arquivo ${path} foi adicionado`))
    .on('change', (path) => log(`arquivo ${path} foi alterado`))
    .on('unlink', (path) => log(`arquivo ${path} foi removido`));

// mais alguns possíveis eventos
watcher
    .on('addDir', (path) => log(`diretório ${path} foi adicionado`))
    .on('unlinkDir', (path) => log(`diretório ${path} foi removido`))
    .on('error', (error) => log(`erro do watcher: ${error}`))
    .on('ready', () => log('scan inicial completo. pronto para mudanças.'))
    .on('raw', (event, path, details) => {
        // interno
        log('informações de evento cru:', event, path, details);
    });

// os eventos 'add', 'adddir', e 'change' também recebem resultados stat() como segundo
// argumento quando disponível: https://nodejs.org/api/fs.html#fs_class_fs_stats
watcher.on('change', (path, stats) => {
    if (stats)
        console.log(`tamanho do arquivo ${path} alterado para ${stats.size}`);
});

// observar novos arquivos
watcher.add('novo-arquivo');
watcher.add(['novo-arquivo-2', 'novo-arquivo-3']);

// obtém uma lista dos paths que estão atualmente sendo observados no filesystem
let watchedPaths = watcher.getWatched();

// deixa de observar alguns arquivos
await watcher.unwatch('novo-arquivo');

// para de observar
//
// esse método é assíncrono
await watcher.close().then(() => console.log('fechado'));

// lista completa de opções. veja abaixo para descrições.
//
// não utilizar esse exemplo abaixo!

chokidar.watch('file', {
    persistent: true,

    // ignorar arquivos .txt
    ignored: (file) => file.endsWith('.txt'),

    // observar apenas arquivos .txt
    // ignored: (file, _stats) => _stats?.isFile() && !file.endsWith('.txt'),

    // emite um evento único quando escritas em chunks forem concluídas
    awaitWriteFinish: true,

    // emite eventos apropriados quando "escritas atômicas" (arquivo mv _tmp) forem usadas
    atomic: true,

    // as opções permitem também especificações de intervalos customizados em ms
    // awaitWriteFinish: {
    //     stabilityThreshold: 2000,
    //     pollInterval: 100
    // },
    //
    // atomic: 100,

    interval: 100,
    binaryInterval: 300,

    cwd: '.',

    depth: 99,

    followSymlinks: true,
    ignoreInitial: false,
    ignorePermissionErrors: false,
    usePolling: false,
    alwaysStat: false
});
```

`chokidar.watch(paths, [options])`

- `paths` (string ou array de strings) paths para os arquivos/diretórios a serem observados recursivamente
- `options` (objeto) objeto de opções como definido abaixo:

### persistência

- `persistent` (padrão: `true`). indica se o processo deve continuar em execução enquanto os arquivos estiverem sendo monitorados.

### filtração de path

- `ignored` função, regex ou path. define os arquivos/paths a serem ignorados. todo o path relativo ou absoluto é testado, não apenas o nome do arquivo. se uma função com dois argumentos for fornecida, ela será chamada duas vezes por path — uma vez com um único argumento (o path) e a segunda vez com dois argumentos (o path e o objeto [`fs.stats`](https://nodejs.org/api/fs.html#fs_class_fs_stats) desse path).
- `ignoreinitial` (padrão: `false`). se definido como `false`, os eventos `add`/`adddir` também serão emitidos para paths correspondentes ao instanciar a observação, pois o chokidar descobre esses paths de arquivo (antes do evento pronto).
- `followsymlinks` (padrão: `true`). quando `false`, somente os próprios links simbólicos serão monitorados em busca de alterações, em vez de seguir as referências de link e os eventos de bolha pelo path do link.
- `cwd` (sem padrão). o diretório base do qual os `paths` de observação serão derivados. os paths emitidos com eventos serão relativos a ele.

### performance

- `usepolling` (padrão: `false`). se deve usar `fs.watchfile` (com suporte de polling) ou `fs.watch`. se o polling resultar em alta utilização da cpu, considere definir essa opção como `false`. normalmente, é necessário **definir essa opção como `true` para monitorar arquivos em uma rede com sucesso**, e pode ser necessário para monitorar arquivos com sucesso em outras situações não padronizadas. definir como `true` explicitamente no macOS substitui o padrão `usefsevents`. você também pode definir a variável de ambiente `chokidar_usepolling` como `true` (1) ou `false` (0) para substituir essa opção.
- _configurações específicas de polling_ (efetivo quando `usepolling: true`)
    - `interval` (padrão: `100`). intervalo de consulta do sistema de arquivos, em milissegundos. você também pode definir a variável de ambiente `chokidar_interval` para substituir esta opção.
    - `binaryinterval` (padrão: `300`). intervalo de pesquisa do sistema de arquivos para arquivos binários. (veja a [lista de extensões binárias](https://github.com/sindresorhus/binary-extensions/blob/master/binary-extensions.json))
- `alwaysstat` (padrão: `false`). se estiver confiando no objeto [`fs.stats`](https://nodejs.org/api/fs.html#fs_class_fs_stats) que pode ser passado com eventos `add`, `adddir` e `change`, defina isso como `true` para garantir que ele seja fornecido mesmo em casos em que ainda não estava disponível nos eventos de observação subjacentes.
- `depth` (padrão: `undefined`). se definido, limita quantos níveis de subdiretórios serão percorridos.
- `awaitwritefinish` (padrão: `false`). por padrão, o evento `add` será disparado quando um arquivo aparecer pela primeira vez no disco, antes que todo o arquivo tenha sido gravado. além disso, em alguns casos, alguns eventos `change` serão emitidos enquanto o arquivo estiver sendo gravado. em alguns casos, especialmente ao monitorar arquivos grandes, será necessário aguardar a conclusão da operação de gravação antes de responder à criação ou modificação de um arquivo. definir `awaitwritefinish` como `true` (ou um valor verdadeiro) pesquisará o tamanho do arquivo, mantendo seus eventos `add` e `change` até que o tamanho não mude por um período de tempo configurável. a configuração de duração apropriada depende muito do sistema operacional e do hardware. para uma detecção precisa, esse parâmetro deve ser relativamente alto, tornando a observação de arquivos muito menos responsiva. use com cautela.
    - _`options.awaitwritefinish`_ _pode ser definido como um objeto para ajustar os parâmetros de tempo:_
        - `awaitwritefinish.stabilitythreshold` (padrão: `2000`). quantidade de tempo em milissegundos para que o tamanho de um arquivo permaneça constante antes de emitir seu evento.
        - `awaitwritefinish.pollinterval` (padrão: `100`). intervalo de pesquisa do tamanho do arquivo, em milissegundos.

### erros

- `ignorepermissionerrors` (padrão: `false`). indica se os arquivos sem permissão de leitura devem ser monitorados, se possível. se a monitoração falhar devido a `eperm` ou `eacces` com esta opção definida como `true`, os erros serão suprimidos silenciosamente.
- `atomic` (padrão: `true` caso `usefsevents` e `usepolling` for `false`). filtra automaticamente artefatos que ocorrem ao usar editores que utilizam "gravações atômicas" em vez de gravar diretamente no arquivo de origem. se um arquivo for adicionado novamente em até 100 ms após ser excluído, o chokidar emite um evento `change` em vez de `unlink` e `add`. se o padrão de 100 ms não funcionar bem para você, você pode substituí-lo definindo `atomic` para um valor personalizado, em milissegundos.

## métodos e eventos

`chokidar.watch()` produz uma instância do `fswatcher`. métodos do `fswatcher`:

- `.add(path / paths)`: adiciona arquivos e diretórios para rastreamento. aceita um array de strings ou apenas uma string.
- `.on(event, callback)`: escuta um evento fs. eventos disponíveis: `add`, `adddir`, `change`, `unlink`, `unlinkdir`, `ready`, `raw`, `error`. além disso, `all` está disponível e é emitido com o nome e o path do evento subjacente para cada evento, exceto `ready`, `raw` e `error`. `raw` é interno, use-o com cuidado.
- `.unwatch(path / paths)`: para de monitorar arquivos ou diretórios. aceita um array de strings ou apenas uma string.
- `.close()`: **async** remove todos os ouvintes dos arquivos monitorados. assíncrono, retorna `promise`. use com `await` para garantir que bugs não aconteçam.
- `.getWatched()`: retorna um objeto que representa todos os caminhos no sistema de arquivos monitorados por esta instância do `fswatcher`. as chaves do objeto são todos os diretórios (usando caminhos absolutos, a menos que a opção `cwd` tenha sido usada) e os valores são arrays dos nomes dos itens contidos em cada diretório.

## cli

confira o [chokidar-cli](https://github.com/open-cli-tools/chokidar-cli) de terceiros, que permite executar um comando em cada alteração ou obter uma stream `stdio` de eventos de alteração.

## solução de problemas

às vezes, o chokidar fica sem identificadores de arquivo, causando erros `emfile` e `enosp`:

- `bash: cannot set terminal process group (-1): inappropriate ioctl for device bash: no job control in this shell`
- `error: watch /home/ enospc`

há duas coisas que podem causar isso.

1. handles de arquivo esgotadas para operações fs genéricas
    - pode ser resolvido utilizando o [graceful-fs](https://www.npmjs.com/package/graceful-fs), que pode fazer monkey-patch no módulo nativo `fs` utilizado pelo chokidar: `let fs = require('fs'); let grfs = require('graceful-fs'); grfs.gracefulify(fs);`
    - pode ser resolvido ajustando o sistema operacional: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`
2. handles de arquivo esgotadas para `fs.watch`
    - não parece ser resolvido com [graceful-fs](https://www.npmjs.com/package/graceful-fs) ou ajuste do sistema operacional
    - é possível começar a usar `usepolling: true`, que alternará o backend para `fs.watchfile`, que consome muitos recursos.

todos os problemas relacionados ao fsevents (`warn optional dep failed, fsevents is not a constructor`) são resolvidos com a atualização para a `v4`+.

## changelog

- **v4 (setembro de 2024)**: suporte a `glob` removido e os `fsevents` agrupados. contagem de dependências reduzida de 13 para 1. reescrita em typescript. aumento do requisito mínimo do node.js para a versão 14+.
- **v3 (abril de 2019)**: melhorias massivas no consumo de cpu e ram; reduz o tamanho dos pacotes/deps em um fator de 17x e aumenta o requisito do node.js para a versão 8.16+.
- **v2 (dezembro de 2017)**: os `globs` agora são exclusivos do estilo posix. várias correções de bugs.
- **v1 (abril de 2015)**: suporte ao `glob`, suporte à links simbólicos, várias correções de bugs. node.js 0.8+ é suportado.
- **v0.1 (abril de 2012)**: release inicial, extraído do [brunch](https://github.com/brunch/brunch/blob/9847a065aea300da99bd0753f90354cde9de1261/src/helpers.coffee#L66).

## upgrading

se você já usou `globs` antes e quer replicar a funcionalidade com a `v4`:

```js
// v3
chok.watch('**/*.js');
chok.watch('./directory/**/*');

// v4
chok.watch('.', {
    ignored: (path, stats) => stats?.isFile() && !path.endsWith('.js'), // observar apenas arquivos js
});

chok.watch('./directory');

// outro jeito
import { glob } from 'node:fs/promises';

const watcher = watch(await Array.fromAsync(glob('**/*.js')));

// não observando

// v3
chok.unwatch('**/*.js');

// v4
chok.unwatch(await Array.fromAsync(glob('**/*.js')));
```

## e também

por que o chokidar recebeu esse nome? qual o significado?

> chowkidar é uma transliteração de uma palavra em hindi que significa 'vigia, porteiro', चौकीदार. em última análise, isso vem do sânscrito _चतुष्क_ (cruzamento, quadrilátero, consistindo em quatro). esta palavra também é usada em outras línguas como o urdu como (چوکیدار), que é amplamente utilizada no paquistão e na índia.

## licença

mit (c) cavassani, veja o arquivo [license](https://github.com/cv55n/evensong/blob/main/chokidar/LICENSE).

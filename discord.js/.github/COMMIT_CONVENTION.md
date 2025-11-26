# convenção de mensagens de commit do git

> isso é adaptado da [convenção de commit do angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular).

#### tl;dr:

as mensagens devem corresponder ao seguinte regex:

```js
/^(revert: )?(feat|fix|docs|style|refactor|perf|test|build|ci|chore|types)(\(.+\))?!?: .{1,72}/;
```

#### exemplos

aparece sob a header "features", e subheader `guildmember`:

```
feat(guildmember): adição do método 'tag'
```

aparece sob a header "bug fixes", subheader `guild`, com um link para a issue #28:

```
fix(guild): auxílio de eventos da forma correta

close #28
```

aparece sob a header "performance improvements", e também sob "breaking changes" com a explicação da alteração que quebra a compatibilidade:

```
perf(core): melhoria no processo de aplicação de patches removendo a opção 'bar'

breaking change: a opção 'bar' foi removida.
```

o seguinte commit e o commit `667ecc1` não aparecem na changelog caso estejam sob a mesma release. caso contrário, o commit reverso aparece sob a header "reverts".

```
revert: feat(managers): adição de managers

isso reverte o commit 667ecc1654a317a13331b17617d973392f415f02.
```

### formato de mensagem completa

uma mensagem de commit consiste em uma **header**, **body** e **footer**. a header possui um **tipo**, **escopo** e **assunto**:

```
<tipo>(<escopo>): <assunto>
<linha em branco>
<body>
<linha em branco>
<footer>
```

a **header** é obrigatório e o **escopo** da header é opcional. se o commit contiver **breaking changes**, um `!` pode ser adicionado antes dos `:` como indicador.

### revert

se o commit reverter um commit anterior, ele deve começar com `revert:`, seguido pela header do commit revertido. no corpo do commit, deve constar: `isso reverte o commit <hash>`, onde hash é o sha do commit que está sendo revertido.

### tipo

se o prefixo for `feat`, `fix` ou `perf`, ele aparecerá no changelog. no entanto, se houver alguma [breaking change](https://github.com/discordjs/discord.js/blob/main/.github/COMMIT_CONVENTION.md#footer), o commit sempre aparecerá no changelog.

outros prefixos ficam a seu critério. sugestões de prefixos para tarefas não relacionadas ao changelog são: docs, chore, style, refactor e test.

### escopo

o escopo pode ser qualquer coisa que especifique o local da alteração confirmada. por exemplo, `guildmember`, `guild`, `message`, `textchannel` etc...

### assunto

o assunto contém uma descrição sucinta da alteração:

- usar o imperativo, presente do indicativo: "change" e não "changed" nem "changes"
- não usar letra maiúscula na primeira letra
- sem pontos finais (.) no final

### body

assim como no **assunto**, use o imperativo no presente: "mudança", não "mudou" nem "muda". O corpo do texto deve incluir a motivação para a mudança e contrastá-la com o comportamento anterior.

### footer

o footer deve conter todas as informações sobre as **breaking changes** e também é o local para referenciar os problemas do github que este commit **finaliza**.

as **breaking changes** devem começar com a expressão `breaking change:`, seguida de um espaço ou duas quebras de linha. o restante da mensagem do commit será usado para essa expressão.

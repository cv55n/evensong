# diretrizes para contribuição com chai

gostaríamos de incentivá-lo a contribuir para o repositório chai.js. isso deve ser o mais fácil possível para você, mas há alguns pontos a serem considerados ao contribuir. As seguintes diretrizes para contribuição devem ser seguidas se você quiser enviar um pull request ou abrir uma issue.

seguir essas diretrizes ajuda a comunicar que você respeita o tempo dos desenvolvedores que gerenciam e desenvolvem este projeto de código aberto. em troca, eles devem retribuir esse respeito abordando sua issue ou avaliando patches e recursos.

**tabela de conteúdos**

- [tldr;](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#tldr)
- [contribuindo](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#contributing)
    - [reports de bug](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#bugs)
    - [feature requests](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#features)
    - [pull requests](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#pull-requests)
- [releasing](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#releasing)
- [suporte](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#support)
    - [recursos](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#resources)
    - [colaboradores core](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#contributors)

## tldr;

- criar um issue ou um pull request requer uma conta no [github](http://github.com).
- os relatórios de problemas devem ser claros, concisos e reproduzíveis. verifique se o seu problema já foi resolvido na branch [master](https://github.com/chaijs/chai/blob/main) ou relatado no [rastreador de problemas do chai](https://github.com/chaijs/chai/issues) no github.
- os pull requests devem seguir as [diretrizes rígidas de estilo de codificação](https://github.com/chaijs/chai/wiki/Chai-Coding-Style-Guide).
- em geral, evite enviar prs para novas asserções sem consultar os principais colaboradores primeiro. provavelmente seria melhor implementá-las como um plugin.
- suporte adicional está disponível no [google group](http://groups.google.com/group/chaijs) ou em ``irc.freenode.net#chaijs``.
- **importante**: ao enviar um patch, você concorda em permitir que o proprietário do projeto licencie seu trabalho sob a mesma licença usada pelo projeto.

## contribuindo

o rastreador de problemas é o canal preferido para [reports de bugs](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#bugs), [feature requests](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#features) e [envio de pull requests](https://github.com/chaijs/chai/blob/main/CONTRIBUTING.md#pull-requests), mas respeite as seguintes restrições:

- **não usar** o rastreador de problemas para solicitações de suporte pessoal (use o [google group](https://groups.google.com/forum/#!forum/chaijs) ou o irc).
- por favor, **não** desvie o assunto nem trolle. mantenha a discussão focada no assunto e respeite as opiniões dos outros.

### reports de bug

um bug é um **problema demonstrável** causado pelo código no repositório.

diretrizes para reports de bugs:

1. **use a pesquisa de problemas do github** — verifique se o problema já foi relatado.
2. **verifique se o problema foi corrigido** — tente reproduzi-lo usando o último branch `master` ou development no repositório.
3. **isole o problema** — crie um caso de teste para demonstrar o seu problema. forneça um repositório, um resumo ou um exemplo de código para demonstrar o seu problema.

um bom report de bug não deve deixar que outras pessoas precisem entrar em contato com você para obter mais informações. tente ser o mais detalhado possível em seu report. qual é o seu ambiente? quais etapas reproduzirão o problema? quais navegadores e/ou versões do node.js apresentam o problema? qual seria o resultado esperado? todos esses detalhes ajudarão as pessoas a corrigir possíveis bugs.

exemplo:

> título de exemplo curto e descritivo para relatório de bug
>
> um resumo do problema e do ambiente do navegador/sistema operacional em que ele ocorre. se aplicável, inclua as etapas necessárias para reproduzir o bug.
>
> 1. esse é o primeiro passo
> 2. esse é o segundo passo
> 3. resto dos passos, etc.
>
> `<url>` - um link para o caso de teste reduzido
>
> ```js
> expect(a).to.equal('a');
>
> // amostra de código
> ```
>
> qualquer outra informação que você queira compartilhar e que seja relevante para o problema relatado. isso pode incluir as linhas de código que você identificou como causadoras do bug e possíveis soluções (e sua opinião sobre seus méritos).

### feature requests

solicitações de recursos são bem-vindas. mas reserve um momento para verificar se a sua ideia se enquadra no escopo e nos objetivos do projeto. cabe a você apresentar argumentos convincentes para convencer os desenvolvedores do projeto sobre os méritos desse recurso. forneça o máximo de detalhes e contexto possível.

além disso, como o chai.js possui uma [api de plugins robusta](http://chaijs.com/guide/plugins/), recomendamos que você publique **novas asserções** como plugins. se o seu recurso for um aprimoramento de uma **asserção existente**, proponha suas alterações como um problema antes de abrir um pull request. se os principais colaboradores do chai.js acharem que seu plugin seria mais adequado como uma asserção principal, eles o convidarão a abrir um pr em [chaijs/chai](https://github.com/chaijs/chai).

### pull requests

- prs para novas afirmações essenciais são desaconselhados.
- prs para correções de bugs de asserção do core são sempre bem-vindos.
- prs para melhorar as interfaces são sempre bem-vindos.
- prs que aumentam a cobertura dos testes são sempre bem-vindos.
- os prs são examinados quanto ao estilo de codificação.

bons pull requests — patches, melhorias, novos recursos — são uma ajuda fantástica. eles devem manter o foco no escopo e evitar conter commits não relacionados.

**pergunte primeiro** antes de embarcar em qualquer solicitação de pull significativa (por exemplo, implementação de recursos, refatoração de código), caso contrário, você corre o risco de gastar muito tempo trabalhando em algo que os desenvolvedores do projeto podem não querer mesclar ao projeto.

siga as convenções de codificação usadas em todo o projeto (recuo, comentários precisos, etc.) e quaisquer outros requisitos (como cobertura de testes). consulte o [guia de estilo de codificação chai.js](https://github.com/chaijs/chai/wiki/Chai-Coding-Style-Guide).

siga este processo se quiser que seu trabalho seja considerado para inclusão no projeto:

1. [forke](http://help.github.com/fork-a-repo/) o projeto, clone seu fork e configure os remotos:

```bash
# clone seu fork do repositório no diretório atual
git clone https://github.com/<your-username>/<repo-name>

# navegue até o diretório recém-clonado
cd <repo-name>

# atribua o repositório original a um repositório remoto chamado "upstream"
git remote add upstream https://github.com/<upstream-owner>/<repo-name>
```

2. se você clonou há algum tempo, obtenha as últimas alterações do upstream:

```bash
git checkout <dev-branch>
git pull upstream <dev-branch>
```

3. crie um novo branch de tópico (fora do branch principal de desenvolvimento do projeto) para conter seu recurso, alteração ou correção:

```bash
git checkout -b <topic-branch-name>
```

4. faça commit das suas alterações em chunks lógicos. use o recurso de [rebase interativo](https://help.github.com/articles/interactive-rebase) do git para organizar seus commits antes de torná-los públicos.

5. execute seu código para garantir que funciona. se ainda estiver com problemas, tente executar o comando ``make clean`` e teste o código novamente.

```bash
npm test

# quando terminar de rodar os testes...
git checkout chai.js
```

6. mescle (ou rebaseie) localmente o branch de desenvolvimento upstream no seu branch de tópico:

```bash
git pull [--rebase] upstream <dev-branch>
```

7. empurre o branch do seu tópico para o seu fork:

```bash
git push origin <topic-branch-name>
```

8. [abra um pull request](https://help.github.com/articles/using-pull-requests/) com um título e uma descrição claros.

**importante**: ao enviar um patch, você concorda em permitir que o proprietário do projeto licencie seu trabalho sob a mesma licença usada pelo projeto.

## releasing

os lançamentos podem ser **preparados** por qualquer pessoa com acesso ao código.

basta executar ``make release-major``, ``make release-minor`` ou ``make-release-patch`` e ele fará automaticamente o seguinte:

- construir o chai.js
- aumentar os números de versão em todo o projeto
- fazer um commit dentro do git

tudo o que você precisa fazer é enviar o commit e fazer uma solicitação de pull, um dos principais colaboradores irá mesclá-lo e publicar uma versão.

### publicando uma release

qualquer pessoa que seja um colaborador core (veja o [readme dos colaboradores principais](https://github.com/chaijs/chai#core-contributors)) pode publicar uma versão:

1. acesse a [página de lançamentos no github](https://github.com/chaijs/chai/releases)
2. clique em "draft a new release" (se você não consegue ver isso, você não é um colaborador core)
3. escreva notas de versão amigáveis ​​ao usuário com base no registro de alterações.

- o título do lançamento é "x.x.x / yyyy-mm-dd" (onde x.x.x é o número da versão)
- se houver mudanças drásticas, escreva tutoriais de migração e o raciocínio.
- convites para contribuições da comunidade (prs) com links para PR e usuários contribuintes.
- chamadas para outras correções feitas pelos principais colaboradores com links para o problema.

4. clique em "save draft" e peça para outros colaboradores principais verificarem seu trabalho ou, alternativamente, clique em "publish release"
5. tudo feito.

## suporte

### recursos

para a maior parte da documentação, você vai querer visitar [chaijs.com](https://chaijs.com).

- [guia de primeiros passos](https://chaijs.com/guide)
- [referência de api](https://chaijs.com/api)
- [plugins](https://chaijs.com/plugins)

alternativamente, a [wiki](https://github.com/chaijs/chai/wiki) pode ser o que você está procurando.

- [guia de estilo de codificação chai](https://github.com/chaijs/chai/wiki/Chai-Coding-Style-Guide)
- [recursos de terceiros](https://github.com/chaijs/chai/wiki/Third-Party-Resources)

ou, finalmente, você pode encontrar um colaborador principal ou um desenvolvedor com ideias semelhantes em qualquer um dos nossos canais de suporte.

- irc: `irc.freenode.org #chaijs`
- [lista de discussão / google group](https://groups.google.com/forum/#!forum/chaijs)

### colaboradores core

sinta-se à vontade para entrar em contato com qualquer um dos principais colaboradores caso tenha dúvidas ou preocupações. faremos o possível para responder o mais rápido possível.

- jake luer
    - gh: [@logicalparadox](https://github.com/logicalparadox)
    - tw: [@jakeluer](http://x.com/jakeluer)
    - irc: logicalparadox
- veselin todorov
    - gh: [@vesln](https://github.com/vesln)
    - tw: [@vesln](http://x.com/vesln)
    - irc: vesln
- keith cirkel
    - gh: [@keithamus](https://github.com/keithamus)
    - tw: [@keithamus](http://x.com/keithamus)
    - irc: keithamus
- lucas fernandes da costa
    - gh: [@lucasfcosta](https://github.com/lucasfcosta)
    - tw: [@lfernandescosta](http://x.com/lfernandescosta)
    - irc: lucasfcosta

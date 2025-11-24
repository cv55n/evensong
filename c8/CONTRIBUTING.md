# contribuindo para o `c8`

o projeto `c8` acolhe todas as contribuições de qualquer pessoa disposta a trabalhar de boa fé com outros colaboradores e com a comunidade. nenhuma contribuição é pequena demais e todas são valorizadas.

## issues

- você pode abrir as issues [aqui](https://github.com/bcoe/c8/issues), por favor siga a guia de template.

## pull requests

os pull requests são a forma de realizar alterações concretas no código, na documentação, nas dependências e nas ferramentas contidas no repositório `c8`.

### configurando seu ambiente local

1. certifique-se de ter instalado a versão mais recente do node.js

2. faça um fork desse projeto no github e clone seu fork localmente:

```
git clone git@github.com:username/c8.git
cd c8
git remote add upstream https://github.com/bcoe/c8.git
git fetch upstream
```

3. crie branches locais para trabalhar. elas também devem ser criadas diretamente a partir da branch principal:

```
git checkout -b my-branch -t upstream/main
```

4. faça suas mudanças

5. rode os testes para ver se está tudo correto (tudo deve passar exceto o snapshot):

```
npm test
```

6. atualize o snapshot:

```
npm run test:snap
```

7. caso tudo esteja passando, realize suas mudanças.

8. como boa prática, após confirmar suas alterações, é recomendável usar o comando `git rebase` (e não `git merge`) para sincronizar seu trabalho com o repositório principal:

```
git fetch upstream
git rebase upstream/main
```

9. execute os testes novamente para garantir que tudo esteja correto.

10. push:

```
npm test
```

11. abra a solicitação de pull request e veja os detalhes no modelo.

12. faça as alterações necessárias após a revisão.

## nota

esse guia é adaptado do projeto [node.js](https://github.com/nodejs/node/blob/main/doc/contributing/pull-requests.md), veja mais para mais detalhes.

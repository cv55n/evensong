# process

`require('process');` assim como qualquer outro módulo.

funciona no `node.js` e em navegadores via o shim `browser.js` fornecido com o módulo.

## implementação ao navegador

o objetivo deste módulo não é ser uma alternativa completa ao módulo de processo integrado. este módulo existe principalmente para fornecer a funcionalidade `nexttick` e pouco mais. mantemos este módulo enxuto porque ele costuma ser incluído por padrão por ferramentas como o browserify quando detecta que um módulo usou o `process` global.

ele também expõe um membro "browser" (ou seja, ``process.browser``), que é `true` nesta implementação, mas `undefined` no node. isso pode ser usado em código isomórfico que ajusta seu comportamento dependendo do ambiente em que está sendo executado.

se você deseja fornecer outros métodos de processo, sugiro que você os aplique no processo global do seu aplicativo. uma lista de patches criados pelos usuários está abaixo.

- [hrtime](https://github.com/kumavis/browser-process-hrtime)
- [stdout](https://github.com/kumavis/browser-stdout)

## notas do gerenciador de pacote

se você estiver escrevendo um empacotador para empacotar módulos para uso do lado do cliente, certifique-se de usar a dica de campo `browser` em `package.json`.

veja https://gist.github.com/4339901 para mais detalhes.

o módulo [browserify](https://github.com/substack/node-browserify) tratará corretamente esse campo ao agrupar seus arquivos.

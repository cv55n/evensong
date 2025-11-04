[![banner do prettier](https://unpkg.com/prettier-logo@1.0.3/images/prettier-banner-light.svg)](https://prettier.io)

<h2 align="center">formatador de código com opiniões próprias</h2>

<p align="center">
    <em>
        javascript
        . typescript
        . flow
        . jsx
        . json
    </em>
    <br>
    <em>
        css
        . scss
        . less
    </em>
    <br>
    <em>
        html
        . vue
        . angular
    </em>
    <br>
    <em>
        graphql
        . markdown
        . yaml
    </em>
    <br>
    <em>
        <a href="https://prettier.io/docs/plugins">
            sua linguagem favorita?
        </a>
    </em>
</p>

<p align="center">
    <a href="https://github.com/prettier/prettier/actions?query=branch%3Amain">
        <img alt="status de ci" src="https://img.shields.io/github/check-runs/prettier/prettier/main?style=flat-square&label=ci">
    </a>
    <a href="https://codecov.io/gh/prettier/prettier">
        <img alt="Coverage Status" src="https://img.shields.io/codecov/c/github/prettier/prettier.svg?style=flat-square">
    </a>
    <a href="https://x.com/acdlite/status/974390255393505280">
        <img alt="Blazing Fast" src="https://img.shields.io/badge/speed-blazing%20%F0%9F%94%A5-brightgreen.svg?style=flat-square">
    </a>
    <br>
    <a href="https://www.npmjs.com/package/prettier">
        <img alt="npm version" src="https://img.shields.io/npm/v/prettier.svg?style=flat-square">
    </a>
    <a href="https://www.npmjs.com/package/prettier">
        <img alt="downloads semanais do npm" src="https://img.shields.io/npm/dw/prettier.svg?style=flat-square">
    </a>
    <a href="https://github.com/prettier/prettier#badge">
        <img alt="code style: prettier" src="https://img.shields.io/badge/estilo_de_código-prettier-ff69b4.svg?style=flat-square">
    </a>
    <a href="https://x.com/intent/follow?screen_name=PrettierCode">
        <img alt="Follow Prettier on X" src="https://img.shields.io/badge/%40prettiercode-9f9f9f?style=flat-square&logo=x&labelColor=555">
    </a>
</p>

## intro

o prettier é um formatador de código com estilo próprio. ele impõe um estilo consistente analisando o código e reimprimindo-o com suas próprias regras, que levam em consideração o comprimento máximo da linha e quebram o código quando necessário.

### input

<!-- prettier-ignore -->

```js
foo(reallyLongArg(), omgSoManyParameters(), IShouldRefactorThis(), isThereSeriouslyAnotherOne());
```

### output

```js
foo(
    reallyLongArg(),
    omgSoManyParameters(),
    IShouldRefactorThis(),
    isThereSeriouslyAnotherOne()
);
```

o prettier pode ser executado [no seu editor](https://prettier.io/docs/editors) ao salvar, em um [gancho de pré-commit](https://prettier.io/docs/precommit) ou em [ambientes de ci](https://prettier.io/docs/cli#list-different) para garantir que sua base de código tenha um estilo consistente, sem que os desenvolvedores precisem postar comentários minuciosos em revisões de código nunca mais.

---

**[documentação](https://prettier.io/docs)**

[instalação](https://prettier.io/docs/install) .
[opções](https://prettier.io/docs/options) .
[cli](https://prettier.io/docs/cli) .
[api](https://prettier.io/docs/api)

**[playground](https://prettier.io/playground)**

---

## badge

mostre ao mundo que você está usando o _prettier_ → [![estilo de código: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

```md
[![estilo de código: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
```

## contribuindo

veja [contributing.md](CONTRIBUTING.md).

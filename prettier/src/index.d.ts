// copiado de `@types/prettier`
//
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/5bb07fc4b087cb7ee91084afa6fe750551a7bbb1/types/prettier/index.d.ts

// versão typescript mínima: 4.2

// adicione `export {}` aqui para desativar a exportação
// automática de index.d.ts. existem vários tipos de
// utilitários aqui que não precisam ser distribuídos com o
// módulo exportado

export {};

import {
    builders,
    printer,
    utils
} from "./document/public.js";

export namespace doc {
    export {
        builders,
        printer,
        utils
    };
}

// esta ferramenta serve para lidar com o caso em que você tem
// uma união explícita entre literais de string e o tipo
// string genérico. normalmente, ela seria resolvida apenas
// com o tipo string, mas esta literalunion genérica mantém o
// intellisense da união original
//
// isso vem desse erro: microsoft/typescript#29729:
//
// https://github.com/microsoft/TypeScript/issues/29729#issuecomment-700527227

export type LiteralUnion<T extends U, U = string> =
    | T
    | (Pick<U, never> & { _?: never | undefined });

export type AST = any;
export type Doc = doc.builders.Doc;

// o tipo de elementos que compõem o array t fornecido
type ArrayElement<T> = T extends Array<infer E> ? E : never;

// uma união das propriedades do objeto dado que são arrays
type ArrayProperties<T> = {
    [K in keyof T]: NonNullable<T[K]> extends readonly any[] ? K : never;
}[keyof T];

// uma união das propriedades do array t fornecido que pode
// ser usada para indexá-lo. se o array for uma tupla, serão
// os índices explícitos do array; caso contrário, serão
// apenas números
type IndexProperties<T extends { length: number }> =
    IsTuple<T> extends true ? Exclude<Partial<T>["length"], T["length"]> : number;

// na prática, executa t[p], exceto que está informando ao
// typescript que é seguro fazer isso para tuplas, arrays ou
// objetos
type IndexValue<T, P> = T extends any[]
    ? P extends number
        ? T[P]
        : never
    : P extends keyof T
        ? T[P]
        : never;

// determina se um objeto t é uma matriz como string[] (caso
// em que isso resulta em falso) ou uma tupla como [string]
// (caso em que isso resulta em verdadeiro)
//
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type IsTuple<T> = T extends []
    ? true
    : T extends [infer First, ...infer Remain]
        ? IsTuple<Remain>
        : false;

type CallProperties<T> = T extends any[]
    ? IndexProperties<T>
    : keyof T;

type IterProperties<T> = T extends any[]
    ? IndexProperties<T>
    : ArrayProperties<T>;

type CallCallback<T, U> = (
    path: AstPath<T>,
    index: number,
    value: any
) => U;

type EachCallback<T> = (
    path: AstPath<ArrayElement<T>>,
    index: number,
    value: any
) => void;

type MapCallback<T, U> = (
    path: AstPath<ArrayElement<T>>,
    index: number,
    value: any
) => U;

// https://github.com/prettier/prettier/blob/next/src/common/ast-path.js
export class AstPath<T = any> {
    constructor(value: T);

    get key(): string | null;
    get index(): number | null;
    get node(): T;
    get parent(): T | null;
    get grandparent(): T | null;
    get isInArray(): boolean;
    get siblings(): T[] | null;
    get next(): T | null;
    get previous(): T | null;
    get isFirst(): boolean;
    get isLast(): boolean;
    get isRoot(): boolean;
    get root(): T;
    get ancestors(): T[];

    stack: T[];

    callParent<U>(callback: (path: this) => U, count?: number): U;

    /**
     * @deprecated utilizar `astpath#key` ou `astpath#index`
     */
    getName(): PropertyKey | null;

    /**
     * @deprecated utilizar `astpath#node` ou `astpath#siblings`
     */
    getValue(): T;

    getNode(count?: number): T | null;
    getParentNode(count?: number): T | null;

    match(
        ...predicates: Array<(
            node: any,
            
            name: string | null,
            number: number | null
        ) => boolean>
    ): boolean;

    // para cada uma das funções de busca na árvore (call,
    // each e map), isso fornece 5 assinaturas de tipo
    // estritas, juntamente com uma alternativa no final,
    // caso você acabe chamando propriedades em mais de 5
    // níveis de profundidade. isso ajuda bastante na tipagem,
    // porque na maioria dos casos você está chamando menos de
    // 5 propriedades, então as funções de busca na árvore têm
    // uma compreensão mais clara do que você está fazendo
    //
    // note que a resolução desses tipos é um tanto complicada
    // e só passou a ser suportada a partir do typescript 4.2
    // (antes disso, o programa simplesmente informava que a
    // instanciação do tipo era excessivamente profunda e
    // possivelmente infinita)

    call<U>(
        callback: CallCallback<T, U>
    ): U;
    
    call<U, P1 extends CallProperties<T>>(
        callback: CallCallback<IndexValue<T, P1>, U>,

        prop1: P1
    ): U;

    call<U, P1 extends keyof T, P2 extends CallProperties<T[P1]>>(
        callback: CallCallback<IndexValue<IndexValue<T, P1>, P2>, U>,
        
        prop1: P1,
        prop2: P2
    ): U;

    call<U, P1 extends keyof T, P2 extends CallProperties<T[P1]>, P3 extends CallProperties<IndexValue<T[P1], P2>>>(
        callback: CallCallback<IndexValue<IndexValue<IndexValue<T, P1>, P2>, P3>, U>,

        prop1: P1,
        prop2: P2,
        prop3: P3
    ): U;

    call<U, P1 extends keyof T, P2 extends CallProperties<T[P1]>, P3 extends CallProperties<IndexValue<T[P1], P2>>, P4 extends CallProperties<IndexValue<IndexValue<T[P1], P2>, P3>>>(
        callback: CallCallback<IndexValue<IndexValue<IndexValue<IndexValue<T, P1>, P2>, P3>, P4>, U>,

        prop1: P1,
        prop2: P2,
        prop3: P3,
        prop4: P4
    ): U;

    call<U, P extends PropertyKey>(
        callback: CallCallback<any, U>,

        prop1: P,
        prop2: P,
        prop3: P,
        prop4: P,
        
        ...props: P[]
    ): U;

    each(callback: EachCallback<T>): void;

    each<P1 extends IterProperties<T>>(
        callback: EachCallback<IndexValue<T, P1>>,

        prop1: P1
    ): void;

    each<P1 extends keyof T, P2 extends IterProperties<T[P1]>>(
        callback: EachCallback<IndexValue<IndexValue<T, P1>, P2>>,
        
        prop1: P1,
        prop2: P2
    ): void;

    each<
        P1 extends keyof T,
        P2 extends IterProperties<T[P1]>,
        P3 extends IterProperties<IndexValue<T[P1], P2>>
    >(
        callback: EachCallback<IndexValue<IndexValue<IndexValue<T, P1>, P2>, P3>>,
        
        prop1: P1,
        prop2: P2,
        prop3: P3
    ): void;

    each<
        P1 extends keyof T,
        P2 extends IterProperties<T[P1]>,
        P3 extends IterProperties<IndexValue<T[P1], P2>>,
        P4 extends IterProperties<IndexValue<IndexValue<T[P1], P2>, P3>>
    >(
        callback: EachCallback<IndexValue<IndexValue<IndexValue<IndexValue<T, P1>, P2>, P3>, P4>>,

        prop1: P1,
        prop2: P2,
        prop3: P3,
        prop4: P4
    ): void;

    each(
        callback: EachCallback<any[]>,

        prop1: PropertyKey,
        prop2: PropertyKey,
        prop3: PropertyKey,
        prop4: PropertyKey,
        
        ...props: PropertyKey[]
    ): void;

    map<U>(callback: MapCallback<T, U>): U[];

    map<U, P1 extends IterProperties<T>>(
        callback: MapCallback<IndexValue<T, P1>, U>,

        prop1: P1
    ): U[];

    map<U, P1 extends keyof T, P2 extends IterProperties<T[P1]>>(
        callback: MapCallback<IndexValue<IndexValue<T, P1>, P2>, U>,
        
        prop1: P1,
        prop2: P2
    ): U[];

    map<
        U,
        P1 extends keyof T,
        P2 extends IterProperties<T[P1]>,
        P3 extends IterProperties<IndexValue<T[P1], P2>>
    >(
        callback: MapCallback<IndexValue<IndexValue<IndexValue<T, P1>, P2>, P3>, U>,

        prop1: P1,
        prop2: P2,
        prop3: P3
    ): U[];

    map<
        U,
        P1 extends keyof T,
        P2 extends IterProperties<T[P1]>,
        P3 extends IterProperties<IndexValue<T[P1], P2>>,
        P4 extends IterProperties<IndexValue<IndexValue<T[P1], P2>, P3>>
    >(
        callback: MapCallback<IndexValue<IndexValue<IndexValue<IndexValue<T, P1>, P2>, P3>, P4>, U>,
        
        prop1: P1,
        prop2: P2,
        prop3: P3,
        prop4: P4
    ): U[];

    map<U>(
        callback: MapCallback<any[], U>,

        prop1: PropertyKey,
        prop2: PropertyKey,
        prop3: PropertyKey,
        prop4: PropertyKey,

        ...props: PropertyKey[]
    ): U[];
}

/** @deprecated `fastpath` foi renomeado para `astpath` */
export type FastPath<T = any> = AstPath<T>;

export type BuiltInParser = (text: string, options?: any) => AST;

export type BuiltInParserName =
    | "acorn"
    | "angular"
    | "babel-flow"
    | "babel-ts"
    | "babel"
    | "css"
    | "espree"
    | "flow"
    | "glimmer"
    | "graphql"
    | "html"
    | "json-stringify"
    | "json"
    | "json5"
    | "jsonc"
    | "less"
    | "lwc"
    | "markdown"
    | "mdx"
    | "meriyah"
    | "mjml"
    | "scss"
    | "typescript"
    | "vue"
    | "yaml";

export type BuiltInParsers = Record<BuiltInParserName, BuiltInParser>;

/**
 * para utilizar em
 * 
 * - `.prettierrc.js`
 * - `.prettierrc.ts`
 * - `.prettierrc.cjs`
 * - `.prettierrc.cts`
 * - `.prettierrc.mjs`
 * - `.prettierrc.mts`
 * - `.prettier.config.js`
 * - `.prettier.config.ts`
 * - `.prettier.config.cjs`
 * - `.prettier.config.cts`
 * - `.prettier.config.mjs`
 * - `.prettier.config.mts`
 */
export interface Config extends Options {
    overrides?: Array<{
        files: string | string[];
        excludeFiles?: string | string[];
        
        options?: Options;
    }>;
}

export interface Options extends Partial<RequiredOptions> {}

export interface RequiredOptions extends doc.printer.Options {
    /**
     * imprime ponto e vírgula no final das frases
     * 
     * @default true
     */
    semi: boolean;

    /**
     * usa aspas simples em vez de aspas duplas
     * 
     * @default false
     */
    singleQuote: boolean;

    /**
     * usa aspas simples em jsx
     * 
     * @default false
     */
    jsxSingleQuote: boolean;

    /**
     * imprime as vírgulas finais sempre que possível
     * 
     * @default "all"
     */
    trailingComma: "none" | "es5" | "all";

    /**
     * imprime espaços entre colchetes em literais de objeto
     * 
     * @default true
     */
    bracketSpacing: boolean;

    /**
     * como encapsular literais de objeto
     * 
     * @default "preserve"
     */
    objectWrap: "preserve" | "collapse";

    /**
     * coloca o ">" de um elemento html (html, jsx, vue,
     * angular) de várias linhas no final da última linha,
     * em vez de deixá-lo sozinho na linha seguinte (isso não
     * se aplica a elementos de fechamento automático)
     * 
     * @default false
     */
    bracketSameLine: boolean;

    /**
     * formata apenas um segmento de um arquivo
     * 
     * @default 0
     */
    rangeStart: number;

    /**
     * formata apenas um segmento de um arquivo
     * 
     * @default Number.POSITIVE_INFINITY
     */
    rangeEnd: number;

    /**
     * especifica qual parser utilizar
     */
    parser: LiteralUnion<BuiltInParserName>;

    /**
     * especifica o caminho do arquivo de entrada. isso será
     * utilizado para realizar a inferência do parser
     */
    filepath: string;

    /**
     * o prettier pode restringir-se a formatar apenas
     * arquivos que contenham um comentário especial, chamado
     * pragma, no início do arquivo. isso é muito útil ao
     * migrar gradualmente grandes bases de código não
     * formatadas para o prettier
     * 
     * @default false
     */
    requirePragma: boolean;

    /**
     * o prettier pode inserir um marcador especial `@format`
     * no início dos arquivos, especificando que o arquivo foi
     * formatado com o prettier. isso funciona bem quando
     * usado em conjunto com a opção `--require-pragma`. se já
     * houver um bloco de documentação (docblock) no início do
     * arquivo, essa opção adicionará uma nova linha a ele com
     * o marcador `@format`
     * 
     * @default false
     */
    insertPragma: boolean;

    /**
     * o prettier permite que arquivos individuais optem por
     * não serem formatados se contiverem um comentário
     * especial, chamado pragma, no início do arquivo
     * 
     * @default false
     */
    checkIgnorePragma: boolean;

    /**
     * por padrão, o prettier quebra o texto markdown como
     * está, já que alguns serviços usam um renderizador
     * sensível a quebras de linha. em alguns casos, você pode
     * preferir usar a quebra automática de linha do
     * editor/visualizador, e essa opção permite que você a
     * desative
     * 
     * @default "preserve"
     */
    proseWrap: "always" | "never" | "preserve";

    /**
     * inclui parênteses em torno de um único parâmetro de
     * função de seta
     * 
     * @default "always"
     */
    arrowParens: "avoid" | "always";

    /**
     * fornece suporte a novos idiomas pro prettier
     */
    plugins: Array<string | URL | Plugin>;

    /**
     * como lidar com espaços em branco em html
     * 
     * @default "css"
     */
    htmlWhitespaceSensitivity: "css" | "strict" | "ignore";

    /**
     * quais caracteres de fim de linha aplicar
     * 
     * @default "lf"
     */
    endOfLine: "auto" | "lf" | "crlf" | "cr";

    /**
     * altera quando as propriedades dos objetos são colocadas
     * entre aspas
     * 
     * @default "as-needed"
     */
    quoteProps: "as-needed" | "consistent" | "preserve";

    /**
     * define se o código dentro das tags <script> e <style>
     * em arquivos vue deve ou não ser indentado
     * 
     * @default false
     */
    vueIndentScriptAndStyle: boolean;
}
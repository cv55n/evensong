import { CursorOptions, CursorResult, Options, SupportInfo } from "./index.js";

/**
 * formatwithcursor, ambas as funções formatam o código e
 * traduzem a posição do cursor de código não formatado para
 * código formatado. isso é útil para integrações com editores,
 * para evitar que o cursor se mova quando o código estiver
 * sendo formatado
 * 
 * a opção cursoroffset deve ser fornecida para especificar a
 * posição do cursor
 * 
 * ```js
 * await prettier.formatwithcursor(" 1", {
 *     cursoroffset: 2,
 *     parser: "babel"
 * });
 * ```
 * 
 * `-> { formatted: "1;\n", cursoroffset: 1 }`
 */
export function formatWithCursor(
    source: string,
    options: CursorOptions
): Promise<CursorResult>;

/**
 * `format` é utilizado para formatar texto usando o prettier.
 * [opções](https://prettier.io/docs/options) podem ser
 * fornecidas para substituir os valores padrão
 */
export function format(source: string, options?: Options): Promise<string>;

/**
 * `check` verifica se o arquivo foi formatado com o prettier,
 * dadas essas opções, e retorna um valor booleano. isso é
 * semelhante ao parâmetro `--list-different` na cli e é útil
 * para executar o prettier em cenários de ci
 */
export function check(source: string, options?: Options): Promise<boolean>;

/**
 * retorna um objeto que representa os analisadores sintáticos,
 * linguagens e tipos de arquivo que o prettier suporta na
 * versão atual
 */
export function getSupportInfo(): Promise<SupportInfo>;
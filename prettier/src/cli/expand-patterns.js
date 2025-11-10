import path from "node:path";

import { directoryIgnorerWithNodeModules, directoryIgnorerWithoutNodeModules } from "./directory-ignorer.js";
import { fastGlob } from "./prettier-internal.js";
import { lstatSafe, normalizeToPosix } from "./utils.js";

/** @import {Context} from './context.js' */

/**
 * @param {Context} context
 */
async function* expandPatterns(context) {
    const seen = new Set();

    let noResults = true;

    for await (const { filePath, ignoreUnknown, error } of expandPatternsInternal(context)) {
        noResults = false;

        if (error) {
            yield { error };

            continue;
        }

        const filename = path.resolve(filePath);

        // filtrar duplicatas
        if (seen.has(filename)) {
            continue;
        }

        seen.add(filename);

        yield {
            filename,
            ignoreUnknown
        };
    }

    if (noResults && context.argv.errorOnUnmatchedPattern !== false) {
        // se não houver arquivos nem outros erros, gerar
        // um erro genérico

        yield {
            error: `nenhum arquivo correspondente. patterns: ${context.filePatterns.join(" ")}`
        };
    }
}

/**
 * @param {Context} context
 */
async function expandPatternsInternal(context) {
    const directoryIgnorer = context.argv.withNodeModules === true
        ? directoryIgnorerWithoutNodeModules
        : directoryIgnorerWithNodeModules;

    const globOptions = {
        dot: true,

        ignore: [
            ...directoryIgnorer.ignorePatterns
        ],

        followSymbolicLinks: false
    };

    const cwd = process.cwd();

    /** @type {Array<{ type: 'file' | 'dir' | 'glob'; glob: string; input: string; }>} */
    const entries = [];

    for (const pattern of context.filePatterns) {
        const absolutePath = path.resolve(pattern);

        if (directoryIgnorer.shouldIgnore(absolutePath)) {
            continue;
        }

        const stat = await lstatSafe(absolutePath);

        if (stat) {
            if (stat.isSymbolicLink()) {
                if (context.argv.errorOnUnmatchedPattern !== false) {
                    yield {
                        error: `pattern explicitamente especificada "${pattern}" é um link simbólico.`
                    };
                } else {
                    context.logger.debug(
                        `pulando a pattern "${pattern}", por se tratar de um link simbólico.`
                    );
                }
            } else if (stat.isFile()) {
                entries.push({
                    type: "file",
                    glob: escapePathForGlob(fixWindowsSlashes(pattern)),
                    input: pattern
                });
            } else if (stat.isDirectory()) {
                /**
                 * 1. remover a barra final `/`, o `fast-glob` não
                 * consegue encontrar arquivos para a pattern `src//*.js`
                 * 
                 * 2. limpar diretório, quando o padrão glob `src/../*.js`
                 * com `fast-glob`, ele retorna arquivos como 'src/../index.js'
                 */
                const relativePath = path.relative(cwd, absolutePath) || ".";
                const prefix = escapePathForGlob(fixWindowsSlashes(relativePath));

                entries.push({
                    type: "dir",
                    glob: `${prefix}/**/*`,
                    input: pattern,
                    ignoreUnknown: true
                });
            }
        } else if (pattern[0] === "!") {
            // converte patterns negativos em entradas `ignore`

            globOptions.ignore.push(fixWindowsSlashes(pattern.slice(1)));
        } else {
            entries.push({
                type: "glob",
                glob: fixWindowsSlashes(pattern),
                input: pattern
            });
        }
    }

    for (const { type, glob, input, ignoreUnknown } of entries) {
        let result;

        try {
            result = await fastGlob(glob, globOptions);
        } catch ({ message }) {
            /* c8 ignore próximas 6 linhas */

            yield {
                error: `${errorMessages.globError[type]}: "${input}".\n${message}`
            };

            continue;
        }

        if (result.length === 0) {
            if (context.argv.errorOnUnmatchedPattern !== false) {
                yield { error: `${errorMessages.emptyResults[type]}: "${input}".` };
            }
        } else {
            yield* sortPaths(result).map((filePath) => ({ filePath, ignoreUnknown }));
        }
    }
}

const errorMessages = {
    globError: {
        file: "não foi possível resolver o arquivo",
        dir: "não foi possível expandir o diretório",
        glob: "não foi possível expandir o padrão glob"
    },

    emptyResults: {
        file: "o arquivo explicitamente especificado foi ignorado devido a padrões glob negativos",
        dir: "nenhum arquivo compatível foi encontrado no diretório",
        glob: "nenhum arquivo encontrado corresponde ao padrão"
    }
};

/**
 * @param {string[]} paths
 */
function sortPaths(paths) {
    return paths.sort((a, b) => a.localeCompare(b));
}

/**
 * essa função deve ser substituída por `fastglob.escapepath`
 * quando esses problemas forem corrigidos:
 * 
 * - https://github.com/mrmlnc/fast-glob/issues/261
 * - https://github.com/mrmlnc/fast-glob/issues/262
 * 
 * @param {string} path
 */
function escapePathForGlob(path) {
    return fastGlob.escapePath(path.replaceAll("\\", "\0")) // fast-glob#262 (parte 1)
        .replaceAll(String.raw`\!`, "@(!)") // fast-glob#261
        .replaceAll("\0", String.raw`@(\\)`); // fast-glob#262 (parte 2)
}

/**
 * usar barras invertidas em padrões glob provavelmente não
 * é correto, mas não aceitar barras invertidas como separadores
 * de caminho no windows é ainda pior
 * 
 * https://github.com/prettier/prettier/pull/6776#discussion_r380723717
 * https://github.com/mrmlnc/fast-glob#how-to-write-patterns-on-windows
 */
const fixWindowsSlashes = normalizeToPosix;

export {
    expandPatterns
};
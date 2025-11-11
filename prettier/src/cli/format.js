import fs from "node:fs/promises";
import path from "node:path";
import getStdin from "get-stdin";

import { expandPatterns } from "./expand-patterns.js";
import { createIsIgnoredFunction, createTwoFilesPatch, errors, picocolors } from "./prettier-internal.js";
import { normalizeToPosix, statSafe } from "./utils.js";

import * as prettier from "../index.js";
import findCacheFile from "./find-cache-file.js";
import FormatResultsCache from "./format-results-cache.js";
import mockable from "./mockable.js";
import getOptionsForFile from "./options/get-options-for-file.js";

function diff(a, b) {
    return createTwoFilesPatch("", "", a, b, "", "", {
        context: 2
    });
}

class DebugError extends Error {
    name = "DebugError";
}

function handleError(context, filename, error, printedFilename, ignoreUnknown) {
    ignoreUnknown ||= context.argv.ignoreUnknown;

    const errorIsUndefinedParseError = error instanceof errors.UndefinedParserError;

    if (errorIsUndefinedParseError && ignoreUnknown) {
        // não consegue testar no ci, `istty` é sempre false,
        // ver comentários em `formatfiles`

        printedFilename?.clear();

        return true;
    }

    if (printedFilename) {
        // adiciona uma nova linha para separar os erros da
        // linha do nome do arquivo

        process.stdout.write("\n");
    }

    if (errorIsUndefinedParseError) {
        context.logger.error(error.message);

        process.exitCode = 2;

        return;
    }

    const isParseError = Boolean(error?.loc);

    const isValidationError = /^valor \S+ inválido\./u.test(error?.message);

    if (isParseError) {
        // `invalid.js: syntaxerror: token inesperado (1:1)`
        context.logger.error(`${filename}: ${String(error)}`);
    } else if (isValidationError || error instanceof errors.ConfigError) {
        // `valor printwidth inválido. esperava-se um integer, mas foi recebido 0.5`
        context.logger.error(error.message);

        // se a validação falhar para um arquivo, falhará para todos
        process.exit(1);
    } else if (error instanceof DebugError) {
        // `invalid.js: alguma mensagem de erro de debug`
        context.logger.error(`${filename}: ${error.message}`);
    } else {
        // `invalid.js: erro: algum erro inesperado\n[stack trace]`

        /* c8 ignore next */
        context.logger.error(filename + ": " + (error.stack || error));
    }

    // não encerrar o processo se um dos arquivos falhar
    process.exitCode = 2;
}

function writeOutput(context, result, options) {
    // não utilizar `console.log` aqui, pois ele adiciona uma
    // nova linha extra no final

    process.stdout.write(
        context.argv.debugCheck ? result.filepath : result.formatted
    );

    if (options && options.cursorOffset >= 0) {
        process.stderr.write(result.cursorOffset + "\n");
    }
}

async function listDifferent(context, input, options, filename) {
    if (!context.argv.check && !context.argv.listDifferent) {
        return;
    }

    try {
        if (!(await prettier.check(input, options)) && !context.argv.write) {
            context.logger.log(filename);

            process.exitCode = 1;
        }
    } catch (error) {
        context.logger.error(error.message);
    }

    return true;
}

async function format(context, input, opt) {
    if (context.argv.debugPrintDoc) {
        const doc = await prettier.__debug.printToDoc(input, opt);

        return {
            formatted: (await prettier.__debug.formatDoc(doc)) + "\n"
        };
    }

    if (context.argv.debugPrintComments) {
        return {
            formatted: await prettier.format(
                JSON.stringify(
                    (await prettier.formatWithCursor(input, opt)).comments || []
                ), {
                    parser: "json"
                }
            )
        };
    }

    if (context.argv.debugPrintAst) {
        const { ast } = await prettier.__debug.parse(input, opt);

        return {
            formatted: JSON.stringify(ast)
        };
    }

    if (context.argv.debugCheck) {
        const pp = await prettier.format(input, opt);
        const pppp = await prettier.format(pp, opt);

        if (pp !== pppp) {
            throw new DebugError(
                "prettier(input) !== prettier(prettier(input))\n" + diff(pp, pppp)
            );
        } else {
            const stringify = (obj) => JSON.stringify(obj, null, 2);

            const ast = stringify(
                (await prettier.__debug.parse(input, opt, {
                    message: true
                })).ast
            );

            const past = stringify(
                (await prettier.__debug.parse(pp, opt, {
                    message: true
                })).ast
            );

            /* c8 ignore start */

            if (ast !== past) {
                const MAX_AST_SIZE = 2097152; // 2mb

                const astDiff = ast.length > MAX_AST_SIZE || past.length > MAX_AST_SIZE
                    ? "diferença na ast muito grande para renderizar"
                    : diff(ast, past);

                throw new DebugError(
                    "ast(input) !== ast(prettier(input))\n" + astDiff + "\n" + diff(input, pp)
                );
            }

            /* c8 ignore end */
        }

        return {
            formatted: pp,
            filepath: opt.filepath || "(stdin)\n"
        };
    }

    const { performanceTestFlag } = context;

    if (performanceTestFlag?.debugBenchmark) {
        let Bench;

        try {
            ({ Bench } = await import("tinybench"));
        } catch {
            context.logger.debug(
                "'--debug-benchmark' requer o pacote 'tinybench' para ser instalado."
            );

            process.exit(2);
        }

        context.logger.debug(
            "opção '--debug-benchmark' encontrada, medindo formatwithcursor com o módulo 'tinybench'."
        );

        const bench = new Bench();

        bench.add("formatar", () => prettier.formatWithCursor(input, opt));

        await bench.run();

        const [result] = bench.table();

        context.logger.debug(
            "medições '--debug-benchmark' para formatwithcursor: " + JSON.stringify(result, undefined, 2)
        );
    } else if (performanceTestFlag?.debugRepeat) {
        const repeat = performanceTestFlag.debugRepeat;

        context.logger.debug(
            `'${performanceTestFlag.name}' encontrado, rodando formatwithcursor ${repeat} vezes.`
        );

        const start = mockable.getTimestamp();

        for (let i = 0; i < repeat; ++i) {
            await prettier.formatWithCursor(input, opt);
        }

        const averageMs = (mockable.getTimestamp() - start) / repeat;

        const results = {
            repeat,

            hz: 1000 / averageMs,
            ms: averageMs
        };

        context.logger.debug(
            `medições '${performanceTestFlag.name}' para formatwithcursor: ${JSON.stringify(results, null, 2)}`
        );
    }

    return prettier.formatWithCursor(input, opt);
}

async function createIsIgnoredFromContextOrDie(context) {
    try {
        return await createIsIgnoredFunction(
            context.argv.ignorePath,
            context.argv.withNodeModules
        );
    } catch (e) {
        context.logger.error(e.message);

        process.exit(2);
    }
}

async function formatStdin(context) {
    const { filepath } = context.argv;

    try {
        const input = await getStdin();

        // todo[@fisker]: deixar caso não tenha nenhum input
        // `prettier --config-precedence cli-override`

        const absoluteFilepath = filepath ? path.resolve(filepath) : undefined;

        let isFileIgnored = false;

        if (absoluteFilepath) {
            const isIgnored = await createIsIgnoredFromContextOrDie(context);

            isFileIgnored = isIgnored(absoluteFilepath);
        }

        if (isFileIgnored) {
            writeOutput(context, { formatted: input });

            return;
        }

        const options = {
            ...(await getOptionsForFile(context, absoluteFilepath)),

            // `getoptionsforfile` encaminha `--stdin-filepath` diretamente, que pode ser um path relativo
            filepath: absoluteFilepath
        };

        if (await listDifferent(context, input, options, "(stdin)")) {
            return;
        }

        const formatted = await format(context, input, options);

        const { performanceTestFlag } = context;

        if (performanceTestFlag) {
            context.logger.log(
                `opção '${performanceTestFlag.name}' encontrada, o código de impressão na tela foi ignorado.`
            );

            return;
        }

        writeOutput(context, formatted, options);
    } catch (error) {
        handleError(context, filepath || "stdin", error);
    }
}

async function formatFiles(context) {
    // isso será usado para filtrar os paths dos arquivos após
    // a verificação do padrão glob, antes que qualquer
    // arquivo seja efetivamente gravado

    const isIgnored = await createIsIgnoredFromContextOrDie(context);
    const cwd = process.cwd();

    let numberOfUnformattedFilesFound = 0;
    let numberOfFilesWithError = 0;

    const { performanceTestFlag } = context;

    if (context.argv.check && !performanceTestFlag) {
        context.logger.log("checando formatação...");
    }

    let formatResultsCache;

    const cacheFilePath = await findCacheFile(context.argv.cacheLocation);

    if (context.argv.cache) {
        formatResultsCache = new FormatResultsCache(cacheFilePath, context.argv.cacheStrategy || "content");
    } else if (!context.argv.cacheLocation) {
        const stat = await statSafe(cacheFilePath);

        if (stat) {
            await fs.unlink(cacheFilePath);
        }
    }

    // algumas pipelines de ci reportam incorretamente o status
    // process.stdout.istty, o que causa linhas indesejadas na
    // saída. uma verificação adicional de isci() ajuda a
    // resolver o problema
    //
    // veja: https://github.com/prettier/prettier/issues/5801

    const isTTY = mockable.isStreamTTY(process.stdout) && !mockable.isCI();

    for await (const { error, filename, ignoreUnknown } of expandPatterns(context)) {
        if (error) {
            context.logger.error(error);

            // não deixar, mas setar o código de saída para 2
            process.exitCode = 2;

            continue;
        }

        const isFileIgnored = isIgnored(filename);

        if (isFileIgnored && (context.argv.debugCheck ||
                              context.argv.write ||
                              context.argv.check ||
                              context.argv.listDifferent
        )) {
            continue;
        }

        const options = {
            ...(await getOptionsForFile(context, filename)),

            filepath: filename
        };

        const fileNameToDisplay = normalizeToPosix(path.relative(cwd, filename));

        let printedFilename;

        if (isTTY) {
            printedFilename = context.logger.log(fileNameToDisplay, {
                newline: false,
                clearable: true
            });
        }

        let input;

        try {
            input = await fs.readFile(filename, "utf8");
        } catch (error) {
            // adicionar uma nova linha pra separar os erros da
            // linha do nome do arquivo

            /* c8 ignore start */

            context.logger.log("");

            context.logger.error(
                `não foi possível ler "${fileNameToDisplay}":\n${error.message}`
            );

            // não deixar o processo caso um arquivo falhar
            process.exitCode = 2;

            continue;

            /* c8 ignore end */
        }

        if (isFileIgnored) {
            printedFilename?.clear();

            writeOutput(context, { formatted: input }, options);

            continue;
        }

        const start = mockable.getTimestamp();

        const isCacheExists = formatResultsCache?.existsAvailableFormatResultsCache(filename, options);

        let result;
        let output;

        try {
            if (isCacheExists) {
                result = { formatted: input };
            } else {
                result = await format(context, input, options);
            }

            output = result.formatted;
        } catch (error) {
            const errorIsIgnored = handleError(
                context,
                fileNameToDisplay,
                error,
                printedFilename,
                ignoreUnknown
            );

            if (!errorIsIgnored) {
                numberOfFilesWithError += 1;
            }

            continue;
        }

        const isDifferent = output !== input;

        let shouldSetCache = !isDifferent;

        // remover o nome do arquivo impresso anteriormente
        // pra registrá-lo com a duração

        printedFilename?.clear();

        if (performanceTestFlag) {
            context.logger.log(
                `opção '${performanceTestFlag.name}' encontrada, código de impressão ou arquivos gravados ignorados.`
            );

            return;
        }

        if (context.argv.write) {
            const timeToDisplay = `${Math.round(mockable.getTimestamp() - start)}ms`;

            // não escrever no arquivo se ele não for ser
            // alterado para não invalidar os caches baseados
            // em mtime

            if (isDifferent) {
                if (!context.argv.check && !context.argv.listDifferent) {
                    context.logger.log(`${fileNameToDisplay} ${timeToDisplay}`);
                }

                try {
                    await mockable.writeFormattedFile(filename, output);

                    // ativar cache se a formatação for bem-sucedida
                    shouldSetCache = true;
                } catch (error) {
                    context.logger.error(
                        `não foi possível escrever o arquivo "${fileNameToDisplay}":\n${error.message}`
                    );

                    // não deixar o processo caso um arquivo falhar
                    process.exitCode = 2;
                }
            } else if (!context.argv.check && !context.argv.listDifferent) {
                const message = `${picocolors.gray(fileNameToDisplay)} ${timeToDisplay} (inalterado)`;

                if (isCacheExists) {
                    context.logger.log(`${message} (armazenado em cache)`);
                } else {
                    context.logger.log(message);
                }
            }
        } else if (context.argv.debugCheck) {
            if (result.filepath) {
                context.logger.log(fileNameToDisplay);
            } else {
                /* c8 ignore next */
                process.exitCode = 2;
            }
        } else if (!context.argv.check && !context.argv.listDifferent) {
            writeOutput(context, result, options);
        }

        if (shouldSetCache) {
            formatResultsCache?.setFormatResultsCache(filename, options);
        } else {
            formatResultsCache?.removeFormatResultsCache(filename);
        }

        if (isDifferent) {
            if (context.argv.check) {
                context.logger.warn(fileNameToDisplay);
            } else if (context.argv.listDifferent) {
                context.logger.log(fileNameToDisplay);
            }

            numberOfUnformattedFilesFound += 1;
        }
    }

    formatResultsCache?.reconcile();

    // printar resumo da verificação com base no código de
    // saída esperado
    if (context.argv.check) {
        if (numberOfFilesWithError > 0) {
            const files = numberOfFilesWithError === 1
                ? "o arquivo acima"
                : `${numberOfFilesWithError} arquivos`;

            context.logger.log(`ocorreu um erro ao verificar o estilo do código em ${files}.`);
        } else if (numberOfUnformattedFilesFound === 0) {
            context.logger.log("todos os arquivos correspondentes usam o estilo de código prettier!");
        } else {
            const files = numberOfUnformattedFilesFound === 1
                ? "o arquivo acima"
                : `${numberOfUnformattedFilesFound} arquivos`;

            context.logger.warn(
                context.argv.write
                    ? `problemas de estilo de código foram corrigidos em ${files}.`
                    : `foram encontrados problemas de estilo de código em ${files}. rode o prettier com --write para corrigir.`
            );
        }
    }

    // garantindo que o código de saída seja diferente de zero
    // quando `--check/list-different` não for combinado com
    // `--write`

    if (
        (context.argv.check || context.argv.listDifferent) &&
        numberOfUnformattedFilesFound > 0 &&
        !process.exitCode &&
        !context.argv.write
    ) {
        process.exitCode = 1;
    }
}

export {
    formatFiles,
    formatStdin
};
import { formatFiles, formatStdin } from "./format.js";
import { parseArgvWithoutPlugins } from "./options/parse-cli-arguments.js";
import { createDetailedUsage, createUsage } from "./usage.js";
import { printToScreen } from "./utils.js";

import * as prettier from "../index.js";
import Context from "./context.js";
import logFileInfoOrDie from "./file-info.js";
import logResolvedConfigPathOrDie from "./find-config-path.js";
import createLogger from "./logger.js";
import mockable from "./mockable.js";
import printSupportInfo from "./print-support-info.js";

async function run(rawArguments = process.argv.slice(2)) {
    // criar um logger de nível padrão para que possamos
    // registrar erros durante a análise de `loglevel`

    let logger = createLogger();

    try {
        const { logLevel } = parseArgvWithoutPlugins(
            rawArguments,
            logger,
            "log-level"
        );

        if (logLevel !== logger.logLevel) {
            logger = createLogger(logLevel);
        }

        const context = new Context({ rawArguments, logger });

        await context.init();

        if (logger.logLevel !== "debug" && context.performanceTestFlag) {
            context.logger = createLogger("debug");
        }

        await main(context);
    } catch (error) {
        logger.error(error.message);

        process.exitCode = 1;
    }
}

async function main(context) {
    context.logger.debug(`argv normalizado: ${JSON.stringify(context.argv)}`);

    if (
        (context.argv.config === false && context.argv.__raw.config !== false) ||
        (context.argv.config && context.rawArguments.includes("--no-config"))
    ) {
        throw new Error("não é possível utilizar --no-config e --config juntos.");
    }

    if (context.argv.check && context.argv.listDifferent) {
        throw new Error("não é possível utilizar --check e --list-different juntos.");
    }

    if (context.argv.write && context.argv.debugCheck) {
        throw new Error("não é possível utilizar --write e --debug-check juntos.");
    }

    if (context.argv.findConfigPath && context.filePatterns.length > 0) {
        throw new Error("não é possível utilizar --find-config-path com múltiplos arquivos");
    }

    if (context.argv.fileInfo && context.filePatterns.length > 0) {
        throw new Error("não é possível utilizar --file-info com múltiplos arquivos");
    }

    if (!context.argv.cache && context.argv.cacheStrategy) {
        throw new Error("`--cache-strategy` não pode ser utilizado sem `--cache`.");
    }

    if (context.argv.version) {
        printToScreen(prettier.version);

        return;
    }

    if (context.argv.help !== undefined) {
        printToScreen(
            typeof context.argv.help === "string" && context.argv.help !== ""
                ? createDetailedUsage(context, context.argv.help)
                : createUsage(context),
        );

        return;
    }

    if (context.argv.supportInfo) {
        return printSupportInfo();
    }

    if (context.argv.findConfigPath) {
        await logResolvedConfigPathOrDie(context);

        return;
    }

    if (context.argv.fileInfo) {
        await logFileInfoOrDie(context);

        return;
    }

    const hasFilePatterns = context.filePatterns.length > 0;
    const useStdin = !hasFilePatterns && (!mockable.isStreamTTY(process.stdin) || context.argv.filepath);

    if (useStdin) {
        if (context.argv.cache) {
            throw new Error("`--cache` não pode ser usado ao formatar a entrada padrão (stdin).");
        }

        await formatStdin(context);

        return;
    }

    if (hasFilePatterns) {
        await formatFiles(context);

        return;
    }

    process.exitCode = 1;

    printToScreen(createUsage(context));
}

export { run };

// exposto para testes
export { mockable } from "./mockable.js";
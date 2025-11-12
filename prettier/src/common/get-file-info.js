import { resolveConfig } from "../config/resolve-config.js";
import { loadPlugins } from "../main/plugins/index.js";
import { isIgnored } from "../utils/ignore.js";
import inferParser from "../utils/infer-parser.js";

/**
 * @typedef {{ ignorePath?: string | URL | (string | URL)[], withNodeModules?: boolean, plugins: object, resolveConfig?: boolean }} FileInfoOptions
 * @typedef {{ ignored: boolean, inferredParser: string | null }} FileInfoResult
 */

/**
 * @param {string | URL} file
 * @param {FileInfoOptions} options
 * 
 * @returns {Promise<FileInfoResult>}
 * 
 * observar que prettier.getfileinfo() espera que
 * options.plugins seja um array de paths, não um objeto
 */
async function getFileInfo(file, options = {}) {
    if (typeof file !== "string" && !(file instanceof URL)) {
        throw new TypeError(
            `esperava-se que \`file\` fosse uma string ou url, mas recebeu-se \`${typeof file}\``
        );
    }

    let {
        ignorePath,
        withNodeModules
    } = options;

    // na api, é permitido um único `ignorepath`
    if (!Array.isArray(ignorePath)) {
        ignorePath = [ignorePath];
    }

    const ignored = await isIgnored(file, {
        ignorePath,
        withNodeModules
    });

    let inferredParser;

    if (!ignored) {
        inferredParser = options.parser ?? (await getParser(file, options));
    }

    return {
        ignored,
        inferredParser: inferredParser ?? null
    };
}

async function getParser(file, options) {
    let config;

    if (options.resolveConfig !== false) {
        config = await resolveConfig(file, {
            // não é necessário ler `.editorconfig`
            editorconfig: false
        });
    }

    if (config?.parser) {
        return config.parser;
    }

    const plugins = [
        ...options.plugins,

        ...(await loadPlugins(config?.plugins ?? []))
    ];

    return inferParser({ plugins }, { physicalFile: file });
}

export default getFileInfo;
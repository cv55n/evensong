/**
 * os seguintes itens estão agrupados aqui, pois também são
 * usados ​​na api
 * 
 * - fast-glob
 * - diff.createtwofilespatch
 * - leven.closestmatch
 * - picocolors
 */

import { createTwoFilesPatch } from "diff";
import { closestMatch as closetLevenshteinMatch } from "leven";

import fastGlob from "fast-glob";
import picocolors from "picocolors";
import * as vnopts from "vnopts";

import { mockable } from "./common/mockable.js";
import { clearCache as clearConfigCache, resolveConfig, resolveConfigFile } from "./config/resolve-config.js";
import { formatOptionsHiddenDefaults } from "./main/normalize-format-options.js";
import { clearCache as clearPluginCache, loadBuiltinPlugins, loadPlugins } from "./main/plugins/index.js";
import { getSupportInfo as getSupportInfoWithoutPlugins, normalizeOptionSettings } from "./main/support.js";
import { createIsIgnoredFunction } from "./utils/ignore.js";

import * as errors from "./common/errors.js";
import getFileInfoWithoutPlugins from "./common/get-file-info.js";
import * as core from "./main/core.js";
import normalizeOptions from "./main/normalize-options.js";
import * as optionCategories from "./main/option-categories.js";
import inferParserWithoutPlugins from "./utils/infer-parser.js";
import omit from "./utils/object-omit.js";
import createMockable from "./utils/create-mockable.js";

/**
 * @param {*} fn
 * @param {number} [optionsArgumentIndex]
 * 
 * @returns {*}
 */
function withPlugins(fn, optionsArgumentIndex = 1) {
    return async (...args) => {
        const options = args[optionsArgumentIndex] ?? {};

        const {
            plugins = []
        } = options;

        args[optionsArgumentIndex] = {
            ...options,

            plugins: (
                await Promise.all([
                    loadBuiltinPlugins(),

                    // todo: a versão independente permite que `plugins` sejam `prettierplugins`, que é um objeto; isso também deveria ser permitido
                    loadPlugins(plugins)
                ])
            ).flat()
        };

        return fn(...args);
    };
}

const formatWithCursor = withPlugins(core.formatWithCursor);

async function format(text, options) {
    const { formatted } = await formatWithCursor(text, {
        ...options,
    
        cursorOffset: -1
    });

    return formatted;
}

async function check(text, options) {
    return (await format(text, options)) === text;
}

// eslint-disable-next-line require-await
async function clearCache() {
    clearConfigCache();
    clearPluginCache();
}

/** @type {typeof getSupportInfoWithoutPlugins} */
const getSupportInfo = withPlugins(getSupportInfoWithoutPlugins, 0);

const inferParser = withPlugins((file, options) =>
    inferParserWithoutPlugins(options, {
        physicalFile: file
    })
);

const getFileInfo = withPlugins(getFileInfoWithoutPlugins);

// compartilhado internamente com o cli
const sharedWithCli = {
    errors,
    optionCategories,
    createIsIgnoredFunction,
    formatOptionsHiddenDefaults,
    normalizeOptions,
    getSupportInfoWithoutPlugins,
    normalizeOptionSettings,

    inferParser: (file, options) => Promise.resolve(options?.parser ?? inferParser(file, options)),
    
    vnopts: {
        ChoiceSchema: vnopts.ChoiceSchema,
        apiDescriptor: vnopts.apiDescriptor
    },
    
    fastGlob,
    createTwoFilesPatch,
    picocolors,
    closetLevenshteinMatch,
    
    utils: {
        omit,
        createMockable
    }
};

const debugApis = {
    parse: withPlugins(core.parse),
    formatAST: withPlugins(core.formatAst),
    formatDoc: withPlugins(core.formatDoc),
    printToDoc: withPlugins(core.printToDoc),
    printDocToString: withPlugins(core.printDocToString),
    
    // exposto para testes
    mockable
};

export {
    debugApis as __debug,
    sharedWithCli as __internal,
    check,
    clearCache as clearConfigCache,
    format,
    formatWithCursor,
    
    getFileInfo,
    getSupportInfo,

    resolveConfig,
    resolveConfigFile
};

export {
    default as version
} from "./main/version.evaluate.js";

export * as doc from "./document/public.js";
export * as util from "./utils/public.js";
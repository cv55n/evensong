// versão simples de `find-project-root`
//
// https://github.com/kirstein/find-project-root/blob/master/index.js

import { DirectorySearcher } from "search-closest";

import * as path from "node:path";

const DIRECTORIES = [
    ".git",
    ".hg"
];

/** @type {DirectorySearcher} */
let searcher;

/**
 * encontra o diretório que contém um diretório do sistema de
 * controle de versão
 * 
 * @param {string} startDirectory
 * @param {{shouldCache?: boolean}} options
 * 
 * @returns {Promise<string | undefined>}
 */
async function findProjectRoot(startDirectory, options) {
    searcher ??= new DirectorySearcher(DIRECTORIES, { allowSymlinks: false });

    const directory = await searcher.search(startDirectory, {
        cache: options.shouldCache
    });

    return directory ? path.dirname(directory) : undefined;
}

function clearFindProjectRootCache() {
    searcher?.clearCache();
}

export {
    clearFindProjectRootCache,
    findProjectRoot
};
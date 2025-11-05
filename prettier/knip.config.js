import { isCI } from "ci-info";

/** @import {KnipConfig} from "knip" */

/** @type {KnipConfig} */
const config = {
    workspaces: {
        ".": {
            entry: [
                "src/plugins/*",
                "scripts/**",

                // usamos `new function()` para criar `import()`
                // em nosso arquivo `bin` (bin/prettier.cjs),
                // portanto, não há uso real dos arquivos da cli

                "src/cli/index.js",
                "src/experimental-cli/index.js",
                "packages/plugin-oxc/index.js",
                "packages/plugin-hermes/index.js",
                "benchmarks/**"
            ],

            project: [
                "src/**",
                "scripts/**",
                "benchmark/**"
            ],

            ignore: [
                "scripts/build/config.js",
                "scripts/build/build-javascript-module.js",
                "scripts/tools/**",
                "src/experimental-cli/**",
                "src/universal/*.browser.js"
            ],

            ignoreDependencies: [
                "eslint-formatter-friendly",
                "ts-expect",
                "buffer",
                "deno-path-from-file-url"
            ],

            ignoreBinaries: [
                "test-coverage"
            ]
        },

        website: {
            entry: [
                "playground/**/*.{js,jsx}",
                "src/pages/**/*.{js,jsx}",
                "static/**/*.{js,mjs}"
            ],

            ignoreDependencies: [
                "@docusaurus/faster",
                "@docusaurus/plugin-content-docs"
            ]
        },

        "scripts/tools/bundle-test": {},
        "scripts/tools/eslint-plugin-prettier-internal-rules": {},

        "scripts/release": {
            entry: ["release.js"]
        }
    }
};

// verifica apenas os espaços de trabalho no ci, pois eles
// exigem etapas de instalação adicionais, veja:
//
// https://github.com/prettier/prettier/issues/16913

if (!isCI) {
    config.workspaces = Object.fromEntries(
        Object.entries(config.workspaces).map(([workspace, settings]) => [
            workspace,

            workspace === "." ? settings : { ignore: ["**/*"] }
        ])
    );
}

export default config;
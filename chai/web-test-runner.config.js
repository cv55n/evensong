import { fromRollup } from "@web/dev-server-rollup";

import rollupCommonjs from "@rollup/plugin-commonjs";

const commonjs = fromRollup(rollupCommonjs);

export default {
    nodeResolve: true,

    files: [
        "test/*.js",
        "!test/virtual-machines.js"
    ],

    plugins: [
        commonjs({
            include: [
                // o plugin commonjs é lento, liste os pacotes necessários explicitamente:

                "**/node_modules/type-detect/**/*"
            ]
        })
    ]
};
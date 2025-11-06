import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { runBenchmark } from "./utilities.js";

import * as prettierProduction from "../node_modules/prettier/index.mjs";
import * as prettierDevelopment from "../src/index.js";

assert.notEqual(prettierProduction.version, prettierDevelopment.version);

const text = await fs.readFile(new URL(import.meta.url), "utf8");

// @ts-expect-error -- sem tipos
const doc = await prettierDevelopment.__debug.printToDoc(text, {
    parser: "babel",
    
    cursorOffset: text.indexOf("cursorOffset")
});

const run = (prettier) => prettier.doc.printer.printDocToString(doc, {
    printWidth: 80,
    tabWidth: 2
});

const expected = await run(prettierProduction);

await runBenchmark({
    name: "printDocToString",

    assert: (result) => assert.deepEqual(result, expected)
}, [
    {
        name: "desenvolvimento",

        prettier: prettierProduction
    }, {
        name: "produção",

        prettier: prettierProduction
    }
].map(({ name, prettier }) => ({
    name,

    implementation: () => run(prettier)
})));
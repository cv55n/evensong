import path from "node:path";

import { resolveConfigFile } from "../index.js";
import { normalizeToPosix, printToScreen } from "./utils.js";

async function logResolvedConfigPathOrDie(context) {
    const file = context.argv.findConfigFile;
    const configFile = await resolveConfigFile(file);

    if (configFile) {
        printToScreen(normalizeToPosix(path.relative(process.cwd(), configFile)));
    } else {
        throw new Error(`não foi possível encontrar o arquivo de configuração para "${file}".`);
    }
}

export default logResolvedConfigPathOrDie;
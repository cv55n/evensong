import { createRequire } from "module";
import { __importDefault, __importStar } from "tslib";
import { pathToFileURL } from "url";

// esse script testa se a api cjs do typescript está estruturada
// conforme o esperado. ele chama "require" como se estivesse
// em cwd, para que possa ser testado em uma instalação separada
// do typescript

const require = createRequire(process.cwd() + "/index.js");
const typescript = process.argv[2];
const resolvedTypeScript = pathToFileURL(require.resolve(typescript)).toString();

console.log(`testando ${typescript}...`);

// veja: https://github.com/microsoft/TypeScript/pull/51474#issuecomment-1310871623

/** @type {[fn: (() => Promise<any>), shouldSucceed: boolean][]} */
const fns = [
    [() => require(typescript).version, true],
    [() => require(typescript).default.version, false],
    
    [() => __importDefault(require(typescript)).version, false],
    [() => __importDefault(require(typescript)).default.version, true],
    
    [() => __importStar(require(typescript)).version, true],
    [() => __importStar(require(typescript)).default.version, true],
    
    [async () => (await import(resolvedTypeScript)).version, true],
    [async () => (await import(resolvedTypeScript)).default.version, true]
];

for (const [fn, shouldSucceed] of fns) {
    let success = false;

    try {
        success = !!(await fn());
    } catch {
        // ignorar
    }

    const status = success ? "succeeded" : "failed";

    if (success === shouldSucceed) {
        console.log(`${fn.toString()} ${status} como esperado`);
    } else {
        console.log(`${fn.toString()} inesperadamente ${status}.`);

        process.exitCode = 1;
    }
}

if (process.exitCode) {
    console.log("falha");
} else {
    console.log("ok");
}
import { readFileSync } from "fs";
import { join } from "path";

import pc from "picocolors";
import playwright from "playwright";

// ativar isso deixará o navegador chromium aberto, dando
// a você a chance de abrir o inspetor da web
const debugging = false;

/** @type {["chromium", "firefox"]} */
const browsers = ["chromium", "firefox"];

for (const browserType of browsers) {
    const browser = await playwright[browserType].launch({ headless: !debugging });
    
    const context = await browser.newContext();
    const page = await context.newPage();

    /** @type {(err: Error) => void} */
    const errorCaught = err => {
        console.error(pc.red("ocorreu um erro ao rodar built/typescript.js em " + browserType));

        console.log(err.toString());

        process.exitCode = 1;
    };

    // @ts-ignore-error
    page.on("error", errorCaught);
    page.on("pageerror", errorCaught);

    await page.setContent(`
    <html>
    <script>${readFileSync(join("built", "local", "typescript.js"), "utf8")}</script>
    <script>if (typeof ts.version !== "string") throw new Error("ts.version não definida")</script>
    </html>
    `);

    if (!debugging) {
        await browser.close();
    } else {
        console.log("o navegador não está fechando, você precisará encerrar o processo no seu terminal manualmente");
    }

    console.log(`${browserType} :+1:`);
}
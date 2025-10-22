import { execFileSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

const packageJsonFilePath = process.argv[2];

if (!packageJsonFilePath) {
    console.error("uso: node addpackagejsongithead.mjs <localização do package.json>");

    process.exit(1);
}

const packageJsonValue = JSON.parse(readFileSync(packageJsonFilePath, "utf8"));

const cwd = dirname(resolve(packageJsonFilePath));

const gitHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }).trim();

packageJsonValue.gitHead = gitHead;

writeFileSync(packageJsonFilePath, JSON.stringify(packageJsonValue, undefined, 4) + "\n");
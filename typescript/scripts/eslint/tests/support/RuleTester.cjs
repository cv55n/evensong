const { RuleTester } = require("@typescript-eslint/rule-tester");

const path = require("path");
const Mocha = require("mocha");

RuleTester.afterAll = Mocha.after;

module.exports.ROOT_DIR = path.join(process.cwd(), "scripts", "eslint", "tests", "fixtures");
module.exports.FILENAME = path.join(module.exports.ROOT_DIR, "file.ts");

module.exports.RuleTester = RuleTester;
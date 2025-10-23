const MAX_UNICODE_CODEPOINT = 0x10FFFF;

/** @type {(c: string) => boolean} */
const isStart = c => /\p{ID_Start}/u.test(c); // Other_ID_Start explicitly included for back compat - see http://www.unicode.org/reports/tr31/#Introduction

/** @type {(c: string) => boolean} */
const isPart = c => /\p{ID_Continue}/u.test(c) || isStart(c); // Likewise for Other_ID_Continue

const parts = [];

let partsActive = false;
let startsActive = false;

const starts = [];

for (let i = 0; i < MAX_UNICODE_CODEPOINT; i++) {
    if (isStart(String.fromCodePoint(i)) !== startsActive) {
        starts.push(i - +startsActive);
    
        startsActive = !startsActive;
    }

    if (isPart(String.fromCodePoint(i)) !== partsActive) {
        parts.push(i - +partsActive);
    
        partsActive = !partsActive;
    }
}

console.log(`/**
 * gerado por scripts/regenerate-unicode-identifier-parts.mjs no node.js ${process.version} com unicode ${process.versions.unicode}
 * baseado em https://www.unicode.org/reports/tr31/ e https://www.ecma-international.org/ecma-262/6.0/#sec-names-and-keywords
 * 
 * unicodeesnextidentifierstart corresponde às propriedades:
 * 
 * - id_start
 * - other_id_start
 * 
 * já o unicodeesnextidentifierpart corresponde às propriedades:
 * 
 * - id_continue
 * - other_id_continue
 * - id_start
 * - other_id_start
 */`);

console.log(`// dprint-ignore`);
console.log(`const unicodeESNextIdentifierStart = [${starts.join(", ")}];`);

console.log(`// dprint-ignore`);
console.log(`const unicodeESNextIdentifierPart = [${parts.join(", ")}];`);
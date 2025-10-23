import { XMLParser } from "fast-xml-parser";

import fs from "fs";
import path from "path";

/** @typedef {{
    LCX: {
        $_TgtCul: string;

        Item: {
            Item: {
                Item: {
                    $_ItemId: string;

                    Str: {
                        Val: string;

                        Tgt: {
                            Val: string;
                        };
                    };
                }[];
            };
        };
    }
}} ParsedLCL */

void 0;

async function main() {
    const args = process.argv.slice(2);

    if (args.length !== 3) {
        console.log("uso:");
        console.log("\nnode generatelocalizeddiagnosticmessages.js <diretório fonte de lcl> <diretório de output> <arquivo map de diagnósticos gerado>");

        return;
    }

    const inputPath = args[0];
    const outputPath = args[1];
    const diagnosticsMapFilePath = args[2];

    // gerar o arquivo lcg para enu
    await generateLCGFile();

    // gerar outras linguagens
    const files = await fs.promises.readdir(inputPath);

    await Promise.all(files.map(visitDirectory));

    return;

    /**
     * @param {string} name
     */
    async function visitDirectory(name) {
        const inputFilePath = path.join(inputPath, name, "diagnosticMessages", "diagnosticMessages.generated.json.lcl");
        const contents = await fs.promises.readFile(inputFilePath);

        /** @type {ParsedLCL} */
        const result = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "$_"
        }).parse(contents);

        if (!result || !result.LCX || !result.LCX.$_TgtCul) {
            console.error("estrutura de arquivo xml inesperada. esperava-se encontrar result.lcx.$_tgtcul.");
        
            process.exit(1);
        }

        const outputDirectoryName = getPreferredLocaleName(result.LCX.$_TgtCul).toLowerCase();
        
        if (!outputDirectoryName) {
            console.error(`nome de localidade de output inválido para '${result.LCX.$_TgtCul}'.`);
        
            process.exit(1);
        }

        await writeFile(path.join(outputPath, outputDirectoryName, "diagnosticMessages.generated.json"), xmlObjectToString(result));
    }

    /**
     * um nome de localidade é baseado nas convenções de marcação de
     * idioma do rfc 4646 (windows vista e posterior) e é representado
     * por locale_sname
     * 
     * geralmente, o padrão <idioma>-<região> é usado. aqui, idioma é
     * um código de idioma iso 639 em letras minúsculas. os códigos da
     * iso 639-1 são usados ​​quando disponíveis. caso contrário, são
     * utilizados códigos da norma iso 639-2/t. região especifica um
     * identificador de país/região iso 3166-1 em letras maiúsculas
     * 
     * por exemplo, o nome do local para inglês (estados unidos) é
     * "en-us" e o nome do local para divehi (maldivas) é "dv-mv"
     * 
     * se o local for neutro (sem região), o valor locale_sname
     * seguirá o padrão <idioma>. se for um local neutro para o qual
     * o script é significativo, o padrão é <idioma>-<script>
     * 
     * mais em: https://msdn.microsoft.com/en-us/library/windows/desktop/dd373814(v=vs.85).aspx
     * 
     * a maioria dos idiomas que oferecemos suporte são localidades
     * neutras, por isso queremos usar o nome do idioma
     * 
     * há três exceções: zh-cn, zh-tw e pt-br
     * 
     * @param {string} localeName
     */
    function getPreferredLocaleName(localeName) {
        switch (localeName) {
            case "zh-CN":
            case "zh-TW":
            case "pt-BR":
                return localeName;

            default:
                return localeName.split("-")[0];
        }
    }

    /**
     * @param {ParsedLCL} o
     */
    function xmlObjectToString(o) {
        /** @type {any} */

        const out = {};

        for (const item of o.LCX.Item.Item.Item) {
            let ItemId = item.$_ItemId;

            let val = item.Str.Tgt ? item.Str.Tgt.Val : item.Str.Val;

            if (typeof ItemId !== "string" || typeof val !== "string") {
                console.error("estrutura de arquivo xml inesperada");
            
                process.exit(1);
            }

            if (ItemId.charAt(0) === ";") {
                ItemId = ItemId.slice(1); // remover ponto e vírgula inicial
            }

            val = val.replace(/\]5D;/, "]"); // unescape `]`
            
            out[ItemId] = val;
        }

        return JSON.stringify(out, undefined, 2);
    }

    /**
     * @param {string} fileName
     * @param {string} contents
     */
    async function writeFile(fileName, contents) {
        await fs.promises.mkdir(path.dirname(fileName), { recursive: true });
        await fs.promises.writeFile(fileName, contents);
    }

    async function generateLCGFile() {
        const contents = await fs.promises.readFile(diagnosticsMapFilePath, "utf-8");

        await writeFile(
            path.join(outputPath, "enu", "diagnosticMessages.generated.json.lcg"),

            getLCGFileXML(
                Object.entries(JSON.parse(contents))
                    .sort((a, b) => a[0] > b[0] ? 1 : -1) // lcg classificado por chaves de propriedade
                    .reduce((s, [key, value]) => s + getItemXML(key, value), "")
            )
        );

        return;

        /**
         * @param {string} key
         * @param {string} value
         */
        function getItemXML(key, value) {
            // valor de entrada de escape
            value = value.replace(/\]/g, "]5D;");

            return `
            <Item ItemId=";${key}" ItemType="0" PsrId="306" Leaf="true">
                <Str Cat="Text">
                    <Val><![CDATA[${value}]]></Val>
                </Str>

                <Disp Icon="Str" />
            </Item>`;
        }

        /**
         * @param {string} items
         */
        function getLCGFileXML(items) {
            return `<?xml version="1.0" encoding="utf-8"?>
<LCX SchemaVersion="6.0" Name="diagnosticMessages.generated.json" PsrId="306" FileType="1" SrcCul="en-US" xmlns="http://schemas.microsoft.com/locstudio/2006/6/lcx">
    <OwnedComments>
        <Cmt Name="Dev" />
        <Cmt Name="LcxAdmin" />
        <Cmt Name="Rccx" />
    </OwnedComments>

    <Item ItemId=";String Table" ItemType="0" PsrId="306" Leaf="false">
        <Disp Icon="Expand" Expand="true" Disp="true" LocTbl="false" />

        <Item ItemId=";Strings" ItemType="0" PsrId="306" Leaf="false">
            <Disp Icon="Str" Disp="true" LocTbl="false" />${items}
        </Item>
    </Item>
</LCX>`;
        }
    }
}

await main();
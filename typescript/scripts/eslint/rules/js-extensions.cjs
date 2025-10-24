const { createRule } = require("./utils.cjs");

/** @import { TSESTree } from "@typescript-eslint/utils" */
void 0;

module.exports = createRule({
    name: "js-extensions",

    meta: {
        docs: {
            description: ``
        },

        messages: {
            missingJsExtension: `essa referência de módulo relativa não possui uma extensão '.js'`
        },

        schema: [],

        type: "suggestion",
        fixable: "code"
    },

    defaultOptions: [],

    create(context) {
        /** @type {(
         *     node:
         *         | TSESTree.ImportDeclaration
         *         | TSESTree.ImportDeclaration
         *         | TSESTree.ExportAllDeclaration
         *         | TSESTree.ExportNamedDeclaration
         *         | TSESTree.TSImportEqualsDeclaration
         *         | TSESTree.TSModuleDeclaration
         * ) => void} */
        const check = node => {
            let source;

            if (node.type === "TSImportEqualsDeclaration") {
                const moduleReference = node.moduleReference;

                if (
                    moduleReference.type === "TSExternalModuleReference"
                    && moduleReference.expression.type === "Literal"
                    && typeof moduleReference.expression.value === "string"
                ) {
                    source = moduleReference.expression;
                }
            } else if (node.type === "TSModuleDeclaration") {
                if (node.kind === "module" && node.id.type === "Literal") {
                    source = node.id;
                }
            } else {
                source = node.source;
            }

            // isso não é 100% preciso; isso pode apontar para um pacote
            // aninhado ou para um diretório contendo um arquivo index.js
            //
            // mas não há nada parecido no repositório, então esta
            // verificação é suficiente. replicar esta lógica por sua
            // conta e risco
            if (source?.value.startsWith(".") && !/\.[cm]?js$/.test(source.value)) {
                const quote = source.raw[0];

                context.report({
                    messageId: "missingJsExtension",

                    node: source,

                    fix: fixer => fixer.replaceText(source, `${quote}${source.value}.js${quote}`)
                });
            }
        };

        return {
            ImportDeclaration: check,
            ExportAllDeclaration: check,
            ExportNamedDeclaration: check,
            TSImportEqualsDeclaration: check,
            TSModuleDeclaration: check
        };
    }
});
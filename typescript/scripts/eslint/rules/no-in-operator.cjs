const { createRule } = require("./utils.cjs");

/** @import { TSESTree } from "@typescript-eslint/utils" */
void 0;

module.exports = createRule({
    name: "no-in-operator",

    meta: {
        docs: {
            description: ``
        },

        messages: {
            noInOperatorError: `não use a palavra-chave 'in' - use 'hasproperty' para verificar a presença da chave`
        },

        schema: [],

        type: "suggestion"
    },

    defaultOptions: [],

    create(context) {
        const IN_OPERATOR = "in";

        /** @type {(node: TSESTree.BinaryExpression) => void} */
        const checkInOperator = node => {
            if (node.operator === IN_OPERATOR) {
                context.report({ messageId: "noInOperatorError", node });
            }
        };

        return {
            BinaryExpression: checkInOperator,
        };
    }
});
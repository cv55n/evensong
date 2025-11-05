import { outdent } from "outdent";

import { optionCategories } from "./prettier-internal.js";

const categoryOrder = [
    optionCategories.CATEGORY_OUTPUT,
    optionCategories.CATEGORY_FORMAT,
    optionCategories.CATEGORY_CONFIG,
    optionCategories.CATEGORY_EDITOR,
    optionCategories.CATEGORY_OTHER
];

const usageSummary = outdent`
    uso: prettier [opções] [arquivo/dir/glob ...]

    por padrão, o output é escrito para o stdout.
    stdin é lido caso pipado para o prettier e nenhum arquivo foi fornecido.
`;

export {
    categoryOrder,
    usageSummary
};
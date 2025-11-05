export default function createMinimistOptions(detailedOptions) {
    const booleanNames = [];
    const stringNames = [];
    const defaultValues = {};

    for (const option of detailedOptions) {
        const { name, alias, type } = option;

        const names = type === "boolean" ? booleanNames : stringNames;

        names.push(name);

        if (alias) {
            names.push(alias);
        }

        if (
            !option.deprecated &&
            (!option.forwardToApi || name === "plugin") &&
            option.default !== undefined
        ) {
            defaultValues[option.name] = option.default;
        }
    }

    return {
        // usamos o aliasschema do vnopts para gerenciar
        // aliases e obter mensagens de erro mais claras

        alias: {},
        boolean: booleanNames,
        string: stringNames,
        default: defaultValues
    };
}
import minimist from "minimist";

const PLACEHOLDER = null;

/**
 * uma flag booleana não especificada, sem valor padrão, é
 * interpretada como `undefined` em vez de `false`
 */
export default function minimistParse(args, options) {
    /* c8 ignore próxima linha */
    const boolean = options.boolean ?? [];

    /* c8 ignore próxima linha */
    const defaults = options.default ?? {};

    const booleanWithoutDefault = boolean.filter((key) => !(key in defaults));

    const newDefaults = {
        ...defaults,

        ...Object.fromEntries(
            booleanWithoutDefault.map((key) => [key, PLACEHOLDER])
        )
    };

    const parsed = minimist(args, {
        ...options,
    
        default: newDefaults
    });

    return Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => value !== PLACEHOLDER)
    );
}
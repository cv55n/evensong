import dashify from "dashify";

import { getSupportInfo } from "../../index.js";
import { getSupportInfoWithoutPlugins, normalizeOptionSettings, optionCategories } from "../prettier-internal.js";

import cliOptions from "../cli-options.evaluate.js";

const detailedCliOptions = normalizeOptionSettings(cliOptions).map((option) => normalizeOptionSettings(option));

function apiOptionToCliOption(apiOption) {
    const cliOption = {
        ...apiOption,

        description: apiOption.cliDescription ?? apiOption.description,
        category: apiOption.cliCategory ?? optionCategories.CATEGORY_FORMAT,

        forwardToApi: apiOption.name
    };

    /* c8 ignore - início */

    if (apiOption.deprecated) {
        delete cliOption.forwardToApi;
        delete cliOption.description;
        delete cliOption.oppositeDescription;

        cliOption.deprecated = true;
    }

    /* c8 ignore - final */

    return normalizeDetailedOption(cliOption);
}

function normalizeDetailedOption(option) {
    return {
        category: optionCategories.CATEGORY_OTHER,

        ...option,

        name: option.cliName ?? dashify(option.name),

        choices: option.choices?.map((choice) => {
            const newChoice = {
                description: "",
                deprecated: false,

                ...(typeof choice === "object" ? choice : {
                    value: choice
                })
            };

            /* c8 ignore as próximas 3 */
            if (newChoice.value === true) {
                newChoice.value = ""; // compatibilidade retroativa para a opção booleana original
            }

            return newChoice;
        })
    };
}

function supportInfoToContextOptions({ options: supportOptions, languages }) {
    const detailedOptions = [
        ...detailedCliOptions,
        
        ...supportOptions.map((apiOption) => apiOptionToCliOption(apiOption))
    ];

    return {
        supportOptions,
        languages,
        detailedOptions
    };
}

async function getContextOptions(plugins) {
    const supportInfo = await getSupportInfo({
        showDeprecated: true,

        plugins
    });

    return supportInfoToContextOptions(supportInfo);
}

function getContextOptionsWithoutPlugins() {
    const supportInfo = getSupportInfoWithoutPlugins();

    return supportInfoToContextOptions(supportInfo);
}

export {
    getContextOptions,
    getContextOptionsWithoutPlugins
};
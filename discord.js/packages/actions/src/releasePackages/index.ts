import { getInput, startGroup, endGroup, getBooleanInput, summary } from '@actions/core';
import { program } from 'commander';

import { generateReleaseTree } from './generateReleaseTree.js';
import { releasePackage } from './releasePackage.js';

function npmPackageLink(packageName: string) {
    return `https://npmjs.com/package/${packageName}` as const;
}

const excludeInput = getInput('exclude');

let dryInput = false;
let devInput = false;

try {
    devInput = getBooleanInput('dev');
} catch {
    // não está sendo rodado no actions
}

try {
    dryInput = getBooleanInput('dry');
} catch {
    // não está sendo rodado no actions ou o input não está definido (cron)
}

program
    .name('lançamento de pacotes')
    .description('publica pacotes monorepo com sequenciamento adequado')
    .argument('[package]', "publica um pacote específico (e suas dependências)", getInput('package'))
    .option(
        '-e, --exclude <packages...>',
        'exclui pacotes específicos do publicação (ainda será publicado se necessário para outro pacote)',

        excludeInput ? excludeInput.split(',') : []
    )
    .option('--dry', 'ignora a publicação propriamente dita e exibe registros em vez disso', dryInput)
    .option('--dev', 'publica versões de desenvolvimento e ignora a marcação/lançamentos no github', devInput)
    .option('--tag <tag>', 'tag a ser usada para versões de desenvolvimento (o padrão é "dev")', getInput('tag'))
    .parse();

const {
    exclude,
    dry,
    dev,

    tag: inputTag
} = program.opts<{
    dev: boolean;
    dry: boolean;
    exclude: string[];
    tag: string
}>();

// tudo isso porque getinput('tag') retornará uma string vazia quando não estiver definida
if (!dev && inputTag.length) {
    throw new Error('a opção --tag pode ser utilizada apenas com --dev');
}

const tag = inputTag.length ? inputTag : dev ? 'dev' : undefined;
const [packageName] = program.processedArgs as [string];
const tree = await generateReleaseTree(dry, tag, packageName, exclude);

interface ReleaseResult {
	identifier: string;
	url: string;
}

const publishedPackages: ReleaseResult[] = [];
const skippedPackages: ReleaseResult[] = [];

for (const branch of tree) {
    startGroup(`publicando ${branch.map((entry) => `${entry.name}@${entry.version}`).join(', ')}`);

    await Promise.all(
        branch.map(async (release) => {
            const published = await releasePackage(release, dry, tag);
            const identifier = `${release.name}@${release.version}`;

            if (published) {
                publishedPackages.push({ identifier, url: npmPackageLink(release.name) });
            } else {
                skippedPackages.push({ identifier, url: npmPackageLink(release.name) });
            }
        })
    );

    endGroup();
}

const result = summary.addHeading('resumo do lançamento');

if (dry) {
	result.addRaw('\n\n> [!nota]\n> isso é uma run seca.\n\n');
}

result.addHeading('publicado', 2);

if (publishedPackages.length === 0) {
	result.addRaw('\n_nenhum_\n\n');
} else {
	result.addRaw('\n');

	for (const { identifier, url } of publishedPackages) {
		result.addRaw(`- [${identifier}](${url})\n`);
	}

	result.addRaw(`\n`);
}

result.addHeading('pulado', 2);

if (skippedPackages.length === 0) {
	result.addRaw('\n_nenhum_\n\n');
} else {
	result.addRaw('\n');

	for (const { identifier, url } of skippedPackages) {
		result.addRaw(`- [${identifier}](${url})\n`);
	}

	result.addRaw(`\n`);
}

await result.write();
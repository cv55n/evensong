import { info, warning } from '@actions/core';
import type { PackageJSON, PackumentVersion } from '@npm/types';
import { $, file, write } from 'bun';

const nonNodePackages = new Set(['@discordjs/proxy-container']);

interface pnpmTreeDependency {
    from: string;
    path: string;
    version: string;
}

interface pnpmTree {
    dependencies?: Record<string, pnpmTreeDependency>;

    name?: string;
    path: string;
    private?: boolean;
    unsavedDepdendencies?: Record<string, pnpmTreeDependency>;
    version?: string;
}

export interface ReleaseEntry {
    changelog?: string;
    dependsOn?: string[];
    name: string;
    version: string;
}

async function fetchDevVersion(pkg: string, tag: string) {
    try {
        const res = await fetch(`https://registry.npmjs.org/${pkg}/${tag}`);

        if (!res.ok)
            return null;

        const packument = (await res.json()) as PackumentVersion;

        return packument.version;
    } catch {
        return null;
    }
}

async function getReleaseEntries(dry: boolean, devTag?: string) {
    const releaseEntries: ReleaseEntry[] = [];
    const packageList: pnpmTree[] = await $`pnpm list --recursive --only-projects --filter {packages/\*} --prod --json`.json();
    const commitHash = (await $`git rev-parse --short HEAD`.text()).trim();
    const timestamp = Math.round(Date.now() / 1_000);

    for (const pkg of packageList) {
        // nunca publicar pacotes privados (o npm apresentará erro de qualquer forma)
        if (pkg.private)
            continue;

        // apenas se for o caso
        if (!pkg.version || !pkg.name)
            continue;

        if (nonNodePackages.has(pkg.name))
            continue;

        const release: ReleaseEntry = {
            name: pkg.name,
            version: pkg.version
        };

        if (devTag) {
            // substituir as dependências do workspace por * para fixá-las
            // às versões dev associadas
            if (!dry) {
                const pkgJsonString = await file(`${pkg.path}/package.json`).text();

                await write(`${pkg.path}/package.json`, pkgJsonString.replaceAll(/workspace:[\^~]/g, 'workspace:*'));
            }

            const devVersion = await fetchDevVersion(pkg.name, devTag);

            if (devVersion?.endsWith(commitHash)) {
                // escrever a versão dev atualmente lançada para que, quando o comando
                // `pnpm publish` for executado em dependências, estas passem a
                // depender das versões dev

                if (dry) {
                    info(`[dry] ${pkg.name}@${devVersion} já foi lançada. editando a versão do package.json.`);
                } else {
                    const pkgJson = (await file(`${pkg.path}/package.json`).json()) as PackageJSON;

                    pkgJson.version = devVersion;

                    await write(`${pkg.path}/package.json`, JSON.stringify(pkgJson, null, '\t'));
                }

                release.version = devVersion;
            } else if (dry) {
                info(`[dry] bumping ${pkg.name} via git-cliff.`);

                release.version = `${pkg.version}.DRY-${devTag}.${timestamp}-${commitHash}`;
            } else {
                await $`pnpm --filter=${pkg.name} run release --preid "${devTag}.${timestamp}-${commitHash}" --skip-changelog`;

                // ler novamente em vez de analisar o output para garantir que
                // estamos fazendo a correspondência ao verificar com o npm
                const pkgJson = (await file(`${pkg.path}/package.json`).json()) as PackageJSON;

                release.version = pkgJson.version;
            }
        }

        // requer apenas o changelog para as versões publicadas no github
        else {
            try {
                // encontra e analisa o changelog para publicar na versão do github
                const changelogFile = await file(`${pkg.path}/CHANGELOG.md`).text();

                let changelogLines: string[] = [];
                let foundChangelog = false;

                for (const line of changelogFile.split('\n')) {
                    if (line.startsWith('# [')) {
                        if (foundChangelog) {
                            if (changelogLines.at(-1) === '') {
                                changelogLines = changelogLines.slice(2, -1);
                            }

                            break;
                        }

                        // verifica a versão do changelog e assume que não há changelog se a versão não corresponder
                        if (!line.startsWith(`# [${release.name === 'discord.js' ? `` : `${release.name}@`}${release.version}]`)) {
                            break;
                        }

                        foundChangelog = true;
                    }

                    if (foundChangelog) {
                        changelogLines.push(line);
                    }
                }

                release.changelog = changelogLines.join('\n');
            } catch (error) {
                // provavelmente não há um arquivo de changelog, mas registrar um por precaução
                warning(`erro ao analisar o changelog para ${pkg.name}, será utilizado o changelog gerado automaticamente: ${error}`);
            }
        }

        if (pkg.dependencies) {
            release.dependsOn = Object.keys(pkg.dependencies);
        }

        releaseEntries.push(release);
    }

    return releaseEntries;
}

export async function generateReleaseTree(dry: boolean, devTag?: string, packageName?: string, exclude?: string[]) {
    let releaseEntries = await getReleaseEntries(dry, devTag);

    // tentar retornar antecipadamente se o pacote não tiver dependências
    if (packageName && packageName !== 'all') {
        const releaseEntry = releaseEntries.find((entry) => entry.name === packageName);

        if (!releaseEntry) {
            throw new Error(`pacote ${packageName} não lançável`);
        }

        if (!releaseEntry.dependsOn) {
            return [[releaseEntry]];
        }
    }

    // gerar primeiro a árvore inteira e, em seguida, fazer a poda, se especificado
    const releaseTree: ReleaseEntry[][] = [];
    const didRelease = new Set<string>();

    while (releaseEntries.length) {
        const nextBranch: ReleaseEntry[] = [];
		const unreleased: ReleaseEntry[] = [];
		
        for (const entry of releaseEntries) {
			if (!entry.dependsOn) {
				nextBranch.push(entry);
				
                continue;
			}

			const allDepsReleased = entry.dependsOn.every((dep) => didRelease.has(dep));
			
            if (allDepsReleased) {
				nextBranch.push(entry);
			} else {
				unreleased.push(entry);
			}
		}

        // atualiza o método `didrelease` em um segundo loop para evitar problemas de ordem do loop
        for (const release of nextBranch) {
            didRelease.add(release.name);
        }

        if (releaseEntries.length === unreleased.length) {
            throw new Error(
                `um ou mais pacotes possuem dependências que não podem ser liberadas: ${unreleased.map((entry) => entry.name).join(',')}`
            );
        }

        releaseTree.push(nextBranch);
        releaseEntries = unreleased;
    }

    // podar exclusões
    if ((!packageName || packageName === 'all') && Array.isArray(exclude) && exclude.length) {
        const neededPackages = new Set<string>();
        const excludedReleaseTree: ReleaseEntry[][] = [];

        for (const releaseBranch of releaseTree.reverse()) {
            const newThisBranch: ReleaseEntry[] = [];

            for (const entry of releaseBranch) {
                if (exclude.includes(entry.name) && !neededPackages.has(entry.name)) {
                    continue;
                }

                newThisBranch.push(entry);

                for (const dep of entry.dependsOn ?? []) {
                    neededPackages.add(dep);
                }
            }

            if (newThisBranch.length)
                excludedReleaseTree.unshift(newThisBranch);
        }

        return excludedReleaseTree;
    }

    if (!packageName || packageName === 'all') {
        return releaseTree;
    }

    // poda a árvore para o pacote especificado
    const neededPackages = new Set<string>([packageName]);
    const packageReleaseTree: ReleaseEntry[][] = [];

    for (const releaseBranch of releaseTree.reverse()) {
        const newThisBranch: ReleaseEntry[] = [];

        for (const entry of releaseBranch) {
            if (neededPackages.has(entry.name)) {
                newThisBranch.push(entry);

                for (const dep of entry.dependsOn ?? []) {
                    neededPackages.add(dep);
                }
            }
        }

        if (newThisBranch.length)
            packageReleaseTree.unshift(newThisBranch);
    }

    return packageReleaseTree;
}
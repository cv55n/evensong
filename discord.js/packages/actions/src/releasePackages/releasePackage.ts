import { setInterval, clearInterval } from 'node:timers';
import { info, warning } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { $ } from 'bun';

import type { ReleaseEntry } from './generateReleaseTree.js';

import process from 'node:process';

let octokit: ReturnType<typeof getOctokit> | undefined;

if (process.env.GITHUB_TOKEN) {
    octokit = getOctokit(process.env.GITHUB_TOKEN);
}

async function checkRegistry(release: ReleaseEntry) {
    const res = await fetch(`https://registry.npmjs.org/${release.name}/${release.version}`);

    return res.ok;
}

async function gitTagAndRelease(release: ReleaseEntry, dry: boolean) {
    const tagName = `${release.name === 'discord.js' ? `` : `${release.name}@`}${release.version}`;

    if (dry) {
        info(`[dry] a versão seria "${tagName}", pulando a criação da versão.`);

        return;
    }

    const commitHash = (await $`git rev-parse HEAD`.text()).trim();

    try {
        await octokit?.rest.repos.createRelease({
            ...context.repo,

            tag_name: tagName,
            target_commitish: commitHash,
            name: tagName,
            body: release.changelog ?? '',
            generate_release_notes: release.changelog === undefined,
            make_latest: release.name === 'discord.js' ? 'true' : 'false'
        });
    } catch (error) {
        warning(`falha ao criar uma release no github: ${error}`);
    }
}

export async function releasePackage(release: ReleaseEntry, dry: boolean, devTag?: string, doGitRelease = !devTag) {
    // primeiro, verificar se os dados estão corretos no registro
    if (await checkRegistry(release)) {
        info(`${release.name}@${release.version} já foi publicado, pulando.`);

        return false;
    }

    if (dry) {
        info(`[dry] publicando ${release.name}@${release.version}`);
    } else {
        await $`pnpm --filter=${release.name} publish --provenance --no-git-checks ${devTag ? `--tag=${devTag}` : ''}`;
    }

    // && !devtag apenas para ter certeza
    if (doGitRelease && !devTag)
        await gitTagAndRelease(release, dry);

    if (dry)
        return true;

    const before = performance.now();

    // registro de pesquisas para garantir que as próximas publicações não falhem
    await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
            if (await checkRegistry(release)) {
                clearInterval(interval);

                resolve();

                return;
            }

            if (performance.now() > before + 5 * 60 * 1_000) {
                clearInterval(interval);

                reject(new Error(`release para ${release.name} falhou.`));
            }
        }, 15_000);
    });

    if (devTag) {
        // enviar e esquecer, as descontinuações são menos importantes do que lançar outras versões de desenvolvimento e podem ser feitas manualmente
        void $`pnpm exec npm-deprecate --name "*${devTag}*" --message "essa versão está descontinuada. por favor, utilize uma versão mais recente." --package ${release.name}`
            .nothrow()
            
            // eslint-disable-next-line promise/prefer-await-to-then
            .then(() => {});
    }

    // maldoso, mas não imagino um mecanismo mais limpo
    if (release.name === 'create-discord-bot') {
        await $`pnpm --filter=create-discord-bot run rename-to-app`;

        // eslint-disable-next-line require-atomic-updates
        release.name = 'create-discord-app';

        await releasePackage(release, dry, devTag, false);
    }

    return true;
}
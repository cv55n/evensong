export * from 'discord-api-types/v10';

export * from '../api/index.js';
export * from '../util/index.js';

/**
 * a versão {@link https://github.com/discordjs/discord.js/blob/main/packages/core#readme | @discordjs/core}
 * que você está atualmente utilizando
 */

// isso precisa ser explicitamente `string` para que não seja
// tipado como uma "const string" injetada pelo esbuild
export const version = '[VI]{{inject}}[/VI]' as string;
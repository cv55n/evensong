/* eslint-disable jsdoc/check-param-names */

import {
	Routes,
	type RESTGetAPIApplicationEmojiResult,
	type RESTGetAPIApplicationEmojisResult,
	type RESTGetCurrentApplicationResult,
	type RESTPatchAPIApplicationEmojiJSONBody,
	type RESTPatchAPIApplicationEmojiResult,
	type RESTPatchCurrentApplicationJSONBody,
	type RESTPatchCurrentApplicationResult,
	type RESTPostAPIApplicationEmojiJSONBody,
	type RESTPostAPIApplicationEmojiResult,
	type Snowflake
} from 'discord-api-types/v10';

import type { RequestData, REST } from '@discordjs/rest';

export class ApplicationsAPI {
    public constructor(private readonly rest: REST) {}

    /**
     * recupera o aplicativo associado ao usuário do bot que
     * fez a solicitação
     * 
     * @see {@link https://discord.com/developers/docs/resources/application#get-current-application}
     * 
     * @param options - as opções para obter o aplicativo
     */
    public async getCurrent({ auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}) {
        return this.rest.get(Routes.currentApplication(), { auth, signal }) as Promise<RESTGetCurrentApplicationResult>;
    }

    /**
     * edita as propriedades do aplicativo associado ao
     * usuário bot solicitante
     * 
     * @see {@link https://discord.com/developers/docs/resources/application#edit-current-application}
	 * 
     * @param body - os novos dados do aplicativo
	 * @param options - as opções para editar o aplicativo
     */
    public async editCurrent(
        body: RESTPatchCurrentApplicationJSONBody,
        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.patch(Routes.currentApplication(), {
            auth,
            body,
            signal
        }) as Promise<RESTPatchCurrentApplicationResult>;
    }

    /**
     * busca todos os emojis de um aplicativo
     * 
     * @see {@link https://discord.com/developers/docs/resources/emoji#list-application-emojis}
     * 
     * @param applicationId - o id do aplicativo para buscar os emojis
     * @param options - as opções para obter os emojis
     */
    public async getEmojis(applicationId: Snowflake, { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}) {
        return this.rest.get(Routes.applicationEmojis(applicationId), {
            auth,
            signal
        }) as Promise<RESTGetAPIApplicationEmojisResult>;
    }

    /**
     * busca um emoji de um aplicativo
     * 
     * @see {@link https://discord.com/developers/docs/resources/emoji#get-application-emoji}
	 * 
     * @param applicationId - o id do aplicativo para buscar os emojis
	 * @param emojiId - o id do emoji a ser buscado
	 * @param options - as opções para obter os emojis
     */
    public async getEmoji(
        applicationId: Snowflake,
        emojiId: Snowflake,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.get(Routes.applicationEmoji(applicationId, emojiId), {
            auth,
            signal
        }) as Promise<RESTGetAPIApplicationEmojiResult>;
    }

    /**
     * cria um novo emoji de um aplicativo
     * 
     * @see {@link https://discord.com/developers/docs/resources/emoji#create-application-emoji}
	 * 
     * @param applicationId - o id do aplicativo para criar o emoji
	 * @param body - os dados para criar o emoji
	 * @param options - as opções para criar o emoji
     */
    public async createEmoji(
        applicationId: Snowflake,
		body: RESTPostAPIApplicationEmojiJSONBody,

		{ auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.post(Routes.applicationEmojis(applicationId), {
			auth,
			body,
			signal
		}) as Promise<RESTPostAPIApplicationEmojiResult>;
    }

    /**
     * edita um emoji de um aplicativo
     * 
     * @see {@link https://discord.com/developers/docs/resources/emoji#modify-application-emoji}
	 * 
     * @param applicationId - o id do aplicativo para editar o emoji
	 * @param emojiId - o id do emoji a ser editado
	 * @param body - os dados para editar o emoji
	 * @param options - as opções para editar o emoji
     */
    public async editEmoji(
		applicationId: Snowflake,
		emojiId: Snowflake,
		body: RESTPatchAPIApplicationEmojiJSONBody,
		
        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
	) {
		return this.rest.patch(Routes.applicationEmoji(applicationId, emojiId), {
			auth,
			body,
			signal
		}) as Promise<RESTPatchAPIApplicationEmojiResult>;
	}

    /**
     * deleta um emoji de um aplicativo
     * 
     * @see {@link https://discord.com/developers/docs/resources/emoji#delete-application-emoji}
	 * 
     * @param applicationId - o id do aplicativo para deletar o emoji
	 * @param emojiId - o id do emoji a ser deletado
	 * @param options - as opções para deletar o emoji
     */
    public async deleteEmoji(
		applicationId: Snowflake,
		emojiId: Snowflake
		
        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
	) {
		await this.rest.delete(Routes.applicationEmoji(applicationId, emojiId), { auth, signal });
	}
}
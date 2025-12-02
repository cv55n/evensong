/* eslint-disable jsdoc/check-param-names */

import { makeURLSearchParams, type RequestData, type REST } from '@discordjs/rest';

import {
	Routes,
	type RESTGetAPIApplicationCommandPermissionsResult,
	type RESTGetAPIApplicationCommandResult,
	type RESTGetAPIApplicationCommandsQuery,
	type RESTGetAPIApplicationCommandsResult,
	type RESTGetAPIApplicationGuildCommandResult,
	type RESTGetAPIApplicationGuildCommandsQuery,
	type RESTGetAPIApplicationGuildCommandsResult,
	type RESTGetAPIGuildApplicationCommandsPermissionsResult,
	type RESTPatchAPIApplicationCommandJSONBody,
	type RESTPatchAPIApplicationCommandResult,
	type RESTPatchAPIApplicationGuildCommandJSONBody,
	type RESTPatchAPIApplicationGuildCommandResult,
	type RESTPostAPIApplicationCommandsJSONBody,
	type RESTPostAPIApplicationCommandsResult,
	type RESTPostAPIApplicationGuildCommandsJSONBody,
	type RESTPostAPIApplicationGuildCommandsResult,
	type RESTPutAPIApplicationCommandPermissionsJSONBody,
	type RESTPutAPIApplicationCommandPermissionsResult,
	type RESTPutAPIApplicationCommandsJSONBody,
	type RESTPutAPIApplicationCommandsResult,
	type RESTPutAPIApplicationGuildCommandsJSONBody,
	type RESTPutAPIApplicationGuildCommandsResult,
	type Snowflake
} from 'discord-api-types/v10';

export class ApplicationCommandsAPI {
    public constructor(private readonly rest: REST) {}

    /**
     * busca todos os comandos globais para um aplicativo
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#get-global-application-commands}
     * 
     * @param applicationId - o id do aplicativo para buscar comandos para
     * @param query - as opções de consulta para buscar os comandos
     * @param options - as opções para buscar os comandos
     */
    public async getGlobalCommands(
        applicationId: Snowflake,
        query: RESTGetAPIApplicationCommandsQuery = {},

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.get(Routes.applicationCommands(applicationId), {
            auth,
            query: makeURLSearchParams(query),
            signal
        }) as Promise<RESTGetAPIApplicationCommandsResult>;
    }

    /**
     * cria um novo comando global
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#create-global-application-command}
     * 
     * @param applicationId - o id do aplicativo para criar o comando para
     * @param body - os dados para criar o comando
     * @param options - as opções para criar o comando
     */
    public async createGlobalCommand(
        applicationId: Snowflake,
        body: RESTPostAPIApplicationCommandsJSONBody,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.post(Routes.applicationCommands(applicationId), {
            auth,
            body,
            signal
        }) as Promise<RESTPostAPIApplicationCommandsResult>;
    }

    /**
     * busca por um comando global
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#get-global-application-command}
     * 
     * @param applicationId - o id do aplicativo para buscar o comando
     * @param commandId - o id do comando a ser buscado
     * @param options - as opções para buscar o comando
     */
    public async getGlobalCommand(
        applicationId: Snowflake,
        commandId: Snowflake,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.get(Routes.applicationCommand(applicationId, commandId), {
            auth,
            signal
        }) as Promise<RESTGetAPIApplicationCommandResult>;
    }

    /**
     * edita um comando global
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#edit-global-application-command}
     * 
     * @param applicationId - o id do aplicativo do comando
     * @param commandId - o id do comando a ser editado
     * @param body - os dados para editar o comando
     * @param options - as opções para editar o comando
     */
    public async editGlobalCommand(
        applicationId: Snowflake,
        commandId: Snowflake,
        body: RESTPatchAPIApplicationCommandJSONBody,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.patch(Routes.applicationCommand(applicationId, commandId), {
            auth,
            body,
            signal
        }) as Promise<RESTPatchAPIApplicationCommandResult>;
    }

    /**
     * deleta um comando global
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#delete-global-application-command}
     * 
     * @param applicationId - o id do aplicativo do comando
     * @param commandId - o id do comando a ser deletado
     * @param options - as opções para deletar o comando
     */
    public async deleteGlobalCommand(
        applicationId: Snowflake,
        commandId: Snowflake,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        await this.rest.delete(Routes.applicationCommand(applicationId, commandId), {
            auth,
            signal
        });
    }

    /**
     * sobrescreve um comando global
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-command}
     * 
     * @param applicationId - o id do aplicativo do qual o comando será sobrescrito
     * @param body - os dados para sobrescrever os comandos
     * @param options - as opções para sobrescrever os comandos
     */
    public async bulkOverwriteGlobalCommands(
        applicationId: Snowflake,
        body: RESTPatchAPIApplicationCommandsJSONBody,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.put(Routes.applicationCommand(applicationId, commandId), {
            auth,
            body,
            signal
        }) as Promise<RESTPatchAPIApplicationCommandsResult>;
    }

    /**
     * busca todos os comandos para um servidor
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#get-guild-application-commands}
     * 
     * @param applicationId - o id do aplicativo do qual os comandos serão buscados
     * @param guildId - o id do servidor do qual os comandos serão buscados
     * @param query - os dados para buscar os comandos
     * @param options - as opções para buscar os comandos
     */
    public async getGuildCommands(
        applicationId: Snowflake,
        guildId: Snowflake,
        query: RESTGetAPIApplicationGuildCommandsQuery = {},

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.get(Routes.applicationGuildCommands(applicationId, commandId), {
            auth,
            query: makeURLSearchParams(query),
            signal
        }) as Promise<RESTGetAPIApplicationGuildCommandsResult>;
    }

    /**
     * cria um novo comando para um servidor
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#create-guild-application-command}
     * 
     * @param applicationId - o id do aplicativo do qual o comando será criado
     * @param guildId - o id do servidor do qual o comando será criado
     * @param body - os dados para criar o comando
     * @param options - as opções para criar o comando
     */
    public async createGuildCommand(
        applicationId: Snowflake,
        guildId: Snowflake,
        body: RESTPostAPIApplicationCommandsJSONBody,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.post(Routes.applicationGuildCommands(applicationId, commandId), {
            auth,
            body,
            signal
        }) as Promise<RESTPostAPIApplicationGuildCommandsResult>;
    }

    /**
     * busca um comando de um servidor
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#get-guild-application-command}
     * 
     * @param applicationId - o id do aplicativo do qual o comando será buscado
     * @param guildId - o id do servidor do qual o comando será buscado
     * @param commandId - o id do comando que será buscado
     * @param options - as opções para buscar o comando
     */
    public async getGuildCommand(
        applicationId: Snowflake,
        guildId: Snowflake,
        commandId: Snowflake,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.get(Routes.applicationGuildCommand(applicationId, commandId), {
            auth,
            signal
        }) as Promise<RESTGetAPIApplicationGuildCommandResult>;
    }

    /**
     * edita um comando de um servidor
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#edit-guild-application-command}
     * 
     * @param applicationId - o id do aplicativo do comando
     * @param guildId - o id do servidor do comando
     * @param commandId - o id do comando que será editado
     * @param body - os dados para editar o comando
     * @param options - as opções para editar o comando
     */
    public async editGuildCommand(
        applicationId: Snowflake,
        guildId: Snowflake,
        commandId: Snowflake,
        body: RESTPatchAPIApplicationGuildCommandJSONBody,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.patch(Routes.applicationGuildCommand(applicationId, commandId), {
            auth,
            body,
            signal
        }) as Promise<RESTPatchAPIApplicationGuildCommandResult>;
    }

    /**
     * deleta um comando de um servidor
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#delete-guild-application-command}
     * 
     * @param applicationId - o id do aplicativo do comando
     * @param guildId - o id do servidor do comando
     * @param commandId - o id do comando que será deletado
     * @param options - as opções para deletar o comando
     */
    public async deleteGuildCommand(
        applicationId: Snowflake,
        guildId: Snowflake,
        commandId: Snowflake,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.delete(Routes.applicationGuildCommand(applicationId, guildId, commandId), {
            auth,
            signal
        });
    }

    /**
     * sobrescreve em massa os comandos de um servidor
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-guild-application-commands}
     * 
     * @param applicationId - o id do aplicativo do qual os comandos serão sobrescritos
     * @param guildId - o id do servidor do qual os comandos serão sobrescritos
     * @param body - os dados para sobrescrever os comandos
     * @param options - as opções para sobrescrever os comandos
     */
    public async bulkOverwriteGuildCommands(
        applicationId: Snowflake,
        guildId: Snowflake,
        body: RESTPutAPIApplicationGuildCommandsJSONBody,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
            auth,
            body,
            signal
        }) as Promise<RESTPutAPIApplicationGuildCommandsResult>;
    }

    /**
     * busca as permissões de um comando do servidor
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#get-guild-application-command-permissions}
     * 
     * @param applicationId - o id do aplicativo do qual se obterá as permissões
     * @param guildId - o id do servidor do comando
     * @param commandId - o id do comando do qual as permissões será buscada
     * @param options - a opção para buscar o comando
     */
    public async getGuildCommandPermissions(
        applicationId: Snowflake,
        guildId: Snowflake,
        commandId: Snowflake,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.get(Routes.applicationCommandPermissions(applicationId, guildId, commandId), {
			auth,
			signal
		}) as Promise<RESTGetAPIApplicationCommandPermissionsResult>;
    }

    /**
     * busca todas as permissões de todos os comando do servidor
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#get-application-command-permissions}
     * 
     * @param applicationId - o id do aplicativo do qual se obterá as permissões
     * @param guildId - o id do servidor do qual se obterá as permissões
     * @param options - a opção para buscar as permissões
     */
    public async getGuildCommandsPermissions(
        applicationId: Snowflake,
        guildId: Snowflake,

        { auth, signal }: Pick<RequestData, 'auth' | 'signal'> = {}
    ) {
        return this.rest.get(Routes.guildApplicationCommandsPermissions(applicationId, guildId), {
			auth,
			signal
		}) as Promise<RESTGetAPIGuildApplicationCommandsPermissionsResult>;
    }

    /**
     * edita as permissões de um comando do servidor
     * 
     * @see {@link https://discord.com/developers/docs/interactions/application-commands#edit-application-command-permissions}
     * 
     * @param userToken - o token do usuário para editar as permissões
     * @param applicationId - o id do aplicativo do qual se editará as permissões
     * @param guildId - o id do servidor do qual se editará as permissões
     * @param commandId - o id do comando do qual se editará as permissões
     * @param body - os dados para editar as permissões
     * @param options - a opção para editar as permissões
     */
    public async editGuildCommandPermissions(
        userToken: string,
        applicationId: Snowflake,
        guildId: Snowflake,
        commandId: Snowflake,
        body: RESTPutAPIApplicationCommandPermissionsJSONBody,

        { signal }: Pick<RequestData, 'signal'> = {}
    ) {
        return this.rest.put(Routes.applicationCommandPermissions(applicationId, guildId, commandId), {
            headers: { Authorization: `bearer ${userToken.replace('bearer ', '')}` },
			auth: false,
            body,
			signal
		}) as Promise<RESTPutAPIApplicationCommandPermissionsResult>;
    }
}
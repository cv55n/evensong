import type { GatewaySendPayload } from 'discord-api-types/v10';

import type { Awaitable } from '@discordjs/util';
import type { ManagerShardEventsMap, WebSocketShardEvents } from '@discordjs/ws';

/**
 * estrutura semelhante a um gateway que pode ser usada para
 * interagir com uma conexão websocket real
 * 
 * você pode fornecer uma implementação personalizada, útil
 * para executar um agente de mensagens entre seu aplicativo
 * e seu gateway, ou pode simplesmente usar:
 * 
 * {@link @discordjs/ws#(WebSocketManager:class)}
 */
export interface Gateway {
    getShardCount(): Awaitable<number>;

    on(
        event: WebSocketShardEvents.Dispatch,

        listener: (
            ...params: ManagerShardEventsMap[WebSocketShardEvents.Dispatch]
        ) => Awaitable<void>
    ): this;

    send(
        shardId: number,
        payload: GatewaySendPayload
    ): Awaitable<void>;
}
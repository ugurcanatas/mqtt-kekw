/**
 * @author Uğurcan Emre Ataş
 * @email ugurcanemre93@gmail.com
 * @create date 2021-10-14 01:28:21
 * @modify date 2021-10-14 01:28:21
 * @desc [description]
 */
import TypedEmitter from "typed-emitter";
import { InterfaceMessageEvents, InterfacePacketConnect, InterfacePublish, InterfaceSubscribe, InterfaceUnsubscribe, TypeHostConfig } from "./types/libtypes";
declare const kekwClient_base: new () => TypedEmitter<InterfaceMessageEvents>;
export declare class kekwClient extends kekwClient_base {
    private port;
    private hostAddress;
    private timeout;
    private client?;
    private connected;
    constructor({ hostAddress, port, //mosquitto default port
    timeout, }?: TypeHostConfig, onFailed?: (message: string) => void);
    getConnectionState(): boolean;
    connectToServer(): void;
    connectionUp: ({ flags, keepAlive, clientID, will, }?: InterfacePacketConnect) => void;
    subscribeTo: (packetConfig: InterfaceSubscribe) => void;
    unsubscribeFrom: (packetConfig: InterfaceUnsubscribe) => void;
    ping: () => void;
    publishTo: (packetConfig: InterfacePublish) => void;
    disconnect: () => void;
}
export {};

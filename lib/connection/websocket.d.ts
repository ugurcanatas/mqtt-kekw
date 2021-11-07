import TypedEmitter from "typed-emitter";
import { InterfaceMessageEvents, InterfacePacketConnect, TypeHostConfig } from "../types/libtypes";
declare const webSocketClient_base: new () => TypedEmitter<InterfaceMessageEvents>;
export default class webSocketClient extends webSocketClient_base {
    private port;
    private hostAddress;
    private timeout;
    private client?;
    private connected;
    private url;
    constructor({ hostAddress, port, timeout, }?: TypeHostConfig, onFailed?: (message: string) => void);
    connect({ flags, keepAlive, clientID, will, }?: InterfacePacketConnect): void;
}
export {};

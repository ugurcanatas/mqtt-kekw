import TypedEmitter from "typed-emitter";
import { InterfaceMessageEvents, InterfacePacketConnect, TypeHostConfig } from "../types/libtypes";
declare const tcpClient_base: new () => TypedEmitter<InterfaceMessageEvents>;
export default class tcpClient extends tcpClient_base {
    private port;
    private hostAddress;
    private timeout;
    private client?;
    private connected;
    constructor({ type, hostAddress, port, timeout, }?: TypeHostConfig, onFailed?: (message: string) => void);
    connectToServer(): void;
    connectionUp: ({ flags, keepAlive, clientID, will, }?: InterfacePacketConnect) => void;
}
export {};

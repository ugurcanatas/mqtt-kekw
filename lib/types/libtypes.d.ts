/**
 * @author Uğurcan Emre Ataş
 * @email ugurcanemre93@gmail.com
 * @create date 2021-10-14 01:28:38
 * @modify date 2021-10-14 01:28:38
 * @desc [description]
 */
interface TypeHostConfig {
    hostAddress?: string;
    port?: number;
    /**
     * From Oasis Docs:
     * If the Client does not receive a CONNACK Packet from the Server within a reasonable amount of time, the Client SHOULD close the Network Connection.
     * A "reasonable" amount of time depends on the type of application and the communications infrastructure.
     * Default set to 5000ms in parameters
     */
    timeout?: number;
    type?: "ws" | "tcp";
}
/**
 * TypePacketConfig
 * @alias TypePacketConfig
 * @typedef {object} TypePacketConfig
 * @property {number} controlPacketType
 * CONNECT: 1
 * CONNACK: 2
 */
declare type TypePacketConfig = {
    controlPacketType: number;
    packetType?: InterfacePublish | InterfaceSubscribe | TypePacketConnect | InterfaceUnsubscribe;
};
declare type IPacketType = InterfacePublish | InterfaceSubscribe | TypePacketConnect | InterfaceUnsubscribe;
interface InterfacePublish {
    topic: string;
    message: string;
    dupFlag?: 0 | 1;
    QoS1?: 0 | 1;
    QoS2?: 0 | 1;
    retain?: 0 | 1;
}
interface InterfaceSubscribe {
    topic: string | string[];
    requestedQoS: 0 | 1;
}
interface InterfaceUnsubscribe {
    topic: string | string[];
    packetIdentifier: number[];
}
interface TypePacketConnect {
    controlPacketType: number;
    flags?: TypeConnectFlags;
    will?: TypeWill;
    keepAlive?: TypeKeepAlive;
    clientID?: string;
}
interface InterfacePacketConnect {
    flags?: TypeConnectFlags;
    will?: TypeWill;
    keepAlive?: TypeKeepAlive;
    clientID?: string;
}
declare type TypeKeepAlive = {
    hours?: number;
    minutes?: number;
    seconds?: number;
};
declare type TypeConnectFlags = {
    username?: string;
    password?: string;
    willRetain?: boolean;
    willQoS_1?: number;
    willQoS_2?: number;
    willFlag?: boolean;
    cleanSession?: boolean;
};
declare type TypeWill = {
    willTopic: string;
    willMessage: string;
};
declare type TypeSuback = {
    packetID: number[];
    returnCodes: TypeSubackReturnCodes[];
};
declare type TypeUnsuback = {
    packetID: number[];
};
declare type TypeSubackReturnCodes = {
    type: string;
    message: string;
    returnCode: string;
};
declare type TypePubackPubrecPubrel = {
    packetID: number[];
};
interface InterfaceMessageEvents {
    ready: () => void;
    error: (error: Error) => void;
    close: (hadError: boolean) => void;
    end: () => void;
    timeout: () => void;
    connectionAccepted: ({ returnCode, message, }: {
        returnCode: any;
        message: string;
    }) => void;
    connectionRefused: ({ returnCode, message, }: {
        returnCode: any;
        message: string;
    }) => void;
    suback: (payload: TypeSuback) => void;
    unsuback: (payload: TypeUnsuback) => void;
    puback: (payload: TypePubackPubrecPubrel) => void;
    pubrec: (payload: TypePubackPubrecPubrel) => void;
    pingresp: (payload: string) => void;
    received: ({ topic, payload }: {
        topic: string;
        payload: string;
    }) => void;
}
export { TypeHostConfig, TypePacketConfig, TypePacketConnect, TypeConnectFlags, TypeWill, TypeSuback, TypeSubackReturnCodes, TypeUnsuback, TypePubackPubrecPubrel, InterfacePacketConnect, InterfaceMessageEvents, InterfacePublish, InterfaceSubscribe, InterfaceUnsubscribe, IPacketType, };

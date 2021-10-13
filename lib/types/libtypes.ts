type TypeHostConfig = {
  hostAddress?: string;
  port?: number;
};
/**
 * TypePacketConfig
 * @alias TypePacketConfig
 * @typedef {object} TypePacketConfig
 * @property {number} controlPacketType
 * CONNECT: 1
 * CONNACK: 2
 */
type TypePacketConfig = {
  controlPacketType: number;
  packetType?:
    | InterfacePublish
    | InterfaceSubscribe
    | TypePacketConnect
    | InterfaceUnsubscribe;
};

interface InterfacePublish {
  topic: string; // indicates publish topic
  message: string; //indicates payload.
  dupFlag: 0 | 1; //Dup flag should set to 0 if first occasion. If re-delivery, DUP flag should set to 1
  QoS1: 0 | 1;
  QoS2: 0 | 1;
  retain: 0 | 1;
}

interface InterfaceSubscribe {
  topic: string | string[];
  requestedQoS: 0 | 1;
}

interface InterfaceUnsubscribe {
  topic: string | string[];
}

interface TypePacketConnect {
  controlPacketType: number;
  flags?: TypeConnectFlags;
  will?: TypeWill;
  keepAlive?: number;
  clientID?: string;
}

type TypeConnectFlags = {
  username?: string;
  password?: string;
  willRetain?: boolean;
  willQoS_1?: number;
  willQoS_2?: number;
  willFlag?: boolean;
  cleanSession?: boolean;
};

type TypeWill = {
  willTopic: string;
  willMessage: string;
};

type TypeSuback = {
  packetID: number[];
  returnCodes: TypeSubackReturnCodes[];
};

type TypeSubackReturnCodes = {
  type: string;
  message: string;
  returnCode: string;
};

interface InterfaceMessageEvents {
  ready: () => void;
  error: (error: Error) => void;
  close: (hadError: boolean) => void;
  connectionAccepted: ({
    returnCode,
    message,
  }: {
    returnCode: any;
    message: string;
  }) => void;
  connectionRefused: ({
    returnCode,
    message,
  }: {
    returnCode: any;
    message: string;
  }) => void;
  suback: (payload: TypeSuback) => void;
  pingresp: (payload: string) => void;
}

export {
  TypeHostConfig,
  TypePacketConfig,
  TypePacketConnect,
  TypeConnectFlags,
  TypeWill,
  InterfacePublish,
  InterfaceSubscribe,
  TypeSuback,
  TypeSubackReturnCodes,
  InterfaceMessageEvents,
};

type TypeHostConfig = {
  hostAddress?: string;
  port: number;
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
};

type TypePacketConnect = {
  controlPacketType: number;
  flags?: TypeConnectFlags;
  will?: TypeWill;
  keepAlive?: number;
  clientID?: string;
};

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

export {
  TypeHostConfig,
  TypePacketConfig,
  TypePacketConnect,
  TypeConnectFlags,
  TypeWill,
};

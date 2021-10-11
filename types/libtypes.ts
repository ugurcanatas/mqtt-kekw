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

export { TypeHostConfig, TypePacketConfig };

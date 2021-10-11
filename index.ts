//Entry file
import { TypeHostConfig, TypePacketConfig } from "./types/libtypes";

import { CONTROL_PACKET_TYPES } from "./utils";
import net from "net";
import EventEmitter from "events";

const kekw = ({ hostAddress = "localhost", port }: TypeHostConfig) => {
  let customEmiter = new EventEmitter();
  let client = new net.Socket();
  console.log("KekW Called");

  const up = () => {
    console.log("KekW UP", hostAddress);
    client.connect(port, hostAddress, () => customEmiter.emit("connected"));
  };

  client.on("ready", () => customEmiter.emit("ready"));

  client.on("error", (error: Error) => {
    customEmiter.emit("error", error);
    throw new Error(error.message);
  });

  client.on("close", (hadError: boolean) =>
    customEmiter.emit("close", hadError)
  );

  client.on("data", (data: Buffer | string) => customEmiter.emit("data", data));

  /**
   * Should return 7 bytes
   * first two bytes indicates the length of the protocol name. eg: "MQTT", length is 4
   * Each byte after first two is hex encodes of "MQTT" characters respectively.
   * 7th byte indicates protocol level. Which is decimal: 4, hex: 04
   *
   * MQTT > 3.1
   *
   * @todo add support for other MQTT versions later.
   */
  const buildVariableHeader = () => {
    /**
     * @link http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html#_Table_2.1_-
     * "The 8 bit unsigned value that represents the revision level of the protocol used by the Client.
     * The value of the Protocol Level field for the version 3.1.1 of the protocol is 4 (0x04)"
     */
    const protocolLevelByte = 0x04;
    const protocolNameBytes = "MQTT".split("").map((v) => v.charCodeAt(0));

    return [0, "MQTT".length, ...protocolNameBytes, protocolLevelByte];
  };

  //Filter and return fixed header raw hex value
  const buildFixedHeader = ({ type }: { type: number }) => {
    const PACKET_TYPE: { [key: number]: any } = {
      1: 0x10, //CONNECT
      2: 0x20, //CONNACK
      3: 0x30, //PUBLISH - Check Publish flags later Qos1 Qos2 etc...
      4: 0x40, //PUBACK
      5: 0x50, //PUBREC
      6: 0x62, //PUBREL
      7: 0x70, //PUBCOMP
      8: 0x82, //SUBSCRIBE
      9: 0x90, //SUBACK
      10: 0xa2, //UNSUBSCRIBE
      11: 0xb0, //UNSUBACK
      12: 0xc0, //PINGREQ
      13: 0xd0, //PINGRESP
      14: 0xe0, //DISCONNECT
    };
    return PACKET_TYPE[type];
  };

  const sendPacket = ({ controlPacketType }: TypePacketConfig) => {
    const fixedHeader = buildFixedHeader({ type: controlPacketType });

    switch (controlPacketType) {
      case CONTROL_PACKET_TYPES.CONNECT:
        connect();
        break;
      case CONTROL_PACKET_TYPES.SUBSCRIBE:
        break;

      default:
        break;
    }
  };

  const connect = () => {
    let remainingLength = []; //Calculate size later
    let variableHeader = buildVariableHeader();
    console.log("ON Connect Message: variableHeader", variableHeader);
  };

  return {
    up,
    listen: customEmiter,
    sendPacket,
  };
};

export { kekw };

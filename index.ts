//Entry file
import { hostConfig } from "./types/libtypes";

import net from "net";
import EventEmitter from "events";

const kekw = ({ hostAddress = "localhost", port }: hostConfig) => {
  let customEmiter = new EventEmitter();
  let client = null;
  console.log("KekW Called");

  const up = () => {
    console.log("KekW UP", hostAddress);

    client = new net.Socket();

    client.connect(port, hostAddress, () => customEmiter.emit("connected"));

    client.on("ready", () => customEmiter.emit("ready"));

    client.on("error", (error: Error) => customEmiter.emit("error", error));

    client.on("close", (hadError: boolean) =>
      customEmiter.emit("close", hadError)
    );

    client.on("data", (data: Buffer | string) =>
      customEmiter.emit("data", data)
    );
  };

  //Filter and return fixed header raw hex value
  const buildFixedHeader = (type: number) => {
    return {
      0: () => "RESERVED",
      1: () => 0x10, //CONNECT
      2: () => 0x20, //CONNACK
      3: () => 0x30, //PUBLISH - Check Publish flags later
      4: () => 0x40, //PUBACK
      5: () => 0x50, //PUBREC
      6: () => 0x62, //PUBREL
      7: () => 0x70, //PUBCOMP
      8: () => 0x82, //SUBSCRIBE
      9: () => 0x90, //SUBACK
      10: () => 0xa2, //UNSUBSCRIBE
      11: () => 0xb0, //UNSUBACK
      12: () => 0xc0, //PINGREQ
      13: () => 0xd0, //PINGRESP
      14: () => 0xe0, //DISCONNECT
      15: () => "RESERVED",
    };
  };

  const sendPacket = () => {};

  return {
    up,
    listen: customEmiter,
    sendPacket,
  };
};

export { kekw };

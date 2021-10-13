/**
 * @author Uğurcan Emre Ataş <ugurcanemre93@gmail.com>
 * Date: 05.10.2021
 *
 * Add unit testing for these functions.
 */
//Entry file
import net from "net";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import {
  InterfaceMessageEvents,
  InterfaceSubscribe,
  InterfaceUnsubscribe,
  TypeHostConfig,
  TypePacketConfig,
  TypePacketConnect,
} from "./types/libtypes";
import {
  CONTROL_PACKET_TYPES,
  RESPONSE_TYPES_DECIMAL,
  CONNACK_ERROR_MESSAGES,
} from "./helpers/utils.js";
import {
  buildConnectFlags,
  parseSubscribePacket,
  buildVariableHeader,
  buildFixedHeader,
  parseSubackData,
  buildUnsubscribe,
  buildSubscribe,
  parseUnsubackData,
} from "./helpers/general-helpers.js";

const kekw = (
  { hostAddress = "localhost", port = 1883, timeout = 5000 }: TypeHostConfig,
  callbackFn: () => void,
  onFailed: (message: string) => void
) => {
  let connected = false;
  let client = new net.Socket();
  client.connect(port, hostAddress, callbackFn);
  let customEmiter = new EventEmitter() as TypedEmitter<InterfaceMessageEvents>;
  setTimeout(() => {
    if (!connected) {
      onFailed(
        "Client did not receive a CONNACK packet for a reasonable amount of time. Closing..."
      );
      client.destroy();
    }
  }, timeout);
  // (() => {
  //   console.log("This is a anon function that starts at the beginning !");
  //   client.connect(port, hostAddress, callbackFn);
  // })();

  client.on("ready", () => {
    connected = true;
    customEmiter.emit("ready");
  });

  client.on("error", (error: Error) => {
    customEmiter.emit("error", error);
    throw new Error(error.message);
  });

  client.on("close", (hadError: boolean) =>
    customEmiter.emit("close", hadError)
  );

  client.on("data", (data: Buffer) => {
    console.log("Data Received", data);
    const firstOffset = data.readUInt8(0);
    console.log("Data ReceivedFirst Offset", firstOffset);
    switch (firstOffset) {
      case RESPONSE_TYPES_DECIMAL.CONNACK:
        const { data: connackBytes } = data.toJSON();
        console.log("CONNACK JSON", connackBytes);
        //add Connect Acknowledge Flags filter later.
        //connackBytes[3] indicates the return code from the server after connect packet received
        switch (connackBytes[3]) {
          case CONNACK_ERROR_MESSAGES[0].decimal:
            customEmiter.emit("connectionAccepted", {
              returnCode: CONNACK_ERROR_MESSAGES[0].returnCode,
              message: CONNACK_ERROR_MESSAGES[0].description,
            });
            break;
          default:
            customEmiter.emit("connectionRefused", {
              returnCode: CONNACK_ERROR_MESSAGES[connackBytes[3]].returnCode,
              message: CONNACK_ERROR_MESSAGES[0].description,
            });
            break;
        }

        break;
      case RESPONSE_TYPES_DECIMAL.PINGRESP:
        customEmiter.emit("pingresp", "Server pinged back!!!");
        break;
      case RESPONSE_TYPES_DECIMAL.SUBACK:
        const suback = parseSubackData({ data });
        customEmiter.emit("suback", suback);
        break;
      case RESPONSE_TYPES_DECIMAL.UNSUBACK:
        const unsuback = parseUnsubackData({ data });
        customEmiter.emit("unsuback", unsuback);
        break;
      case RESPONSE_TYPES_DECIMAL.PACKET_RECEIVED:
        console.log("Publish Packet Received");
        const { topic, payload } = parseSubscribePacket({ data });
        console.log(
          `Topic received: ${topic} ### Payload received: ${payload}`
        );

        break;

      default:
        break;
    }
  });

  const sendConnectPacket = ({
    controlPacketType,
    flags = {
      username: undefined,
      password: undefined,
      willRetain: false,
      willQoS_2: 0,
      willQoS_1: 0,
      willFlag: false,
      cleanSession: true,
    },
    keepAlive = 60,
    clientID = "mqttTestClient",
    will = {
      willTopic: "topic",
      willMessage: "message",
    },
  }: TypePacketConnect) => {
    //build fixed header
    const fixedHeader = buildFixedHeader({ type: controlPacketType });
    //build variable header
    const variableHeader = buildVariableHeader();
    //Check flags, convert binary array to decimal
    const connectFlags = buildConnectFlags(flags);
    //Create keep alive array, change here later.
    const keepAliveByte = new Uint8Array([0, keepAlive]);

    let clientPayload = new Uint8Array([
      0,
      clientID.length,
      ...clientID.split("").map((v) => v.charCodeAt(0)),
    ]);

    let willTopicPayload = flags.willFlag
      ? new Uint8Array([
          0,
          will.willTopic.length,
          ...will.willTopic.split("").map((v) => v.charCodeAt(0)),
        ])
      : [];

    let willMessagePayload = flags.willFlag
      ? new Uint8Array([
          0,
          will.willMessage.length,
          ...will.willMessage.split("").map((v) => v.charCodeAt(0)),
        ])
      : [];

    console.log("Testing so far ");
    console.log("Fixed Header", fixedHeader);
    console.log("Variable Header", variableHeader);
    console.log("Connect Flags", connectFlags);
    console.log("Client Payload ", clientPayload);

    let buffer = Buffer.from(
      [
        fixedHeader,
        //remaining length
        keepAliveByte.length + variableHeader.length + clientPayload.length + 1,
        ...variableHeader,
        connectFlags,
        ...keepAliveByte,
        ...clientPayload,
      ] as any,
      "hex"
    );
    //If there is a will, add them to the end of the buffer aswell
    if (flags.willFlag) {
      buffer = Buffer.concat([
        buffer,
        Buffer.from([...willTopicPayload, ...willMessagePayload]),
      ]);
    }
    console.log("HEX Buffer", buffer);
    client.write(buffer);
  };

  const sendPacket = ({ controlPacketType, packetType }: TypePacketConfig) => {
    const fixedHeader = buildFixedHeader({ type: controlPacketType });

    switch (controlPacketType) {
      case CONTROL_PACKET_TYPES.CONNECT:
        sendConnectPacket({ controlPacketType });
        break;
      case CONTROL_PACKET_TYPES.SUBSCRIBE:
        const subscribeBuffer = buildSubscribe(
          packetType as InterfaceSubscribe,
          fixedHeader
        );
        client.write(subscribeBuffer);
        break;
      case CONTROL_PACKET_TYPES.UNSUBSCRIBE:
        const unsubBuffer = buildUnsubscribe(
          packetType as InterfaceUnsubscribe,
          fixedHeader
        );
        client.write(unsubBuffer);

        break;
      case CONTROL_PACKET_TYPES.PUBLISH:
        //Fixed Header byte 1 - bits 7-4 => Packet Type, bits 3-0 => Respectively, DUP Flag, (bits 2 and 1) QoS Level, Retain
        //Remaining Length byte 2
        // Variable Header: Respectively
        // topic length [MSB,LSB] [0,length of topic, ...each topic character]
        // byte 1 topic name
        // byte 2
        break;
      case CONTROL_PACKET_TYPES.PINGREQ:
        pingRequest({ type: controlPacketType });
        break;
      case CONTROL_PACKET_TYPES.DISCONNECT:
        disconnectRequest({ fixedHeader });
        break;

      default:
        break;
    }
  };

  const disconnectRequest = ({ fixedHeader }: { fixedHeader: any }) => {
    const buffer = Buffer.from(new Uint8Array([fixedHeader, 0]) as any, "hex");
    client.write(buffer);
    client.destroy();
  };

  //Response d0 00
  const pingRequest = ({ type }: { type: number }) => {
    const fixedHeader = buildFixedHeader({ type });
    const request = new Uint8Array([fixedHeader, 0]);
    const reqBuffer = Buffer.from(request as any, "hex");
    client.write(reqBuffer);
  };

  return {
    //up,
    listen: customEmiter,
    sendPacket,
  };
};

export { kekw };

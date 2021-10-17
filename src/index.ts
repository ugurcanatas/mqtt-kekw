/**
 * @author Uğurcan Emre Ataş
 * @email ugurcanemre93@gmail.com
 * @create date 2021-10-14 01:28:21
 * @modify date 2021-10-14 01:28:21
 * @desc [description]
 */

//Entry fileasdasd
import net from "net";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import {
  InterfaceMessageEvents,
  InterfacePublish,
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
  buildPublish,
  parsePubResponses,
  convertKeepAliveToHex,
} from "./helpers/general-helpers.js";

export const kekw = (
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

  client.on("close", (hadError: boolean) => {
    connected = false;
    customEmiter.emit("close", hadError);
  });

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
      /**
       * QoS = 1, At least once delivery
       */
      case RESPONSE_TYPES_DECIMAL.PUBACK:
        const pubackPacketID = parsePubResponses({ data });
        customEmiter.emit("puback", pubackPacketID);
        break;
      /**
       * QoS = 2, At most once delivery
       */
      case RESPONSE_TYPES_DECIMAL.PUBREC:
        const pubrecPacketID = parsePubResponses({ data });
        customEmiter.emit("pubrec", pubrecPacketID);
        break;
      case RESPONSE_TYPES_DECIMAL.PACKET_RECEIVED:
        console.log("Publish Packet Received");
        const { topic, payload } = parseSubscribePacket({ data });
        console.log(
          `Topic received: ${topic} ### Payload received: ${payload}`
        );
        //customEmiter.emit("received");
        break;

      default:
        break;
    }
  });

  // customEmiter.on("received", () => {
  //   console.log("Message Received");
  //   customInterval && clearInterval(customInterval);
  //   customInterval = setInterval(() => {
  //     if (!connected) {
  //       client.connect(port, hostAddress, callbackFn);
  //     }
  //     pingRequest({
  //       type: CONTROL_PACKET_TYPES.PINGREQ,
  //     });
  //     console.log(`Ran every ${60 * 1000}`);
  //   }, 60 * 1000);
  // });

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
    keepAlive = {
      hours: 1,
      minutes: 0,
      seconds: 0,
    },
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
    //get keep alive 2 byte hex
    const intervalHex = convertKeepAliveToHex({
      hours: keepAlive?.hours,
      minutes: keepAlive?.minutes,
      seconds: keepAlive?.seconds,
    });

    let clientPayload = [
      0,
      clientID.length,
      ...clientID.split("").map((v) => v.charCodeAt(0)),
    ];

    let willTopicPayload = flags.willFlag
      ? [
          0,
          will.willTopic.length,
          ...will.willTopic.split("").map((v) => v.charCodeAt(0)),
        ]
      : [];

    let willMessagePayload = flags.willFlag
      ? [
          0,
          will.willMessage.length,
          ...will.willMessage.split("").map((v) => v.charCodeAt(0)),
        ]
      : [];

    let buffer = Buffer.from(
      [
        fixedHeader,
        //remaining length
        intervalHex.length + variableHeader.length + clientPayload.length + 1,
        ...variableHeader,
        connectFlags,
        ...intervalHex,
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
        const pubBuffer = buildPublish(
          packetType as InterfacePublish,
          fixedHeader
        );
        console.log("Build Buffer", pubBuffer);
        client.write(pubBuffer);
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

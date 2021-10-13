//Entry file
import {
  InterfaceSubscribe,
  TypeHostConfig,
  TypePacketConfig,
  TypePacketConnect,
} from "./types/libtypes";
import {
  CONTROL_PACKET_TYPES,
  RESPONSE_TYPES_DECIMAL,
  CONNECT_ERROR_MESSAGES,
} from "./helpers/utils.js";
import {
  buildConnectFlags,
  parseSubscribePacket,
  buildVariableHeader,
  buildFixedHeader,
  parseSubackData,
} from "./helpers/general-helpers.js";
import net from "net";
import EventEmitter from "events";

const kekw = (
  { hostAddress = "localhost", port }: TypeHostConfig,
  callbackFn: () => void
) => {
  let client = new net.Socket();
  client.connect(port, hostAddress, callbackFn);
  let customEmiter = new EventEmitter();
  // (() => {
  //   console.log("This is a anon function that starts at the beginning !");
  //   client.connect(port, hostAddress, callbackFn);
  // })();

  client.on("ready", () => customEmiter.emit("ready"));

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
        const connackBytes = new Uint8Array(data);
        console.log("CONNACK Uint8 Array", connackBytes);

        //connackBytes[3] indicates the return code from the server after connect packet received
        switch (connackBytes[3]) {
          case CONNECT_ERROR_MESSAGES[0].decimal:
            console.log("Connection Accepted !!!!");
            customEmiter.emit("connection-accepted", {
              returnCode: CONNECT_ERROR_MESSAGES[0].returnCode,
              message: CONNECT_ERROR_MESSAGES[0].description,
            });
            break;

          default:
            console.log("Connection Refused");
            customEmiter.emit("connection-refused", {
              responseCode: CONNECT_ERROR_MESSAGES[connackBytes[3]].returnCode,
              message: CONNECT_ERROR_MESSAGES[0].description,
            });
            break;
        }

        break;

      case RESPONSE_TYPES_DECIMAL.PINGRESP:
        console.log("Ping Response From Server");
        customEmiter.emit("ping-response", "Server pinged back!!!");
        break;
      case RESPONSE_TYPES_DECIMAL.SUBACK:
        console.log("SUBACK received");
        const suback = parseSubackData({ data });
        customEmiter.emit("suback", suback);
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
        const { topic, requestedQoS } = packetType as InterfaceSubscribe;
        let encodedTopic = null;
        if (typeof topic === "string") {
          //single topic
          encodedTopic = new Uint8Array([
            0,
            topic.length,
            ...topic.split("").map((v) => v.charCodeAt(0)),
            requestedQoS, //Requested QOS
          ]);
          console.log("Subscribe packet is => ", encodedTopic);
        } else {
          //array of topics. loop
          encodedTopic = new Uint8Array();
        }
        //packet identifier at variable header.
        const packetIdentifier = new Uint8Array([0, 16]);

        const subscribeBuffer = Buffer.from(
          [
            fixedHeader,
            packetIdentifier.length + encodedTopic.length,
            ...packetIdentifier,
            ...encodedTopic,
          ] as any,
          "hex"
        );
        console.log("Sub Buffer", subscribeBuffer);
        client.write(subscribeBuffer);
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

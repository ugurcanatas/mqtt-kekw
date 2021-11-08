/**
 * @author Uğurcan Emre Ataş
 * @email ugurcanemre93@gmail.com
 * @create date 2021-10-14 01:28:21
 * @modify date 2021-10-14 01:28:21
 * @desc [description]
 */

import net from "net";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import {
  InterfaceMessageEvents,
  InterfacePacketConnect,
  InterfacePublish,
  InterfaceSubscribe,
  InterfaceUnsubscribe,
  TypeHostConfig,
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
  fieldWithSize,
  randomize,
} from "./helpers/general-helpers.js";

export class kekwClient extends (EventEmitter as new () => TypedEmitter<InterfaceMessageEvents>) {
  private port: number;
  private hostAddress: string;
  private timeout: number;
  private client?: net.Socket;
  private connected: boolean;
  constructor(
    {
      hostAddress = "localhost",
      port = 1883, //mosquitto default port
      timeout = 5000,
    }: TypeHostConfig = {},
    onFailed?: (message: string) => void
  ) {
    super();
    this.port = port;
    this.hostAddress = hostAddress;
    this.timeout = timeout;
    this.connected = false;
    this.client = new net.Socket();
    console.log("This Runs", this.hostAddress, this.port);
    this.connectToServer();
    setTimeout(() => {
      if (!this.connected) {
        onFailed &&
          onFailed(
            "Client did not receive a CONNACK packet for a reasonable amount of time. Closing..."
          );
        this.client?.destroy();
      }
    }, timeout);
  }

  getConnectionState() {
    return this.connected;
  }

  connectToServer() {
    this.client?.connect(this.port, this.hostAddress, () => {
      console.log("Connection Listener");
    });

    this.client?.on("connect", () => {
      console.log("Connected");
    });

    this.client?.on("ready", () => {
      console.log("Ready");
      this.emit("ready");
    });

    this.client?.on("close", (hadError: boolean) => {
      console.log("Is Closed", hadError);
      this.connected = false;
      this.emit("close", hadError);
    });

    this.client?.on("end", () => {
      this.connected = false;
      this.emit("end");
    });

    this.client?.on("timeout", () => {
      this.emit("timeout");
    });

    this.client?.on("error", (error: Error) => {
      this.emit("error", error);
      this.connected = false;
      throw Error(error.message);
    });

    this.client?.on("data", (buffer: Buffer) => {
      const { data } = buffer.toJSON();
      console.log("JSON Buffer", data);
      switch (data[0]) {
        case RESPONSE_TYPES_DECIMAL.CONNACK:
          switch (data[3]) {
            case CONNACK_ERROR_MESSAGES[0].decimal:
              this.connected = true;
              this.emit("connectionAccepted", {
                returnCode: CONNACK_ERROR_MESSAGES[0].returnCode,
                message: CONNACK_ERROR_MESSAGES[0].description,
              });
              break;
            default:
              this.connected = false;
              this.emit("connectionRefused", {
                returnCode: CONNACK_ERROR_MESSAGES[data[3]].returnCode,
                message: CONNACK_ERROR_MESSAGES[data[3]].description,
              });
              break;
          }
          break;
        case RESPONSE_TYPES_DECIMAL.PINGRESP:
          this.emit("pingresp", "Broker Pinged Back");
          break;
        case RESPONSE_TYPES_DECIMAL.SUBACK:
          const suback = parseSubackData({ data });
          this.emit("suback", suback);
          break;
        case RESPONSE_TYPES_DECIMAL.UNSUBACK:
          const unsuback = parseUnsubackData({ data });
          this.emit("unsuback", unsuback);
          break;
        /**
         * QoS = 1, At least once delivery
         */
        case RESPONSE_TYPES_DECIMAL.PUBACK:
          const pubackPacketID = parsePubResponses({ data });
          this.emit("puback", pubackPacketID);
          break;
        /**
         * QoS = 2, At most once delivery
         */
        case RESPONSE_TYPES_DECIMAL.PUBREC:
          const pubrecPacketID = parsePubResponses({ data });
          this.emit("pubrec", pubrecPacketID);
          break;
        case RESPONSE_TYPES_DECIMAL.PACKET_RECEIVED:
          console.log("Publish Packet Received");
          const { topic, payload } = parseSubscribePacket({ data: buffer });
          console.log(`Topic received: ${topic}  Payload received: ${payload}`);
          this.emit("received", {
            topic,
            payload,
          });
          break;

        default:
          break;
      }
    });
  }

  connectionUp = ({
    flags = {
      username: undefined,
      password: undefined,
      willRetain: false,
      willQoS_2: 0,
      willQoS_1: 0,
      willFlag: true,
      cleanSession: true,
    },
    keepAlive = {
      hours: 1,
      minutes: 0,
      seconds: 0,
    },
    clientID = randomize("mqttClient"),
    will = {
      willTopic: randomize("topic"),
      willMessage: randomize("message"),
    },
  }: InterfacePacketConnect = {}) => {
    const fixedHeader = buildFixedHeader({
      type: CONTROL_PACKET_TYPES.CONNECT,
    });
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
    /**
     * Full Format from first byte to last byte
     * byte 1 - bit 7-4, MQTT Control Packet Type, bit 3-0 reserved field.
     * byte 2 - remaining length: variableHeader.length + payload.length
     */

    let clientPayload = [
      0,
      clientID.length,
      ...clientID.split("").map((v) => v.charCodeAt(0)),
      ...(flags.willFlag
        ? [
            0,
            will.willTopic.length,
            ...will.willTopic.split("").map((v) => v.charCodeAt(0)),
            0,
            will.willMessage.length,
            ...will.willMessage.split("").map((v) => v.charCodeAt(0)),
          ]
        : []),
      ...(flags.username !== undefined ? fieldWithSize(flags.username) : []),
      ...(flags.password !== undefined ? fieldWithSize(flags.password) : []),
    ];

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
    //console.log("Client Payload Buffer", buffer);
    this.client?.write(buffer);
  };

  subscribeTo = (packetConfig: InterfaceSubscribe) => {
    const subscribeBuffer = buildSubscribe(
      packetConfig,
      buildFixedHeader({
        type: CONTROL_PACKET_TYPES.SUBSCRIBE,
      })
    );
    this.client?.write(subscribeBuffer);
  };

  unsubscribeFrom = (packetConfig: InterfaceUnsubscribe) => {
    const unsubBuffer = buildUnsubscribe(
      packetConfig,
      buildFixedHeader({
        type: CONTROL_PACKET_TYPES.UNSUBSCRIBE,
      })
    );
    this.client?.write(unsubBuffer);
  };

  ping = () => {
    const fixedHeader = buildFixedHeader({
      type: CONTROL_PACKET_TYPES.PINGREQ,
    });
    const request = new Uint8Array([fixedHeader, 0]);
    const reqBuffer = Buffer.from(request as any, "hex");
    this.client?.write(reqBuffer);
  };

  publishTo = (packetConfig: InterfacePublish) => {
    const pubBuffer = buildPublish(
      packetConfig,
      buildFixedHeader({
        type: CONTROL_PACKET_TYPES.PUBLISH,
      })
    );
    console.log("Build Buffer", pubBuffer);
    this.client?.write(pubBuffer);
  };

  disconnect = () => {
    const fixedHeader = buildFixedHeader({
      type: CONTROL_PACKET_TYPES.DISCONNECT,
    });
    const buffer = Buffer.from(new Uint8Array([fixedHeader, 0]) as any, "hex");
    this.client?.write(buffer);
    this.client?.destroy();
  };
}

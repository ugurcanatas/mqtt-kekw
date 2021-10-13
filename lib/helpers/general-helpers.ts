/**
 * @author Uğurcan Emre Ataş <ugurcanemre93@gmail.com>
 * Date: 05.10.2021
 *
 * Add unit testing for these functions.
 */

import {
  InterfacePublish,
  InterfaceSubscribe,
  InterfaceUnsubscribe,
  TypeConnectFlags,
  TypeSuback,
  TypeUnsuback,
} from "../types/libtypes";
import { SUBACK_RETURN_TYPES } from "./utils.js";

/**
 * Connect flag bits in Connect Packet are located in byte 8.
 * More information: @link http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html#_Toc398718030 (3.1.2.3 Connect Flags)
 * Explained bit 7 to bit 1 respectively.
 * @param username - bit 7: username flag. Optional. If empty or undefined, we will set related bit to 0.
 * @param password - bit 6: password flag. Optional. If empty or undefined, we will set related bit to 0.
 * @param willRetain - bit 5: willRetain flag. Optional. Explain more...
 * @param willQoS_2 - bit 4: willQoS_2 flag. Optional. Explain more...
 * @param willQoS_1 - bit 3: willQoS_1 flag. Optional. Explain more...
 * @param willFlag - bit 2: willFlag flag. If set to 1, willMessage and willTopic must be present in the connect packet.
 * @param cleanSession - bit 1: cleanSession flag. Explain more.
 */
export const buildConnectFlags = ({
  username,
  password,
  willRetain,
  willQoS_2,
  willQoS_1,
  willFlag,
  cleanSession,
}: TypeConnectFlags) => {
  return parseInt(
    [
      username !== undefined ? 1 : 0,
      password !== undefined ? 1 : 0,
      willRetain !== undefined ? (willRetain ? 1 : 0) : 0,
      willQoS_2 !== undefined ? willQoS_2 : 0,
      willQoS_1 !== undefined ? willQoS_1 : 0,
      willFlag !== undefined ? (willFlag ? 1 : 0) : 0,
      cleanSession !== undefined ? (cleanSession ? 1 : 0) : 0,
      0, //Reserved
    ].join(""),
    2
  );
};

/**
 *
 * @param data Data received from TCP socket. Contains raw hex
 *
 * **STEPS**:
 * - Step 1:
 * remainingLength - read offset 1 from buffer as Uint8. This indicates the remaining length in decimal format.
 * eg: "let's say we received 1D on offset 1. If you convert 1D to decimal, you are going to get 29
 * This means that there are 29 bytes after 1 byte fixed header and 1 byte remaining length fields."
 *
 * - Step 2:
 * Reading offset 2 and 3 is going to give us the length of the "topic" field. MSB of first topic field byte is 00
 * and LSB of sencond topic field byte is 04. Total is 4. So our topic is a 4 character UTF-8 string.
 *
 * - Step 3: Reading the topic as utf8 string.
 * At this point we already have the remainingLength and topicLength variables ready. Topic LSB and MSB ends at byte 3 and 4.
 * With provided information, if we start a for loop from offset 4 (indicates byte 4)  and loop until topicLength + 4,
 * (remember first 4 bytes are fixed always) in theory we should be able to read all characters in the topic field.
 *
 * - Step 4: Reading the payload as utf8 string
 * After topic is read, loop from where we left off, which is topicLength + 4 till remainingLength + 1. With that,
 * we should get all the payload
 *
 * @TODO Test a long payload message.
 */
export const parseSubscribePacket = ({
  data,
}: {
  data: Buffer;
}): { topic: string; payload: string } => {
  //bit in location 1 indicates remainingLength.
  const remainingLength = data.readUInt8(1);
  //next two bits indicate the length of the topic
  const topicLength = data.readUInt8(2) + data.readUInt8(3);

  let topic = "";
  for (let index = 4; index < topicLength + 4; index++) {
    topic += String.fromCharCode(data.readUInt8(index));
  }

  //read rest
  let payload = "";
  for (let index = topicLength + 4; index <= remainingLength + 1; index++) {
    payload += String.fromCharCode(data.readUInt8(index));
  }

  return {
    topic,
    payload,
  };
};

/**
 * Variable header is used to indicate the protocol name length and protocol name.
 * Protocol name is <code>MQTT</code> for now and static.
 * According to docs, variable header in Connect Packet consists of:
 * 2 bytes of protocol length (MQTT => 00 04) and 4 bytes of each character in MQTT.
 * Protocol Level byte is not part of variable header but we can return Protocol Level byte with
 * variable header since these bytes are respectively as follows: [Protocol Length MSB | Protocol Length LSB | M | Q | T | T | Protocol Level]
 *
 * MQTT > 3.1
 *
 * @link http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html#_Table_2.1_-
 * "The 8 bit unsigned value that represents the revision level of the protocol used by the Client.
 * The value of the Protocol Level field for the version 3.1.1 of the protocol is 4 (0x04)"
 *
 * @TODO add support for other MQTT versions later.
 */
export const buildVariableHeader = () => {
  //Fixed protocol level
  const protocolLevelByte = 0x04;
  const protocolNameBytes = "MQTT".split("").map((v) => v.charCodeAt(0));

  return [0, "MQTT".length, ...protocolNameBytes, protocolLevelByte];
};

//Filter and return fixed header raw hex value
export const buildFixedHeader = ({ type }: { type: number }) => {
  const PACKET_TYPE: { [key: number]: any } = {
    1: 0x10, //CONNECT 16 Decimal
    2: 0x20, //CONNACK 32 Decimal
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

/**
 *
 * @param data Buffer from on("data")  event listener in TCP socket.
 *
 * According to oasis documentation; SUBACK packet is a subscribe acknowledgement package that service sends to the client.
 * Packet consists of following.
 *
 * - ### Fixed Header
 * - Byte 1 includes, bits [7-4] fixed header and bits [3-0] Reserved bits.
 * - Byte 2 includes remaining length. Remaining length does not include fixed header and itself.
 *
 * - ### Variable Header
 * - Byte 1 : Packet identifier MSB
 * - Byte 2 : Packet identifier LSB
 *
 * - ### Payload
 * - Payload consists of return codes. Allowed return codes are in the following.
 *
 * 0x00 - Success - Maximum QoS 0
 *
 * 0x01 - Success - Maximum QoS 1
 *
 * 0x02 - Success - Maximum QoS 2
 *
 * 0x80 - Failure
 *
 * @returns
 */
export const parseSubackData = ({ data }: { data: Buffer }): TypeSuback => {
  const { data: bufferData } = data.toJSON();
  //console.log("Buffer To JSON", bufferData);
  // first one is fixedHeader, second is remainingLength.
  const [, , piMSB, piLSB] = bufferData;

  let returnCodes = [];
  for (let index = 4; index < bufferData.length; index++) {
    const returnType = bufferData[index];
    returnCodes.push(SUBACK_RETURN_TYPES[returnType]);
  }

  return {
    returnCodes,
    packetID: [piMSB, piLSB],
  };
};

export const parseUnsubackData = ({ data }: { data: Buffer }): TypeUnsuback => {
  const { data: bufferData } = data.toJSON();
  const [, , piMSB, piLSB] = bufferData;
  return {
    packetID: [piMSB, piLSB],
  };
};

/**
 *
 * @param topic
 * @param requestedQoS
 * @param fixedHeader
 *
 * Add explanation later
 *
 *
 * @returns Buffer
 */
export const buildSubscribe = (
  { topic, requestedQoS }: InterfaceSubscribe,
  fixedHeader: any
) => {
  let encodedTopic;
  if (typeof topic === "string") {
    //single topic
    encodedTopic = [
      0,
      topic.length,
      ...topic.split("").map((v) => v.charCodeAt(0)),
      requestedQoS, //Requested QOS
    ];
    console.log("Subscribe packet is => ", encodedTopic);
  } else {
    //array of topics. loop
    encodedTopic = topic
      .map((v) => [
        0,
        v.length,
        ...v.split("").map((v) => v.charCodeAt(0)),
        requestedQoS,
      ])
      .reduce((f, s) => [...f, ...s]);
  }
  //packet identifier at variable header.
  const packetIdentifier = [0, 16];

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
  return subscribeBuffer;
};

/**
 *
 * @param packetIdentifier 2 byte identifier Received from subscribe. Pass it to unsub request.
 * @param topic either string | string[] type. We should be able to unsubscribe from a single topic or multiple topics
 */
export const buildUnsubscribe = (
  { packetIdentifier, topic }: InterfaceUnsubscribe,
  fixedHeader: any
) => {
  let encodedUnsubTopic;
  //type check for single or multi topics
  if (typeof topic === "string") {
    encodedUnsubTopic = [
      0,
      topic.length,
      ...topic.split("").map((v) => v.charCodeAt(0)),
    ];
  } else {
    encodedUnsubTopic = topic
      .map((v) => [0, v.length, ...v.split("").map((v) => v.charCodeAt(0))])
      .reduce((f, s) => [...f, ...s]);
  }

  let remainingLength = encodedUnsubTopic.length + packetIdentifier.length;
  const buffer = Buffer.from([
    fixedHeader,
    remainingLength,
    ...packetIdentifier,
    ...encodedUnsubTopic,
  ]);
  console.log("Unsubscribe Buffer", buffer);
  return buffer;
};

/**
 *
 * @param param0
 * @param fixedHeader
 * @returns
 *
 * @TODO send variable header if QoS Level > 0
 */
export const buildPublish = (
  {
    message,
    topic,
    QoS1 = 0,
    QoS2 = 0,
    dupFlag = 0,
    retain = 0,
  }: InterfacePublish,
  fixedHeader: any
) => {
  console.log("Publish Fixed Header", fixedHeader);
  //fixed header
  const fixedHeaderDecimal = parseInt(
    `0011${dupFlag}${QoS2}${QoS1}${retain}`,
    2
  );
  //variable header
  const topicArray = [
    0,
    topic.length,
    ...topic.split("").map((v) => v.charCodeAt(0)),
  ];

  const messageArray = [
    0,
    message.length,
    ...message.split("").map((v) => v.charCodeAt(0)),
  ];

  const buffer = Buffer.from([
    fixedHeaderDecimal,
    topicArray.length + messageArray.length,
    ...topicArray,
    ...messageArray,
  ]);
  return buffer;

  // Test without packet id first. const packetID = [0,]
};

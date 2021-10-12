/**
 * @author Uğurcan Emre Ataş <ugurcanemre93@gmail.com>
 * Date: 05.10.2021
 */

import { TypeConnectFlags } from "../types/libtypes";

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
  const remainingLength = data.readUInt8(1);
  console.log("Reading remaining length", remainingLength);

  //next two bits indicate the length of the topic
  const topicLength = data.readUInt8(2) + data.readUInt8(3);
  console.log("Reading Topic Length", topicLength);

  let topic = "";
  for (let index = 4; index < topicLength + 4; index++) {
    //console.log("Topic Data decoding", data.readUInt8(index));
    topic += String.fromCharCode(data.readUInt8(index));
  }

  console.log("Topic", topic);
  //read rest
  let payload = "";
  for (let index = topicLength + 4; index <= remainingLength + 1; index++) {
    //console.log("Sub message decoding", data.readUInt8(index));
    payload += String.fromCharCode(data.readUInt8(index));
  }
  console.log("Payload", payload);

  return {
    topic,
    payload,
  };
};

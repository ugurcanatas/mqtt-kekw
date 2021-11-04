/**
 * @author Uğurcan Emre Ataş
 * @email ugurcanemre93@gmail.com
 * @create date 2021-10-14 01:28:31
 * @modify date 2021-10-14 01:28:31
 * @desc [description]
 */
/// <reference types="node" />
import { InterfacePublish, InterfaceSubscribe, InterfaceUnsubscribe, TypeConnectFlags, TypePubackPubrecPubrel, TypeSuback, TypeUnsuback } from "../types/libtypes";
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
export declare const buildConnectFlags: ({ username, password, willRetain, willQoS_2, willQoS_1, willFlag, cleanSession, }: TypeConnectFlags) => number;
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
export declare const parseSubscribePacket: ({ data, }: {
    data: Buffer;
}) => {
    topic: string;
    payload: string;
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
export declare const buildVariableHeader: () => number[];
export declare const buildFixedHeader: ({ type }: {
    type: number;
}) => any;
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
export declare const parseSubackData: ({ data }: {
    data: number[];
}) => TypeSuback;
export declare const parseUnsubackData: ({ data, }: {
    data: number[];
}) => TypeUnsuback;
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
export declare const buildSubscribe: ({ topic, requestedQoS }: InterfaceSubscribe, fixedHeader: any) => Buffer;
/**
 *
 * @param packetIdentifier 2 byte identifier Received from subscribe. Pass it to unsub request.
 * @param topic either string | string[] type. We should be able to unsubscribe from a single topic or multiple topics
 */
export declare const buildUnsubscribe: ({ packetIdentifier, topic }: InterfaceUnsubscribe, fixedHeader: any) => Buffer;
/**
 *
 * @param param0
 * @param fixedHeader
 * @returns
 *
 * QoS definitions
 * QoS Value    Bit 2   Bit 1   Description
 * -----------------------------------------
 *     0          0       0     At most once delivery
 *     1          0       1     At least once delivery
 *     2          1       0     Exactly once delivery
 *     3          1       1     Reserver - Must not be used
 *
 * @TODO send variable header if QoS Level > 0
 */
export declare const buildPublish: ({ message, topic, QoS1, QoS2, dupFlag, retain, }: InterfacePublish, fixedHeader: any) => Buffer;
/**
 * Used for PUBACK, PUBREC, PUBREL
 */
export declare const parsePubResponses: ({ data, }: {
    data: number[];
}) => TypePubackPubrecPubrel;
declare type Time = {
    hours?: 0 | number;
    minutes?: 0 | number;
    seconds?: 0 | number;
};
/**
 * Max Keep Alive: 18 hours 12 minutes 15 seconds
 * @returns 2 byte hex
 */
export declare const convertKeepAliveToHex: ({ seconds, hours, minutes, }: Time) => number[];
export {};

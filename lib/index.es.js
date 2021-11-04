import net from 'net';
import EventEmitter from 'events';

const CONTROL_PACKET_TYPES = {
    CONNECT: 1,
    CONNACK: 2,
    PUBLISH: 3,
    PUBACK: 4,
    PUBREC: 5,
    PUBREL: 6,
    PUBCOMP: 7,
    SUBSCRIBE: 8,
    SUBACK: 9,
    UNSUBSCRIBE: 10,
    UNSUBACK: 11,
    PINGREQ: 12,
    PINGRESP: 13,
    DISCONNECT: 14,
};
const RESPONSE_TYPES_DECIMAL = {
    PACKET_RECEIVED: 48,
    CONNECT: 16,
    CONNACK: 32,
    PINGRESP: 208,
    SUBACK: 144,
    UNSUBACK: 176,
    PUBACK: 64,
    PUBREC: 80,
};
const CONNACK_ERROR_MESSAGES = {
    0: {
        decimal: 0,
        hex: 0x00,
        returnCode: "0x00 Connection Accepted",
        description: "Connection accepted",
    },
    1: {
        decimal: 1,
        hex: 0x01,
        returnCode: "0x01 Connection Refused, unacceptable protocol version",
        description: "The Server does not support the level of the MQTT protocol requested by the Client",
    },
    2: {
        decimal: 2,
        hex: 0x02,
        returnCode: "0x02 Connection Refused, identifier rejected",
        description: "The Client identifier is correct UTF-8 but not allowed by the Server",
    },
    3: {
        decimal: 3,
        hex: 0x03,
        returnCode: "0x03 Connection Refused, Server unavailable",
        description: "The Network Connection has been made but the MQTT service is unavailable",
    },
    4: {
        decimal: 4,
        hex: 0x04,
        returnCode: "0x04 Connection Refused, bad user name or password",
        description: "The data in the user name or password is malformed",
    },
    5: {
        decimal: 5,
        hex: 0x05,
        returnCode: "0x05 Connection Refused, not authorized",
        description: "The Client is not authorized to connect",
    },
};
const SUBACK_RETURN_TYPES = {
    0: {
        type: "Success",
        message: "0x00 - Success - Maximum QoS 0",
        returnCode: "0x00",
    },
    1: {
        type: "Success",
        message: "0x01 - Success - Maximum QoS 1",
        returnCode: "0x01",
    },
    2: {
        type: "Success",
        message: "0x02 - Success - Maximum QoS 2",
        returnCode: "0x02",
    },
    128: {
        type: "Failure",
        message: "Failure",
        returnCode: "0x80",
    },
};

/**
 * @author Uğurcan Emre Ataş
 * @email ugurcanemre93@gmail.com
 * @create date 2021-10-14 01:28:31
 * @modify date 2021-10-14 01:28:31
 * @desc [description]
 */
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
const buildConnectFlags = ({ username, password, willRetain, willQoS_2, willQoS_1, willFlag, cleanSession, }) => {
    if (username === "" || password === "") {
        throw new Error("Username or password cannot be an empty string.");
    }
    if (willQoS_1 === 1 && willQoS_2 === 1) {
        throw new Error("Will QoS bits cannot be set to 1 at the same time.");
    }
    return parseInt([
        username !== undefined ? 1 : 0,
        password !== undefined ? 1 : 0,
        willRetain !== undefined ? (willRetain ? 1 : 0) : 0,
        willQoS_2 !== undefined ? willQoS_2 : 0,
        willQoS_1 !== undefined ? willQoS_1 : 0,
        willFlag !== undefined ? (willFlag ? 1 : 0) : 0,
        cleanSession !== undefined ? (cleanSession ? 1 : 0) : 0,
        0, //Reserved
    ].join(""), 2);
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
const parseSubscribePacket = ({ data, }) => {
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
const buildVariableHeader = () => {
    //Fixed protocol level
    const protocolLevelByte = 0x04;
    const protocolNameBytes = "MQTT".split("").map((v) => v.charCodeAt(0));
    return [0, "MQTT".length, ...protocolNameBytes, protocolLevelByte];
};
//Filter and return fixed header raw hex value
const buildFixedHeader = ({ type }) => {
    const PACKET_TYPE = {
        1: 0x10,
        2: 0x20,
        3: 0x30,
        4: 0x40,
        5: 0x50,
        6: 0x62,
        7: 0x70,
        8: 0x82,
        9: 0x90,
        10: 0xa2,
        11: 0xb0,
        12: 0xc0,
        13: 0xd0,
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
const parseSubackData = ({ data }) => {
    //console.log("Buffer To JSON", bufferData);
    // first one is fixedHeader, second is remainingLength.
    const [, , piMSB, piLSB] = data;
    let returnCodes = [];
    for (let index = 4; index < data.length; index++) {
        const returnType = data[index];
        returnCodes.push(SUBACK_RETURN_TYPES[returnType]);
    }
    return {
        returnCodes,
        packetID: [piMSB, piLSB],
    };
};
const parseUnsubackData = ({ data, }) => {
    const [, , piMSB, piLSB] = data;
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
const buildSubscribe = ({ topic, requestedQoS }, fixedHeader) => {
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
    }
    else {
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
    const subscribeBuffer = Buffer.from([
        fixedHeader,
        packetIdentifier.length + encodedTopic.length,
        ...packetIdentifier,
        ...encodedTopic,
    ], "hex");
    console.log("Sub Buffer", subscribeBuffer);
    return subscribeBuffer;
};
/**
 *
 * @param packetIdentifier 2 byte identifier Received from subscribe. Pass it to unsub request.
 * @param topic either string | string[] type. We should be able to unsubscribe from a single topic or multiple topics
 */
const buildUnsubscribe = ({ packetIdentifier, topic }, fixedHeader) => {
    let encodedUnsubTopic;
    //type check for single or multi topics
    if (typeof topic === "string") {
        encodedUnsubTopic = [
            0,
            topic.length,
            ...topic.split("").map((v) => v.charCodeAt(0)),
        ];
    }
    else {
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
const buildPublish = ({ message, topic, QoS1 = 1, QoS2 = 0, dupFlag = 0, retain = 0, }, fixedHeader) => {
    console.log("QoS Data", QoS1, QoS2);
    if (QoS1 == 1 && QoS2 == 1) {
        throw new Error("QoS level bits cannot be value 1 at the same time in a Publish Packet. ERR: Reserved – must not be used");
    }
    if (QoS1 == 0 && QoS2 == 0) {
        dupFlag = 0;
    }
    console.log("Publish Fixed Header", fixedHeader);
    //fixed header
    const fixedHeaderDecimal = parseInt(`0011${dupFlag}${QoS2}${QoS1}${retain}`, 2);
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
    let buffer;
    if (QoS1 > 0 || QoS2 > 0) {
        buffer = Buffer.from([
            fixedHeaderDecimal,
            topicArray.length + messageArray.length + 2,
            ...topicArray,
            ...[0, 10],
            ...messageArray,
        ]);
    }
    else {
        buffer = Buffer.from([
            fixedHeaderDecimal,
            topicArray.length + messageArray.length,
            ...topicArray,
            ...messageArray,
        ]);
    }
    return buffer;
    // Test without packet id first. const packetID = [0,]
};
/**
 * Used for PUBACK, PUBREC, PUBREL
 */
const parsePubResponses = ({ data, }) => {
    const [, , piMSB, piLSB] = data;
    return { packetID: [piMSB, piLSB] };
};
/**
 * Max Keep Alive: 18 hours 12 minutes 15 seconds
 * @returns 2 byte hex
 */
const convertKeepAliveToHex = ({ seconds = 0, hours = 0, minutes = 0, }) => {
    console.log("Received hours and minutes", hours, minutes, seconds);
    if (hours > 18 && minutes > 12 && seconds > 15)
        throw new Error("Maxiumum value of Keep Alive should be 18hh 12mm 15s");
    let hToS = Math.abs(hours) * 3600;
    let mToS = Math.abs(minutes) * 60;
    let total = (hToS + mToS + Math.abs(seconds)).toString(16);
    while (total.length < 4) {
        total = `0${total}`;
    }
    let lsb = parseInt(total.slice(0, 2), 16);
    let msb = parseInt(total.slice(2, total.length), 16);
    //return Buffer.from(total, "hex");
    return [lsb, msb];
};

/**
 * @author Uğurcan Emre Ataş
 * @email ugurcanemre93@gmail.com
 * @create date 2021-10-14 01:28:21
 * @modify date 2021-10-14 01:28:21
 * @desc [description]
 */
class kekwClient extends EventEmitter {
    constructor({ hostAddress = "localhost", port = 1883, //mosquitto default port
    timeout = 5000, } = {}, onFailed) {
        super();
        this.connectionUp = ({ flags = {
            username: undefined,
            password: undefined,
            willRetain: false,
            willQoS_2: 0,
            willQoS_1: 0,
            willFlag: true,
            cleanSession: true,
        }, keepAlive = {
            hours: 1,
            minutes: 0,
            seconds: 0,
        }, clientID = "mqttTestClient", will = {
            willTopic: "topic",
            willMessage: "message",
        }, } = {}) => {
            var _a;
            const fixedHeader = buildFixedHeader({
                type: CONTROL_PACKET_TYPES.CONNECT,
            });
            //build variable header
            const variableHeader = buildVariableHeader();
            //Check flags, convert binary array to decimal
            const connectFlags = buildConnectFlags(flags);
            //get keep alive 2 byte hex
            const intervalHex = convertKeepAliveToHex({
                hours: keepAlive === null || keepAlive === void 0 ? void 0 : keepAlive.hours,
                minutes: keepAlive === null || keepAlive === void 0 ? void 0 : keepAlive.minutes,
                seconds: keepAlive === null || keepAlive === void 0 ? void 0 : keepAlive.seconds,
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
            ];
            let buffer = Buffer.from([
                fixedHeader,
                //remaining length
                intervalHex.length + variableHeader.length + clientPayload.length + 1,
                ...variableHeader,
                connectFlags,
                ...intervalHex,
                ...clientPayload,
            ], "hex");
            //console.log("Client Payload Buffer", buffer);
            (_a = this.client) === null || _a === void 0 ? void 0 : _a.write(buffer);
        };
        this.subscribeTo = (packetConfig) => {
            var _a;
            const subscribeBuffer = buildSubscribe(packetConfig, buildFixedHeader({
                type: CONTROL_PACKET_TYPES.SUBSCRIBE,
            }));
            (_a = this.client) === null || _a === void 0 ? void 0 : _a.write(subscribeBuffer);
        };
        this.unsubscribeFrom = (packetConfig) => {
            var _a;
            const unsubBuffer = buildUnsubscribe(packetConfig, buildFixedHeader({
                type: CONTROL_PACKET_TYPES.UNSUBSCRIBE,
            }));
            (_a = this.client) === null || _a === void 0 ? void 0 : _a.write(unsubBuffer);
        };
        this.ping = () => {
            var _a;
            const fixedHeader = buildFixedHeader({
                type: CONTROL_PACKET_TYPES.PINGREQ,
            });
            const request = new Uint8Array([fixedHeader, 0]);
            const reqBuffer = Buffer.from(request, "hex");
            (_a = this.client) === null || _a === void 0 ? void 0 : _a.write(reqBuffer);
        };
        this.publishTo = (packetConfig) => {
            var _a;
            const pubBuffer = buildPublish(packetConfig, buildFixedHeader({
                type: CONTROL_PACKET_TYPES.PUBLISH,
            }));
            console.log("Build Buffer", pubBuffer);
            (_a = this.client) === null || _a === void 0 ? void 0 : _a.write(pubBuffer);
        };
        this.disconnect = () => {
            var _a, _b;
            const fixedHeader = buildFixedHeader({
                type: CONTROL_PACKET_TYPES.DISCONNECT,
            });
            const buffer = Buffer.from(new Uint8Array([fixedHeader, 0]), "hex");
            (_a = this.client) === null || _a === void 0 ? void 0 : _a.write(buffer);
            (_b = this.client) === null || _b === void 0 ? void 0 : _b.destroy();
        };
        this.port = port;
        this.hostAddress = hostAddress;
        this.timeout = timeout;
        this.connected = false;
        this.client = new net.Socket();
        console.log("This Runs", this.hostAddress, this.port);
        this.connectToServer();
        setTimeout(() => {
            var _a;
            if (!this.connected) {
                onFailed &&
                    onFailed("Client did not receive a CONNACK packet for a reasonable amount of time. Closing...");
                (_a = this.client) === null || _a === void 0 ? void 0 : _a.destroy();
            }
        }, timeout);
    }
    getConnectionState() {
        return this.connected;
    }
    connectToServer() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        (_a = this.client) === null || _a === void 0 ? void 0 : _a.connect(this.port, this.hostAddress, () => {
            console.log("Connection Listener");
        });
        (_b = this.client) === null || _b === void 0 ? void 0 : _b.on("connect", () => {
            console.log("Connected");
        });
        (_c = this.client) === null || _c === void 0 ? void 0 : _c.on("ready", () => {
            console.log("Ready");
            this.emit("ready");
        });
        (_d = this.client) === null || _d === void 0 ? void 0 : _d.on("close", (hadError) => {
            console.log("Is Closed", hadError);
            this.connected = false;
            this.emit("close", hadError);
        });
        (_e = this.client) === null || _e === void 0 ? void 0 : _e.on("end", () => {
            this.connected = false;
            this.emit("end");
        });
        (_f = this.client) === null || _f === void 0 ? void 0 : _f.on("timeout", () => {
            this.emit("timeout");
        });
        (_g = this.client) === null || _g === void 0 ? void 0 : _g.on("error", (error) => {
            this.emit("error", error);
            this.connected = false;
            throw Error(error.message);
        });
        (_h = this.client) === null || _h === void 0 ? void 0 : _h.on("data", (buffer) => {
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
                            this.emit("connectionRefused", {
                                returnCode: CONNACK_ERROR_MESSAGES[data[3]].returnCode,
                                message: CONNACK_ERROR_MESSAGES[0].description,
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
            }
        });
    }
}

export { kekwClient };

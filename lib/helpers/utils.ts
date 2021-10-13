import { TypeSubackReturnCodes } from "../types/libtypes";

export const CONTROL_PACKET_TYPES = {
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

export const RESPONSE_TYPES_DECIMAL = {
  PACKET_RECEIVED: 48,
  CONNECT: 16,
  CONNACK: 32,
  PINGRESP: 208,
  SUBACK: 144,
  UNSUBACK: 176,
};

export const CONNACK_ERROR_MESSAGES: { [key: number]: any } = {
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
    description:
      "The Server does not support the level of the MQTT protocol requested by the Client",
  },
  2: {
    decimal: 2,
    hex: 0x02,
    returnCode: "0x02 Connection Refused, identifier rejected",
    description:
      "The Client identifier is correct UTF-8 but not allowed by the Server",
  },
  3: {
    decimal: 3,
    hex: 0x03,
    returnCode: "0x03 Connection Refused, Server unavailable",
    description:
      "The Network Connection has been made but the MQTT service is unavailable",
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

export const SUBACK_RETURN_TYPES: { [key: number]: TypeSubackReturnCodes } = {
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

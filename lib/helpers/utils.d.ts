/**
 * @author Uğurcan Emre Ataş
 * @email ugurcanemre93@gmail.com
 * @create date 2021-10-14 01:27:39
 * @modify date 2021-10-14 01:27:39
 * @desc [description]
 */
import { TypeSubackReturnCodes } from "../types/libtypes";
export declare const CONTROL_PACKET_TYPES: {
    CONNECT: number;
    CONNACK: number;
    PUBLISH: number;
    PUBACK: number;
    PUBREC: number;
    PUBREL: number;
    PUBCOMP: number;
    SUBSCRIBE: number;
    SUBACK: number;
    UNSUBSCRIBE: number;
    UNSUBACK: number;
    PINGREQ: number;
    PINGRESP: number;
    DISCONNECT: number;
};
export declare const RESPONSE_TYPES_DECIMAL: {
    PACKET_RECEIVED: number;
    CONNECT: number;
    CONNACK: number;
    PINGRESP: number;
    SUBACK: number;
    UNSUBACK: number;
    PUBACK: number;
    PUBREC: number;
};
export declare const CONNACK_ERROR_MESSAGES: {
    [key: number]: any;
};
export declare const SUBACK_RETURN_TYPES: {
    [key: number]: TypeSubackReturnCodes;
};

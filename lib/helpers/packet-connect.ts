import { TypeConnectFlags } from "../types/libtypes";

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

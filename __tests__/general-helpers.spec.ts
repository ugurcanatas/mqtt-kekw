import {
  buildConnectFlags,
  buildVariableHeader,
  convertKeepAliveToHex,
  parseSubscribePacket,
  fieldWithSize,
} from "../src/helpers/general-helpers";
import { TypeConnectFlags } from "../src/types/libtypes";

let config: TypeConnectFlags = {
  username: "Ugur",
  password: undefined,
  willRetain: true,
  willQoS_2: 0,
  willQoS_1: 1,
  willFlag: true,
  cleanSession: true,
};

describe("buildConnectFlags Function in general-helpers.ts", () => {
  if (config.username === "" || config.password === "") {
    test("if buildConnectFlags throws an error on empty string", () => {
      expect(() => {
        buildConnectFlags(config);
      }).toThrow("Username or password cannot be an empty string.");
    });
  } else if (config.willQoS_1 === 1 && config.willQoS_2 === 1) {
    test("if buildConnectFlags throws an error on both QoS's are set to 1", () => {
      expect(() => {
        buildConnectFlags(config);
      }).toThrow("Will QoS bits cannot be set to 1 at the same time.");
    });
  } else {
    test("if buildConnectFlags function returns type of number", () => {
      let bin = buildConnectFlags(config);
      expect(typeof bin).toBe("number");
    }),
      test("if buildConnectFlags function returns >= 0", () => {
        expect(buildConnectFlags(config)).toBeGreaterThanOrEqual(0);
      }),
      test("if buildConnectFlags function returns <= 255", () => {
        expect(buildConnectFlags(config)).toBeLessThanOrEqual(255);
      });
  }
});

describe("buildVariableHeader function in general-helpers.ts", () => {
  test("if buildVariableHeader returns correct format", () => {
    expect(Array.isArray(buildVariableHeader())).toBe(true);
    expect(buildVariableHeader().length).toEqual(7);
  });
});

describe("parseSubscribePacket", () => {
  let topicName = "testTopic1/subTopic";
  let message = "TestTopicMessageHelloWorld";
  let rest = [
    ...topicName.split("").map((v) => v.charCodeAt(0)),
    ...message.split("").map((v) => v.charCodeAt(0)),
  ];

  let subPacket = Buffer.from([
    ...[48, rest.length + 2, 0, topicName.length],
    ...rest,
  ]);
  test("check parseSubscribePacket function", () => {
    expect(parseSubscribePacket({ data: subPacket })).toMatchObject({
      payload: message,
      topic: topicName,
    });
  });
});

describe("convertKeepAliveToHex", () => {
  let hours = 10;
  let minutes = 0;
  let seconds = 10;

  test("check convertKeepAliveToHex function", () => {
    if (hours > 18 && minutes > 12 && seconds > 15) {
      expect(
        convertKeepAliveToHex({
          hours,
          minutes,
          seconds,
        })
      ).toThrow("Maxiumum value of Keep Alive should be 18hh 12mm 15s");
    } else {
      expect(
        typeof convertKeepAliveToHex({
          hours,
          minutes,
          seconds,
        })
      ).toBe("object");
    }
  });
});

describe("checkFieldWithSize", () => {
  test("should have msb, lsb and encoded string ", () => {
    expect(typeof fieldWithSize("ugurcan")).toBe("object");
  });
});

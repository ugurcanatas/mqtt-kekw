# MQTT KEKW

![LOGO](./assets/kekw_logo.png)

MQTT Kekw is a Node.js MQTT TCP client.

## Example usage

```javascript
const kekwClient = require("mqtt-kekw");

const client = new kekwClient(
  { hostAddress: "localhost", port: 1883 },
  (message) => {
    console.log("Connection Failed", message);
  }
);
```

### Client Properties

<code>hostAddress</code>

- Type: `string`
- Default: `localhost`
- Description: Broker address

<code>port</code>

- Type: `number`
- Default: `1883`
- Description: Broker port

<code>timeout</code>

- Type: `number`
- Default: `5000`
- Description: Timeout for connack response in milliseconds. If client does not receive any response in this time, tcp connection will be destroyed.

## Sending connection packet

<p>Send connection packet after TCP connection is <b>ready</b></p>

```javascript
client.on("ready", () => {
  console.log("Client Ready !!");
  client.connectionUp({
    clientID: "MQTT_CLIENT",
  });
});
```

## Emitted events

| Event Name         | Description                                                           | Args & Types                                         |
| :----------------- | :-------------------------------------------------------------------- | ---------------------------------------------------- |
| connect            | `TCP connection starts`                                               | ---                                                  |
| ready              | `TCP connection ready`                                                | ---                                                  |
| close              | `TCP connection closed`                                               | hadError: `boolean`                                  |
| end                | `TCP connection ended`                                                | ---                                                  |
| error              | `TCP connection error`                                                | error: `Error`                                       |
| timeout            | `TCP timeout`                                                         | ---                                                  |
| connectionAccepted | `Connection acknowledged by the Broker`                               | payload:{returnCode: `string`, message: `string`}    |
| connectionRefused  | `Connection did not acknowledged by the Broker`                       | payload:{returnCode: `string`, message: `string`}    |
| pingresp           | `Broker pinged back`                                                  | message:`string`                                     |
| suback             | `Subscribe acknowledged by the Broker`                                | payload:{returnCodes: `any[]`, packetID: `number[]`} |
| unsuback           | `Unsubscribe acknowledged by the Broker`                              | payload:{packetID: `number[]`}                       |
| puback             | `Publish acknowledged by the Broker(QoS = 1, At least once delivery)` | payload:{packetID: `number[]`}                       |
| pubrec             | `Publish acknowledged by the Broker(QoS = 2, At most once delivery)`  | payload:{packetID: `number[]`}                       |
| received           | `Message from the Broker received`                                    | payload:{topic: `string`, payload: `string`}         |

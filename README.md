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

### Client Props

<code>hostAddress</code>

- **Type**: `string`
- **Default**: `localhost`
- **Description**: Broker address

<code>port</code>

- **Type**: `number`
- **Default**: `1883`
- **Description**: Broker port

<code>timeout</code>

- **Type**: `number`
- **Default**: `5000`
- **Description**: Timeout in ms. If no broker response within this time, client will destroy its connection.

<code>onFailure</code>

- **Type**: `function (optional)`
- **Description**: Callback function. Called after timeout.

## Sending connection packet

<p>Send connection packet after TCP connection is <b>ready</b></p>

### Example usage

```javascript
client.on("ready", () => {
  console.log("Client Ready !!");
  client.connectionUp({
    clientID: "MQTT_CLIENT",
  });
});
```

<code>connectionUp</code>

- **Type**: `function`
- **Description**: Sends a Connection packet to the broker

  - **Properties**:
  - `flags`:

    - **Type**: `Object`
    - **Description**: Consists of connection flag properties
    - **Properties**:

      - `username`

        > **Type**: `string | undefined`

      - `password`

        > **Type**: `string | undefined`

      - `willRetain`

        > **Type**: `boolean`

      - `willQoS_1`

        > **Type**: `boolean`

      - `willQoS_2`

        > **Type**: `boolean`

      - `willFlag`

        > **Type**: `boolean`

      - `cleanSession`

        > **Type**: `boolean`

  - `keepAlive`:

    - **Type**: `Object`
    - **Description**: Keep alive value consists of hours, minutes and seconds
    - **Properties**:

      - `hours`

        > **Type**: `number`

      - `minutes`

        > **Type**: `number`

      - `seconds`

        > **Type**: `number`

## Emitted events

Events emitted with Node.js EventEmitter class. All events are created by following Oasis spesification [@Docs-Oasis](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html)

| Event Name          | Description                                                           | Args & Types                                 |
| :------------------ | :-------------------------------------------------------------------- | -------------------------------------------- |
| [connect](#connect) | `TCP connection starts`                                               | ---                                          |
| [ready](#ready)     | `TCP connection ready`                                                | ---                                          |
| [close](#close)     | `TCP connection closed`                                               | hadError: `boolean`                          |
| end                 | `TCP connection ended`                                                | ---                                          |
| error               | `TCP connection error`                                                | error: `Error`                               |
| timeout             | `TCP timeout`                                                         | ---                                          |
| connectionAccepted  | `Connection acknowledged by the Broker`                               | {returnCode: `string`, message: `string`}    |
| connectionRefused   | `Connection did not acknowledged by the Broker`                       | {returnCode: `string`, message: `string`}    |
| pingresp            | `Broker pinged back`                                                  | message:`string`                             |
| suback              | `Subscribe acknowledged by the Broker`                                | {returnCodes: `any[]`, packetID: `number[]`} |
| unsuback            | `Unsubscribe acknowledged by the Broker`                              | {packetID: `number[]`}                       |
| puback              | `Publish acknowledged by the Broker(QoS = 1, At least once delivery)` | {packetID: `number[]`}                       |
| pubrec              | `Publish acknowledged by the Broker(QoS = 2, At most once delivery)`  | {packetID: `number[]`}                       |
| received            | `Message from the Broker received`                                    | {topic: `string`, payload: `string`}         |

### Connect

Emitted after client is connected to the broker.

```javascript
client.on("connect", () => {
  console.log("Client Connected !!");
});
```

### Ready

Emitted after broker is ready to receive packets

```javascript
client.on("ready", () => {
  console.log("Client Ready !!");
});
```

### Close

Emitted after connection closed.

<code>hadError</code>

- **Type**: `boolean`
- **Description**: If connection closed because of an error or not.

```javascript
client.on("close", (hadError) => {
  console.log("Client Connection Closed !!");
});
```

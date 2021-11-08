# MQTT KEKW

![LOGO](./assets/kekw_logo.png)

MQTT Kekw is a Node.js MQTT TCP client.

## Example usage

### Install

```bash
npm i @mqtt-kekw/tcp-client
```

### Use

```javascript
const { kekwClient } = require("@mqtt-kekw/tcp-client");

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

- **Arguments**:

- `flags` (optional):
- **Type:** `object`
- **Description:** Consists of following
  | Name | Type | Description |
  | :--- | :---- | :--- |
  | username | `string` | If username exists, it will be present in the payload |
  | password | `string` | If password exists, it will be present in the payload |
  | willFlag | `boolean` | ...more |
  | willQoS_1 | `number` | ...more |
  | willQoS_2 | `number` | ...more |
  | willRetain | `boolean` | ...more |
  | cleanSession | `boolean` | If cleanSession is set to 0, resume communications with the client based on state from the current Session |

- `clientID` (optional):
- **Type:** `string`
- **Description:** Client Identifier string. Part of the payload packet

- `keepAlive` (optional)::
- **Type:** `object`
- **Description:** How much longer should connection stay open between client and broker. Keep in mind that mosquitto broker adds +15 seconds to keepAlive
  | Name | Type | Description |
  | :--- | :---- | :--- |
  | hours | number | hours in number (0-23) |
  | minutes | number | minutes in number (0-60) |
  | seconds | number | seconds in number (0-60) |

- `will`:
- **Type:** `object`
- **Description:** Specify will topic and will message if willFlag is set to true
  | Name | Type | Description |
  | :--- | :---- | :--- |
  | willTopic | string | Will Topic |
  | willMessage | string | Will Message |

## Emitted events

Events emitted with Node.js EventEmitter class. All events are created by following Oasis spesification [@Docs-Oasis](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html)

| Event Name                                                | Description                                                           | Args & Types                                 |
| :-------------------------------------------------------- | :-------------------------------------------------------------------- | -------------------------------------------- |
| [connect](./docs/EVENTS.md#connect)                       | `TCP connection starts`                                               | ---                                          |
| [ready](./docs/EVENTS.md#ready)                           | `TCP connection ready`                                                | ---                                          |
| [close](./docs/EVENTS.md#close)                           | `TCP connection closed`                                               | hadError: `boolean`                          |
| [end](./docs/EVENTS.md#end)                               | `TCP connection ended`                                                | ---                                          |
| [error](./docs/EVENTS.md#error)                           | `TCP connection error`                                                | error: `Error`                               |
| [timeout](./docs/EVENTS.md#timeout)                       | `TCP timeout`                                                         | ---                                          |
| [connectionAccepted](./docs/EVENTS.md#connectionaccepted) | `Connection acknowledged by the Broker`                               | {returnCode: `string`, message: `string`}    |
| [connectionRefused](./docs/EVENTS.md#connectionrefused)   | `Connection did not acknowledged by the Broker`                       | {returnCode: `string`, message: `string`}    |
| [pingresp](./docs/EVENTS.md#pingresp)                     | `Broker pinged back`                                                  | message:`string`                             |
| [suback](./docs/EVENTS.md#suback)                         | `Subscribe acknowledged by the Broker`                                | {returnCodes: `any[]`, packetID: `number[]`} |
| [unsuback](./docs/EVENTS.md#unsuback)                     | `Unsubscribe acknowledged by the Broker`                              | {packetID: `number[]`}                       |
| puback                                                    | `Publish acknowledged by the Broker(QoS = 1, At least once delivery)` | {packetID: `number[]`}                       |
| pubrec                                                    | `Publish acknowledged by the Broker(QoS = 2, At most once delivery)`  | {packetID: `number[]`}                       |
| received                                                  | `Message from the Broker received`                                    | {topic: `string`, payload: `string`}         |

## Functions

- ### <code>ping</code>

  ```javascript
  client.ping();
  ```

  **Description:** Sends a ping packet to the broker. `pingresp` should be triggered after client receives a ping back data packet.

- ### <code>disconnect</code>

  ```javascript
  client.disconnect();
  ```

  **Description:** Sends a disconnect packet to the broker. Client closes it's connection after receiving disconnect acknowledgement packet.

- ### <code>subscribeTo({topic,requestedQoS})</code>

  **Description:** Sends a subscribe packet to the broker with topic or topics and requestedQoS. Client should receive **suback** packet.

  **Arguments:**

  `topic`:

  - **Type**: string | string[]
  - **Description**: Topic can be a string or a array of strings. Payload calculated accordingly

  `requestedQoS`:

  - **Type**: number (either 0 or 1)
  - **Description**: Requested QoS.(more later)

  ```javascript
  client.subscribeTo({
    topic: "home/+/humidity",
    requestedQoS: 0,
  });
  ```

- ### <code>unsubscribeFrom({topic,requestedQoS})</code>

  **Description:** Sends an unsubscribe packet to the broker with topic or topics and requestedQoS. Client should receive **unsuback** packet.

  **Arguments:**

  `topic`:

  - **Type**: string | string[]
  - **Description**: Topic can be a string or a array of strings. Payload calculated accordingly

  `packetIdentifier`:

  - **Type**: number[]
  - **Description**: Packet identifier should be same as the packet identifier that client received in `suback` event

  ```javascript
  client.unsubscribeFrom({
    topic: "home/+/humidity",
    packetIdentifier,
  });
  ```

- ### <code>publishTo({topic,message,dupFlag,QoS1,QoS2,retain})</code>

  **Description:** Sends a publish packet to the broker with necessarry arguments. Client should received **puback** or **pubrec** accordingly.

  **Arguments:**

  `topic`:

  - **Type**: string
  - **Description**: Topic is a string. Defines which topic that message will be published to

  `message`:

  - **Type**: string
  - **Description**: Message data with the related topic

  `dupFlag`:

  - **Type**: number
  - **Description**: Duplication flag should be set to 0 if it's first occasion. If it's a duplication, it should be set to 1

  `QoS1`:

  - **Type**: number
  - **Description**: ...

  `QoS2`:

  - **Type**: number
  - **Description**: ...

  `retain`:

  - **Type**: number
  - **Description**: ...

  ```javascript
  client.unsubscribeFrom({
    topic: "home",
    packetIdentifier,
  });
  ```

## Subscribe & Unsubscribe Example

### Single-Level Wildcard `'+'`

Example topics

- home/room1/temperature
- home/room2/temperature
- home/room3/temperature

**Example usage**
Subscribe to all topics with `home/${any_topic}/temperature` format

```javascript
client.subscribeTo({
  topic: "home/+/temperature",
  //requestedQoS: 0,
});
```

If you want to unsubscribe from a single level wildcard

```javascript
client.unsubscribeFrom({
  topic: "home/+/temperature",
  //requestedQoS: 0,
});
```

### Multi-Level Wildcard `'#'`

Example topics

- home/room1/temperature
- home/room1/humidity
- home/room1/voltage

**Example usage**

Subscribe to all topics with `home/room1/${any_topic}` format

```javascript
client.subscribeTo({
  topic: "home/room1/#",
  //requestedQoS: 0,
});
```

If you want to unsubscribe from a multi level wildcard

```javascript
client.unsubscribeFrom({
  topic: "home/room1/#",
  //requestedQoS: 0,
});
```

### Subscribe to multiple topics

```javascript
client.subscribeTo({
  topic: ["home/room1/temperature", "home/room1/temperature"],
  //requestedQoS: 0,
});
```

### Unsubscribe from multiple topics

```javascript
client.unsubscribeFrom({
  topic: ["home/room1/temperature", "home/room1/temperature"],
  //packetIdentifier here
});
```

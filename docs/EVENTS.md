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

### End

Emitted after connection ends.

```javascript
client.on("end", (hadError) => {
  console.log("Client Connection Ended !!");
});
```

### Close

Emitted after an error occured.

<code>error</code>

- **Type**: `Error`
- **Description**: Error argument in tcp socket.

```javascript
client.on("close", (hadError) => {
  console.log("Client Connection Closed !!");
});
```

### Timeout

Emitted after connection timedout.

```javascript
client.on("timeout", (hadError) => {
  console.log("Connection Timedout !!");
});
```

### connectionAccepted

Emitted after broker accepts client connection.

<code>returnCode</code>

- **Type**: `any`
- **Description**: Return code from the broker.

<code>message</code>

- **Type**: `string`
- **Description**: Message from the broker.

```javascript
client.on("connectionAccepted", ({ returnCode, message }) => {
  console.log("Client Connection Accepted !!");
});
```

### connectionRefused

Emitted after if broker refuses client connection

<code>returnCode</code>

- **Type**: `any`
- **Description**: Return code from the broker.

<code>message</code>

- **Type**: `string`
- **Description**: Message from the broker.

```javascript
client.on("connectionRefused", ({ returnCode, message }) => {
  console.log("Client Connection Refused !!");
});
```

### Pingresp

Emitted after ping response received by client

<code>response</code>

- **Type**: `string`
- **Description**: Default pingresp message

```javascript
client.on("pingresp", (response) => {
  console.log("Server pinged back !!");
});
```

### Suback

Emitted after subscribe acknowledgement packet received by client

<code>packetID</code>

- **Type**: `number[]`
- **Description**: Packet identifier

<code>returnCodes</code>

- **Type**: `object`
- **Description**: Suback information
- **Properties**:

  `type`: string

  `message`: string

  `returnCode`: string

```javascript
client.on("suback", ({ packetID, returnCodes }) => {
  console.log("Client SuBack Response", returnCodes, packetID);
});
```

### Unsuback

Emitted after unsubscribe acknowledgement packet received by client

```javascript
client.on("unsuback", ({ packetID, returnCodes }) => {});
```

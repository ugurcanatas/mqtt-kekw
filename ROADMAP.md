### Roadmap

- [] Implement <code>CONNECT</code> Packet Types & Sending Connect Packet

  - [x] Build Fixed Header
  - [x] Build Variable Header
  - [x] Build Connect Flags
  - [x] Build Keep Alive
  - [x] Build & Encode Client ID
  - [] Build & Encode Will Topic
  - [] Build & Encode Will Message
  - [] Test Full Connect packet with will topic & will message included.

- [x] Implement Decoding <code>CONNACK</code> Packet Types
  - [x] Connack Decoding hex buffer as Uint8Array.
  - [x] Emit events using connect _return codes_ as filter. EG: <code>connect-accepted</code>
- [x] Implement <code>PUBLISH</code> Packet Types

  - [x] Build PUB Packet Headers & Payload

- [x] Implement <code>DISCONNECT</code> Packet Types
- [x] Implement <code>PINGREQ</code> Packet Types
- [x] Implement filtering <code>PINGRESP</code>

  - [x] Emit event when <code>PINGRESP</code> happens

- [] Implement <code>SUBSCRIBE</code> Packet Type

  - [x] Emit event when <code>SUBACK</code> happens
  - [x] Send subscribe packet
  - [x] Subscribe to array of topics or a single topic done.
  - [] Add array of QoS instead of single QoS
  - [] Check Subscribe docs for missed parts

- [] Implement <code>SUBACK</code>

  - [x] Emit an event when <code>SUBACK</code> happens
  - [x] Return packetID with emitted event as an argument
  - [x] Add multiple topic check if client subscribed to multiple topics (Tested with three different topics)

- [x] Implement <code>UNSUBSCRIBE</code>

  - [x] Unsubbing from single and multiple topics tested.

- [x] Implement <code>UNSUBACK</code> with event emitters.

- [x] Implement decoding received <code>PUBLISH</code> Packet from Broker

  - [x] <code>PUBACK</code>
  - [x] <code>PUBREC</code>
  - [x] <code>PUBREL</code>
  - [] Check docs for missed parts

- [] Use net module emitter instead of creating a new emitter.

- [] Reconnecting after tcp socket drops due to keep alive interval

- [x] Add [typed-emitter](https://github.com/andywer/typed-emitter)

- [] Tested functions

  - [x] general-helpers/buildConnectFlags
  - [x] general-helpers/buildVariableHeader
  - [x] general-helpers/parseSubscribePacket
  - [x] general-helpers/convertKeepAliveToHex

- [] Add reconnect logic

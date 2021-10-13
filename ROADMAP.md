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
- [] Implement <code>PUBLISH</code> Packet Types

  - [] Build PUB Packet Headers & Payload

- [x] Implement <code>DISCONNECT</code> Packet Types
- [x] Implement <code>PINGREQ</code> Packet Types
- [x] Implement filtering <code>PINGRESP</code>

  - [] Emit event when <code>PINGRESP</code> happens

- [] Implement <code>SUBSCRIBE</code> Packet Type

  - [x] Emit event when <code>SUBACK</code> happens
  - [x] Send subscribe packet
  - [x] Sending list of subscribe topics
  - [] Check Subscribe docs for missed parts

- [] Implement <code>SUBACK</code>

  - [] Emit an event when <code>SUBACK</code> happens
  - [] Return packetID with emitted event as an argument
  - [] Add multiple topic check if client subscribed to multiple topics

- [] Implement decoding received <code>PUBLISH</code> Packet from Broker

  - [] Check docs for missed parts

- [] Use net module emitter instead of creating a new emitter.

- [] Add [typed-emitter](https://github.com/andywer/typed-emitter)

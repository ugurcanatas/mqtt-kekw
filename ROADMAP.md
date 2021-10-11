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
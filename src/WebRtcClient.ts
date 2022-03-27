// @ts-ignore
import wrtc from '@koush/wrtc';
import net from 'net';

const { RTCPeerConnection, RTCIceCandidate } = wrtc;

interface ClientMessage {
  type: 'OFFER' | 'ANSWER' | 'ICECANDIDATE';
  data: object;
}

export class WebRtcClient {
  constructor(socket?: net.Socket) {
    this.socket =
      socket ??
      net.createConnection({ port: 5001 }, () => {
        console.log('Socket Connected');
      });

    this.socket.on('data', async (buffer) => {
      const { type, data } = this.bufferToJson(buffer);

      switch (type) {
        case 'OFFER': {
          await this.pc.setRemoteDescription(data as RTCSessionDescriptionInit);
          await this.createAnswer();
          break;
        }

        case 'ANSWER': {
          await this.pc.setRemoteDescription(data as RTCSessionDescriptionInit);
          break;
        }

        case 'ICECANDIDATE': {
          await this.pc.addIceCandidate(new RTCIceCandidate(data));
          break;
        }
      }
    });

    this.socket.on('end', () => {
      console.log('DISCONNECTED');
    });
  }

  send(message: ClientMessage) {
    this.socket.write(this.jsonToBuffer(message));
  }

  createPC() {
    this.pc = new RTCPeerConnection({});

    this.pc.addEventListener('icecandidate', (evt) => {
      if (evt.candidate !== null) {
        this.send({
          type: 'ICECANDIDATE',
          data: evt.candidate,
        });
      }
    });
    this.pc.addEventListener('connectionstatechange', (evt) =>
      console.log(evt)
    );
    this.pc.addEventListener('icecandidateerror', (evt) => console.log(evt));
    this.pc.addEventListener('negotiationneeded', (evt) => console.log(evt));
    this.pc.addEventListener('datachannel', (evt) => {
      this.channel = evt.channel;
      this.addEventsToChannel();
    });
  }

  createChannel() {
    this.channel = this.pc.createDataChannel('test');
    this.addEventsToChannel();
  }

  private addEventsToChannel() {
    this.channel.addEventListener('error', (evt) => console.log(evt));
    this.channel.addEventListener('open', (evt) => {
      console.log('DATACHANNEL OPENED');
      this.channel.send(`Hello, ${this.pc.currentLocalDescription?.type}`);
    });
    this.channel.addEventListener('close', (evt) => console.log(evt));
    this.channel.addEventListener('message', (evt) => {
      console.log('received : ' + evt.data);
    });
  }

  async createOffer() {
    const sdp = await this.pc.createOffer();
    await this.pc.setLocalDescription(sdp);

    this.send({ type: 'OFFER', data: sdp });
  }

  private async createAnswer() {
    const sdp = await this.pc.createAnswer();
    await this.pc.setLocalDescription(sdp);

    this.send({ type: 'ANSWER', data: sdp });
  }

  private jsonToBuffer(data: ClientMessage): Buffer {
    return Buffer.from(JSON.stringify(data) + '\n');
  }

  private bufferToJson(buffer: Buffer): ClientMessage {
    return JSON.parse(buffer.toString().split('\n')[0]);
  }

  private pc: RTCPeerConnection;
  private socket: net.Socket;
  private channel: RTCDataChannel;
}

import net from 'net';
import { WebRtcClient } from './WebRtcClient';

const server = net
  .createServer((socket) => {
    const client = new WebRtcClient(socket);
    client.createPC();
  })
  .on('error', console.error);

server.listen(5001, () => console.log('Server running on 5001'));

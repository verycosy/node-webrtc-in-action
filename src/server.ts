import * as cv from 'opencv4nodejs';
import net from 'net';
import { WebRtcClient } from './WebRtcClient';

async function test() {
  const wCap = new cv.VideoCapture(0);

  while (1) {
    const frame = wCap.read();
    cv.imshow('Mirror', frame.flip(1).bgrToGray());

    const key = cv.waitKey(10);

    // NOTE: ESC
    if (key === 27) {
      wCap.release();
      cv.destroyAllWindows();
      cv.waitKey(1);
      break;
    }
  }
}

test();

const server = net
  .createServer((socket) => {
    const client = new WebRtcClient(socket);
    client.createPC();
  })
  .on('error', console.error);

server.listen(5001, () => console.log('Server running on 5001'));

import { WebRtcClient } from './WebRtcClient';

const client = new WebRtcClient();

client.createPC();
client.createChannel();
client.createOffer();

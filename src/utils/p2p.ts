// Minimal, opt-in P2P sync via WebRTC DataChannels with passphrase-derived AES-GCM.
// No servers: uses manual offer/answer paste or QR; users exchange SDP out-of-band.

import { deriveKeyFromPassphrase, encryptString, decryptString } from './cryptoKey';

export type P2PSession = {
  pc: RTCPeerConnection;
  dc?: RTCDataChannel;
  close: () => void;
  createOfferBlob: () => Promise<string>;
  acceptRemoteAnswer: (answerBlob: string) => Promise<void>;
  onMessage: (cb: (msg: string) => void) => void;
  sendEncrypted: (passphrase: string, payload: object) => Promise<void>;
};

const iceServers: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302'] }];

export function createP2PSession(): P2PSession {
  const pc = new RTCPeerConnection({ iceServers });
  let dc: RTCDataChannel | undefined;
  let msgHandler: (msg: string) => void = () => {};

  dc = pc.createDataChannel('sync', { ordered: true });
  dc.onmessage = (e) => msgHandler(String(e.data));
  pc.ondatachannel = (e) => {
    dc = e.channel;
    dc.onmessage = (ev) => msgHandler(String(ev.data));
  };

  function close() {
    if (dc && dc.readyState !== 'closed') dc.close();
    pc.close();
  }

  async function createOfferBlob(): Promise<string> {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    // wait for ICE gathering complete
    await new Promise<void>((res) => {
      if (pc.iceGatheringState === 'complete') return res();
      const check = () => pc.iceGatheringState === 'complete' && (pc.removeEventListener('icegatheringstatechange', check as any), res());
      pc.addEventListener('icegatheringstatechange', check);
      setTimeout(() => res(), 2000); // fallback
    });
    return btoa(JSON.stringify(pc.localDescription));
  }

  async function acceptRemoteAnswer(answerBlob: string): Promise<void> {
    const ans = JSON.parse(atob(answerBlob));
    await pc.setRemoteDescription(ans);
  }

  function onMessage(cb: (msg: string) => void) { msgHandler = cb; }

  async function sendEncrypted(passphrase: string, payload: object) {
    if (!dc || dc.readyState !== 'open') throw new Error('Channel not open');
    const key = await deriveKeyFromPassphrase(passphrase);
    const json = JSON.stringify(payload);
  const enc = await encryptString(json, key);
    dc.send(JSON.stringify(enc));
  }

  return { pc, dc, close, createOfferBlob, acceptRemoteAnswer, onMessage, sendEncrypted };
}

export async function decryptIncoming(passphrase: string, encBlob: string): Promise<any> {
  const key = await deriveKeyFromPassphrase(passphrase);
  const data = JSON.parse(encBlob);
  const plain = await decryptString(data, key);
  return JSON.parse(plain);
}

// Responder flow: accept remote offer, create answer, return blob
export async function createResponderFromOffer(offerBlob: string) {
  const pc = new RTCPeerConnection({ iceServers });
  let dc: RTCDataChannel | undefined;
  let msgHandler: (msg: string) => void = () => {};
  pc.ondatachannel = (e) => {
    dc = e.channel;
    dc.onmessage = (ev) => msgHandler(String(ev.data));
  };
  const offer = JSON.parse(atob(offerBlob));
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await new Promise<void>((res) => {
    if (pc.iceGatheringState === 'complete') return res();
    const check = () => pc.iceGatheringState === 'complete' && (pc.removeEventListener('icegatheringstatechange', check as any), res());
    pc.addEventListener('icegatheringstatechange', check);
    setTimeout(() => res(), 2000);
  });
  function close() { if (dc && dc.readyState !== 'closed') dc.close(); pc.close(); }
  function onMessage(cb: (msg: string) => void) { msgHandler = cb; }
  async function sendEncrypted(passphrase: string, payload: object) {
    if (!dc || dc.readyState !== 'open') throw new Error('Channel not open');
    const key = await deriveKeyFromPassphrase(passphrase);
    const enc = await encryptString(JSON.stringify(payload), key);
    dc.send(JSON.stringify(enc));
  }
  const answerBlob = btoa(JSON.stringify(pc.localDescription));
  return { pc, dc, close, onMessage, sendEncrypted, answerBlob } as const;
}

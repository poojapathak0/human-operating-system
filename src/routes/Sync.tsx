import { useEffect, useRef, useState } from 'react';
import { createP2PSession, createResponderFromOffer, decryptIncoming } from '../utils/p2p';
import { exportEncryptedWithKey, importEncryptedWithKey } from '../db/db';
import { QRCanvas, QRScanner } from '../components/QR';

export default function Sync() {
  const [mode, setMode] = useState<'offer' | 'answer' | null>(null);
  const [info, setInfo] = useState<string>('');
  const [pass, setPass] = useState('');
  const remoteRef = useRef<HTMLTextAreaElement>(null);
  const [session, setSession] = useState<ReturnType<typeof createP2PSession> | null>(null);

  useEffect(() => () => { session?.close(); }, [session]);

  async function startOffer() {
    const s = createP2PSession();
    setSession(s);
    const offerBlob = await s.createOfferBlob();
  setInfo(offerBlob);
    setMode('offer');
  }

  async function pasteAnswerAndSend() {
    if (!session) return;
    const ans = remoteRef.current?.value.trim();
    if (!ans) return;
    await session.acceptRemoteAnswer(ans);
    const payload = await exportEncryptedWithKey();
    await session.sendEncrypted(pass, { type: 'backup', data: payload });
  }

  async function startAnswer() {
    const offer = remoteRef.current?.value.trim();
    if (!offer) return;
    const responder = await createResponderFromOffer(offer);
  setInfo(responder.answerBlob);
    responder.onMessage(async (msg) => {
      try {
        const data = await decryptIncoming(pass, msg);
        if (data?.type === 'backup' && typeof data.data === 'string') {
          await importEncryptedWithKey(data.data);
          alert('Synced successfully');
        }
      } catch (e) {
        console.error(e);
      }
    });
    setMode('answer');
  }

  return (
    <section>
      <h2>Private Sync (P2P)</h2>
      <p>Connect two devices directly. Exchange the blobs below via QR or copy/paste. Use a shared passphrase for encryption.</p>
      <div className="card" style={{display:'grid', gap:8}}>
        <label>Shared passphrase (only for this sync)</label>
        <input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="Enter shared passphrase" />
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <button onClick={startOffer}>Start (Offer)</button>
          <button onClick={startAnswer}>Answer</button>
        </div>
        <textarea ref={remoteRef} placeholder={mode==='offer'?'Paste answer here or scan QR':'Paste offer here or scan QR'} rows={4} />
        <div className="card" style={{display:'grid', gap:8}}>
          <strong>Scan {mode==='offer'?'Answer':'Offer'} via QR</strong>
          <QRScanner onResult={(v)=>{ if(remoteRef.current) remoteRef.current.value = v; }} />
        </div>
        {info && (
          <>
            <label>{mode==='offer'?'Your Offer (share this)':'Your Answer (share this)'}</label>
            <textarea readOnly value={info} rows={4} />
            <div style={{display:'grid', gap:8}}>
              <strong>Share as QR</strong>
              <QRCanvas text={info} />
            </div>
          </>
        )}
        {mode==='offer' && (
          <button onClick={pasteAnswerAndSend} disabled={!pass}>Send Backup</button>
        )}
      </div>
      <p style={{marginTop:12, opacity:0.7}}>This uses WebRTC with a shared passphrase for end-to-end encryption. No cloud.</p>
    </section>
  );
}

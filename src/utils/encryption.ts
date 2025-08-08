// Simple AES-GCM encryption using Web Crypto. Keys are derived from a passphrase kept only in-memory.
// In a real app, provide a UX to set/pass the passphrase; for MVP we use a session key.

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

let sessionKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (sessionKey) return sessionKey;
  // Derive a random key per session; optionally persisted via user-provided passphrase later
  sessionKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt'
  ]);
  return sessionKey;
}

export async function encryptObject(obj: unknown): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = textEncoder.encode(JSON.stringify(obj));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const blob = new Uint8Array(iv.byteLength + cipher.byteLength);
  blob.set(iv, 0);
  blob.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...blob));
}

export async function decryptArray(encoded: string): Promise<any | null> {
  try {
    const key = await getKey();
    const raw = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const iv = raw.slice(0, 12);
    const data = raw.slice(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return JSON.parse(textDecoder.decode(new Uint8Array(plain)));
  } catch (e) {
    console.error('decrypt failed', e);
    return null;
  }
}

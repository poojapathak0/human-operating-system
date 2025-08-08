// Key manager for passphrase-based AES-GCM using Web Crypto
// Stores only a salt in localStorage; derived key is kept in-memory per session.

const SALT_KEY = 'clear.salt.v1';
let derivedKey: CryptoKey | null = null;

function getOrCreateSalt(): Uint8Array {
  const existing = localStorage.getItem(SALT_KEY);
  if (existing) return Uint8Array.from(atob(existing), (c) => c.charCodeAt(0));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
  return salt;
}

export async function deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const salt = getOrCreateSalt();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  const saltBuf = new Uint8Array(salt); // ensure ArrayBuffer (not SharedArrayBuffer)
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: 120_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return key;
}

export function hasKey(): boolean {
  return !!derivedKey;
}

export function lock(): void {
  derivedKey = null;
}

export async function unlock(passphrase: string): Promise<void> {
  derivedKey = await deriveKeyFromPassphrase(passphrase);
}

export function getKeyOrNull(): CryptoKey | null {
  return derivedKey;
}

export async function setPassphrase(passphrase: string): Promise<void> {
  // Creating salt if needed and deriving the session key.
  derivedKey = await deriveKeyFromPassphrase(passphrase);
}

export async function encryptString(plain: string, key?: CryptoKey | null): Promise<string> {
  const k = key ?? derivedKey;
  if (!k) throw new Error('Locked: no encryption key available');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plain);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, data);
  const blob = new Uint8Array(iv.byteLength + cipher.byteLength);
  blob.set(iv, 0);
  blob.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...blob));
}

export async function decryptString(encoded: string, key?: CryptoKey | null): Promise<string> {
  const k = key ?? derivedKey;
  if (!k) throw new Error('Locked: no encryption key available');
  const raw = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, data);
  return new TextDecoder().decode(new Uint8Array(plain));
}

import { db } from '../../db/db';
import type { JournalEntry } from '../../store/appStore';
import { v4 as uuidv4 } from 'uuid';
import { encryptString, decryptString, getKeyOrNull } from '../../utils/cryptoKey';

// Vault service: encrypted journal entries with local persistence
export async function addJournalEntry(plainText: string, createdAt = Date.now()): Promise<JournalEntry> {
  const key = getKeyOrNull();
  if (!key) throw new Error('Locked: set or unlock passphrase to save');
  const cipherText = await encryptString(plainText, key);
  const rec: JournalEntry = { id: uuidv4(), text: cipherText, createdAt };
  await db.journals.add(rec);
  return rec;
}

export async function readJournalEntry(entry: JournalEntry): Promise<string> {
  const key = getKeyOrNull();
  if (!key) throw new Error('Locked: unlock to read');
  return decryptString(entry.text, key);
}

export async function listJournalEntries(limit?: number): Promise<JournalEntry[]> {
  const all = await db.journals.orderBy('createdAt').reverse().toArray();
  return typeof limit === 'number' ? all.slice(0, limit) : all;
}

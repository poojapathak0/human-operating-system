import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db';
import { encryptString, decryptString, getKeyOrNull } from '../utils/cryptoKey';

export type Mood = 'sad' | 'tired' | 'neutral' | 'calm' | 'happy';

export interface CheckIn {
  id: string;
  mood: Mood;
  notes?: string;
  createdAt: number;
}

export interface DecisionRecord {
  id: string;
  question: string;
  values: string[];
  options: string[];
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  // stored as encrypted string
  text: string;
  createdAt: number;
}

interface AppState {
  checkIns: CheckIn[];
  decisions: DecisionRecord[];
  journals: JournalEntry[];
  addCheckIn: (input: Omit<CheckIn, 'id'>) => Promise<void>;
  addDecision: (input: Omit<DecisionRecord, 'id'>) => Promise<void>;
  addJournal: (input: { text: string; createdAt: number }) => Promise<void>;
  getDecryptedJournalText: (entry: JournalEntry) => Promise<string>;
  hydrateFromDb: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      checkIns: [],
      decisions: [],
      journals: [],
  async hydrateFromDb() {
        const [cis, ds, js] = await Promise.all([
          db.checkIns.toArray(),
          db.decisions.toArray(),
          db.journals.toArray()
        ]);
        set({ checkIns: cis, decisions: ds, journals: js });
      },
      async addCheckIn(input) {
        const rec: CheckIn = { id: uuidv4(), ...input };
        await db.checkIns.add(rec);
        set({ checkIns: [...get().checkIns, rec] });
      },
      async addDecision(input) {
        const rec: DecisionRecord = { id: uuidv4(), ...input };
        await db.decisions.add(rec);
        set({ decisions: [...get().decisions, rec] });
      },
      async addJournal(input) {
        const key = getKeyOrNull();
        if (!key) throw new Error('Locked: set or unlock passphrase to save journal');
        const cipherText = await encryptString(input.text, key);
        const rec: JournalEntry = { id: uuidv4(), text: cipherText, createdAt: input.createdAt };
        await db.journals.add(rec);
        set({ journals: [...get().journals, rec] });
      },
      async getDecryptedJournalText(entry) {
        const key = getKeyOrNull();
        if (!key) throw new Error('Locked: unlock to read journal');
        return decryptString(entry.text, key);
      }
    }),
    { name: 'clear-app-state' }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db';
import { reminderService } from '../utils/reminders';
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

export type TaskRepeat = 'none' | 'daily' | 'weekly';
export interface TaskItem {
  id: string;
  title: string;
  dueAt?: number; // epoch ms, optional
  repeat: TaskRepeat;
  completed: boolean;
  createdAt: number;
}

interface AppState {
  checkIns: CheckIn[];
  decisions: DecisionRecord[];
  journals: JournalEntry[];
  tasks: TaskItem[];
  addCheckIn: (input: Omit<CheckIn, 'id'>) => Promise<void>;
  addDecision: (input: Omit<DecisionRecord, 'id'>) => Promise<void>;
  addJournal: (input: { text: string; createdAt: number }) => Promise<void>;
  getDecryptedJournalText: (entry: JournalEntry) => Promise<string>;
  addTask: (input: Omit<TaskItem, 'id' | 'createdAt' | 'completed'> & { title: string }) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  updateTask: (id: string, patch: Partial<Omit<TaskItem, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  hydrateFromDb: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      checkIns: [],
      decisions: [],
      journals: [],
      tasks: [],
  async hydrateFromDb() {
        const [cis, ds, js, ts] = await Promise.all([
          db.checkIns.toArray(),
          db.decisions.toArray(),
          db.journals.toArray(),
          db.tasks?.toArray?.() ?? Promise.resolve([])
        ]);
        set({ checkIns: cis, decisions: ds, journals: js, tasks: ts as any });
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
      },
      async addTask(input) {
        const rec: TaskItem = {
          id: uuidv4(),
          title: input.title,
          dueAt: input.dueAt,
          repeat: input.repeat ?? 'none',
          completed: false,
          createdAt: Date.now()
        };
        await db.tasks.add(rec as any);
        set({ tasks: [...get().tasks, rec] });
      },
      async toggleTask(id) {
        const t = get().tasks.find((x) => x.id === id);
        if (!t) return;
        let updated = { ...t, completed: !t.completed } as TaskItem;
        // If completing a repeating task, roll due date forward and keep it active
        if (updated.completed && updated.repeat !== 'none' && updated.dueAt) {
          const base = new Date(updated.dueAt);
          if (updated.repeat === 'daily') base.setDate(base.getDate() + 1);
          if (updated.repeat === 'weekly') base.setDate(base.getDate() + 7);
          updated = { ...updated, completed: false, dueAt: base.getTime() };
          // schedule next reminder
          reminderService.scheduleNotification({
            id: `task-${updated.id}-${updated.dueAt}`,
            type: 'wellness',
            title: 'Task reminder',
            message: updated.title
          } as any, updated.dueAt!);
        }
        await db.tasks.put(updated as any);
        set({ tasks: get().tasks.map((x) => (x.id === id ? updated : x)) });
      },
      async updateTask(id, patch) {
        const t = get().tasks.find((x) => x.id === id);
        if (!t) return;
        const updated = { ...t, ...patch } as TaskItem;
        await db.tasks.put(updated as any);
        set({ tasks: get().tasks.map((x) => (x.id === id ? updated : x)) });
        // If due date set/changed, schedule a reminder
        if (patch.dueAt && updated.dueAt) {
          reminderService.scheduleNotification({
            id: `task-${updated.id}-${updated.dueAt}`,
            type: 'wellness',
            title: 'Task reminder',
            message: updated.title
          } as any, updated.dueAt);
        }
      },
      async deleteTask(id) {
        await db.tasks.delete(id as any);
        set({ tasks: get().tasks.filter((x) => x.id !== id) });
      }
    }),
    { name: 'clear-app-state' }
  )
);

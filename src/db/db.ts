import Dexie, { Table } from 'dexie';
import { encryptString, decryptString, getKeyOrNull } from '../utils/cryptoKey';
import type { CheckIn, DecisionRecord, JournalEntry, TaskItem } from '../store/appStore';

class ClearDB extends Dexie {
  checkIns!: Table<CheckIn, string>;
  decisions!: Table<DecisionRecord, string>;
  journals!: Table<JournalEntry, string>;
  tasks!: Table<TaskItem, string>;

  constructor() {
    super('clear-db');
    this.version(1).stores({
      checkIns: 'id, createdAt, mood',
      decisions: 'id, createdAt',
      journals: 'id, createdAt'
    });
    // add tasks in next version
    this.version(2).stores({
      tasks: 'id, createdAt, dueAt, completed'
    });

    this.checkIns.mapToClass(class {});
    this.decisions.mapToClass(class {});
    this.journals.mapToClass(class {});
    if (this.tasks) {
      this.tasks.mapToClass(class {} as any);
    }
  }
}

export const db = new ClearDB();

// Basic hooks for encryption at boundary
export async function exportEncryptedWithKey(): Promise<string> {
  if (!getKeyOrNull()) throw new Error('Locked: set or unlock passphrase first');
  const payload = {
    checkIns: await db.checkIns.toArray(),
    decisions: await db.decisions.toArray(),
  journals: await db.journals.toArray(),
  tasks: (await (db.tasks?.toArray?.() ?? Promise.resolve([])))
  };
  return encryptString(JSON.stringify(payload));
}

export async function importEncryptedWithKey(blob: string) {
  if (!getKeyOrNull()) throw new Error('Locked: set or unlock passphrase first');
  const json = await decryptString(blob);
  const data = JSON.parse(json);
  await db.transaction('rw', db.checkIns, db.decisions, db.journals, db.tasks, async () => {
    await Promise.all([
      db.checkIns.clear(),
      db.decisions.clear(),
      db.journals.clear(),
      db.tasks.clear()
    ]);
    await db.checkIns.bulkAdd(data.checkIns || []);
    await db.decisions.bulkAdd(data.decisions || []);
    await db.journals.bulkAdd(data.journals || []);
    if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks);
  });
}

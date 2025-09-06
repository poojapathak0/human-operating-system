import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/db';
import * as checkin from '../modules/checkin';
import * as vault from '../modules/vault';
import * as tasks from '../modules/tasks';
import { setPassphrase, lock } from '../utils/cryptoKey';

describe('Service modules (offline, local)', () => {
  beforeEach(async () => {
    // Clear DB between tests
    await db.transaction('rw', db.checkIns, db.decisions, db.journals, db.tasks, async () => {
      await db.checkIns.clear();
      await db.decisions.clear();
      await db.journals.clear();
      await db.tasks.clear();
    });
    lock();
  });

  it('check-in: add and list', async () => {
    await checkin.addCheckIn({ mood: 'calm', notes: 'walk and water' });
    await checkin.addCheckIn({ mood: 'happy' });
    const list = await checkin.listCheckIns();
    expect(list.length).toBe(2);
    const stats = await checkin.getMoodStats(7);
    expect(stats.calm + stats.happy).toBeGreaterThan(0);
  });

  it('vault: requires passphrase; encrypts and decrypts', async () => {
    await setPassphrase('test-strong-pass');
    const rec = await vault.addJournalEntry('private thoughts');
    const list = await vault.listJournalEntries();
    expect(list.length).toBe(1);
    const plain = await vault.readJournalEntry(rec);
    expect(plain).toContain('private');
  });

  it('tasks: add, toggle with daily repeat roll, update due, delete', async () => {
    const t = await tasks.addTask({ title: 'Drink water', repeat: 'daily', dueAt: Date.now() + 1_000 });
    expect(t.completed).toBe(false);
    const n1 = await tasks.toggleTask(t.id);
    // Because repeat=daily and dueAt existed, it should roll and be active (not completed)
    expect(n1?.completed).toBe(false);
    const n2 = await tasks.updateTask(t.id, { dueAt: Date.now() + 3600_000 });
    expect(n2?.dueAt).toBeTypeOf('number');
    await tasks.deleteTask(t.id);
    const all = await tasks.listTasks();
    expect(all.find((x) => x.id === t.id)).toBeUndefined();
  });
});

import { db } from '../../db/db';
import type { TaskItem, TaskRepeat } from '../../store/appStore';
import { v4 as uuidv4 } from 'uuid';
import { reminderService } from '../../utils/reminders';

function maybeSchedule(title: string, id: string, dueAt?: number) {
  if (typeof window === 'undefined') return; // avoid side effects in tests/node
  if (!dueAt) return;
  try {
    reminderService.scheduleNotification({
      id: `task-${id}-${dueAt}`,
      type: 'wellness',
      title: 'Task reminder',
      message: title,
    } as any, dueAt);
  } catch {}
}

export async function addTask(input: { title: string; dueAt?: number; repeat?: TaskRepeat }): Promise<TaskItem> {
  const rec: TaskItem = {
    id: uuidv4(),
    title: input.title,
    dueAt: input.dueAt,
    repeat: input.repeat ?? 'none',
    completed: false,
    createdAt: Date.now(),
  };
  await db.tasks.add(rec as any);
  maybeSchedule(rec.title, rec.id, rec.dueAt);
  return rec;
}

export async function listTasks(): Promise<TaskItem[]> {
  const all = await db.tasks.toArray();
  // optional sort by createdAt
  return all.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

export async function toggleTask(id: string): Promise<TaskItem | undefined> {
  const t = await db.tasks.get(id as any);
  if (!t) return undefined;
  let updated: TaskItem = { ...t, completed: !t.completed } as TaskItem;
  if (updated.completed && updated.repeat !== 'none' && updated.dueAt) {
    const base = new Date(updated.dueAt);
    if (updated.repeat === 'daily') base.setDate(base.getDate() + 1);
    if (updated.repeat === 'weekly') base.setDate(base.getDate() + 7);
    updated = { ...updated, completed: false, dueAt: base.getTime() };
    maybeSchedule(updated.title, updated.id, updated.dueAt);
  }
  await db.tasks.put(updated as any);
  return updated;
}

export async function updateTask(id: string, patch: Partial<Omit<TaskItem, 'id' | 'createdAt'>>): Promise<TaskItem | undefined> {
  const t = await db.tasks.get(id as any);
  if (!t) return undefined;
  const updated: TaskItem = { ...t, ...patch } as TaskItem;
  await db.tasks.put(updated as any);
  if (typeof patch.dueAt === 'number') maybeSchedule(updated.title, updated.id, updated.dueAt);
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id as any);
}

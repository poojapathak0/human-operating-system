import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { reminderService } from '../utils/reminders';
import * as tasksSvc from '../modules/tasks';

// date formatting helper not currently used

export default function Planner() {
  const [tasks, setTasks] = useState(useAppStore.getState().tasks);
  // keep local tasks in sync with store hydration as a fallback
  useEffect(() => {
    const unsub = useAppStore.subscribe((s) => setTasks(s.tasks));
    return () => unsub();
  }, []);

  const checkIns = useAppStore((s) => s.checkIns);
  const journals = useAppStore((s) => s.journals);

  const [title, setTitle] = useState('');
  const [due, setDue] = useState<string>('');
  const [repeat, setRepeat] = useState<'none'|'daily'|'weekly'>('none');

  const suggestions = useMemo(() => {
    // lightweight on-device suggestion: if user often notes "walk", "water", “sleep”, suggest them
    const text = [
      ...checkIns.map((c) => c.notes || ''),
    ].join(' ').toLowerCase();
    const picks: string[] = [];
    if (/(walk|steps|stroll)/.test(text)) picks.push('10‑minute walk');
    if (/(water|hydrate|drink)/.test(text)) picks.push('Drink water (1 glass)');
    if (/(sleep|tired|rest)/.test(text)) picks.push('Wind‑down at 10pm');
    if (/(journal|write|reflect)/.test(text)) picks.push('5‑minute reflection');
    if (picks.length === 0) picks.push('2‑minute breathing');
    return Array.from(new Set(picks)).slice(0, 4);
  }, [checkIns, journals]);

  async function onAdd() {
    if (!title.trim()) return;
    const dueAt = due ? Date.parse(due) : undefined;
  const rec = await tasksSvc.addTask({ title: title.trim(), dueAt, repeat });
  setTasks((prev) => [...prev, rec]);
    setTitle(''); setDue(''); setRepeat('none');
    // schedule a one-shot reminder if dueAt exists
    if (dueAt) {
      reminderService.scheduleNotification({
        id: `task-${Date.now()}`,
        type: 'wellness',
        title: 'Task reminder',
        message: title,
      } as any, dueAt);
    }
  }

  function toICS() {
    // very small ICS export for tasks with dueAt
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Clear//Planner//EN'
    ];
    tasks.filter(t => t.dueAt).forEach(t => {
      const dt = new Date(t.dueAt!);
      const pad = (n:number)=>String(n).padStart(2,'0');
      const stamp = `${dt.getUTCFullYear()}${pad(dt.getUTCMonth()+1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${t.id}@clear`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`DTSTART:${stamp}`);
      lines.push(`SUMMARY:${t.title}`);
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'clear-planner.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="section-premium">
      <div className="header-premium">
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🗓️</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Planner</div>
        <div style={{ color: 'var(--text-secondary)' }}>Daily tasks, routines, and reminders</div>
      </div>

  <div className="card card-premium" style={{ display: 'grid', gap: 'var(--space-md)' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="task-title" style={{ fontWeight: 600 }}>Task Title</label>
          <input id="task-title" className="input-premium" placeholder="Task title" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <label htmlFor="task-due" style={{ fontWeight: 600 }}>Due</label>
              <input id="task-due" className="input-premium" type="datetime-local" value={due} onChange={(e)=>setDue(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <label htmlFor="task-repeat" style={{ fontWeight: 600 }}>Repeat</label>
              <select id="task-repeat" className="input-premium" value={repeat} onChange={(e)=>setRepeat(e.target.value as any)}>
              <option value="none">One‑time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {suggestions.map((s) => (
              <button key={s} className="btn btn-secondary" onClick={()=>setTitle(s)}>{s}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={onAdd} style={{ background: 'var(--brand-gradient)' }}>Add Task</button>
          <button className="btn btn-secondary" onClick={async ()=>{
            // Generate a simple daily plan from suggestions
            const now = new Date();
            const todayAt = (h:number,m:number)=>{ const d=new Date(now); d.setHours(h,m,0,0); return d.getTime(); };
            const picks = suggestions.slice(0,3);
            for (let i=0;i<picks.length;i++) {
              const rec = await tasksSvc.addTask({ title: picks[i], repeat: 'daily', dueAt: todayAt(9+i*2, 0) });
              setTasks((prev)=>[...prev, rec]);
            }
          }}>Generate Daily Plan</button>
          <button className="btn btn-secondary" onClick={toICS}>Export to Calendar (.ics)</button>
        </div>
      </div>

      <div className="card card-premium" style={{ marginTop: 'var(--space-lg)' }}>
        <h3 style={{ marginTop: 0 }}>Your Tasks</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {tasks.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No tasks yet.</div>}
          {tasks.map((t) => (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={t.completed} onChange={async ()=>{
                const updated = await tasksSvc.toggleTask(t.id);
                if (updated) setTasks((prev)=>prev.map(x=>x.id===t.id?updated:x));
              }} />
              <div>
                <div style={{ fontWeight: 600, textDecoration: t.completed ? 'line-through' : 'none' }}>{t.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {t.dueAt ? new Date(t.dueAt).toLocaleString() : 'No due date'} · {t.repeat}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={async ()=>{
                  const updated = await tasksSvc.updateTask(t.id, { dueAt: Date.now() + 60*60*1000 });
                  if (updated) setTasks((prev)=>prev.map(x=>x.id===t.id?updated:x));
                }}>+1h</button>
                <button className="btn btn-secondary" onClick={async ()=>{
                  await tasksSvc.deleteTask(t.id);
                  setTasks((prev)=>prev.filter(x=>x.id!==t.id));
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useAppStore, CheckIn } from '../store/appStore';
import { useI18n } from '../utils/i18n';
import { MoodProgressRing } from '../components/ProgressRing';

export default function Timeline() {
  const t = useI18n();
  const checkIns = useAppStore((s) => s.checkIns);

  const moodEmojis: Record<string, string> = {
    sad: '😢',
    tired: '😴', 
    neutral: '😐',
    calm: '😌',
    happy: '😊'
  };

  const counts = checkIns.reduce<Record<string, number>>((acc: Record<string, number>, c: CheckIn) => {
    acc[c.mood] = (acc[c.mood] || 0) + 1;
    return acc;
  }, {});
  
  const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = checkIns.filter((c: CheckIn) => c.createdAt >= lastWeek);
  const scoreMap: Record<string, number> = { sad: 1, tired: 2, neutral: 3, calm: 4, happy: 5 };
  const avg = recent.length
    ? (recent.reduce((s: number, c: CheckIn) => s + (scoreMap[c.mood] || 3), 0) / recent.length).toFixed(1)
    : '—';

  const totalEntries = checkIns.length;
  const streakDays = calculateStreak(checkIns);

  function calculateStreak(entries: CheckIn[]): number {
    if (entries.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dayStart = currentDate.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const hasEntry = entries.some(entry => 
        entry.createdAt >= dayStart && entry.createdAt < dayEnd
      );
      
      if (hasEntry) {
        streak++;
      } else {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>✨ {t('timeline.title')}</h2>
        <div style={{ 
          background: 'var(--brand-gradient)', 
          color: 'white', 
          padding: 'var(--space-sm) var(--space-md)', 
          borderRadius: '20px', 
          fontSize: '0.875rem', 
          fontWeight: '600',
          boxShadow: 'var(--shadow-glow)'
        }}>
          {streakDays} day streak 🔥
        </div>
      </div>

      {/* Premium Stats Dashboard */}
      <div className="card card-premium" style={{ marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ margin: '0 0 var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '1.5rem' }}>
          📊 Your Wellness Dashboard
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-xl)' }}>
          {/* Average Score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '800', 
              background: 'var(--brand-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 'var(--space-sm)'
            }}>
              {avg}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>7-day Average</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
              Based on {recent.length} recent entries
            </div>
          </div>

          {/* Total Entries */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, #10b981, #059669)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 'var(--space-sm)'
            }}>
              {totalEntries}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Total Check-ins</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
              Your wellness journey
            </div>
          </div>

          {/* Streak */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 'var(--space-sm)'
            }}>
              {streakDays}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Day Streak 🔥</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
              Keep it going!
            </div>
          </div>
        </div>
      </div>

      {/* Mood Breakdown with Progress Rings */}
      <div className="card" style={{ background: 'var(--surface-glass)' }}>
        <h3 style={{ margin: '0 0 var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          🎭 Mood Distribution
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: 'var(--space-lg)',
          justifyItems: 'center'
        }}>
          {Object.entries(counts).map(([mood, count]) => (
            <div key={mood} style={{ textAlign: 'center' }}>
              <MoodProgressRing mood={mood} total={count} />
              <div style={{ 
                marginTop: 'var(--space-sm)', 
                fontWeight: '600', 
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                {t(`mood.${mood}`)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ul className="list">
        {checkIns
          .slice()
          .sort((a: CheckIn, b: CheckIn) => b.createdAt - a.createdAt)
          .map((ci: CheckIn) => (
            <li key={ci.id} className="card">
              <div className="row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{moodEmojis[ci.mood]}</span>
                  <strong>{t(`mood.${ci.mood}`)}</strong>
                </div>
                <small style={{ color: 'var(--muted)' }}>{new Date(ci.createdAt).toLocaleString()}</small>
              </div>
              {ci.notes && <p style={{ margin: '12px 0 0', color: 'var(--text)', lineHeight: '1.5' }}>{ci.notes}</p>}
            </li>
          ))}
      </ul>
    </section>
  );
}

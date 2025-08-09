import { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { useI18n } from '../utils/i18n';

export default function CheckIn() {
  const t = useI18n();
  const addCheckIn = useAppStore((s) => s.addCheckIn);
  const [mood, setMood] = useState<string>('neutral');
  const [notes, setNotes] = useState('');
  const rec = useRef<any>(null);
  const [recOn, setRecOn] = useState(false);
  const speechEnabled =
    typeof window !== 'undefined' &&
    localStorage.getItem('clear.speech') === '1' &&
    (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window));

  function toggleRec() {
    if (!speechEnabled) return;
    if (!rec.current) {
      const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      rec.current = new SR();
      rec.current.lang = 'en-US';
      rec.current.interimResults = true;
      rec.current.continuous = false;
      rec.current.onresult = (e: any) => {
        const t = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
        setNotes((prev) => (prev ? prev + ' ' : '') + t);
      };
      rec.current.onend = () => setRecOn(false);
    }
    if (recOn) {
      rec.current?.stop();
      setRecOn(false);
    } else {
      rec.current?.start();
      setRecOn(true);
    }
  }

  const moodEmojis: Record<string, string> = {
    sad: '😢',
    tired: '😴', 
    neutral: '😐',
    calm: '😌',
    happy: '😊'
  };

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>💫 {t('checkin.title')}</h2>
        <div style={{ 
          background: 'var(--accent-success)', 
          color: 'white', 
          padding: 'var(--space-xs) var(--space-md)', 
          borderRadius: '20px', 
          fontSize: '0.75rem', 
          fontWeight: '600',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
        }}>
          Daily Wellness
        </div>
      </div>

      <div className="card card-premium">
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <label style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            display: 'block', 
            marginBottom: 'var(--space-md)',
            background: 'var(--brand-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {t('checkin.how_are_you')}
          </label>
          <div className="moodRow">
            {['sad', 'tired', 'neutral', 'calm', 'happy'].map((m) => (
              <button
                key={m}
                className={mood === m ? 'mood active' : 'mood'}
                onClick={() => setMood(m)}
                style={{
                  background: mood === m ? 'var(--brand-gradient)' : 'var(--surface-glass)',
                  transform: mood === m ? 'translateY(-6px) scale(1.05)' : undefined
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: 'var(--space-sm)' }}>{moodEmojis[m]}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t(`mood.${m}`)}</div>
              </button>
            ))}
          </div>
        </div>
        <label style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          display: 'block', 
          marginBottom: 'var(--space-md)',
          color: 'var(--text-primary)'
        }}>
          {t('checkin.top_priority')}
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <textarea
            placeholder={t('checkin.note_placeholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-premium"
            style={{ 
              flex: 1,
              minHeight: '100px',
              resize: 'vertical',
              fontFamily: 'var(--font-system)',
              fontSize: '1rem'
            }}
          />
          {speechEnabled && (
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              aria-pressed={recOn}
              onClick={toggleRec}
              style={{
                minWidth: '60px',
                height: '60px',
                borderRadius: '50%',
                background: recOn ? 'var(--accent-gradient)' : 'var(--surface-glass)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-glass)',
                boxShadow: recOn ? 'var(--shadow-glow)' : 'var(--shadow-soft)',
                transform: recOn ? 'scale(1.05)' : undefined,
                transition: 'all 0.3s var(--ease-spring)'
              }}
            >
              <span style={{ fontSize: '20px' }}>{recOn ? '⏹️' : '🎤'}</span>
            </button>
          )}
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            addCheckIn({ mood: mood as any, notes, createdAt: Date.now() });
            setNotes('');
          }}
          style={{ 
            width: '100%',
            marginTop: 'var(--space-lg)',
            background: 'var(--brand-gradient)',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}
        >
          {t('common.save')}
        </button>
      </div>
    </section>
  );
}

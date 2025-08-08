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

  return (
    <section>
      <h2>{t('checkin.title')}</h2>
      <div className="card">
        <label>{t('checkin.how_are_you')}</label>
        <div className="moodRow">
          {['sad', 'tired', 'neutral', 'calm', 'happy'].map((m) => (
            <button
              key={m}
              className={mood === m ? 'mood active' : 'mood'}
              onClick={() => setMood(m)}
            >
              {t(`mood.${m}`)}
            </button>
          ))}
        </div>
        <label>{t('checkin.top_priority')}</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <textarea
            placeholder={t('checkin.note_placeholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ flex: 1 }}
          />
          {speechEnabled && (
            <button
              type="button"
              className="micBtn"
              aria-pressed={recOn}
              onClick={toggleRec}
            >
              {recOn ? 'Stop' : 'Speak'}
            </button>
          )}
        </div>
        <button
          onClick={() => {
            addCheckIn({ mood: mood as any, notes, createdAt: Date.now() });
            setNotes('');
          }}
        >
          {t('common.save')}
        </button>
      </div>
    </section>
  );
}

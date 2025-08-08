import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useI18n } from '../utils/i18n';

export default function CheckIn() {
  const t = useI18n();
  const addCheckIn = useAppStore((s) => s.addCheckIn);
  const [mood, setMood] = useState<string>('neutral');
  const [notes, setNotes] = useState('');

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
        <textarea
          placeholder={t('checkin.note_placeholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          onClick={() => {
            addCheckIn({ mood, notes, createdAt: Date.now() });
            setNotes('');
          }}
        >
          {t('common.save')}
        </button>
      </div>
    </section>
  );
}

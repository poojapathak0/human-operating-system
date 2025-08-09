import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useI18n } from '../utils/i18n';

export default function DecisionCompass() {
  const t = useI18n();
  const addDecision = useAppStore((s) => s.addDecision);
  const [question, setQuestion] = useState('');
  const [values, setValues] = useState('');
  const [options, setOptions] = useState('');

  return (
    <section className="section-premium">
      <div className="header-premium">
        <div style={{
          fontSize: '2.5rem',
          marginBottom: 'var(--space-sm)',
          filter: 'drop-shadow(0 2px 8px var(--brand-500))'
        }}>
          🧭
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          background: 'var(--brand-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 'var(--space-sm)'
        }}>
          {t('compass.title')}
        </div>
        <div style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          Navigate difficult decisions with clarity and alignment to your values
        </div>
      </div>

      <div className="card card-premium">
        <div className="form-section">
          <label className="label-premium">{t('compass.question')}</label>
          <input 
            className="input-premium"
            placeholder="What decision are you facing?"
            value={question} 
            onChange={(e) => setQuestion(e.target.value)}
            style={{ fontSize: '1.1rem' }}
          />
        </div>

        <div className="form-section">
          <label className="label-premium">{t('compass.values')}</label>
          <input
            className="input-premium"
            placeholder={t('compass.values_ph')}
            value={values}
            onChange={(e) => setValues(e.target.value)}
          />
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)', 
            marginTop: 'var(--space-sm)' 
          }}>
            💡 Separate multiple values with commas
          </div>
        </div>

        <div className="form-section">
          <label className="label-premium">{t('compass.options')}</label>
          <textarea
            className="input-premium"
            placeholder={t('compass.options_ph')}
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            style={{ minHeight: '120px', resize: 'vertical' }}
          />
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)', 
            marginTop: 'var(--space-sm)' 
          }}>
            📝 Put each option on a new line
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            addDecision({
              question,
              values: values.split(',').map((v) => v.trim()).filter(Boolean),
              options: options.split('\n').map((o) => o.trim()).filter(Boolean),
              createdAt: Date.now()
            });
            setQuestion('');
            setValues('');
            setOptions('');
          }}
          style={{ 
            width: '100%',
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

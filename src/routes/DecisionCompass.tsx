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
    <section>
      <h2>{t('compass.title')}</h2>
      <div className="card">
        <label>{t('compass.question')}</label>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} />

        <label>{t('compass.values')}</label>
        <input
          placeholder={t('compass.values_ph')}
          value={values}
          onChange={(e) => setValues(e.target.value)}
        />

        <label>{t('compass.options')}</label>
        <textarea
          placeholder={t('compass.options_ph')}
          value={options}
          onChange={(e) => setOptions(e.target.value)}
        />

        <button
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
        >
          {t('common.save')}
        </button>
      </div>
    </section>
  );
}

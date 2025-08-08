import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

const resources = {
  en: {
    translation: {
      common: { save: 'Save' },
      mood: {
        sad: 'Sad',
        tired: 'Tired',
        neutral: 'Neutral',
        calm: 'Calm',
        happy: 'Happy'
      },
      checkin: {
        title: 'Daily Clarity Check-In',
        how_are_you: 'How are you feeling?',
        top_priority: "What's your top priority today?",
        note_placeholder: 'Write a short note…'
      },
      timeline: { title: 'Life Reflection Timeline' },
      compass: {
        title: 'Decision Compass',
        question: 'What decision are you exploring?',
        values: 'Core values (comma-separated)',
        values_ph: 'e.g., honesty, family, growth',
        options: 'Options (one per line)',
        options_ph: 'List possible options…'
      },
      vault: {
        title: 'Inner Vault',
        placeholder: 'Private journal entry…',
        unlock: 'Unlock with passphrase',
        lock: 'Lock',
        unlocked: 'Unlocked',
        enter_passphrase: 'Enter your passphrase',
        locked: 'Locked — unlock to view',
        loading: 'Decrypting…'
      }
    }
  }
  ,
  hi: {
    translation: {
      common: { save: 'सहेजें' },
      mood: {
        sad: 'उदास',
        tired: 'थका हुआ',
        neutral: 'सामान्य',
        calm: 'शांत',
        happy: 'खुश'
      },
      checkin: {
        title: 'दैनिक स्पष्टता जाँच',
        how_are_you: 'आप कैसा महसूस कर रहे हैं?',
        top_priority: 'आज आपकी सबसे बड़ी प्राथमिकता क्या है?',
        note_placeholder: 'छोटा सा नोट लिखें…'
      },
      timeline: { title: 'जीवन प्रतिबिंब समयरेखा' },
      compass: {
        title: 'निर्णय कम्पास',
        question: 'आप कौन सा निर्णय सोच रहे हैं?',
        values: 'मूल्य (अल्पविराम से अलग)',
        values_ph: 'जैसे ईमानदारी, परिवार, विकास',
        options: 'विकल्प (हर पंक्ति में एक)',
        options_ph: 'संभावित विकल्प लिखें…'
      },
      vault: {
        title: 'आंतरिक तिजोरी',
        placeholder: 'निजी डायरी प्रविष्टि…',
        unlock: 'पासफ़्रेज़ से अनलॉक करें',
        lock: 'लॉक',
        unlocked: 'अनलॉक',
        enter_passphrase: 'अपना पासफ़्रेज़ दर्ज करें',
        locked: 'लॉक — देखने के लिए अनलॉक करें',
        loading: 'डिक्रिप्ट किया जा रहा है…'
      }
    }
  }
  ,
  es: {
    translation: {
      common: { save: 'Guardar' },
      mood: {
        sad: 'Triste',
        tired: 'Cansado',
        neutral: 'Neutral',
        calm: 'Calmo',
        happy: 'Feliz'
      },
      checkin: {
        title: 'Chequeo Diario de Claridad',
        how_are_you: '¿Cómo te sientes?',
        top_priority: '¿Tu prioridad de hoy?',
        note_placeholder: 'Escribe una nota corta…'
      },
      timeline: { title: 'Línea de Reflexión de Vida' },
      compass: {
        title: 'Brújula de Decisiones',
        question: '¿Qué decisión estás explorando?',
        values: 'Valores (separados por comas)',
        values_ph: 'p. ej., honestidad, familia, crecimiento',
        options: 'Opciones (una por línea)',
        options_ph: 'Lista opciones posibles…'
      },
      vault: {
        title: 'Bóveda Interior',
        placeholder: 'Entrada de diario privada…',
        unlock: 'Desbloquear con contraseña',
        lock: 'Bloquear',
        unlocked: 'Desbloqueado',
        enter_passphrase: 'Ingresa tu contraseña',
        locked: 'Bloqueado — desbloquea para ver',
        loading: 'Descifrando…'
      }
    }
  }
} as const;

const savedLng = localStorage.getItem('clear.lng') || 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: savedLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export const useI18n = () => {
  const { t } = useTranslation();
  return t;
};

export function setLanguage(lng: 'en' | 'hi' | 'es') {
  i18n.changeLanguage(lng);
  localStorage.setItem('clear.lng', lng);
}

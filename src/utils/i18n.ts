import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

// Lazy language loader
async function loadLanguage(lng: string) {
  switch (lng) {
    case 'hi':
      return (await import('../locales/hi.json')).default;
    case 'es':
      return (await import('../locales/es.json')).default;
    case 'ar':
      return (await import('../locales/ar.json')).default;
    case 'fr':
      return (await import('../locales/fr.json')).default;
    default:
      return (await import('../locales/en.json')).default;
  }
}

const savedLng = (localStorage.getItem('clear.lng') as string) || 'en';

i18n.use(initReactI18next).init({
  resources: {},
  lng: savedLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

// Preload current language
loadLanguage(savedLng).then((res) => {
  i18n.addResourceBundle(savedLng, 'translation', res, true, true);
});

export const useI18n = () => {
  const { t } = useTranslation();
  return t;
};

export async function setLanguage(lng: 'en' | 'hi' | 'es' | 'ar' | 'fr') {
  const res = await loadLanguage(lng);
  i18n.addResourceBundle(lng, 'translation', res, true, true);
  i18n.changeLanguage(lng);
  localStorage.setItem('clear.lng', lng);
  // Set dir for RTL languages
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
}

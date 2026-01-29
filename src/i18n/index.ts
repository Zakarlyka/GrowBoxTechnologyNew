import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import uk from './locales/uk.json';
import ru from './locales/ru.json';

// Standardized language codes: ua, en, ru
// 'ua' maps to Ukrainian locale file (uk.json)
const resources = {
  en: { translation: en },
  ua: { translation: uk },  // 'ua' code uses Ukrainian translations
  ru: { translation: ru },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ua', // default language (Ukrainian)
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
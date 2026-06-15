import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    debug: false,
    interpolation: {
      escapeValue: false, // React already doing escaping
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    ns: ['common', 'vehicle', 'maintenance', 'seo', 'logs', 'dashboard', 'routes', 'manuals'],
    defaultNS: 'common',
    react: {
      useSuspense: false
    }
  });

// Since we are not using HTTP backend (to prevent async loading issues in simple setups), we'll import them directly or use fetch. 
// For better Vite compatibility without an http backend plugin, let's just bundle the translations directly.

import common_es from '../public/locales/es/common.json';
import vehicle_es from '../public/locales/es/vehicle.json';
import maintenance_es from '../public/locales/es/maintenance.json';
import seo_es from '../public/locales/es/seo.json';

import common_en from '../public/locales/en/common.json';
import vehicle_en from '../public/locales/en/vehicle.json';
import maintenance_en from '../public/locales/en/maintenance.json';
import seo_en from '../public/locales/en/seo.json';
import logs_es from '../public/locales/es/logs.json';
import logs_en from '../public/locales/en/logs.json';
import dashboard_es from '../public/locales/es/dashboard.json';
import dashboard_en from '../public/locales/en/dashboard.json';
import routes_es from '../public/locales/es/routes.json';
import routes_en from '../public/locales/en/routes.json';
import manuals_es from '../public/locales/es/manuals.json';
import manuals_en from '../public/locales/en/manuals.json';

i18n.addResourceBundle('es', 'common', common_es);
i18n.addResourceBundle('es', 'vehicle', vehicle_es);
i18n.addResourceBundle('es', 'maintenance', maintenance_es);
i18n.addResourceBundle('es', 'seo', seo_es);
i18n.addResourceBundle('es', 'logs', logs_es);
i18n.addResourceBundle('es', 'dashboard', dashboard_es);
i18n.addResourceBundle('es', 'routes', routes_es);
i18n.addResourceBundle('es', 'manuals', manuals_es);

i18n.addResourceBundle('en', 'common', common_en);
i18n.addResourceBundle('en', 'vehicle', vehicle_en);
i18n.addResourceBundle('en', 'maintenance', maintenance_en);
i18n.addResourceBundle('en', 'seo', seo_en);
i18n.addResourceBundle('en', 'logs', logs_en);
i18n.addResourceBundle('en', 'dashboard', dashboard_en);
i18n.addResourceBundle('en', 'routes', routes_en);
i18n.addResourceBundle('en', 'manuals', manuals_en);

export default i18n;

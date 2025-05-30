import { createInstance, i18n } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import i18nConfig from '@/app/i18nConfig';

export default async function initTranslations(
    locale: string,
    namespaces: string[],
    i18nInstance?: i18n,
    resources?: any,
) {
    i18nInstance = i18nInstance || createInstance();

    i18nInstance.use(initReactI18next);

    await i18nInstance.init({
        lng: locale,
        resources,
        fallbackLng: i18nConfig.defaultLocale,
        supportedLngs: i18nConfig.locales,
        defaultNS: namespaces[0],
        fallbackNS: namespaces[0],
        ns: namespaces,
    });

    return {
        i18n: i18nInstance,
        resources: i18nInstance.services.resourceStore.data,
        t: i18nInstance.t,
    };
}
import i18next from "i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";

function detectLocale(): string {
  return Intl.DateTimeFormat().resolvedOptions().locale.split("-")[0];
}

export async function initI18n(): Promise<void> {
  const lng = detectLocale();

  await i18next.init({
    lng,
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

export const t = i18next.t.bind(i18next);

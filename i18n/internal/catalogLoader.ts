import {
  DEFAULT_LOCALE,
  type LocaleCode,
} from '@/i18n/config';
import {
  composeLocaleTranslations,
  type TranslationTree,
} from '@/i18n/internal/translationTree';

export type TranslationTreeLoader = () => Promise<TranslationTree>;

export interface LocaleCatalogLoader {
  clearCache: () => void;
  isLoaded: (locale: LocaleCode) => boolean;
  loadLocale: (locale: LocaleCode) => Promise<TranslationTree>;
  preloadLocale: (locale: LocaleCode) => Promise<TranslationTree>;
}

interface CreateLocaleCatalogLoaderOptions {
  baseLoaders: Record<LocaleCode, TranslationTreeLoader>;
  overrideLoaders?: Partial<Record<LocaleCode, TranslationTreeLoader>>;
}

export function createLocaleCatalogLoader({
  baseLoaders,
  overrideLoaders = {},
}: CreateLocaleCatalogLoaderOptions): LocaleCatalogLoader {
  const loadedLocales = new Map<LocaleCode, TranslationTree>();
  const inFlightLoads = new Map<LocaleCode, Promise<TranslationTree>>();

  const loadLocale = async (locale: LocaleCode) => {
    const cachedLocale = loadedLocales.get(locale);
    if (cachedLocale) {
      return cachedLocale;
    }

    const existingLoad = inFlightLoads.get(locale);
    if (existingLoad) {
      return existingLoad;
    }

    const loadPromise = (async () => {
      const baseTranslations = await baseLoaders[locale]();
      const overrideTranslations = overrideLoaders[locale]
        ? await overrideLoaders[locale]!()
        : undefined;
      const localeTree = composeLocaleTranslations(
        baseTranslations,
        overrideTranslations,
      );

      loadedLocales.set(locale, localeTree);
      return localeTree;
    })().finally(() => {
      inFlightLoads.delete(locale);
    });

    inFlightLoads.set(locale, loadPromise);
    return loadPromise;
  };

  return {
    clearCache: () => {
      loadedLocales.clear();
      inFlightLoads.clear();
    },
    isLoaded: (locale) => loadedLocales.has(locale),
    loadLocale,
    preloadLocale: loadLocale,
  };
}

export async function activateLocaleWithFallbacks(
  activateLocale: (locale: LocaleCode) => Promise<unknown>,
  localeCandidates: readonly LocaleCode[],
) {
  const attemptedLocales = new Set<LocaleCode>();
  let lastError: unknown;

  for (const locale of localeCandidates) {
    if (attemptedLocales.has(locale)) {
      continue;
    }

    attemptedLocales.add(locale);

    try {
      await activateLocale(locale);
      return locale;
    } catch (error) {
      lastError = error;
    }
  }

  throw (
    lastError ??
    new Error(
      `Unable to activate any locale candidate. Default locale: ${DEFAULT_LOCALE}.`,
    )
  );
}

const BASE_LOCALE_LOADERS: Record<LocaleCode, TranslationTreeLoader> = {
  fr: async () => require('../locales/fr').FR_TRANSLATIONS,
  en: async () => require('../locales/en').EN_TRANSLATIONS,
  de: async () => require('../locales/de').DE_TRANSLATIONS,
  it: async () => require('../locales/it').IT_TRANSLATIONS,
  es: async () => require('../locales/es').ES_TRANSLATIONS,
  pt: async () => require('../locales/pt').PT_TRANSLATIONS,
};

const RESULT_OVERRIDE_LOADERS: Partial<Record<LocaleCode, TranslationTreeLoader>> = {
  fr: async () => require('../results/fr').FR_RESULT_TRANSLATIONS,
  en: async () => require('../results/en').EN_RESULT_TRANSLATIONS,
  de: async () => require('../results/de').DE_RESULT_TRANSLATIONS,
  it: async () => require('../results/it').IT_RESULT_TRANSLATIONS,
  es: async () => require('../results/es').ES_RESULT_TRANSLATIONS,
  pt: async () => require('../results/pt').PT_RESULT_TRANSLATIONS,
};

export const localeCatalogLoader = createLocaleCatalogLoader({
  baseLoaders: BASE_LOCALE_LOADERS,
  overrideLoaders: RESULT_OVERRIDE_LOADERS,
});

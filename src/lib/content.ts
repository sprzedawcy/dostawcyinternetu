// =====================================================
// lib/content.ts - Pobieranie tekstów UI z bazy danych
// DostawcyInternetu.pl
// =====================================================

import { prisma } from "@/lib/prisma";
import { cache } from "react";

type Locale = 'pl' | 'en' | 'ua';

interface ContentRow {
  key: string;
  value_pl: string;
  value_en: string | null;
  value_ua: string | null;
}

// =====================================================
// CACHE - React cache dla SSR (deduplikacja requestów)
// =====================================================

/**
 * Pobiera pojedynczy tekst z bazy
 * Używa React cache dla deduplikacji w SSR
 */
export const getContent = cache(async (
  key: string, 
  locale: Locale = 'pl'
): Promise<string> => {
  try {
    const row = await prisma.uiContent.findUnique({
      where: { key },
      select: {
        value_pl: true,
        value_en: true,
        value_ua: true,
      }
    });

    if (!row) {
      console.warn(`[Content] Missing key: ${key}`);
      return key; // Fallback do klucza
    }

    // Wybierz odpowiednią wersję językową
    const value = locale === 'en' ? row.value_en : 
                  locale === 'ua' ? row.value_ua : 
                  row.value_pl;

    return value || row.value_pl; // Fallback do PL
  } catch (error) {
    console.error(`[Content] Error fetching ${key}:`, error);
    return key;
  }
});

/**
 * Pobiera wiele tekstów naraz (batch)
 * Optymalizacja - jedno zapytanie zamiast wielu
 */
export const getContentBatch = cache(async (
  keys: string[], 
  locale: Locale = 'pl'
): Promise<Record<string, string>> => {
  try {
    const rows = await prisma.uiContent.findMany({
      where: { key: { in: keys } },
      select: {
        key: true,
        value_pl: true,
        value_en: true,
        value_ua: true,
      }
    });

    const result: Record<string, string> = {};
    
    for (const key of keys) {
      const row = rows.find(r => r.key === key);
      if (row) {
        const value = locale === 'en' ? row.value_en : 
                      locale === 'ua' ? row.value_ua : 
                      row.value_pl;
        result[key] = value || row.value_pl;
      } else {
        console.warn(`[Content] Missing key: ${key}`);
        result[key] = key;
      }
    }

    return result;
  } catch (error) {
    console.error(`[Content] Error fetching batch:`, error);
    // Zwróć klucze jako fallback
    return keys.reduce((acc, key) => ({ ...acc, [key]: key }), {});
  }
});

/**
 * Pobiera wszystkie teksty z kategorii
 */
export const getContentByCategory = cache(async (
  category: string, 
  locale: Locale = 'pl'
): Promise<Record<string, string>> => {
  try {
    const rows = await prisma.uiContent.findMany({
      where: { category },
      select: {
        key: true,
        value_pl: true,
        value_en: true,
        value_ua: true,
      }
    });

    const result: Record<string, string> = {};
    
    for (const row of rows) {
      const value = locale === 'en' ? row.value_en : 
                    locale === 'ua' ? row.value_ua : 
                    row.value_pl;
      result[row.key] = value || row.value_pl;
    }

    return result;
  } catch (error) {
    console.error(`[Content] Error fetching category ${category}:`, error);
    return {};
  }
});

// =====================================================
// HELPERS - Interpolacja zmiennych
// =====================================================

/**
 * Interpoluje zmienne w tekście
 * Przykład: interpolate("Internet w {miasto}", { miasto: "Warszawa" })
 * Wynik: "Internet w Warszawa"
 */
export function interpolate(
  template: string, 
  variables: Record<string, string | number>
): string {
  return template.replace(
    /\{(\w+)\}/g, 
    (_, key) => String(variables[key] ?? `{${key}}`)
  );
}

/**
 * Pobiera tekst i od razu interpoluje zmienne
 */
export async function getContentWithVars(
  key: string,
  variables: Record<string, string | number>,
  locale: Locale = 'pl'
): Promise<string> {
  const template = await getContent(key, locale);
  return interpolate(template, variables);
}

// =====================================================
// PRESETS - Gotowe zestawy tekstów dla komponentów
// =====================================================

/**
 * Teksty dla szukajki
 */
export async function getSearchContent(locale: Locale = 'pl') {
  return getContentBatch([
    'search.title',
    'search.city_label',
    'search.city_placeholder',
    'search.street_label',
    'search.street_placeholder',
    'search.number_label',
    'search.number_placeholder',
    'search.button',
    'search.loading',
  ], locale);
}

/**
 * Teksty dla listy ofert
 */
export async function getOffersContent(locale: Locale = 'pl') {
  return getContentBatch([
    'offer.order_now',
    'offer.check_availability',
    'offer.call_us',
    'offer.per_month',
    'offer.download',
    'offer.upload',
    'offer.technology',
    'offer.contract',
    'offer.no_results',
    'offer.filter_all',
    'offer.sort_recommended',
    'offer.sort_price_asc',
    'offer.sort_price_desc',
    'offer.sort_speed_desc',
    'badge.featured',
    'badge.local',
    'badge.mobile',
    'badge.cable',
    'badge.available',
  ], locale);
}

/**
 * Teksty dla modala adresu
 */
export async function getModalContent(locale: Locale = 'pl') {
  return getContentBatch([
    'modal.title',
    'modal.title_number',
    'modal.subtitle',
    'modal.city_label',
    'modal.street_label',
    'modal.number_label',
    'modal.street_placeholder',
    'modal.number_placeholder',
    'modal.select_street_first',
    'modal.confirm_button',
    'modal.footer_note',
  ], locale);
}

/**
 * Dane kontaktowe
 */
export async function getContactInfo() {
  return getContentBatch([
    'brand.phone',
    'brand.email',
  ], 'pl');
}

// =====================================================
// CLIENT-SIDE - Do użycia w Client Components
// =====================================================

/**
 * Typ dla contentu przekazywanego do client components
 */
export type ContentMap = Record<string, string>;

/**
 * Helper do tworzenia props z contentem
 * Użycie w Server Component:
 * 
 * const content = await getOffersContent(locale);
 * return <OffersList content={content} ... />
 */
export function createContentProps<T extends ContentMap>(content: T) {
  return { content };
}

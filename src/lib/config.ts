// =====================================================
// lib/config.ts - Pobieranie konfiguracji z bazy danych
// DostawcyInternetu.pl
// =====================================================

import { prisma } from "@/lib/prisma";
import { cache } from "react";

// =====================================================
// TYPES
// =====================================================

type ConfigValue = string | number | boolean | string[] | Record<string, unknown>;

interface ConfigRow {
  key: string;
  value: unknown; // JSONB
}

// =====================================================
// CACHE - React cache dla SSR
// =====================================================

/**
 * Pobiera pojedynczą wartość konfiguracji
 */
export const getConfig = cache(async <T extends ConfigValue>(
  key: string,
  defaultValue: T
): Promise<T> => {
  try {
    const row = await prisma.uiConfig.findUnique({
      where: { key },
      select: { value: true }
    });

    if (!row) {
      console.warn(`[Config] Missing key: ${key}, using default`);
      return defaultValue;
    }

    return row.value as T;
  } catch (error) {
    console.error(`[Config] Error fetching ${key}:`, error);
    return defaultValue;
  }
});

/**
 * Pobiera wiele wartości konfiguracji naraz
 */
export const getConfigBatch = cache(async (
  keys: string[]
): Promise<Record<string, ConfigValue>> => {
  try {
    const rows = await prisma.uiConfig.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true }
    });

    const result: Record<string, ConfigValue> = {};
    
    for (const row of rows) {
      result[row.key] = row.value as ConfigValue;
    }

    return result;
  } catch (error) {
    console.error(`[Config] Error fetching batch:`, error);
    return {};
  }
});

// =====================================================
// TYPED GETTERS - Typowane helpery
// =====================================================

/**
 * Pobiera wartość jako string
 */
export async function getConfigString(key: string, defaultValue: string = ''): Promise<string> {
  const value = await getConfig(key, defaultValue);
  return String(value);
}

/**
 * Pobiera wartość jako number
 */
export async function getConfigNumber(key: string, defaultValue: number = 0): Promise<number> {
  const value = await getConfig(key, defaultValue);
  return Number(value);
}

/**
 * Pobiera wartość jako boolean
 */
export async function getConfigBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
  const value = await getConfig(key, defaultValue);
  return Boolean(value);
}

/**
 * Pobiera wartość jako array
 */
export async function getConfigArray<T = string>(key: string, defaultValue: T[] = []): Promise<T[]> {
  const value = await getConfig(key, defaultValue);
  return Array.isArray(value) ? value : defaultValue;
}

// =====================================================
// PRESETS - Gotowe zestawy konfiguracji
// =====================================================

/**
 * Konfiguracja ofert
 */
export async function getOffersConfig() {
  return {
    itemsPerPage: await getConfigNumber('offers.items_per_page', 12),
    sortOptions: await getConfigArray<string>('offers.sort_options', ['default', 'price-asc', 'price-desc', 'speed-desc']),
    defaultSort: await getConfigString('offers.default_sort', 'default'),
  };
}

/**
 * Konfiguracja szukajki
 */
export async function getSearchConfig() {
  return {
    debounceMs: await getConfigNumber('search.debounce_ms', 300),
    minCharsCity: await getConfigNumber('search.min_chars_city', 2),
    minCharsStreet: await getConfigNumber('search.min_chars_street', 2),
    minCharsNumber: await getConfigNumber('search.min_chars_number', 1),
    maxResults: await getConfigNumber('search.max_results', 20),
  };
}

/**
 * Feature flags
 */
export async function getFeatureFlags() {
  return {
    kpoEnabled: await getConfigBoolean('features.kpo_enabled', true),
    mapEnabled: await getConfigBoolean('features.map_enabled', false),
    reviewsEnabled: await getConfigBoolean('features.reviews_enabled', true),
    blogEnabled: await getConfigBoolean('features.blog_enabled', false),
  };
}

/**
 * Dane kontaktowe
 */
export async function getContactConfig() {
  return {
    phone: await getConfigString('contact.phone', '532274808'),
    phoneFormatted: await getConfigString('contact.phone_formatted', '532 274 808'),
    email: await getConfigString('contact.email', 'kontakt@dostawcyinternetu.pl'),
  };
}

/**
 * Konfiguracja SEO
 */
export async function getSeoConfig() {
  return {
    defaultRobots: await getConfigString('seo.default_robots', 'index, follow'),
    sitemapLimit: await getConfigNumber('seo.sitemap_limit', 50000),
  };
}

/**
 * Konfiguracja cache (TTL w sekundach)
 */
export async function getCacheConfig() {
  return {
    offersTtl: await getConfigNumber('cache.offers_ttl', 300),
    coverageTtl: await getConfigNumber('cache.coverage_ttl', 3600),
    contentTtl: await getConfigNumber('cache.content_ttl', 86400),
  };
}

// =====================================================
// RUNTIME CONFIG - Dla runtime bez bazy (fallback)
// =====================================================

/**
 * Domyślne wartości konfiguracji (bez bazy)
 * Używane gdy baza jest niedostępna lub dla developmentu
 */
export const DEFAULT_CONFIG = {
  // Contact
  'contact.phone': '532274808',
  'contact.phone_formatted': '532 274 808',
  'contact.email': 'kontakt@dostawcyinternetu.pl',
  
  // Offers
  'offers.items_per_page': 12,
  'offers.sort_options': ['default', 'price-asc', 'price-desc', 'speed-desc'],
  'offers.default_sort': 'default',
  
  // Search
  'search.debounce_ms': 300,
  'search.min_chars_city': 2,
  'search.min_chars_street': 2,
  'search.min_chars_number': 1,
  'search.max_results': 20,
  
  // Features
  'features.kpo_enabled': true,
  'features.map_enabled': false,
  'features.reviews_enabled': true,
  'features.blog_enabled': false,
  
  // SEO
  'seo.default_robots': 'index, follow',
  'seo.sitemap_limit': 50000,
  
  // Cache TTL (seconds)
  'cache.offers_ttl': 300,
  'cache.coverage_ttl': 3600,
  'cache.content_ttl': 86400,
} as const;

/**
 * Pobiera wartość z fallbackiem do DEFAULT_CONFIG
 */
export function getConfigWithFallback<K extends keyof typeof DEFAULT_CONFIG>(
  key: K
): typeof DEFAULT_CONFIG[K] {
  return DEFAULT_CONFIG[key];
}

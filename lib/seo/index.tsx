// lib/seo/index.ts
// SEO System - generowanie TYLKO przez admina, nie przy odwiedzinach

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dostawcyinternetu.pl';

// =====================================================
// 1. POBIERANIE SEO Z BAZY (używane przez strony)
// =====================================================

export async function getSEO(urlPath: string) {
  return prisma.seoPageData.findUnique({
    where: { url_path: urlPath },
    include: {
      jsonld: { where: { active: true }, orderBy: { sort_order: 'asc' } },
      breadcrumbs: { orderBy: { position: 'asc' } },
      faq: { where: { active: true }, orderBy: { sort_order: 'asc' } }
    }
  });
}

export async function getMetadata(urlPath: string): Promise<Metadata> {
  const seo = await getSEO(urlPath);
  
  if (!seo) {
    return {}; // Brak SEO w bazie - strona użyje domyślnych
  }
  
  return {
    title: seo.title || undefined,
    description: seo.description || undefined,
    keywords: seo.keywords?.split(',').map(k => k.trim()),
    alternates: { canonical: seo.canonical_url },
    robots: seo.robots || undefined,
    authors: seo.author ? [{ name: seo.author }] : undefined,
    openGraph: {
      title: seo.og_title || seo.title || undefined,
      description: seo.og_description || seo.description || undefined,
      url: seo.canonical_url || undefined,
      siteName: 'DostawcyInternetu.pl',
      type: (seo.og_type as any) || 'website',
      images: seo.og_image ? [{ url: seo.og_image }] : undefined,
      locale: 'pl_PL',
    },
    twitter: {
      card: (seo.twitter_card as any) || 'summary_large_image',
      title: seo.twitter_title || seo.title || undefined,
      description: seo.twitter_description || seo.description || undefined,
      images: seo.twitter_image ? [seo.twitter_image] : undefined,
    },
  };
}

export function getJsonLdScripts(seo: any): object[] {
  if (!seo) return [];
  
  const schemas: object[] = [];
  
  // Organization
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'DostawcyInternetu.pl',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`
  });
  
  // WebSite
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: 'DostawcyInternetu.pl',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/szukaj?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  });
  
  // BreadcrumbList
  if (seo.breadcrumbs?.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: seo.breadcrumbs.map((b: any) => ({
        '@type': 'ListItem',
        position: b.position,
        name: b.name,
        item: b.url
      }))
    });
  }
  
  // Custom JSON-LD z bazy
  for (const j of seo.jsonld || []) {
    schemas.push({
      '@context': 'https://schema.org',
      ...(j.jsonld_data as object)
    });
  }
  
  // FAQPage
  if (seo.faq?.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: seo.faq.map((f: any) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer }
      }))
    });
  }
  
  return schemas;
}

// Komponent do wstawienia w stronę
export function JsonLdScripts({ schemas }: { schemas: object[] }) {
  if (!schemas.length) return null;
  
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

// =====================================================
// 2. GENEROWANIE SEO (wywoływane TYLKO przez admina)
// =====================================================

interface GenerateInput {
  urlPath: string;
  pageType: 'artykul' | 'oferta' | 'operator' | 'miejscowosc';
  entityId?: number;
  title: string;
  content: string;
  extraData?: Record<string, any>;
}

export async function generateSEO(input: GenerateInput) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Jesteś ekspertem SEO dla polskiej porównywarki DostawcyInternetu.pl.
Wygeneruj UNIKALNE, KONTEKSTOWE dane SEO.

URL: ${input.urlPath}
Typ: ${input.pageType}
Tytuł: ${input.title}
Treść: ${input.content.slice(0, 3500)}
${input.extraData ? `Dane: ${JSON.stringify(input.extraData)}` : ''}

Odpowiedz TYLKO poprawnym JSON:
{
  "meta": {
    "title": "max 60 znaków, słowo kluczowe na początku",
    "description": "max 155 znaków, z CTA (Sprawdź, Porównaj, Zobacz)",
    "keywords": ["max", "5-7", "słów"],
    "ogTitle": "tytuł dla social media",
    "ogDescription": "opis social media max 200 znaków"
  },
  "breadcrumbs": [
    {"name": "Start", "url": "/"},
    {"name": "...", "url": "/..."}
  ],
  "schemas": [
    {
      "@type": "Article|Product|LocalBusiness|Service",
      "...pełny schema.org obiekt..."
    }
  ],
  "faq": [
    {"question": "pytanie związane z treścią", "answer": "odpowiedź 2-3 zdania"},
    {"question": "...", "answer": "..."}
  ]
}

ZASADY:
- Meta title: słowo kluczowe NA POCZĄTKU
- Meta description: MUSI zawierać CTA
- FAQ: 3-5 pytań UNIKALNYCH dla tej treści
- Schema: Article dla artykułów, Product+Offer dla ofert, LocalBusiness+ISP dla operatorów, Service dla miejscowości
- Breadcrumbs: rzeczywista struktura URL`
    }]
  });
  
  const text = response.content[0];
  if (text.type !== 'text') throw new Error('No text response');
  
  const json = text.text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error('No JSON in response');
  
  return JSON.parse(json);
}

export async function saveSEO(input: GenerateInput, data: any) {
  // Upsert głównego rekordu
  const page = await prisma.seoPageData.upsert({
    where: { url_path: input.urlPath },
    create: {
      url_path: input.urlPath,
      page_type: input.pageType,
      entity_id: input.entityId,
      title: data.meta.title,
      description: data.meta.description,
      keywords: data.meta.keywords?.join(', '),
      canonical_url: `${BASE_URL}${input.urlPath}`,
      og_title: data.meta.ogTitle,
      og_description: data.meta.ogDescription,
      og_image: input.extraData?.thumbnail || input.extraData?.image,
      twitter_title: data.meta.ogTitle,
      twitter_description: data.meta.ogDescription,
      twitter_image: input.extraData?.thumbnail || input.extraData?.image,
      author: input.extraData?.autor,
    },
    update: {
      title: data.meta.title,
      description: data.meta.description,
      keywords: data.meta.keywords?.join(', '),
      og_title: data.meta.ogTitle,
      og_description: data.meta.ogDescription,
      og_image: input.extraData?.thumbnail || input.extraData?.image,
      twitter_title: data.meta.ogTitle,
      twitter_description: data.meta.ogDescription,
      twitter_image: input.extraData?.thumbnail || input.extraData?.image,
      author: input.extraData?.autor,
      updated_at: new Date(),
    }
  });
  
  // Usuń stare i dodaj nowe breadcrumbs
  await prisma.seoBreadcrumb.deleteMany({ where: { page_id: page.id } });
  if (data.breadcrumbs?.length) {
    await prisma.seoBreadcrumb.createMany({
      data: data.breadcrumbs.map((b: any, i: number) => ({
        page_id: page.id,
        position: i + 1,
        name: b.name,
        url: b.url.startsWith('http') ? b.url : `${BASE_URL}${b.url}`
      }))
    });
  }
  
  // Usuń stare i dodaj nowe JSON-LD
  await prisma.seoJsonld.deleteMany({ where: { page_id: page.id } });
  if (data.schemas?.length) {
    await prisma.seoJsonld.createMany({
      data: data.schemas.map((s: any, i: number) => ({
        page_id: page.id,
        schema_type: s['@type'] || 'Unknown',
        jsonld_data: s,
        sort_order: i
      }))
    });
  }
  
  // Usuń stare i dodaj nowe FAQ
  await prisma.seoFaq.deleteMany({ where: { page_id: page.id } });
  if (data.faq?.length) {
    await prisma.seoFaq.createMany({
      data: data.faq.map((f: any, i: number) => ({
        page_id: page.id,
        question: f.question,
        answer: f.answer,
        sort_order: i
      }))
    });
  }
  
  return page;
}

// Główna funkcja - generuj i zapisz
export async function generateAndSaveSEO(input: GenerateInput) {
  console.log(`[SEO] Generating for: ${input.urlPath}`);
  
  const data = await generateSEO(input);
  const page = await saveSEO(input, data);
  
  console.log(`[SEO] Saved: ${input.urlPath}`);
  
  return page;
}

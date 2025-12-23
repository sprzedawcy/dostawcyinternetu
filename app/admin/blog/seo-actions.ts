// app/admin/blog/seo-actions.ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { generateAndSaveSEO } from '@/lib/seo';

// =====================================================
// GENERUJ SEO DLA ARTYKUŁU (wywoływane przy zapisie)
// =====================================================

export async function generateArtykulSEO(artykulId: number) {
  const artykul = await prisma.artykul.findUnique({
    where: { id: artykulId },
    include: { kategoria: true }
  });
  
  if (!artykul) {
    return { success: false, error: 'Artykuł nie znaleziony' };
  }
  
  // Wyciągnij tekst z HTML
  const textContent = artykul.tresc
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || '';
  
  try {
    await generateAndSaveSEO({
      urlPath: `/blog/${artykul.kategoria?.slug}/${artykul.slug}`,
      pageType: 'artykul',
      entityId: artykul.id,
      title: artykul.tytul,
      content: textContent,
      extraData: {
        kategoria: artykul.kategoria?.nazwa,
        autor: artykul.autor,
        data: artykul.data_publikacji?.toISOString(),
        thumbnail: artykul.thumbnail_url
      }
    });
    
    revalidatePath(`/blog/${artykul.kategoria?.slug}/${artykul.slug}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('SEO generation error:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// GENERUJ SEO DLA OFERTY
// =====================================================

export async function generateOfertaSEO(ofertaId: number) {
  const oferta = await prisma.oferta.findUnique({
    where: { id: ofertaId },
    include: { operator: true }
  });
  
  if (!oferta) {
    return { success: false, error: 'Oferta nie znaleziona' };
  }
  
  try {
    await generateAndSaveSEO({
      urlPath: `/oferty/${oferta.operator.slug}/${oferta.slug}`,
      pageType: 'oferta',
      entityId: oferta.id,
      title: `${oferta.nazwa} - ${oferta.operator.nazwa}`,
      content: `Oferta ${oferta.nazwa} od ${oferta.operator.nazwa}. 
                Prędkość: ${oferta.download_mbps}/${oferta.upload_mbps} Mbps. 
                Cena: ${oferta.abonament} zł/mies. 
                ${oferta.opis || ''}`,
      extraData: {
        cena: Number(oferta.abonament),
        download: oferta.download_mbps,
        upload: oferta.upload_mbps,
        technologia: oferta.technologia,
        operator: oferta.operator.nazwa,
        image: oferta.operator.logo_url
      }
    });
    
    revalidatePath(`/oferty/${oferta.operator.slug}/${oferta.slug}`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =====================================================
// GENERUJ SEO DLA OPERATORA
// =====================================================

export async function generateOperatorSEO(operatorId: number) {
  const operator = await prisma.operator.findUnique({
    where: { id: operatorId },
    include: { oferty: { where: { aktywna: true }, take: 5 } }
  });
  
  if (!operator) {
    return { success: false, error: 'Operator nie znaleziony' };
  }
  
  const ofertyInfo = operator.oferty
    .map(o => `${o.nazwa}: ${o.download_mbps} Mbps za ${o.abonament} zł`)
    .join('. ');
  
  try {
    await generateAndSaveSEO({
      urlPath: `/dostawcy-internetu/${operator.slug}`,
      pageType: 'operator',
      entityId: operator.id,
      title: operator.nazwa,
      content: `${operator.nazwa} - dostawca internetu. 
                ${operator.opis || ''}
                Oferty: ${ofertyInfo}`,
      extraData: {
        logo: operator.logo_url,
        strona: operator.strona_www,
        telefon: operator.telefon,
        technologie: operator.technologie,
        image: operator.logo_url
      }
    });
    
    revalidatePath(`/dostawcy-internetu/${operator.slug}`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =====================================================
// GENERUJ SEO DLA MIEJSCOWOŚCI
// =====================================================

export async function generateMiejscowoscSEO(simc: string) {
  const miasto = await prisma.miejscowosci_seo.findFirst({
    where: { simc }
  });
  
  if (!miasto) {
    return { success: false, error: 'Miejscowość nie znaleziona' };
  }
  
  try {
    await generateAndSaveSEO({
      urlPath: `/internet/${miasto.slug}`,
      pageType: 'miejscowosc',
      title: `Internet w ${miasto.nazwa}`,
      content: `Internet w ${miasto.nazwa}, ${miasto.powiat}, woj. ${miasto.wojewodztwo}.
                Budynki: ${miasto.liczba_budynkow}.
                Operatorzy: ${(miasto.operatorzy as string[])?.join(', ')}.`,
      extraData: {
        wojewodztwo: miasto.wojewodztwo,
        powiat: miasto.powiat,
        operatorzy: miasto.operatorzy
      }
    });
    
    revalidatePath(`/internet/${miasto.slug}`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =====================================================
// SPRAWDŹ CZY MA SEO
// =====================================================

export async function checkSEOExists(urlPath: string) {
  const seo = await prisma.seoPageData.findUnique({
    where: { url_path: urlPath },
    select: { id: true, updated_at: true }
  });
  
  return seo ? { exists: true, updatedAt: seo.updated_at } : { exists: false };
}

// =====================================================
// USUŃ SEO
// =====================================================

export async function deleteSEO(urlPath: string) {
  try {
    await prisma.seoPageData.delete({ where: { url_path: urlPath } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

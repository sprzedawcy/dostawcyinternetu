// app/admin/blog/actions.ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { generateArtykulSEO } from './seo-actions';

// =====================================================
// TWORZENIE ARTYKUŁU
// =====================================================

export async function createArtykul(formData: FormData) {
  const tytul = formData.get('tytul') as string;
  const slug = formData.get('slug') as string;
  const zajawka = formData.get('zajawka') as string;
  const tresc = formData.get('tresc') as string;
  const kategoria_id = parseInt(formData.get('kategoria_id') as string);
  const opublikowany = formData.get('opublikowany') === 'true';
  const thumbnail_url = formData.get('thumbnail_url') as string;
  const autor = formData.get('autor') as string || 'Redakcja';
  const dataPublikacji = formData.get('data_publikacji') as string;
  const generateSEO = formData.get('generate_seo') === 'true';
  
  try {
    const artykul = await prisma.artykul.create({
      data: {
        tytul,
        slug,
        zajawka,
        tresc,
        kategoria_id,
        opublikowany,
        thumbnail_url: thumbnail_url || null,
        autor,
        data_publikacji: dataPublikacji ? new Date(dataPublikacji) : 
                         opublikowany ? new Date() : null,
      }
    });
    
    if (generateSEO && opublikowany) {
      console.log(`[CMS] Auto-generating SEO for article ${artykul.id}`);
      await generateArtykulSEO(artykul.id);
    }
    
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    
    return { success: true, id: artykul.id };
  } catch (error: any) {
    console.error('Create article error:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// AKTUALIZACJA ARTYKUŁU
// =====================================================

export async function updateArtykul(id: number, formData: FormData) {
  const tytul = formData.get('tytul') as string;
  const slug = formData.get('slug') as string;
  const zajawka = formData.get('zajawka') as string;
  const tresc = formData.get('tresc') as string;
  const kategoria_id = parseInt(formData.get('kategoria_id') as string);
  const opublikowany = formData.get('opublikowany') === 'true';
  const thumbnail_url = formData.get('thumbnail_url') as string;
  const autor = formData.get('autor') as string;
  const dataPublikacji = formData.get('data_publikacji') as string;
  const regenerateSEO = formData.get('regenerate_seo') === 'true';
  
  try {
    const oldArtykul = await prisma.artykul.findUnique({
      where: { id },
      include: { kategoria: true }
    });
    
    const artykul = await prisma.artykul.update({
      where: { id },
      data: {
        tytul,
        slug,
        zajawka,
        tresc,
        kategoria_id,
        opublikowany,
        thumbnail_url: thumbnail_url || null,
        autor,
        data_publikacji: dataPublikacji ? new Date(dataPublikacji) : undefined,
        redirect_url: null, // Przy edycji czyścimy przekierowanie (reaktywacja)
        updated_at: new Date(),
      },
      include: { kategoria: true }
    });
    
    if (regenerateSEO && opublikowany) {
      console.log(`[CMS] Regenerating SEO for article ${artykul.id}`);
      
      if (oldArtykul && (oldArtykul.slug !== slug || oldArtykul.kategoria_id !== kategoria_id)) {
        await prisma.seoPageData.deleteMany({
          where: { url_path: `/blog/${oldArtykul.kategoria?.slug}/${oldArtykul.slug}` }
        });
      }
      
      await generateArtykulSEO(artykul.id);
    }
    
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    if (oldArtykul?.kategoria) {
      revalidatePath(`/blog/${oldArtykul.kategoria.slug}/${oldArtykul.slug}`);
    }
    revalidatePath(`/blog/${artykul.kategoria?.slug}/${artykul.slug}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Update article error:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// DEAKTYWACJA ARTYKUŁU (soft delete z przekierowaniem)
// =====================================================

export async function deactivateArtykul(id: number, redirectUrl: string) {
  try {
    if (!redirectUrl || !redirectUrl.startsWith('/')) {
      return { 
        success: false, 
        error: 'Przekierowanie musi być względnym URL-em zaczynającym się od /' 
      };
    }
    
    const artykul = await prisma.artykul.findUnique({
      where: { id },
      include: { kategoria: true }
    });
    
    if (!artykul) {
      return { success: false, error: 'Artykuł nie znaleziony' };
    }
    
    const currentUrl = `/blog/${artykul.kategoria?.slug}/${artykul.slug}`;
    
    if (redirectUrl === currentUrl) {
      return { success: false, error: 'Nie można przekierować artykułu na samego siebie' };
    }
    
    const loopCheck = await checkRedirectLoop(redirectUrl, currentUrl);
    if (loopCheck.hasLoop) {
      return { 
        success: false, 
        error: `Wykryto pętlę przekierowań: ${loopCheck.chain.join(' → ')}` 
      };
    }
    
    const targetExists = await checkTargetExists(redirectUrl);
    if (!targetExists.exists) {
      return { 
        success: false, 
        error: `Cel przekierowania nie istnieje lub jest nieaktywny: ${redirectUrl}` 
      };
    }
    
    await prisma.artykul.update({
      where: { id },
      data: {
        opublikowany: false,
        redirect_url: redirectUrl,
        updated_at: new Date(),
      }
    });
    
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    revalidatePath(currentUrl);
    
    return { success: true };
  } catch (error: any) {
    console.error('Deactivate article error:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// SPRAWDZANIE PĘTLI PRZEKIEROWAŃ
// =====================================================

async function checkRedirectLoop(
  targetUrl: string, 
  sourceUrl: string, 
  visited: string[] = []
): Promise<{ hasLoop: boolean; chain: string[] }> {
  const chain = [...visited, sourceUrl];
  
  if (chain.includes(targetUrl)) {
    return { hasLoop: true, chain: [...chain, targetUrl] };
  }
  
  if (chain.length > 10) {
    return { hasLoop: true, chain: [...chain, '(zbyt długi łańcuch)'] };
  }
  
  const targetRedirect = await getRedirectForUrl(targetUrl);
  
  if (targetRedirect) {
    return checkRedirectLoop(targetRedirect, targetUrl, chain);
  }
  
  return { hasLoop: false, chain };
}

async function getRedirectForUrl(url: string): Promise<string | null> {
  const blogMatch = url.match(/^\/blog\/([^\/]+)\/([^\/]+)$/);
  if (blogMatch) {
    const [, kategoriaSlug, slug] = blogMatch;
    
    const artykul = await prisma.artykul.findFirst({
      where: { 
        slug,
        kategoria: { slug: kategoriaSlug }
      },
      select: { redirect_url: true }
    });
    
    return artykul?.redirect_url || null;
  }
  
  return null;
}

// =====================================================
// SPRAWDZANIE CZY CEL PRZEKIEROWANIA ISTNIEJE
// =====================================================

async function checkTargetExists(url: string): Promise<{ exists: boolean; reason?: string }> {
  const blogMatch = url.match(/^\/blog\/([^\/]+)\/([^\/]+)$/);
  if (blogMatch) {
    const [, kategoriaSlug, slug] = blogMatch;
    
    const artykul = await prisma.artykul.findFirst({
      where: { 
        slug,
        kategoria: { slug: kategoriaSlug },
        opublikowany: true,
        redirect_url: null
      }
    });
    
    if (!artykul) {
      return { exists: false, reason: 'Artykuł nie istnieje, jest nieaktywny lub ma własne przekierowanie' };
    }
    
    return { exists: true };
  }
  
  if (url === '/blog' || url.match(/^\/blog\?/)) {
    return { exists: true };
  }
  
  if (url === '/') {
    return { exists: true };
  }
  
  return { exists: true };
}

// =====================================================
// REAKTYWACJA ARTYKUŁU
// =====================================================

export async function reactivateArtykul(id: number) {
  try {
    await prisma.artykul.update({
      where: { id },
      data: {
        opublikowany: true,
        redirect_url: null,
        updated_at: new Date(),
      }
    });
    
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =====================================================
// POBIERANIE ARTYKUŁÓW (z filtrami, wyszukiwaniem, paginacją)
// =====================================================

export async function getArtykuly(
  page = 1, 
  limit = 50, 
  kategoriaSlug: string | null = null,
  szukaj: string = '',
  status: string = 'aktywne'
) {
  const skip = (page - 1) * limit;
  
  // Buduj warunki WHERE
  const where: any = {};
  
  // Filtr kategorii
  if (kategoriaSlug) {
    where.kategoria = { slug: kategoriaSlug };
  }
  
  // Filtr wyszukiwania
  if (szukaj) {
    where.OR = [
      { tytul: { contains: szukaj, mode: 'insensitive' } },
      { zajawka: { contains: szukaj, mode: 'insensitive' } },
      { slug: { contains: szukaj, mode: 'insensitive' } },
    ];
  }
  
  // Filtr statusu
  if (status === 'aktywne') {
    where.opublikowany = true;
    where.redirect_url = null;
  } else if (status === 'nieaktywne') {
    where.OR = where.OR || [];
    // Nieaktywne = nieopublikowane LUB z przekierowaniem
    where.AND = [
      where.OR.length > 0 ? { OR: where.OR } : {},
      {
        OR: [
          { opublikowany: false },
          { redirect_url: { not: null } }
        ]
      }
    ];
    delete where.OR;
  }
  // status === 'wszystkie' - brak dodatkowych filtrów
  
  const [artykuly, total] = await Promise.all([
    prisma.artykul.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { opublikowany: 'desc' },
        { data_publikacji: 'desc' },
        { created_at: 'desc' }
      ],
      select: {
        id: true,
        tytul: true,
        slug: true,
        zajawka: true,
        thumbnail_url: true,
        opublikowany: true,
        wyrozniany: true,
        data_publikacji: true,
        redirect_url: true,
        created_at: true,
        kategoria: {
          select: {
            id: true,
            nazwa: true,
            slug: true
          }
        }
      }
    }),
    prisma.artykul.count({ where })
  ]);
  
  return { artykuly, total, totalPages: Math.ceil(total / limit) };
}

export async function getArtykul(id: number) {
  return prisma.artykul.findUnique({
    where: { id },
    include: { kategoria: true }
  });
}

export async function getKategorie() {
  return prisma.kategoriaBlogu.findMany({ 
    orderBy: { nazwa: 'asc' },
    include: { _count: { select: { artykuly: true } } }
  });
}

// =====================================================
// HELPER: Generuj slug z tekstu
// =====================================================

export async function generateSlug(text: string): Promise<string> {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // usuń akcenty
    .replace(/ł/g, 'l')
    .replace(/ą/g, 'a')
    .replace(/ę/g, 'e')
    .replace(/ć/g, 'c')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

// =====================================================
// NIE USUWAMY - tylko deaktywujemy!
// =====================================================

export async function deleteArtykul(id: number) {
  return { 
    success: false, 
    error: 'Usuwanie artykułów jest wyłączone. Użyj deaktywacji z przekierowaniem.' 
  };
}
// =====================================================
// GENERATOR - funkcje pomocnicze
// =====================================================

export async function getMiejscowoscData(simc: string) {
  const data = await prisma.miejscowosci_seo.findFirst({
    where: { slug: { contains: simc } }
  });
  
  // Konwertuj BigInt na number/string
  if (data) {
    return JSON.parse(JSON.stringify(data, (_, v) => 
      typeof v === 'bigint' ? Number(v) : v
    ));
  }
  return null;
}

export async function getOperatorData(operatorId: number | string) {
  // Jeśli to string (slug), znajdź po ID
  const id = typeof operatorId === 'string' ? parseInt(operatorId) : operatorId;
  
  if (isNaN(id)) {
    return null;
  }
  
  const data = await prisma.operator.findUnique({
    where: { id },
    include: { oferty: { where: { aktywna: true }, take: 5 } }
  });
  
  // Konwertuj BigInt na number/string
  if (data) {
    return JSON.parse(JSON.stringify(data, (_, v) => 
      typeof v === 'bigint' ? Number(v) : v
    ));
  }
  return null;
}

export async function generateArtykulMiejscowosc(simc: string, kategoriaId: number) {
  // TODO: Implementacja generowania artykułu dla miejscowości
  return { success: false, error: 'Nie zaimplementowano' };
}

export async function generateArtykulOperator(operatorId: number, kategoriaId: number) {
  // TODO: Implementacja generowania artykułu dla operatora
  return { success: false, error: 'Nie zaimplementowano' };
}

export async function getImageSize(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'force-cache'
    });
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      return Math.round(parseInt(contentLength) / 1024);
    }
    return null;
  } catch {
    return null;
  }
}
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// =====================================================
// KATEGORIE
// =====================================================

export async function getKategorie() {
  return prisma.kategoriaBlogu.findMany({
    orderBy: { kolejnosc: 'asc' },
    include: {
      _count: { select: { artykuly: true } }
    }
  });
}

// =====================================================
// TAGI
// =====================================================

export async function getTagi() {
  return prisma.tag.findMany({
    orderBy: { nazwa: 'asc' }
  });
}

export async function createTag(nazwa: string) {
  const slug = nazwa
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  
  return prisma.tag.create({
    data: { nazwa, slug }
  });
}

// =====================================================
// ARTYKUŁY - LISTA
// =====================================================

export async function getArtykuly(params?: {
  kategoria?: string;
  opublikowany?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  
  if (params?.kategoria) {
    where.kategoria = { slug: params.kategoria };
  }
  if (params?.opublikowany !== undefined) {
    where.opublikowany = params.opublikowany;
  }
  
  const [artykuly, total] = await Promise.all([
    prisma.artykul.findMany({
      where,
      include: {
        kategoria: true,
        operator: { select: { id: true, nazwa: true } },
        tagi: { include: { tag: true } }
      },
      orderBy: { created_at: 'desc' },
      take: params?.limit || 50,
      skip: params?.offset || 0
    }),
    prisma.artykul.count({ where })
  ]);
  
  return { artykuly, total };
}

// =====================================================
// ARTYKUŁ - SZCZEGÓŁY
// =====================================================

export async function getArtykul(id: number) {
  const artykul = await prisma.artykul.findUnique({
    where: { id },
    include: {
      kategoria: true,
      operator: { select: { id: true, nazwa: true } },
      tagi: { include: { tag: true } }
    }
  });
  
  return artykul;
}

export async function getArtykulBySlug(kategoriaSlug: string, artykulSlug: string) {
  const artykul = await prisma.artykul.findFirst({
    where: {
      slug: artykulSlug,
      kategoria: { slug: kategoriaSlug },
      opublikowany: true
    },
    include: {
      kategoria: true,
      operator: { select: { id: true, nazwa: true, slug: true, logo_url: true } },
      tagi: { include: { tag: true } }
    }
  });
  
  return artykul;
}

// =====================================================
// ARTYKUŁ - TWORZENIE
// =====================================================

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 200);
}

export async function createArtykul(formData: FormData) {
  const tytul = formData.get("tytul") as string;
  const slug = formData.get("slug") as string || generateSlug(tytul);
  const zajawka = formData.get("zajawka") as string || null;
  const tresc = formData.get("tresc") as string || null;
  const kategoria_id = formData.get("kategoria_id") ? parseInt(formData.get("kategoria_id") as string) : null;
  const operator_id = formData.get("operator_id") ? parseInt(formData.get("operator_id") as string) : null;
  const miejscowosc_simc = formData.get("miejscowosc_simc") as string || null;
  const technologia = formData.get("technologia") as string || null;
  const thumbnail_url = formData.get("thumbnail_url") as string || null;
  const meta_title = formData.get("meta_title") as string || null;
  const meta_description = formData.get("meta_description") as string || null;
  const autor = formData.get("autor") as string || "Redakcja";
  const opublikowany = formData.get("opublikowany") === "true";
  const wyrozniany = formData.get("wyrozniany") === "true";
  const tagiJson = formData.get("tagi") as string;
  
  try {
    const artykul = await prisma.artykul.create({
      data: {
        tytul,
        slug,
        zajawka,
        tresc,
        kategoria_id,
        operator_id,
        miejscowosc_simc,
        technologia,
        thumbnail_url,
        meta_title,
        meta_description,
        autor,
        opublikowany,
        wyrozniany,
        data_publikacji: opublikowany ? new Date() : null,
      }
    });
    
    // Dodaj tagi
    if (tagiJson) {
      const tagiIds = JSON.parse(tagiJson) as number[];
      if (tagiIds.length > 0) {
        await prisma.artykulTag.createMany({
          data: tagiIds.map(tag_id => ({
            artykul_id: artykul.id,
            tag_id
          }))
        });
      }
    }
    
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    
    return { success: true, id: artykul.id };
  } catch (error: any) {
    console.error("Create article error:", error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// ARTYKUŁ - AKTUALIZACJA
// =====================================================

export async function updateArtykul(id: number, formData: FormData) {
  const tytul = formData.get("tytul") as string;
  const slug = formData.get("slug") as string || generateSlug(tytul);
  const zajawka = formData.get("zajawka") as string || null;
  const tresc = formData.get("tresc") as string || null;
  const kategoria_id = formData.get("kategoria_id") ? parseInt(formData.get("kategoria_id") as string) : null;
  const operator_id = formData.get("operator_id") ? parseInt(formData.get("operator_id") as string) : null;
  const miejscowosc_simc = formData.get("miejscowosc_simc") as string || null;
  const technologia = formData.get("technologia") as string || null;
  const thumbnail_url = formData.get("thumbnail_url") as string || null;
  const meta_title = formData.get("meta_title") as string || null;
  const meta_description = formData.get("meta_description") as string || null;
  const autor = formData.get("autor") as string || "Redakcja";
  const opublikowany = formData.get("opublikowany") === "true";
  const wyrozniany = formData.get("wyrozniany") === "true";
  const tagiJson = formData.get("tagi") as string;
  
  try {
    const existing = await prisma.artykul.findUnique({ where: { id } });
    
    const artykul = await prisma.artykul.update({
      where: { id },
      data: {
        tytul,
        slug,
        zajawka,
        tresc,
        kategoria_id,
        operator_id,
        miejscowosc_simc,
        technologia,
        thumbnail_url,
        meta_title,
        meta_description,
        autor,
        opublikowany,
        wyrozniany,
        data_publikacji: opublikowany && !existing?.data_publikacji ? new Date() : existing?.data_publikacji,
        updated_at: new Date()
      }
    });
    
    await prisma.artykulTag.deleteMany({ where: { artykul_id: id } });
    
    if (tagiJson) {
      const tagiIds = JSON.parse(tagiJson) as number[];
      if (tagiIds.length > 0) {
        await prisma.artykulTag.createMany({
          data: tagiIds.map(tag_id => ({
            artykul_id: id,
            tag_id
          }))
        });
      }
    }
    
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    
    return { success: true };
  } catch (error: any) {
    console.error("Update article error:", error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// ARTYKUŁ - USUWANIE
// =====================================================

export async function deleteArtykul(id: number) {
  try {
    await prisma.artykul.delete({ where: { id } });
    
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =====================================================
// ARTYKUŁY POWIĄZANE
// =====================================================

export async function getArtykulyByOperator(operatorId: number, limit = 5) {
  return prisma.artykul.findMany({
    where: {
      operator_id: operatorId,
      opublikowany: true
    },
    include: { kategoria: true },
    orderBy: { data_publikacji: 'desc' },
    take: limit
  });
}

export async function getArtykulyByTechnologia(technologia: string, limit = 5) {
  return prisma.artykul.findMany({
    where: {
      technologia,
      opublikowany: true
    },
    include: { kategoria: true },
    orderBy: { data_publikacji: 'desc' },
    take: limit
  });
}

export async function getArtykulyByMiejscowosc(simc: string, limit = 5) {
  return prisma.artykul.findMany({
    where: {
      miejscowosc_simc: simc,
      opublikowany: true
    },
    include: { kategoria: true },
    orderBy: { data_publikacji: 'desc' },
    take: limit
  });
}

export async function getArtykulyWyrozonione(limit = 3) {
  return prisma.artykul.findMany({
    where: {
      wyrozniany: true,
      opublikowany: true
    },
    include: { kategoria: true },
    orderBy: { data_publikacji: 'desc' },
    take: limit
  });
}

// =====================================================
// POBIERANIE DANYCH DLA MIEJSCOWOŚCI
// =====================================================

export async function getMiejscowoscData(slug: string) {
  const seoData = await prisma.miejscowosci_seo.findUnique({
    where: { slug }
  });

  if (!seoData) return null;

  const operatorzyCount = await prisma.operatorCoverage.groupBy({
    by: ['operator_id'],
    where: {
      simc: seoData.slug
    }
  });

  const oferty = await prisma.oferta.findMany({
    where: { aktywna: true },
    include: { operator: { select: { nazwa: true, typ: true } } },
    orderBy: { abonament: 'asc' },
    take: 20
  });

  const najtanszaOferta = oferty[0];
  const najszybszaOferta = oferty.reduce((max, o) => 
    o.download_mbps > max.download_mbps ? o : max, oferty[0]);

  return {
    miejscowosc: {
      nazwa: seoData.nazwa,
      slug: seoData.slug,
      powiat: seoData.powiat,
      wojewodztwo: seoData.wojewodztwo,
      budynkow: Number(seoData.budynkow) || 0,
      mieszkan: Number(seoData.mieszkan_hp) || 0,
    },
    operatorzy: {
      total: seoData.operatorzy?.length || 0,
      lista: seoData.operatorzy || [],
      lokalni: seoData.lokalni_operatorzy,
    },
    zasiegi: {
      orange: Number(seoData.orange_bud) || 0,
      tmobile: Number(seoData.tmobile_bud) || 0,
      upc: Number(seoData.upc_bud) || 0,
      vectra: Number(seoData.vectra_bud) || 0,
      netia: Number(seoData.netia_bud) || 0,
    },
    oferty: {
      najtansza: najtanszaOferta ? {
        operator: najtanszaOferta.operator.nazwa,
        cena: Number(najtanszaOferta.abonament),
        predkosc: najtanszaOferta.download_mbps
      } : null,
      najszybsza: najszybszaOferta ? {
        operator: najszybszaOferta.operator.nazwa,
        cena: Number(najszybszaOferta.abonament),
        predkosc: najszybszaOferta.download_mbps
      } : null,
    },
    kpoFerc: {
      budynkow: Number(seoData.kpo_ferc_bud) || 0,
      typy: seoData.kpo_ferc_typy || [],
    }
  };
}

// =====================================================
// POBIERANIE DANYCH DLA OPERATORA
// =====================================================

export async function getOperatorData(slug: string) {
  const operator = await prisma.operator.findUnique({
    where: { slug },
    include: {
      oferty: {
        where: { aktywna: true },
        orderBy: { abonament: 'asc' }
      },
      _count: {
        select: {
          coverage: true,
          opinie: { where: { widoczna: true } }
        }
      }
    }
  });

  if (!operator) return null;

  const ofertyStacjonarne = operator.oferty.filter(o => o.typ_uslugi === 'stacjonarny' || !o.typ_uslugi);
  const ofertyKomorkowe = operator.oferty.filter(o => o.typ_uslugi === 'komórkowy');

  return {
    operator: {
      nazwa: operator.nazwa,
      slug: operator.slug,
      typ: operator.typ,
      technologie: operator.technologie,
      regiony: operator.regiony,
      strona_www: operator.strona_www,
    },
    statystyki: {
      zasieg_budynkow: operator._count.coverage,
      liczba_opinii: operator._count.opinie,
    },
    oferty: {
      stacjonarne: {
        count: ofertyStacjonarne.length,
        najtansza: ofertyStacjonarne[0] ? {
          nazwa: ofertyStacjonarne[0].nazwa,
          cena: Number(ofertyStacjonarne[0].abonament),
          predkosc: ofertyStacjonarne[0].download_mbps
        } : null,
        najszybsza: ofertyStacjonarne.reduce((max, o) => 
          o.download_mbps > (max?.download_mbps || 0) ? o : max, null as any)
      },
      komorkowe: {
        count: ofertyKomorkowe.length,
        najtansza: ofertyKomorkowe[0] ? {
          nazwa: ofertyKomorkowe[0].nazwa,
          cena: Number(ofertyKomorkowe[0].abonament),
        } : null,
      }
    }
  };
}

// =====================================================
// GENERATOR ARTYKUŁU - MIEJSCOWOŚĆ
// =====================================================

export async function generateArtykulMiejscowosc(slug: string) {
  const data = await getMiejscowoscData(slug);
  
  if (!data) {
    return { success: false, error: "Nie znaleziono miejscowości" };
  }

  const prompt = `Napisz artykuł SEO o dostępności internetu w miejscowości ${data.miejscowosc.nazwa}.

TWARDE DANE (użyj ich w artykule):
- Miejscowość: ${data.miejscowosc.nazwa}, ${data.miejscowosc.powiat}, woj. ${data.miejscowosc.wojewodztwo}
- Liczba budynków: ${data.miejscowosc.budynkow}
- Dostępni operatorzy: ${data.operatorzy.lista.join(', ') || 'brak danych'}
- Liczba operatorów: ${data.operatorzy.total}
${data.oferty.najtansza ? `- Najtańsza oferta: ${data.oferty.najtansza.operator} - ${data.oferty.najtansza.cena} zł/mies (${data.oferty.najtansza.predkosc} Mbps)` : ''}
${data.oferty.najszybsza ? `- Najszybsza oferta: ${data.oferty.najszybsza.operator} - ${data.oferty.najszybsza.predkosc} Mbps (${data.oferty.najszybsza.cena} zł/mies)` : ''}
- Zasięg Orange: ${data.zasiegi.orange} budynków
- Zasięg T-Mobile: ${data.zasiegi.tmobile} budynków
- Zasięg UPC: ${data.zasiegi.upc} budynków
- Zasięg Vectra: ${data.zasiegi.vectra} budynków
- Zasięg Netia: ${data.zasiegi.netia} budynków
${data.kpoFerc.budynkow > 0 ? `- Planowana budowa światłowodu (KPO): ${data.kpoFerc.budynkow} budynków` : ''}

WYMAGANIA:
1. Tytuł H1 zawierający nazwę miejscowości i "internet"
2. Zajawka 2-3 zdania
3. Treść HTML z nagłówkami H2, H3
4. Użyj WSZYSTKICH podanych liczb - to Twoja przewaga SEO
5. Naturalny język, nie "AI-generated"
6. Około 800-1200 słów
7. Zakończ CTA zachęcającym do sprawdzenia dostępności

FORMAT ODPOWIEDZI (JSON):
{
  "tytul": "tytuł artykułu",
  "zajawka": "krótka zajawka",
  "tresc": "<h2>...</h2><p>...</p>...",
  "meta_title": "max 60 znaków",
  "meta_description": "max 155 znaków"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return { success: false, error: "Unexpected response type" };
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Nie udało się sparsować odpowiedzi" };
    }

    const article = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      article: {
        ...article,
        dane_snapshot: data,
      }
    };
  } catch (error: any) {
    console.error("Generator error:", error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// GENERATOR ARTYKUŁU - OPERATOR
// =====================================================

export async function generateArtykulOperator(slug: string) {
  const data = await getOperatorData(slug);
  
  if (!data) {
    return { success: false, error: "Nie znaleziono operatora" };
  }

  const prompt = `Napisz artykuł SEO o operatorze internetowym ${data.operator.nazwa}.

TWARDE DANE (użyj ich w artykule):
- Operator: ${data.operator.nazwa}
- Typ: ${data.operator.typ}
- Technologie: ${data.operator.technologie?.join(', ') || 'brak danych'}
- Regiony działania: ${data.operator.regiony?.join(', ') || 'cała Polska'}
- Strona WWW: ${data.operator.strona_www || 'brak'}
- Zasięg: ${data.statystyki.zasieg_budynkow} budynków w bazie
- Liczba opinii: ${data.statystyki.liczba_opinii}

OFERTY STACJONARNE (${data.oferty.stacjonarne.count}):
${data.oferty.stacjonarne.najtansza ? `- Najtańsza: ${data.oferty.stacjonarne.najtansza.nazwa} - ${data.oferty.stacjonarne.najtansza.cena} zł/mies (${data.oferty.stacjonarne.najtansza.predkosc} Mbps)` : '- Brak ofert'}
${data.oferty.stacjonarne.najszybsza ? `- Najszybsza: ${data.oferty.stacjonarne.najszybsza.download_mbps} Mbps` : ''}

OFERTY KOMÓRKOWE (${data.oferty.komorkowe.count}):
${data.oferty.komorkowe.najtansza ? `- Najtańsza: ${data.oferty.komorkowe.najtansza.nazwa} - ${data.oferty.komorkowe.najtansza.cena} zł/mies` : '- Brak ofert'}

WYMAGANIA:
1. Tytuł H1 zawierający nazwę operatora
2. Zajawka 2-3 zdania
3. Treść HTML z sekcjami: O operatorze, Oferty, Zasięg, Opinie
4. Użyj WSZYSTKICH podanych liczb
5. Naturalny język, obiektywny ton
6. Około 600-1000 słów
7. Zakończ CTA do sprawdzenia ofert

FORMAT ODPOWIEDZI (JSON):
{
  "tytul": "tytuł artykułu",
  "zajawka": "krótka zajawka",
  "tresc": "<h2>...</h2><p>...</p>...",
  "meta_title": "max 60 znaków",
  "meta_description": "max 155 znaków"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return { success: false, error: "Unexpected response type" };
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Nie udało się sparsować odpowiedzi" };
    }

    const article = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      article: {
        ...article,
        dane_snapshot: data,
      }
    };
  } catch (error: any) {
    console.error("Generator error:", error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// LISTA MIEJSCOWOŚCI DO WYBORU
// =====================================================

export async function getMiejscowosciDoGeneracji(limit = 50) {
  return prisma.miejscowosci_seo.findMany({
    where: {
      budynkow: { gt: 100 }
    },
    select: {
      slug: true,
      nazwa: true,
      powiat: true,
      wojewodztwo: true,
      budynkow: true,
    },
    orderBy: { budynkow: 'desc' },
    take: limit
  });
}

// =====================================================
// LISTA OPERATORÓW DO WYBORU
// =====================================================

export async function getOperatorzyDoGeneracji() {
  return prisma.operator.findMany({
    where: { aktywny: true },
    select: {
      id: true,
      slug: true,
      nazwa: true,
      typ: true,
      _count: { select: { oferty: { where: { aktywna: true } } } }
    },
    orderBy: { nazwa: 'asc' }
  });
}
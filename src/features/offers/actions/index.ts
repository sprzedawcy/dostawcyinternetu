"use server"
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Konwersja Decimal/Date na proste typy
function serializeOffer(data: any): any {
  return JSON.parse(JSON.stringify(data));
}

// 1. POBIERZ WSZYSTKIE OFERTY
export async function getOffers() {
  const offers = await prisma.oferta.findMany({
    include: {
      operator: {
        select: {
          id: true,
          nazwa: true,
          logo_url: true,
        }
      },
      _count: {
        select: {
          urzadzenia: true,
          lokalizacje: true,
          programy_tv: true,
        }
      }
    },
    orderBy: [
      { wyrozoniona: 'desc' },
      { created_at: 'desc' }
    ]
  });
  
  return offers.map(serializeOffer);
}

// 2. POBIERZ JEDNĄ OFERTĘ
export async function getOffer(id: number) {
  const offer = await prisma.oferta.findUnique({
    where: { id },
    include: {
      operator: true,
      urzadzenia: true,
      lokalizacje: true,
      programy_tv: true,
    }
  });
  
  if (!offer) return null;
  return serializeOffer(offer);
}

// 3. DODAJ OFERTĘ
export async function createOffer(formData: FormData) {
  const operator_id = parseInt(formData.get('operator_id') as string);
  const nazwa = formData.get('nazwa') as string;
  const custom_url = formData.get('custom_url') as string;
  const redirect_url = formData.get('redirect_url') as string;
  const opis = formData.get('opis') as string;
  const abonament = parseFloat(formData.get('abonament') as string);
  const instalacja = formData.get('instalacja') ? parseFloat(formData.get('instalacja') as string) : null;
  const aktywacja = formData.get('aktywacja') ? parseFloat(formData.get('aktywacja') as string) : null;
  const zobowiazanie_miesiace = formData.get('zobowiazanie_miesiace') ? parseInt(formData.get('zobowiazanie_miesiace') as string) : null;
  const download_mbps = parseInt(formData.get('download_mbps') as string);
  const upload_mbps = parseInt(formData.get('upload_mbps') as string);
  const technologia = formData.get('technologia') as string;
  const kategoria = formData.get('kategoria') as string;
  const wyrozoniona = formData.get('wyrozoniona') === 'true';
  const lokalna = formData.get('lokalna') === 'true';
  const oferta_specjalna = formData.get('oferta_specjalna') === 'true';
  const dom_blok_info = formData.get('dom_blok_info') === 'true';
  const dom_blok_tekst = formData.get('dom_blok_tekst') as string;

  const oferta = await prisma.oferta.create({
    data: {
      operator_id,
      nazwa,
      custom_url: custom_url || null,
      redirect_url: redirect_url || null,
      opis: opis || null,
      abonament,
      instalacja,
      aktywacja,
      zobowiazanie_miesiace,
      download_mbps,
      upload_mbps,
      technologia: technologia || null,
      kategoria,
      wyrozoniona,
      lokalna,
      oferta_specjalna,
      dom_blok_info,
      dom_blok_tekst: dom_blok_tekst || null,
    }
  });

  revalidatePath('/admin/oferty');
  return serializeOffer(oferta);
}

// 4. AKTUALIZUJ OFERTĘ
export async function updateOffer(id: number, formData: FormData) {
  const operator_id = parseInt(formData.get('operator_id') as string);
  const nazwa = formData.get('nazwa') as string;
  const custom_url = formData.get('custom_url') as string;
  const redirect_url = formData.get('redirect_url') as string;
  const opis = formData.get('opis') as string;
  const abonament = parseFloat(formData.get('abonament') as string);
  const instalacja = formData.get('instalacja') ? parseFloat(formData.get('instalacja') as string) : null;
  const aktywacja = formData.get('aktywacja') ? parseFloat(formData.get('aktywacja') as string) : null;
  const zobowiazanie_miesiace = formData.get('zobowiazanie_miesiace') ? parseInt(formData.get('zobowiazanie_miesiace') as string) : null;
  const download_mbps = parseInt(formData.get('download_mbps') as string);
  const upload_mbps = parseInt(formData.get('upload_mbps') as string);
  const technologia = formData.get('technologia') as string;
  const kategoria = formData.get('kategoria') as string;
  const wyrozoniona = formData.get('wyrozoniona') === 'true';
  const lokalna = formData.get('lokalna') === 'true';
  const oferta_specjalna = formData.get('oferta_specjalna') === 'true';
  const dom_blok_info = formData.get('dom_blok_info') === 'true';
  const dom_blok_tekst = formData.get('dom_blok_tekst') as string;
  const aktywna = formData.get('aktywna') === 'true';

  const oferta = await prisma.oferta.update({
    where: { id },
    data: {
      operator_id,
      nazwa,
      custom_url: custom_url || null,
      redirect_url: redirect_url || null,
      opis: opis || null,
      abonament,
      instalacja,
      aktywacja,
      zobowiazanie_miesiace,
      download_mbps,
      upload_mbps,
      technologia: technologia || null,
      kategoria,
      wyrozoniona,
      lokalna,
      oferta_specjalna,
      dom_blok_info,
      dom_blok_tekst: dom_blok_tekst || null,
      aktywna,
    }
  });

  revalidatePath('/admin/oferty');
  revalidatePath(`/admin/oferty/${id}`);
  return serializeOffer(oferta);
}

// 5. USUŃ OFERTĘ (zachowane dla kompatybilności, ale nie używane)
export async function deleteOffer(id: number) {
  await prisma.oferta.delete({
    where: { id }
  });

  revalidatePath('/admin/oferty');
}

// 6. POBIERZ OPERATORÓW (do selecta)
export async function getOperatorsForSelect() {
  return await prisma.operator.findMany({
    select: {
      id: true,
      nazwa: true,
    },
    orderBy: { nazwa: 'asc' }
  });
}

// 7. PRZEŁĄCZ STATUS OFERTY
export async function toggleOfferStatus(id: number) {
  const offer = await prisma.oferta.findUnique({
    where: { id }
  });

  if (!offer) {
    throw new Error('Oferta nie istnieje');
  }

  await prisma.oferta.update({
    where: { id },
    data: {
      aktywna: !offer.aktywna
    }
  });

  revalidatePath('/admin/oferty');
}
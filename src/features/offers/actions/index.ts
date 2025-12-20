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

// 3. POBIERZ AKTYWNE OFERTY OPERATORA (do przekierowania)
export async function getActiveOffersForOperator(operatorId: number, excludeId?: number) {
  const offers = await prisma.oferta.findMany({
    where: {
      operator_id: operatorId,
      aktywna: true,
      id: excludeId ? { not: excludeId } : undefined
    },
    select: {
      id: true,
      nazwa: true,
      custom_url: true
    },
    orderBy: { nazwa: 'asc' }
  });
  
  return offers;
}

// 4. DODAJ OFERTĘ
export async function createOffer(formData: FormData) {
  const operator_id = parseInt(formData.get('operator_id') as string);
  const nazwa = formData.get('nazwa') as string;
  const custom_url = formData.get('custom_url') as string;
  const redirect_url = formData.get('redirect_url') as string;
  const opis = formData.get('opis') as string;
  
  // Ceny dla mieszkań
  const abonament = parseFloat(formData.get('abonament') as string);
  const instalacja = formData.get('instalacja') ? parseFloat(formData.get('instalacja') as string) : null;
  const aktywacja = formData.get('aktywacja') ? parseFloat(formData.get('aktywacja') as string) : null;
  
  // Ceny dla domów
  const abonament_dom = formData.get('abonament_dom') ? parseFloat(formData.get('abonament_dom') as string) : null;
  const instalacja_dom = formData.get('instalacja_dom') ? parseFloat(formData.get('instalacja_dom') as string) : null;
  const aktywacja_dom = formData.get('aktywacja_dom') ? parseFloat(formData.get('aktywacja_dom') as string) : null;
  
  const zobowiazanie_miesiace = formData.get('zobowiazanie_miesiace') ? parseInt(formData.get('zobowiazanie_miesiace') as string) : null;
  const download_mbps = parseInt(formData.get('download_mbps') as string);
  const upload_mbps = parseInt(formData.get('upload_mbps') as string);
  const technologia = formData.get('technologia') as string;
  const wifi = formData.get('wifi') as string;
  const kategoria = formData.get('kategoria') as string;
  const wyrozoniona = formData.get('wyrozoniona') === 'true';
  const lokalna = formData.get('lokalna') === 'true';
  const dom_blok_tekst = formData.get('dom_blok_tekst') as string;
  const typ_polaczenia = formData.get('typ_polaczenia') as string;
  const priorytet = formData.get('priorytet') ? parseInt(formData.get('priorytet') as string) : 0;
  const aktywna = formData.get('aktywna') !== 'false';
  
  // Lokalizacje (JSON)
  const lokalizacje_json = formData.get('lokalizacje_json') as string;
  const lokalizacje: string[] = lokalizacje_json ? JSON.parse(lokalizacje_json) : [];

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
      abonament_dom,
      instalacja_dom,
      aktywacja_dom,
      zobowiazanie_miesiace,
      download_mbps,
      upload_mbps,
      technologia: technologia || null,
      wifi: wifi || null,
      kategoria,
      wyrozoniona,
      lokalna,
      dom_blok_tekst: dom_blok_tekst || null,
      typ_polaczenia,
      priorytet,
      aktywna,
      // Lokalizacje jako relacja
      lokalizacje: {
        create: lokalizacje.map(nazwa => ({
          typ: 'miejscowosc',
          kod: '',
          nazwa
        }))
      }
    }
  });

  revalidatePath('/admin/oferty');
  return serializeOffer(oferta);
}

// 5. AKTUALIZUJ OFERTĘ
export async function updateOffer(id: number, formData: FormData) {
  const operator_id = parseInt(formData.get('operator_id') as string);
  const nazwa = formData.get('nazwa') as string;
  const custom_url = formData.get('custom_url') as string;
  const redirect_url = formData.get('redirect_url') as string;
  const opis = formData.get('opis') as string;
  
  // Ceny dla mieszkań
  const abonament = parseFloat(formData.get('abonament') as string);
  const instalacja = formData.get('instalacja') ? parseFloat(formData.get('instalacja') as string) : null;
  const aktywacja = formData.get('aktywacja') ? parseFloat(formData.get('aktywacja') as string) : null;
  
  // Ceny dla domów
  const abonament_dom = formData.get('abonament_dom') ? parseFloat(formData.get('abonament_dom') as string) : null;
  const instalacja_dom = formData.get('instalacja_dom') ? parseFloat(formData.get('instalacja_dom') as string) : null;
  const aktywacja_dom = formData.get('aktywacja_dom') ? parseFloat(formData.get('aktywacja_dom') as string) : null;
  
  const zobowiazanie_miesiace = formData.get('zobowiazanie_miesiace') ? parseInt(formData.get('zobowiazanie_miesiace') as string) : null;
  const download_mbps = parseInt(formData.get('download_mbps') as string);
  const upload_mbps = parseInt(formData.get('upload_mbps') as string);
  const technologia = formData.get('technologia') as string;
  const wifi = formData.get('wifi') as string;
  const kategoria = formData.get('kategoria') as string;
  const wyrozoniona = formData.get('wyrozoniona') === 'true';
  const lokalna = formData.get('lokalna') === 'true';
  const dom_blok_tekst = formData.get('dom_blok_tekst') as string;
  const aktywna = formData.get('aktywna') === 'true';
  const typ_polaczenia = formData.get('typ_polaczenia') as string;
  const priorytet = formData.get('priorytet') ? parseInt(formData.get('priorytet') as string) : 0;

  // Lokalizacje (JSON)
  const lokalizacje_json = formData.get('lokalizacje_json') as string;
  const lokalizacje: string[] = lokalizacje_json ? JSON.parse(lokalizacje_json) : [];

  // Aktualizuj ofertę
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
      abonament_dom,
      instalacja_dom,
      aktywacja_dom,
      zobowiazanie_miesiace,
      download_mbps,
      upload_mbps,
      technologia: technologia || null,
      wifi: wifi || null,
      kategoria,
      wyrozoniona,
      lokalna,
      dom_blok_tekst: dom_blok_tekst || null,
      aktywna,
      typ_polaczenia,
      priorytet,
    }
  });

  // Aktualizuj lokalizacje (usuń stare, dodaj nowe)
  await prisma.ofertaLokalizacja.deleteMany({
    where: { oferta_id: id }
  });
  
  if (lokalizacje.length > 0) {
    await prisma.ofertaLokalizacja.createMany({
      data: lokalizacje.map(nazwa => ({
        oferta_id: id,
        typ: 'miejscowosc',
        kod: '',
        nazwa
      }))
    });
  }

  revalidatePath('/admin/oferty');
  revalidatePath(`/admin/oferty/${id}`);
  return serializeOffer(oferta);
}

// 6. USUŃ OFERTĘ
export async function deleteOffer(id: number) {
  await prisma.oferta.delete({
    where: { id }
  });

  revalidatePath('/admin/oferty');
}

// 7. POBIERZ OPERATORÓW (do selecta)
export async function getOperatorsForSelect() {
  return await prisma.operator.findMany({
    where: { aktywny: true },
    select: {
      id: true,
      nazwa: true,
    },
    orderBy: { nazwa: 'asc' }
  });
}

// 8. PRZEŁĄCZ STATUS OFERTY
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

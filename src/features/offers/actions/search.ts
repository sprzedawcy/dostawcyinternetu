"use server"
import { prisma } from "@/lib/prisma";

// Usuń powiat z nazwy miejscowości
function cleanMiejscowoscName(name: string): string {
  return name.replace(/\s*\([^)]+\)\s*$/, '').trim().toLowerCase();
}

interface AddressData {
  teryt: string;
  miejscowosc: string;
  ulica?: string;
  nr: string;
  simc: string;
  slug?: string;
  operators: { slug: string; hp_count: number }[];
  kpo_ferc?: string;
  bts?: { distance_m: number; isp: string; tech: string }[];
}

// 1. POBIERZ DANE ADRESU
export async function getAddressData(simc: string, id_ulicy: string, nr: string): Promise<AddressData | null> {
  const address = await prisma.polska.findFirst({
    where: { simc, id_ulicy, nr }
  });
  
  if (!address) return null;
  
  // Pobierz zasięgi z nowej tabeli operator_coverage
  const coverages = await prisma.operatorCoverage.findMany({
    where: { simc, id_ulicy, nr },
    include: {
      operator: {
        select: { slug: true }
      }
    }
  });
  
  const operators = coverages.map(c => ({
    slug: c.operator.slug,
    hp_count: c.hp_count
  }));
  
  // BTS
  const bts = [];
  if (address.bts_1_m && address.bts_1_isp && address.bts_1_tech) {
    bts.push({ distance_m: address.bts_1_m, isp: address.bts_1_isp, tech: address.bts_1_tech });
  }
  if (address.bts_2_m && address.bts_2_isp && address.bts_2_tech) {
    bts.push({ distance_m: address.bts_2_m, isp: address.bts_2_isp, tech: address.bts_2_tech });
  }
  if (address.bts_3_m && address.bts_3_isp && address.bts_3_tech) {
    bts.push({ distance_m: address.bts_3_m, isp: address.bts_3_isp, tech: address.bts_3_tech });
  }
  
  return {
    teryt: address.teryt || `${simc}_${id_ulicy}_${nr}`,
    miejscowosc: address.miejscowosc || '',
    ulica: address.ulica || undefined,
    nr: address.nr,
    simc: address.simc,
    slug: address.slug || undefined,
    operators,
    kpo_ferc: address.kpo_ferc || undefined,
    bts: bts.length > 0 ? bts : undefined
  };
}

// 2. WYSZUKAJ OFERTY DLA ADRESU
export async function searchOffersForAddress(simc: string, id_ulicy: string, nr: string) {
  const addressData = await getAddressData(simc, id_ulicy, nr);
  
  // Pobierz WSZYSTKIE aktywne oferty
  const allOffers = await prisma.oferta.findMany({
    where: { aktywna: true },
    include: {
      operator: {
        select: { id: true, nazwa: true, slug: true, logo_url: true }
      },
      lokalizacje: true
    },
    orderBy: [
      { wyrozoniona: 'desc' },
      { priorytet: 'desc' }
    ]
  });

  if (!addressData) {
    // Brak adresu w bazie - pokaż tylko komórkowe
    const mobileOffers = allOffers.filter(o => o.typ_polaczenia === 'komorkowe');
    
    return {
      address: null,
      offers: interleaveOffers(mobileOffers).map(serializeOffer),
      allOffersCount: mobileOffers.length,
      hasKpoFerc: false,
      hasCable: false,
      bts: []
    };
  }
  
  const operatorSlugs = addressData.operators.map(op => op.slug);
  const hasCable = operatorSlugs.length > 0;
  const addressMiejscowosc = cleanMiejscowoscName(addressData.miejscowosc);
  
  // Filtruj oferty
  let filteredOffers = allOffers.filter(offer => {
    // Oferty kablowe - tylko jeśli operator ma zasięg
    if (offer.typ_polaczenia === 'kablowe') {
      if (!operatorSlugs.includes(offer.operator.slug)) {
        return false;
      }
    }
    
    // Oferty lokalne - sprawdź czy miejscowość pasuje (porównuj bez powiatu)
    if (offer.lokalna && offer.lokalizacje.length > 0) {
      const locationNames = offer.lokalizacje.map(l => cleanMiejscowoscName(l.nazwa));
      if (!locationNames.includes(addressMiejscowosc)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sortuj: wyróżnione → lokalne → kablowe → komórkowe, po priorytecie
  filteredOffers.sort((a, b) => {
    // 1. Wyróżnione najpierw
    if (a.wyrozoniona !== b.wyrozoniona) {
      return a.wyrozoniona ? -1 : 1;
    }
    
    // 2. Lokalne przed resztą
    if (a.lokalna !== b.lokalna) {
      return a.lokalna ? -1 : 1;
    }
    
    // 3. Kablowe przed komórkowymi (tylko jeśli jest kabel)
    if (hasCable && a.typ_polaczenia !== b.typ_polaczenia) {
      return a.typ_polaczenia === 'kablowe' ? -1 : 1;
    }
    
    // 4. Priorytet
    if (a.priorytet !== b.priorytet) {
      return b.priorytet - a.priorytet;
    }
    
    // 5. Data utworzenia
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  // Przeplataj oferty różnych operatorów
  const interleavedOffers = interleaveOffers(filteredOffers);
  
  return {
    address: addressData,
    offers: interleavedOffers.map(serializeOffer),
    allOffersCount: interleavedOffers.length,
    hasKpoFerc: !!addressData.kpo_ferc,
    hasCable,
    bts: addressData.bts || []
  };
}

// Przeplatanie ofert różnych operatorów
function interleaveOffers(offers: any[]): any[] {
  if (offers.length === 0) return [];
  
  // Grupuj po operatorze zachowując kolejność
  const offersByOperator = new Map<number, any[]>();
  
  for (const offer of offers) {
    const opId = offer.operator_id;
    if (!offersByOperator.has(opId)) {
      offersByOperator.set(opId, []);
    }
    offersByOperator.get(opId)!.push(offer);
  }
  
  // Round-robin
  const result: any[] = [];
  let hasMore = true;
  let index = 0;
  
  while (hasMore) {
    hasMore = false;
    for (const [_, operatorOffers] of offersByOperator) {
      if (operatorOffers.length > index) {
        result.push(operatorOffers[index]);
        hasMore = true;
      }
    }
    index++;
  }
  
  return result;
}

// Serializacja (Decimal → number)
function serializeOffer(offer: any): any {
  return JSON.parse(JSON.stringify(offer));
}

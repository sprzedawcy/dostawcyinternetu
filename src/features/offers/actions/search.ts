"use server"
import { prisma } from "@/lib/prisma";

// Mapowanie nazw operatorów z tabeli polska na slug w CMS
const OPERATOR_MAPPING: Record<string, string> = {
  'upc': 'upc',
  'timo': 'orange',  // T-Mobile to Orange po fuzji
  'netia': 'netia',
  'vectra': 'vectra',
  'opl': 'orange',
  'moico': 'moico',
  'krawarkon': 'krawarkon',
};

interface AddressData {
  teryt: string;
  miejscowosc: string;
  ulica?: string;
  nr: string;
  simc: string;
  slug?: string;
  
  // Zasięgi operatorów
  operators: {
    slug: string;
    hp_count: number;
  }[];
  
  // KPO/FERC
  kpo_ferc?: string;
  
  // BTS (jeśli brak kablowych)
  bts?: {
    distance_m: number;
    isp: string;
    tech: string;
  }[];
}

// 1. POBIERZ DANE ADRESU Z TABELI POLSKA
export async function getAddressData(simc: string, id_ulicy: string, nr: string): Promise<AddressData | null> {
  const address = await prisma.polska.findFirst({
    where: {
      simc,
      id_ulicy,
      nr
    }
  });
  
  if (!address) return null;
  
  // Zbierz operatorów z zasięgiem
  const operators: { slug: string; hp_count: number }[] = [];
  
  if (address.upc_hp && address.upc_hp > 0) {
    operators.push({ slug: 'upc', hp_count: address.upc_hp });
  }
  if (address.timo_hp && address.timo_hp > 0) {
    operators.push({ slug: 'orange', hp_count: address.timo_hp });
  }
  if (address.netia_hp && address.netia_hp > 0) {
    operators.push({ slug: 'netia', hp_count: address.netia_hp });
  }
  if (address.vectra_hp && address.vectra_hp > 0) {
    operators.push({ slug: 'vectra', hp_count: address.vectra_hp });
  }
  if (address.opl_hp && address.opl_hp > 0) {
    operators.push({ slug: 'orange', hp_count: address.opl_hp });
  }
  if (address.moico_hp && address.moico_hp > 0) {
    operators.push({ slug: 'moico', hp_count: address.moico_hp });
  }
  if (address.krawarkon_hp && address.krawarkon_hp > 0) {
    operators.push({ slug: 'krawarkon', hp_count: address.krawarkon_hp });
  }
  
  // BTS (3 najbliższe)
  const bts = [];
  if (address.bts_1_m && address.bts_1_isp && address.bts_1_tech) {
    bts.push({
      distance_m: address.bts_1_m,
      isp: address.bts_1_isp,
      tech: address.bts_1_tech
    });
  }
  if (address.bts_2_m && address.bts_2_isp && address.bts_2_tech) {
    bts.push({
      distance_m: address.bts_2_m,
      isp: address.bts_2_isp,
      tech: address.bts_2_tech
    });
  }
  if (address.bts_3_m && address.bts_3_isp && address.bts_3_tech) {
    bts.push({
      distance_m: address.bts_3_m,
      isp: address.bts_3_isp,
      tech: address.bts_3_tech
    });
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
  
  if (!addressData) {
    return {
      address: null,
      offers: [],
      allOffersCount: 0,
      hasKpoFerc: false,
      hasCable: false,
      bts: []
    };
  }
  
  // Pobierz operatorów z zasięgiem
  const operatorSlugs = addressData.operators.map(op => op.slug);
  
  if (operatorSlugs.length === 0) {
    // Brak kablowych - zwróć info o BTS
    return {
      address: addressData,
      offers: [],
      allOffersCount: 0,
      hasKpoFerc: !!addressData.kpo_ferc,
      hasCable: false,
      bts: addressData.bts || []
    };
  }
  
  // Pobierz operatorów z CMS
  const operators = await prisma.operator.findMany({
    where: {
      slug: { in: operatorSlugs },
      aktywny: true
    }
  });
  
  const operatorIds = operators.map(op => op.id);
  
  // Pobierz oferty
  const allOffers = await prisma.oferta.findMany({
    where: {
      operator_id: { in: operatorIds },
      aktywna: true
    },
    include: {
      operator: true
    },
    orderBy: [
      { wyrozoniona: 'desc' },
      { priorytet: 'desc' }
    ]
  });
  
  // LOGIKA SORTOWANIA:
  // 1. Jeśli są kablowe - ukryj komórkowe tego operatora
  // 2. Sortuj: wyróżnione → priorytet → typ (kablowe > komórkowe)
  // 3. Przetasuj między operatorami (nie pokazuj 5 ofert tego samego obok siebie)
  // 4. Limit 12 (lub wszystkie)
  
  // Krok 1: Filtruj komórkowe jeśli operator ma kablowe
  const operatorsWithCable = new Set<number>();
  allOffers.forEach(offer => {
    if (offer.typ_polaczenia === 'kablowe') {
      operatorsWithCable.add(offer.operator_id);
    }
  });
  
  const filteredOffers = allOffers.filter(offer => {
    // Jeśli operator ma kablowe, ukryj jego komórkowe
    if (operatorsWithCable.has(offer.operator_id) && offer.typ_polaczenia === 'komorkowe') {
      return false;
    }
    return true;
  });
  
  // Krok 2: Sortuj
  const sorted = filteredOffers.sort((a, b) => {
    // 1. Wyróżnione najpierw
    if (a.wyrozoniona !== b.wyrozoniona) {
      return a.wyrozoniona ? -1 : 1;
    }
    
    // 2. Priorytet (wyższy = wyżej)
    if (a.priorytet !== b.priorytet) {
      return b.priorytet - a.priorytet;
    }
    
    // 3. Typ (kablowe > komórkowe)
    if (a.typ_polaczenia !== b.typ_polaczenia) {
      return a.typ_polaczenia === 'kablowe' ? -1 : 1;
    }
    
    // 4. Data utworzenia (nowsze = wyżej)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  // Krok 3: Przetasuj między operatorami (round-robin)
  const interleaved: typeof sorted = [];
  const offersByOperator = new Map<number, typeof sorted>();
  
  sorted.forEach(offer => {
    if (!offersByOperator.has(offer.operator_id)) {
      offersByOperator.set(offer.operator_id, []);
    }
    offersByOperator.get(offer.operator_id)!.push(offer);
  });
  
  let hasMore = true;
  let index = 0;
  
  while (hasMore) {
    hasMore = false;
    
    for (const [operatorId, offers] of offersByOperator) {
      if (offers.length > index) {
        interleaved.push(offers[index]);
        hasMore = true;
      }
    }
    
    index++;
  }
  
  // Krok 4: Limit 12 dla głównej listy
  const topOffers = interleaved.slice(0, 12);
  
  return {
    address: addressData,
    offers: topOffers.map((offer: any) => JSON.parse(JSON.stringify(offer))),
    allOffersCount: interleaved.length,
    hasKpoFerc: !!addressData.kpo_ferc,
    hasCable: true,
    bts: addressData.bts || []
  };
}
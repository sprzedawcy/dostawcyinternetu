import { searchOffersForAddress } from './src/features/offers/actions/search';

async function test() {
  console.log('🔍 Testowanie wyszukiwania ofert...\n');
  
  const result = await searchOffersForAddress('0225762', '00000', '88a');
  
  console.log('📍 Adres:', result.address);
  console.log('📊 Liczba ofert:', result.offers.length, '/', result.allOffersCount);
  console.log('🏗️ KPO/FERC:', result.hasKpoFerc ? 'TAK' : 'NIE');
  console.log('📡 Kablowe:', result.hasCable ? 'TAK' : 'NIE');
  console.log('📶 BTS:', result.bts?.length || 0, 'nadajniki');
  
  if (result.offers.length > 0) {
    console.log('\n📋 Top oferty:');
    result.offers.forEach((offer: any, i: number) => {
      console.log(`${i+1}. ${offer.operator.nazwa} - ${offer.nazwa} (${offer.typ_polaczenia}, priorytet: ${offer.priorytet})`);
    });
  }
}

test();

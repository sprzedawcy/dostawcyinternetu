import { searchOffersForAddress } from './src/features/offers/actions/search';

async function test() {
  console.log('🔍 Test adresu z Netia...\n');
  
  const result = await searchOffersForAddress('0385833', '00000', '136');
  
  console.log('📍 Adres:', result.address?.miejscowosc, result.address?.nr);
  console.log('📊 Operatorzy z zasięgiem:', result.address?.operators);
  console.log('📋 Liczba ofert:', result.offers.length);
  
  if (result.offers.length > 0) {
    console.log('\n✅ Oferty:');
    result.offers.forEach((offer: any, i: number) => {
      console.log(`${i+1}. ${offer.operator.nazwa} - ${offer.nazwa}`);
    });
  } else {
    console.log('\n⚠️ Brak ofert - operator Netia nie ma jeszcze dodanych ofert w CMS');
  }
}

test();

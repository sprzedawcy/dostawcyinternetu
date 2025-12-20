import { prisma } from './lib/prisma';

async function check() {
  const operators = await prisma.operator.findMany({
    select: {
      id: true,
      nazwa: true,
      slug: true,
      aktywny: true
    }
  });
  
  console.log('📋 Operatorzy w CMS:');
  operators.forEach(op => {
    console.log(`- ${op.slug} (${op.nazwa}) - ${op.aktywny ? '✅' : '❌'}`);
  });
  
  console.log('\n📊 Potrzebni operatorzy z tabeli polska:');
  console.log('- upc (UPC Polska)');
  console.log('- orange (Orange / T-Mobile)');
  console.log('- netia (Netia)');
  console.log('- vectra (Vectra)');
  console.log('- moico (Moico)');
  console.log('- krawarkon (Krawarkon)');
}

check();

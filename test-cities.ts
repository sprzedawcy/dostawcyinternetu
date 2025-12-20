import { prisma } from './lib/prisma';

async function test() {
  const tests = ['żory', 'zory', 'łódź', 'lodz', 'wólka', 'wolka', 'żywiec', 'zywiec'];
  
  for (const query of tests) {
    const results = await prisma.searchMiejscowosc.findMany({
      where: {
        nazwa_normalized: {
          contains: query.toLowerCase()
        }
      },
      take: 3
    });
    
    console.log(`\n"${query}" → ${results.length} wyników:`);
    results.forEach(r => console.log(`  - ${r.nazwa} (normalized: ${r.nazwa_normalized})`));
  }
  
  await prisma.$disconnect();
}

test();

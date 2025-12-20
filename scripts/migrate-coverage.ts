import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OPERATOR_MAPPING = [
  { column: 'upc_hp', slug: 'upc' },
  { column: 'timo_hp', slug: 'timo' },      // T-Mobile osobno!
  { column: 'netia_hp', slug: 'netia' },
  { column: 'vectra_hp', slug: 'vectra' },
  { column: 'opl_hp', slug: 'orange' },     // Orange Polska
  { column: 'moico_hp', slug: 'moico' },
  { column: 'krawarkon_hp', slug: 'krawarkon' },
];

async function migrate() {
  console.log('🚀 Start migracji zasięgów (BEZ LIMITU)...\n');

  const operators = await prisma.operator.findMany();
  console.log(`📋 Znaleziono ${operators.length} operatorów w CMS:`);
  operators.forEach(op => console.log(`   - ${op.slug} (ID: ${op.id})`));
  
  const slugToId = new Map(operators.map(op => [op.slug, op.id]));

  let totalInserted = 0;

  for (const mapping of OPERATOR_MAPPING) {
    const operatorId = slugToId.get(mapping.slug);
    
    if (!operatorId) {
      console.log(`\n⚠️ Operator "${mapping.slug}" nie istnieje w CMS - pomijam ${mapping.column}`);
      continue;
    }

    console.log(`\n📦 Migruję ${mapping.column} → operator_id=${operatorId} (${mapping.slug})`);

    const records = await prisma.$queryRawUnsafe<any[]>(`
      SELECT simc, id_ulicy, nr, ${mapping.column} as hp_count
      FROM polska 
      WHERE ${mapping.column} > 0
    `);

    console.log(`   Znaleziono ${records.length.toLocaleString()} rekordów z ${mapping.column} > 0`);

    if (records.length === 0) continue;

    let inserted = 0;
    const batchSize = 5000;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        await prisma.operatorCoverage.createMany({
          data: batch.map(r => ({
            operator_id: operatorId,
            simc: r.simc,
            id_ulicy: r.id_ulicy,
            nr: r.nr,
            hp_count: r.hp_count,
            source: 'migration'
          })),
          skipDuplicates: true
        });
        inserted += batch.length;
      } catch (e: any) {
        console.log(`   ⚠️ Błąd batch ${i}-${i+batchSize}: ${e.message}`);
      }

      if (i % 50000 === 0 && i > 0) {
        console.log(`   ... ${i.toLocaleString()}/${records.length.toLocaleString()}`);
      }
    }

    console.log(`   ✅ Wstawiono ${inserted.toLocaleString()} rekordów`);
    totalInserted += inserted;
  }

  console.log(`\n🎉 MIGRACJA ZAKOŃCZONA! Łącznie: ${totalInserted.toLocaleString()} rekordów`);
  
  const stats = await prisma.operatorCoverage.groupBy({
    by: ['operator_id'],
    _count: { id: true }
  });
  
  console.log('\n📊 STATYSTYKI:');
  for (const stat of stats) {
    const op = operators.find(o => o.id === stat.operator_id);
    console.log(`   ${op?.slug || '?'}: ${stat._count.id.toLocaleString()} adresów`);
  }

  await prisma.$disconnect();
}

migrate().catch(console.error);

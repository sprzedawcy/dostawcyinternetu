import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'polska'
      ORDER BY ordinal_position;
    `;
    console.log('📋 Kolumny w tabeli polska:');
    console.log(columns);
    
    const sample = await prisma.$queryRaw`
      SELECT * FROM polska LIMIT 1;
    `;
    console.log('\n📄 Przykładowy wiersz:');
    console.log(sample);
  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();

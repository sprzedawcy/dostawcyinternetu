import { prisma } from './lib/prisma';

const operators = [
  {
    nazwa: 'UPC Polska',
    slug: 'upc',
    opis: 'Operator telewizji kablowej i internetu działający w większych miastach Polski.'
  },
  {
    nazwa: 'Orange Polska',
    slug: 'orange',
    opis: 'Największy operator telekomunikacyjny w Polsce oferujący internet, telewizję i telefon.'
  },
  {
    nazwa: 'Netia',
    slug: 'netia',
    opis: 'Operator alternatywny oferujący internet światłowodowy i usługi telekomunikacyjne.'
  },
  {
    nazwa: 'Vectra',
    slug: 'vectra',
    opis: 'Operator telewizji kablowej i internetu działający regionalnie w Polsce.'
  },
  {
    nazwa: 'Moico',
    slug: 'moico',
    opis: 'Lokalny operator internetowy.'
  },
  {
    nazwa: 'Krawarkon',
    slug: 'krawarkon',
    opis: 'Lokalny operator internetowy.'
  }
];

async function seed() {
  console.log('🌱 Dodawanie operatorów...\n');
  
  for (const op of operators) {
    const existing = await prisma.operator.findUnique({
      where: { slug: op.slug }
    });
    
    if (existing) {
      console.log(`⏭️  ${op.slug} - już istnieje`);
    } else {
      await prisma.operator.create({
        data: {
          ...op,
          aktywny: true
        }
      });
      console.log(`✅ ${op.slug} - dodano`);
    }
  }
  
  console.log('\n✅ Gotowe!');
}

seed();

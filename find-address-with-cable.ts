import { prisma } from './lib/prisma';

async function find() {
  const address = await prisma.polska.findFirst({
    where: {
      OR: [
        { upc_hp: { gt: 0 } },
        { netia_hp: { gt: 0 } },
        { vectra_hp: { gt: 0 } }
      ]
    }
  });
  
  console.log('📍 Znaleziono adres z kablówką:');
  console.log(`Miejscowość: ${address?.miejscowosc}`);
  console.log(`Ulica: ${address?.ulica || 'brak'}`);
  console.log(`Nr: ${address?.nr}`);
  console.log(`SIMC: ${address?.simc}, ID_ULICY: ${address?.id_ulicy}`);
  console.log(`\nUPC: ${address?.upc_hp || 0} HP`);
  console.log(`Netia: ${address?.netia_hp || 0} HP`);
  console.log(`Vectra: ${address?.vectra_hp || 0} HP`);
}

find();

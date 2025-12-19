import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'wojtek@dostawcyinternetu.pl';
  const password = '123abc123';
  
  // Sprawdź czy użytkownik już istnieje
  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    console.log('❌ Użytkownik już istnieje!');
    return;
  }

  // Hashuj hasło
  const password_hash = await bcrypt.hash(password, 10);

  // Utwórz użytkownika
  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      name: 'Wojtek',
      role: 'admin'
    }
  });

  console.log('✅ Utworzono użytkownika:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

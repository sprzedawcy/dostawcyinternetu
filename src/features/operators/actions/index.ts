"use server"
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Konwersja Decimal/Date na proste typy
function serializeOperator(data: any): any {
  return JSON.parse(JSON.stringify(data));
}

// Funkcja slugify
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 1. POBIERZ WSZYSTKICH OPERATORÓW
export async function getOperators() {
  const operators = await prisma.operator.findMany({
    include: {
      _count: {
        select: {
          oferty: true,
          leady: true,
          zasiegi: true,
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });
  
  return operators.map(serializeOperator);
}

// 2. POBIERZ JEDNEGO OPERATORA
export async function getOperator(id: number) {
  const operator = await prisma.operator.findUnique({
    where: { id },
    include: {
      oferty: true,
      zasiegi: true,
      opinie: true,
      leady: true,
    }
  });
  
  if (!operator) return null;
  return serializeOperator(operator);
}

// 3. DODAJ OPERATORA
export async function createOperator(formData: FormData) {
  const nazwa = formData.get('nazwa') as string;
  const opis = formData.get('opis') as string;
  const email_handlowca = formData.get('email_handlowca') as string;
  const logo_url = formData.get('logo_url') as string;
  const redirect_url = formData.get('redirect_url') as string;

  const slug = slugify(nazwa);

  const existing = await prisma.operator.findUnique({
    where: { slug }
  });

  if (existing) {
    throw new Error('Operator o tej nazwie już istnieje');
  }

  const operator = await prisma.operator.create({
    data: {
      nazwa,
      slug,
      opis: opis || null,
      email_handlowca: email_handlowca || null,
      logo_url: logo_url || null,
      redirect_url: redirect_url || null,
      aktywny: true,
    }
  });

  revalidatePath('/admin/operatorzy');
  return operator;
}

// 4. AKTUALIZUJ OPERATORA
export async function updateOperator(id: number, formData: FormData) {
  const nazwa = formData.get('nazwa') as string;
  const opis = formData.get('opis') as string;
  const email_handlowca = formData.get('email_handlowca') as string;
  const logo_url = formData.get('logo_url') as string;
  const redirect_url = formData.get('redirect_url') as string;
  const aktywny = formData.get('aktywny') === 'true';

  const slug = slugify(nazwa);

  const existing = await prisma.operator.findFirst({
    where: { 
      slug,
      NOT: { id }
    }
  });

  if (existing) {
    throw new Error('Operator o tej nazwie już istnieje');
  }

  const operator = await prisma.operator.update({
    where: { id },
    data: {
      nazwa,
      slug,
      opis: opis || null,
      email_handlowca: email_handlowca || null,
      logo_url: logo_url || null,
      redirect_url: redirect_url || null,
      aktywny,
    }
  });

  revalidatePath('/admin/operatorzy');
  revalidatePath(`/admin/operatorzy/${id}`);
  return operator;
}

// 5. USUŃ OPERATORA (zachowane dla kompatybilności, ale nie używane)
export async function deleteOperator(id: number) {
  await prisma.operator.delete({
    where: { id }
  });

  revalidatePath('/admin/operatorzy');
}

// 6. PRZEŁĄCZ STATUS
export async function toggleOperatorStatus(id: number) {
  const operator = await prisma.operator.findUnique({
    where: { id }
  });

  if (!operator) {
    throw new Error('Operator nie istnieje');
  }

  await prisma.operator.update({
    where: { id },
    data: {
      aktywny: !operator.aktywny
    }
  });

  revalidatePath('/admin/operatorzy');
}
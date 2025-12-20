"use server"
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Serializacja
function serializeCoverage(data: any): any {
  return JSON.parse(JSON.stringify(data));
}

// 1. POBIERZ ZASIĘG OPERATORA
export async function getOperatorCoverage(operator_id: number, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    prisma.zasiegOperatora.findMany({
      where: { operator_id },
      orderBy: [
        { aktywny: 'desc' },
        { created_at: 'desc' }
      ],
      skip,
      take: limit
    }),
    prisma.zasiegOperatora.count({
      where: { operator_id }
    })
  ]);
  
  return {
    items: items.map(serializeCoverage),
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

// 1.5. SPRAWDŹ CZY MIEJSCOWOŚĆ MA ULICE
export async function cityHasStreets(simc: string): Promise<boolean> {
  const count = await prisma.searchUlica.count({
    where: { simc }
  });
  
  return count > 0;
}

// 2. DODAJ ZASIĘG - CAŁE MIASTO
export async function addCityCoverage(operator_id: number, formData: FormData) {
  const teryt = formData.get('teryt') as string;
  const miejscowosc = formData.get('miejscowosc') as string;
  const simc = formData.get('simc') as string;
  const notatka = formData.get('notatka') as string;
  
  // Sprawdź czy już istnieje
  const existing = await prisma.zasiegOperatora.findUnique({
    where: {
      operator_id_teryt: {
        operator_id,
        teryt
      }
    }
  });
  
  if (existing) {
    throw new Error('Ten zasięg już istnieje dla tego operatora');
  }
  
  const coverage = await prisma.zasiegOperatora.create({
    data: {
      operator_id,
      teryt,
      miejscowosc,
      simc,
      ulica: null,
      id_ulicy: null,
      nr: null,
      typ: 'cale_miasto',
      aktywny: true,
      notatka: notatka || null
    }
  });
  
  revalidatePath(`/admin/operatorzy/${operator_id}/zasieg`);
  return serializeCoverage(coverage);
}

// 3. DODAJ ZASIĘG - KONKRETNA ULICA
export async function addStreetCoverage(operator_id: number, formData: FormData) {
  const teryt = formData.get('teryt') as string;
  const miejscowosc = formData.get('miejscowosc') as string;
  const simc = formData.get('simc') as string;
  const ulica = formData.get('ulica') as string;
  const id_ulicy = formData.get('id_ulicy') as string;
  const notatka = formData.get('notatka') as string;
  
  const uniqueKey = `${teryt}_${id_ulicy}`;
  
  const existing = await prisma.zasiegOperatora.findUnique({
    where: {
      operator_id_teryt: {
        operator_id,
        teryt: uniqueKey
      }
    }
  });
  
  if (existing) {
    throw new Error('Ten zasięg już istnieje dla tego operatora');
  }
  
  const coverage = await prisma.zasiegOperatora.create({
    data: {
      operator_id,
      teryt: uniqueKey,
      miejscowosc,
      simc,
      ulica,
      id_ulicy,
      nr: null,
      typ: 'konkretna_ulica',
      aktywny: true,
      notatka: notatka || null
    }
  });
  
  revalidatePath(`/admin/operatorzy/${operator_id}/zasieg`);
  return serializeCoverage(coverage);
}

// 4. DODAJ ZASIĘG - KONKRETNY ADRES
export async function addAddressCoverage(operator_id: number, formData: FormData) {
  const teryt = formData.get('teryt') as string;
  const miejscowosc = formData.get('miejscowosc') as string;
  const simc = formData.get('simc') as string;
  const ulica = formData.get('ulica') as string;
  const id_ulicy = formData.get('id_ulicy') as string;
  const nr = formData.get('nr') as string;
  const notatka = formData.get('notatka') as string;
  
  const uniqueKey = `${teryt}_${id_ulicy}_${nr}`;
  
  const existing = await prisma.zasiegOperatora.findUnique({
    where: {
      operator_id_teryt: {
        operator_id,
        teryt: uniqueKey
      }
    }
  });
  
  if (existing) {
    throw new Error('Ten zasięg już istnieje dla tego operatora');
  }
  
  const coverage = await prisma.zasiegOperatora.create({
    data: {
      operator_id,
      teryt: uniqueKey,
      miejscowosc,
      simc,
      ulica,
      id_ulicy,
      nr,
      typ: 'konkretny_adres',
      aktywny: true,
      notatka: notatka || null
    }
  });
  
  revalidatePath(`/admin/operatorzy/${operator_id}/zasieg`);
  return serializeCoverage(coverage);
}

// 5. PRZEŁĄCZ STATUS ZASIĘGU
export async function toggleCoverageStatus(id: number, operator_id: number) {
  const coverage = await prisma.zasiegOperatora.findUnique({
    where: { id }
  });
  
  if (!coverage) {
    throw new Error('Zasięg nie istnieje');
  }
  
  await prisma.zasiegOperatora.update({
    where: { id },
    data: {
      aktywny: !coverage.aktywny
    }
  });
  
  revalidatePath(`/admin/operatorzy/${operator_id}/zasieg`);
}

// 6. USUŃ ZASIĘG
export async function deleteCoverage(id: number, operator_id: number) {
  await prisma.zasiegOperatora.delete({
    where: { id }
  });
  
  revalidatePath(`/admin/operatorzy/${operator_id}/zasieg`);
}

// 7. BULK AKTYWUJ/DEZAKTYWUJ
export async function bulkToggleCoverage(ids: number[], operator_id: number, aktywny: boolean) {
  await prisma.zasiegOperatora.updateMany({
    where: {
      id: { in: ids },
      operator_id
    },
    data: {
      aktywny
    }
  });
  
  revalidatePath(`/admin/operatorzy/${operator_id}/zasieg`);
}

// 8. BULK USUŃ
export async function bulkDeleteCoverage(ids: number[], operator_id: number) {
  await prisma.zasiegOperatora.deleteMany({
    where: {
      id: { in: ids },
      operator_id
    }
  });
  
  revalidatePath(`/admin/operatorzy/${operator_id}/zasieg`);
}

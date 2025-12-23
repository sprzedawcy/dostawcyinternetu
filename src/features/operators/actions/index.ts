"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function generateSlug(nazwa: string): string {
  return nazwa
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // usuń akcenty
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getOperators() {
  return prisma.operator.findMany({
    include: {
      _count: {
        select: {
          oferty: true,
          leady: true,
        },
      },
    },
    orderBy: { nazwa: "asc" },
  });
}

export async function getOperator(id: number) {
  const operator = await prisma.operator.findUnique({
    where: { id },
    include: {
      oferty: true,
      leady: true,
      zasiegi: true,
      faq: { orderBy: { kolejnosc: "asc" } },
      promotions: { where: { aktywna: true } },
    },
  });

  if (!operator) return null;

  // Konwertuj Decimal na number dla ofert
  return {
    ...operator,
    oferty: operator.oferty.map((o) => ({
      ...o,
      abonament: o.abonament ? Number(o.abonament) : null,
      instalacja: o.instalacja ? Number(o.instalacja) : null,
      aktywacja: o.aktywacja ? Number(o.aktywacja) : null,
      abonament_dom: o.abonament_dom ? Number(o.abonament_dom) : null,
      instalacja_dom: o.instalacja_dom ? Number(o.instalacja_dom) : null,
      aktywacja_dom: o.aktywacja_dom ? Number(o.aktywacja_dom) : null,
    })),
  };
}

export async function getActiveOperators() {
  return prisma.operator.findMany({
    where: { aktywny: true },
    orderBy: { nazwa: "asc" },
  });
}

export async function createOperator(formData: FormData) {
  const nazwa = formData.get("nazwa") as string;
  
  if (!nazwa) {
    throw new Error("Nazwa operatora jest wymagana");
  }

  // Sprawdź czy już istnieje
  const existing = await prisma.operator.findFirst({
    where: { nazwa },
  });

  if (existing) {
    throw new Error("Operator o tej nazwie już istnieje");
  }

  const slug = generateSlug(nazwa);

  // Parsuj tablice
  const technologie = parseJsonArray(formData.get("technologie") as string);
  const regiony = parseCommaSeparated(formData.get("regiony") as string);
  const keywords = parseCommaSeparated(formData.get("keywords") as string);

  await prisma.operator.create({
    data: {
      nazwa,
      slug,
      opis: formData.get("opis") as string || null,
      logo_url: formData.get("logo_url") as string || null,
      email_handlowca: formData.get("email_handlowca") as string || null,
      redirect_url: formData.get("redirect_url") as string || null,
      strona_www: formData.get("strona_www") as string || null,
      telefon: formData.get("telefon") as string || null,
      typ: formData.get("typ") as string || "krajowy",
      meta_title: formData.get("meta_title") as string || null,
      meta_description: formData.get("meta_description") as string || null,
      technologie,
      regiony,
      keywords,
      aktywny: true,
    },
  });

  revalidatePath("/admin/operatorzy");
}

export async function updateOperator(id: number, formData: FormData) {
  const nazwa = formData.get("nazwa") as string;
  
  if (!nazwa) {
    throw new Error("Nazwa operatora jest wymagana");
  }

  // Sprawdź czy nazwa nie jest zajęta przez innego operatora
  const existing = await prisma.operator.findFirst({
    where: { 
      nazwa,
      id: { not: id }
    },
  });

  if (existing) {
    throw new Error("Operator o tej nazwie już istnieje");
  }

  // Parsuj tablice
  const technologie = parseJsonArray(formData.get("technologie") as string);
  const regiony = parseCommaSeparated(formData.get("regiony") as string);
  const keywords = parseCommaSeparated(formData.get("keywords") as string);

  // Pobierz obecnego operatora (dla zachowania slug jeśli nazwa się nie zmieniła)
  const current = await prisma.operator.findUnique({ where: { id } });
  const slug = current?.nazwa === nazwa ? current.slug : generateSlug(nazwa);

  await prisma.operator.update({
    where: { id },
    data: {
      nazwa,
      slug,
      opis: formData.get("opis") as string || null,
      logo_url: formData.get("logo_url") as string || null,
      email_handlowca: formData.get("email_handlowca") as string || null,
      redirect_url: formData.get("redirect_url") as string || null,
      strona_www: formData.get("strona_www") as string || null,
      telefon: formData.get("telefon") as string || null,
      typ: formData.get("typ") as string || "krajowy",
      meta_title: formData.get("meta_title") as string || null,
      meta_description: formData.get("meta_description") as string || null,
      technologie,
      regiony,
      keywords,
      aktywny: formData.get("aktywny") === "true",
    },
  });

  revalidatePath("/admin/operatorzy");
  revalidatePath(`/admin/operatorzy/${id}`);
}

export async function toggleOperatorStatus(id: number) {
  const operator = await prisma.operator.findUnique({
    where: { id },
  });

  if (!operator) {
    throw new Error("Operator nie istnieje");
  }

  await prisma.operator.update({
    where: { id },
    data: { aktywny: !operator.aktywny },
  });

  revalidatePath("/admin/operatorzy");
}

export async function deleteOperator(id: number) {
  // Sprawdź czy operator ma powiązane dane
  const operator = await prisma.operator.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          oferty: true,
          leady: true,
        },
      },
    },
  });

  if (!operator) {
    throw new Error("Operator nie istnieje");
  }

  if (operator._count.oferty > 0) {
    throw new Error(`Nie można usunąć - operator ma ${operator._count.oferty} ofert`);
  }

  if (operator._count.leady > 0) {
    throw new Error(`Nie można usunąć - operator ma ${operator._count.leady} leadów`);
  }

  await prisma.operator.delete({
    where: { id },
  });

  revalidatePath("/admin/operatorzy");
}

// Helpers
function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseCommaSeparated(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
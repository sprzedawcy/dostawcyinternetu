import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const miejscowosc = req.nextUrl.searchParams.get('miejscowosc');
    
    if (!miejscowosc) {
      return NextResponse.json({ error: "Brak parametru miejscowosc" }, { status: 400 });
    }

    const record = await prisma.polska.findFirst({
      where: {
        miejscowosc: {
          equals: miejscowosc,
          mode: 'insensitive'
        }
      },
      select: { simc: true }
    });

    if (!record) {
      return NextResponse.json({ error: "Nie znaleziono miejscowosci" }, { status: 404 });
    }

    // Sprawdź czy są ulice
    const streetCount = await prisma.polska.count({
      where: {
        simc: record.simc,
        ulica: { not: null }
      }
    });

    return NextResponse.json({ 
      simc: record.simc,
      hasStreets: streetCount > 0
    });
    
  } catch (error) {
    console.error("Blad API simc:", error);
    return NextResponse.json({ error: "Blad serwera" }, { status: 500 });
  }
}
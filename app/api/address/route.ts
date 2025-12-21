import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const simc = req.nextUrl.searchParams.get('simc');
    const query = req.nextUrl.searchParams.get('query');
    
    if (!simc || !query) {
      return NextResponse.json({ error: "Brak parametrow" }, { status: 400 });
    }

    const streets = await prisma.polska.findMany({
      where: {
        simc,
        ulica: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id_ulicy: true,
        ulica: true
      },
      distinct: ['id_ulicy'],
      take: 20
    });

    return NextResponse.json({ streets });
    
  } catch (error) {
    console.error("Blad API streets:", error);
    return NextResponse.json({ error: "Blad serwera" }, { status: 500 });
  }
}
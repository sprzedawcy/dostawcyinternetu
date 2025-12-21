import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const simc = req.nextUrl.searchParams.get('simc');
    const id_ulicy = req.nextUrl.searchParams.get('id_ulicy') || '00000';
    const query = req.nextUrl.searchParams.get('query');
    
    if (!simc || !query) {
      return NextResponse.json({ error: "Brak parametrow" }, { status: 400 });
    }

    const numbers = await prisma.polska.findMany({
      where: {
        simc,
        id_ulicy,
        nr: {
          startsWith: query
        }
      },
      select: {
        id: true,
        nr: true
      },
      take: 50,
      orderBy: { nr: 'asc' }
    });

    return NextResponse.json({ numbers });
    
  } catch (error) {
    console.error("Blad API numbers:", error);
    return NextResponse.json({ error: "Blad serwera" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const kontakt = await prisma.leadKontakt.create({
      data: {
        lead_id: parseInt(id),
        uwagi: body.uwagi
      }
    });
    
    // Automatycznie zmień status na "kontakt" jeśli był "nowy"
    await prisma.lead.updateMany({
      where: { id: parseInt(id), status: 'nowy' },
      data: { status: 'kontakt' }
    });
    
    return NextResponse.json({ success: true, kontakt });
  } catch (error) {
    console.error("Błąd dodawania kontaktu:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

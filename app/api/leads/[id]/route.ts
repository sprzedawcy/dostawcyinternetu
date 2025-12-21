import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: {
        status: body.status,
        notatki: body.notatki,
        data_kontaktu_plan: body.data_kontaktu_plan ? new Date(body.data_kontaktu_plan) : null,
        data_umowiony: body.data_umowiony ? new Date(body.data_umowiony) : null,
        data_instalacji: body.data_instalacji ? new Date(body.data_instalacji) : null,
        miesiac_rozliczenia: body.miesiac_rozliczenia,
        spad_powod: body.spad_powod
      }
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Blad aktualizacji leada:", error);
    return NextResponse.json({ error: "Blad serwera" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { opinionId, action } = await request.json();

    if (!opinionId || !action) {
      return NextResponse.json({ error: "Brak danych" }, { status: 400 });
    }

    switch (action) {
      case 'approve':
        await prisma.opinia.update({
          where: { id: opinionId },
          data: { widoczna: true, zatwierdzil: 'admin' }
        });
        break;

      case 'reject':
        await prisma.opinia.update({
          where: { id: opinionId },
          data: { widoczna: false, zatwierdzil: null }
        });
        break;

      case 'delete':
        await prisma.opinia.delete({
          where: { id: opinionId }
        });
        break;

      default:
        return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

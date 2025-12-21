import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { autor, email, ocena, tytul, tresc, operator_id, oferta_id } = body;

    if (!autor || !tresc || !ocena) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    if (ocena < 1 || ocena > 5) {
      return NextResponse.json({ error: "Ocena musi być 1-5" }, { status: 400 });
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "";

    const opinia = await prisma.opinia.create({
      data: {
        autor,
        email: email || null,
        ocena,
        tytul: tytul || null,
        tresc,
        operator_id: operator_id || null,
        oferta_id: oferta_id || null,
        widoczna: false,
        ip_address: ip,
        user_agent: userAgent
      }
    });

    return NextResponse.json({ success: true, id: opinia.id });
  } catch (error) {
    console.error("Błąd zapisywania opinii:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

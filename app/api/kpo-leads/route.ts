import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Sanityzacja inputu
function sanitize(input: string): string {
  return input
    .replace(/[<>'"`;{}[\]\\]/g, '')
    .trim()
    .slice(0, 500);
}

// Walidacja telefonu (polski format)
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-]/g, '');
  return /^(\+48)?[0-9]{9}$/.test(cleaned);
}

// Walidacja email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      miejscowosc, ulica, nr, simc, id_ulicy,
      imie, telefon, email, uwagi 
    } = body;

    // Walidacja wymaganych pól
    if (!miejscowosc || !imie || !telefon) {
      return NextResponse.json(
        { error: "Wszystkie pola są wymagane: miejscowość, imię, telefon" },
        { status: 400 }
      );
    }

    // Walidacja telefonu
    if (!isValidPhone(telefon)) {
      return NextResponse.json(
        { error: "Nieprawidłowy format telefonu" },
        { status: 400 }
      );
    }

    // Walidacja email (jeśli podany)
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Nieprawidłowy format email" },
        { status: 400 }
      );
    }

    // Pobierz IP i User Agent
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Zapisz do bazy
    const lead = await prisma.kpoLead.create({
      data: {
        miejscowosc: sanitize(miejscowosc),
        ulica: ulica ? sanitize(ulica) : null,
        nr: nr ? sanitize(nr) : null,
        simc: simc ? sanitize(simc) : null,
        id_ulicy: id_ulicy ? sanitize(id_ulicy) : null,
        imie: sanitize(imie),
        telefon: sanitize(telefon),
        email: email ? sanitize(email) : null,
        uwagi: uwagi ? sanitize(uwagi) : null,
        ip_address: ip,
        user_agent: userAgent.slice(0, 500),
      }
    });

    return NextResponse.json({ 
      success: true, 
      id: lead.id,
      message: "Dziękujemy! Skontaktujemy się wkrótce."
    });

  } catch (error) {
    console.error("KPO Lead error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd. Spróbuj ponownie." },
      { status: 500 }
    );
  }
}

// GET - lista zgłoszeń (dla admina)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = status ? { status } : {};

    const [leads, total] = await Promise.all([
      prisma.kpoLead.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kpoLead.count({ where })
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("KPO Leads GET error:", error);
    return NextResponse.json(
      { error: "Błąd pobierania danych" },
      { status: 500 }
    );
  }
}

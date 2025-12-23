import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "8");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const miejscowosci = await prisma.miejscowosc.findMany({
      where: {
        nazwa: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        nazwa: true,
        slug: true,
        wojewodztwo: true,
        powiat: true,
      },
      orderBy: [
        // Priorytet dla dokładnych dopasowań na początku
        { nazwa: "asc" },
      ],
      take: limit,
    });

    return NextResponse.json(miejscowosci);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

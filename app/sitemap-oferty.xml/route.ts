// app/sitemap-oferty.xml/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dostawcyinternetu.pl";

export async function GET() {
  const oferty = await prisma.oferta.findMany({
    where: { aktywna: true },
    select: {
      slug: true,
      updated_at: true,
      operator: { select: { slug: true } }
    },
    orderBy: { updated_at: "desc" },
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${oferty.map(oferta => `  <url>
    <loc>${BASE_URL}/oferty/${oferta.operator?.slug || 'operator'}/${oferta.slug}</loc>
    <lastmod>${oferta.updated_at?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
    },
  });
}

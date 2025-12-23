// app/sitemap-miejscowosci.xml/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dostawcyinternetu.pl";
const MAX_URLS_PER_SITEMAP = 45000; // Google limit: 50k

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * MAX_URLS_PER_SITEMAP;

  // Zlicz wszystkie miejscowości
  const total = await prisma.miejscowosci_seo.count();
  const totalPages = Math.ceil(total / MAX_URLS_PER_SITEMAP);

  // Jeśli to request bez page i mamy więcej niż 1 stronę - zwróć sitemap index
  if (!searchParams.has("page") && totalPages > 1) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: totalPages }, (_, i) => `  <sitemap>
    <loc>${BASE_URL}/sitemap-miejscowosci.xml?page=${i + 1}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    });
  }

  // Pobierz miejscowości dla tej strony
  const miejscowosci = await prisma.miejscowosci_seo.findMany({
    select: {
      slug: true,
      wojewodztwo: true,
    },
    orderBy: { slug: "asc" },
    take: MAX_URLS_PER_SITEMAP,
    skip: offset,
  });

  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${miejscowosci.map(m => `  <url>
    <loc>${BASE_URL}/internet/${m.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
    },
  });
}

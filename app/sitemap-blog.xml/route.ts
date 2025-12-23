// app/sitemap-blog.xml/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dostawcyinternetu.pl";

export async function GET() {
  // Pobierz kategorie
  const kategorie = await prisma.kategoriaBlogu.findMany({
    select: { slug: true },
    orderBy: { kolejnosc: "asc" },
  });

  // Pobierz opublikowane artykuły
  const artykuly = await prisma.artykul.findMany({
    where: { opublikowany: true },
    select: {
      slug: true,
      updated_at: true,
      data_publikacji: true,
      kategoria: { select: { slug: true } },
    },
    orderBy: { data_publikacji: "desc" },
  });

  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${kategorie.map(kat => `  <url>
    <loc>${BASE_URL}/blog/${kat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${artykuly.map(art => `  <url>
    <loc>${BASE_URL}/blog/${art.kategoria?.slug || 'wiedza'}/${art.slug}</loc>
    <lastmod>${(art.updated_at || art.data_publikacji)?.toISOString().split('T')[0] || today}</lastmod>
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

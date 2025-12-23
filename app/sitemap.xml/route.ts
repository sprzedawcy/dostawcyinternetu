// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dostawcyinternetu.pl";

export async function GET() {
  const sitemaps = [
    "sitemap-oferty.xml",
    "sitemap-operatorzy.xml", 
    "sitemap-miejscowosci.xml",
    "sitemap-blog.xml",
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${BASE_URL}/${sitemap}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200", // 24h cache
    },
  });
}

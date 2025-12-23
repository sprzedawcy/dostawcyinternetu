// app/sitemap-operatorzy.xml/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dostawcyinternetu.pl";

export async function GET() {
  const operatorzy = await prisma.operator.findMany({
    where: { aktywny: true },
    select: {
      slug: true,
      updated_at: true,
    },
    orderBy: { nazwa: "asc" },
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/dostawcy-internetu</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${operatorzy.map(op => `  <url>
    <loc>${BASE_URL}/dostawcy-internetu/${op.slug}</loc>
    <lastmod>${op.updated_at?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
    },
  });
}

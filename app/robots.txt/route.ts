// app/robots.txt/route.ts
import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dostawcyinternetu.pl";

export async function GET() {
  const robots = `# robots.txt for ${BASE_URL}
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-oferty.xml
Sitemap: ${BASE_URL}/sitemap-operatorzy.xml
Sitemap: ${BASE_URL}/sitemap-miejscowosci.xml
Sitemap: ${BASE_URL}/sitemap-blog.xml

# Blokuj panel admina
Disallow: /admin/
Disallow: /api/
Disallow: /login

# Blokuj duplikaty
Disallow: /*?*
Allow: /internet/*?*

# Crawl delay (opcjonalnie)
Crawl-delay: 1
`;

  return new NextResponse(robots, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

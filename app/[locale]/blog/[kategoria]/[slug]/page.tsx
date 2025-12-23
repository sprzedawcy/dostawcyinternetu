// app/[locale]/blog/[kategoria]/[slug]/page.tsx
// Strona artykułu - POBIERA SEO z bazy, nie generuje!

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getMetadata, getSEO, getJsonLdScripts, JsonLdScripts } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string; kategoria: string; slug: string }>;
}

// =====================================================
// METADATA - pobiera z bazy, fallback na dane artykułu
// =====================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategoria, slug } = await params;
  const urlPath = `/blog/${kategoria}/${slug}`;
  
  // Pobierz SEO z bazy
  const seoMetadata = await getMetadata(urlPath);
  
  // Jeśli jest SEO w bazie - użyj go
  if (seoMetadata && Object.keys(seoMetadata).length > 0) {
    return seoMetadata;
  }
  
  // Fallback - podstawowe dane z artykułu
  const artykul = await prisma.artykul.findFirst({
    where: { slug, kategoria: { slug: kategoria } }
  });
  
  if (!artykul) return {};
  
  return {
    title: artykul.tytul,
    description: artykul.zajawka?.slice(0, 155),
  };
}

// =====================================================
// STRONA
// =====================================================

export default async function ArtykulPage({ params }: Props) {
  const { locale, kategoria, slug } = await params;
  const urlPath = `/blog/${kategoria}/${slug}`;
  
  // Pobierz artykuł
  const artykul = await prisma.artykul.findFirst({
    where: { 
      slug, 
      kategoria: { slug: kategoria },
      opublikowany: true,
      OR: [
        { data_publikacji: { lte: new Date() } },
        { data_publikacji: null }
      ]
    },
    include: { kategoria: true }
  });
  
  if (!artykul) notFound();
  
  // Pobierz SEO z bazy (jeśli wygenerowane przez admina)
  const seo = await getSEO(urlPath);
  const jsonLdSchemas = seo ? getJsonLdScripts(seo) : [];
  
  // Pobierz podobne artykuły
  const podobne = await prisma.artykul.findMany({
    where: {
      kategoria_id: artykul.kategoria_id,
      id: { not: artykul.id },
      opublikowany: true
    },
    take: 3,
    orderBy: { data_publikacji: 'desc' }
  });
  
  const dataPublikacji = artykul.data_publikacji 
    ? new Date(artykul.data_publikacji).toLocaleDateString('pl-PL')
    : null;
  
  // Breadcrumbs - z bazy SEO lub domyślne
  const breadcrumbs = seo?.breadcrumbs?.length ? seo.breadcrumbs : [
    { name: 'Blog', url: '/blog', position: 1 },
    { name: artykul.kategoria?.nazwa || 'Kategoria', url: `/blog/${kategoria}`, position: 2 },
    { name: artykul.tytul, url: urlPath, position: 3 }
  ];
  
  // FAQ - z bazy SEO (jeśli wygenerowane)
  const faqItems = seo?.faq || [];
  
  return (
    <>
      {/* JSON-LD z bazy SEO */}
      {jsonLdSchemas.length > 0 && <JsonLdScripts schemas={jsonLdSchemas} />}
      
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              {breadcrumbs.map((item: any, i: number) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span>›</span>}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="text-gray-900 truncate max-w-[200px]">{item.name}</span>
                  ) : (
                    <Link href={item.url} className="hover:text-blue-600">{item.name}</Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
        
        <article className="max-w-4xl mx-auto px-4 py-8">
          {/* Obrazek */}
          {artykul.thumbnail_url && (
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8">
              <img 
                src={artykul.thumbnail_url} 
                alt={artykul.tytul}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {artykul.kategoria && (
              <Link 
                href={`/${locale}/blog?kategoria=${artykul.kategoria.slug}`}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100"
              >
                {artykul.kategoria.nazwa}
              </Link>
            )}
            {dataPublikacji && (
              <time className="text-sm text-gray-500">{dataPublikacji}</time>
            )}
            {artykul.autor && (
              <span className="text-sm text-gray-500">• {artykul.autor}</span>
            )}
          </div>
          
          {/* Tytuł */}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            {artykul.tytul}
          </h1>
          
          {/* Zajawka */}
          {artykul.zajawka && (
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {artykul.zajawka}
            </p>
          )}
          
          {/* Treść */}
          <div 
            className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-blue-600 prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: artykul.tresc || '' }}
          />
          
          {/* FAQ - tylko jeśli wygenerowane przez AI */}
          {faqItems.length > 0 && (
            <section className="mt-12 bg-blue-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Najczęściej zadawane pytania
              </h2>
              <div className="space-y-4">
                {faqItems.map((faq: any, i: number) => (
                  <details key={i} className="bg-white rounded-lg p-4 shadow-sm">
                    <summary className="font-semibold cursor-pointer hover:text-blue-600">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-gray-600 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </article>
        
        {/* Podobne artykuły */}
        {podobne.length > 0 && (
          <section className="bg-white border-t">
            <div className="max-w-4xl mx-auto px-4 py-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Podobne artykuły</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {podobne.map(art => (
                  <Link 
                    key={art.id} 
                    href={`/${locale}/blog/${kategoria}/${art.slug}`} 
                    className="group"
                  >
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                      {art.thumbnail_url && (
                        <img 
                          src={art.thumbnail_url} 
                          alt={art.tytul}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                      {art.tytul}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

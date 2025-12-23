import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import OffersList from "./OffersList";

interface Props {
  slug: string;
  locale: string;
}

interface MiejscowoscSeo {
  nazwa: string;
  slug: string;
  simc_count: number;
  h1: string | null;
  meta_title: string | null;
  meta_description: string | null;
  opis_krotki: string | null;
  article_text: string | null;
  keywords: string[] | null;
  operatorzy: string[] | null;
  operatorow_db: number | null;
  mieszkan_hp: number | null;
  budynkow: number | null;
  ulic: number | null;
  faq: any | null;
  breadcrumbs: any | null;
  blog_tags: any | null;
  powiat: string | null;
  wojewodztwo: string | null;
}

export default async function MiejscowoscPage({ slug, locale }: Props) {
  const slugDecoded = decodeURIComponent(slug);
  
  // Pobierz dane SEO z tabeli miejscowosci_seo
  const seoResults = await prisma.$queryRaw<MiejscowoscSeo[]>`
    SELECT 
      nazwa, slug, simc_count,
      h1, meta_title, meta_description,
      opis_krotki, article_text, keywords,
      operatorzy, operatorow_db,
      mieszkan_hp, budynkow, ulic,
      faq, breadcrumbs, blog_tags,
      powiat, wojewodztwo
    FROM miejscowosci_seo 
    WHERE slug = ${slugDecoded}
    LIMIT 1
  `;

  const seoData = seoResults[0];

  if (!seoData) {
    notFound();
  }

  // Pobierz simc z tabeli polska
  const miejscowoscData = await prisma.polska.findFirst({
    where: { slug: slugDecoded },
    select: { simc: true }
  });

  const simc = miejscowoscData?.simc || '';

  // Pobierz operatorów z zasięgiem
  const coverages = await prisma.operatorCoverage.findMany({
    where: { simc },
    select: { operator_id: true },
    distinct: ['operator_id']
  });

  const operatorIds = coverages.map(c => c.operator_id);

  // Pobierz oferty: kablowe od operatorów z zasięgiem + wszystkie mobilne
  const offers = await prisma.oferta.findMany({
    where: {
      aktywna: true,
      OR: [
        { typ_polaczenia: 'komorkowe' },
        { 
          typ_polaczenia: 'kablowe',
          operator_id: { in: operatorIds.length > 0 ? operatorIds : [-1] }
        }
      ]
    },
    include: {
      operator: {
        select: { id: true, nazwa: true, slug: true, logo_url: true }
      }
    },
    orderBy: [
      { wyrozoniona: 'desc' },
      { lokalna: 'desc' },
      { priorytet: 'desc' }
    ]
  });

  const operators = [...new Map(offers.map(o => [o.operator.id, o.operator])).values()];
  const serializedOffers = JSON.parse(JSON.stringify(offers));

  return (
    <div className="bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Strona główna</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{seoData.nazwa}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero section z SEO */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-4">
            {seoData.h1 || `Internet ${seoData.nazwa}`}
          </h1>
          
          {/* Intro text z tabeli lub fallback */}
          {seoData.opis_krotki ? (
            <p className="text-gray-800 text-lg leading-relaxed">
              {seoData.opis_krotki}
            </p>
          ) : (
            <p className="text-gray-800 text-lg leading-relaxed">
              Porównaj {offers.length} ofert internetu w {seoData.nazwa}. Sprawdź dostępność i ceny.
            </p>
          )}

          {/* Info o konieczności weryfikacji */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Wybierz ofertę i podaj dokładny adres, aby sprawdzić dostępność
          </div>
        </div>

        {/* Lista ofert z modalem */}
        <OffersList 
          offers={serializedOffers} 
          operators={operators}
          miejscowosc={seoData.nazwa}
          miejscowoscSlug={slugDecoded}
          simc={simc}
          level="miasto"
        />

        {/* Artykuł SEO pod ofertami */}
        {seoData.article_text && (
          <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
            <div 
              className="[&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mb-4 [&>p]:text-gray-900 [&>p]:leading-relaxed [&>p]:mb-4"
              dangerouslySetInnerHTML={{ __html: seoData.article_text }}
            />
          </div>
        )}

        {/* FAQ w stylu cytatów */}
        {seoData.faq && Array.isArray(seoData.faq) && seoData.faq.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Często zadawane pytania - Internet {seoData.nazwa}
            </h2>
            <div className="space-y-6">
              {seoData.faq.map((item: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p className="font-semibold text-gray-900 mb-2">
                    „{item.question || item.pytanie}"
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {item.answer || item.odpowiedz}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Powiązane artykuły (blog_tags) */}
        {seoData.blog_tags && Array.isArray(seoData.blog_tags) && seoData.blog_tags.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Artykuły o internecie w {seoData.nazwa}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seoData.blog_tags.map((article: any, index: number) => (
                <Link 
                  key={index}
                  href={article.url || `/blog/${article.slug}`}
                  className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{article.title || article.tytul}</h3>
                  {article.excerpt && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
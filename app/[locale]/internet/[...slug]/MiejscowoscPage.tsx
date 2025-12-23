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

  const miejscowoscData = await prisma.polska.findFirst({
    where: { slug: slugDecoded },
    select: { simc: true }
  });

  const simc = miejscowoscData?.simc || '';

  const coverages = await prisma.operatorCoverage.findMany({
    where: { simc },
    select: { operator_id: true },
    distinct: ['operator_id']
  });

  const operatorIds = coverages.map(c => c.operator_id);

  const offers = await prisma.oferta.findMany({
    where: {
      aktywna: true,
      OR: [
        { typ_polaczenia: 'komorkowe' },
        { typ_polaczenia: 'kablowe', operator_id: { in: operatorIds.length > 0 ? operatorIds : [-1] } }
      ]
    },
    include: { operator: { select: { id: true, nazwa: true, slug: true, logo_url: true } } },
    orderBy: [{ wyrozoniona: 'desc' }, { lokalna: 'desc' }, { priorytet: 'desc' }]
  });

  const operators = [...new Map(offers.map(o => [o.operator.id, o.operator])).values()];
  const serializedOffers = JSON.parse(JSON.stringify(offers));

  return (
    <div className="page-wrapper">
      {/* Breadcrumbs */}
      <div className="breadcrumbs-wrapper">
        <div className="container">
          <nav className="breadcrumbs">
            <Link href="/" className="breadcrumbs__link">Strona główna</Link>
            <span className="breadcrumbs__separator">/</span>
            <span className="breadcrumbs__current">{seoData.nazwa}</span>
          </nav>
        </div>
      </div>

      <div className="container section">
        {/* Hero section */}
        <div className="page-hero">
          <h1 className="page-hero__title">
            {seoData.h1 || `Internet ${seoData.nazwa}`}
          </h1>
          
          {seoData.opis_krotki ? (
            <p className="page-hero__description">{seoData.opis_krotki}</p>
          ) : (
            <p className="page-hero__description">
              Porównaj {offers.length} ofert internetu w {seoData.nazwa}. Sprawdź dostępność i ceny.
            </p>
          )}

          <span className="status-badge status-badge--info">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Wybierz ofertę i podaj dokładny adres, aby sprawdzić dostępność
          </span>
        </div>

        {/* Lista ofert */}
        <OffersList 
          offers={serializedOffers} 
          operators={operators}
          miejscowosc={seoData.nazwa}
          miejscowoscSlug={slugDecoded}
          simc={simc}
          level="miasto"
        />

        {/* Artykuł SEO */}
        {seoData.article_text && (
          <div className="content-box">
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: seoData.article_text }}
            />
          </div>
        )}

        {/* FAQ */}
        {seoData.faq && Array.isArray(seoData.faq) && seoData.faq.length > 0 && (
          <div className="content-box">
            <h2 className="content-box__title">
              Często zadawane pytania - Internet {seoData.nazwa}
            </h2>
            <div className="faq-list">
              {seoData.faq.map((item: any, index: number) => (
                <div key={index} className="faq-item">
                  <p className="faq-item__question">
                    „{item.question || item.pytanie}"
                  </p>
                  <p className="faq-item__answer">
                    {item.answer || item.odpowiedz}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Powiązane artykuły */}
        {seoData.blog_tags && Array.isArray(seoData.blog_tags) && seoData.blog_tags.length > 0 && (
          <div className="content-box">
            <h2 className="content-box__title">
              Artykuły o internecie w {seoData.nazwa}
            </h2>
            <div className="article-grid">
              {seoData.blog_tags.map((article: any, index: number) => (
                <Link 
                  key={index}
                  href={article.url || `/blog/${article.slug}`}
                  className="article-card"
                >
                  <h3 className="article-card__title">{article.title || article.tytul}</h3>
                  {article.excerpt && (
                    <p className="article-card__excerpt">{article.excerpt}</p>
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
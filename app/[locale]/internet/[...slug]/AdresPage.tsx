import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import OffersList from "./OffersList";

interface Props {
  miejscowoscSlug: string;
  ulicaSlug: string;
  numer: string;
  locale: string;
}

function formatUlicaNazwa(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function sanitizeNumer(nr: string): string {
  return nr.replace(/[<>'"`;(){}[\]\\]/g, '').trim().slice(0, 20);
}

export default async function AdresPage({ miejscowoscSlug, ulicaSlug, numer, locale }: Props) {
  const numerSafe = sanitizeNumer(decodeURIComponent(numer));
  
  const miejscowoscData = await prisma.polska.findFirst({
    where: { slug: miejscowoscSlug },
    select: { miejscowosc: true, simc: true, slug: true }
  });

  if (!miejscowoscData) {
    notFound();
  }

  const ulicaNazwa = formatUlicaNazwa(ulicaSlug);
  const pelnyAdres = `${ulicaNazwa} ${numerSafe}, ${miejscowoscData.miejscowosc}`;

  // Znajdź adres w bazie (opcjonalnie - może nie istnieć)
  const adresData = await prisma.polska.findFirst({
    where: {
      simc: miejscowoscData.simc,
      ulica: { contains: ulicaNazwa, mode: 'insensitive' },
      nr: numerSafe
    },
    select: { teryt: true, miejscowosc: true, ulica: true, nr: true, simc: true, id_ulicy: true }
  });

  // Sprawdź coverage kablowy (jeśli adres istnieje w bazie)
  let operatorzyKablowi: number[] = [];
  
  if (adresData) {
    const coverage = await prisma.operatorCoverage.findMany({
      where: { simc: adresData.simc, id_ulicy: adresData.id_ulicy, nr: adresData.nr },
      select: { operator_id: true, hp_count: true }
    });
    operatorzyKablowi = coverage.filter(c => c.hp_count > 0).map(c => c.operator_id);
  }

  const maKablowy = operatorzyKablowi.length > 0;

  // Pobierz oferty: ZAWSZE mobilne + kablowe jeśli są w coverage
  const offers = await prisma.oferta.findMany({
    where: {
      aktywna: true,
      OR: [
        { typ_polaczenia: 'komorkowe' },
        ...(maKablowy ? [{ typ_polaczenia: 'kablowe', operator_id: { in: operatorzyKablowi } }] : [])
      ]
    },
    include: { operator: { select: { id: true, nazwa: true, slug: true, logo_url: true } } },
    orderBy: [{ wyrozoniona: 'desc' }, { lokalna: 'desc' }, { priorytet: 'desc' }, { abonament: 'asc' }]
  });

  const operators = [...new Map(offers.map(o => [o.operator.id, o.operator])).values()];
  const serializedOffers = JSON.parse(JSON.stringify(offers));
  
  const ofertyKablowe = offers.filter(o => o.typ_polaczenia === 'kablowe').length;
  const ofertyMobilne = offers.filter(o => o.typ_polaczenia === 'komorkowe').length;

  return (
    <div className="page-wrapper">
      {/* Breadcrumbs */}
      <div className="breadcrumbs-wrapper">
        <div className="container">
          <nav className="breadcrumbs">
            <Link href="/" className="breadcrumbs__link">Strona główna</Link>
            <span className="breadcrumbs__separator">/</span>
            <Link href={`/internet/${miejscowoscSlug}`} className="breadcrumbs__link">
              {miejscowoscData.miejscowosc}
            </Link>
            <span className="breadcrumbs__separator">/</span>
            <Link href={`/internet/${miejscowoscSlug}/${ulicaSlug}`} className="breadcrumbs__link">
              {ulicaNazwa}
            </Link>
            <span className="breadcrumbs__separator">/</span>
            <span className="breadcrumbs__current">{numerSafe}</span>
          </nav>
        </div>
      </div>

      <div className="container section">
        {/* Hero */}
        <div className="page-hero">
          <div className="page-hero__header">
            <h1 className="page-hero__title">Internet: {pelnyAdres}</h1>
            
            {maKablowy ? (
              <span className="status-badge status-badge--success">
                <span className="status-badge__dot"></span>
                {operatorzyKablowi.length} operatorów kablowych
              </span>
            ) : (
              <span className="status-badge status-badge--info">
                <span className="status-badge__dot"></span>
                {ofertyMobilne} ofert mobilnych (LTE/5G)
              </span>
            )}
          </div>
          
          <p className="page-hero__description">
            {maKablowy 
              ? `Znaleźliśmy ${ofertyKablowe} ofert internetu kablowego oraz ${ofertyMobilne} ofert mobilnych dostępnych pod tym adresem.`
              : `Pod tym adresem dostępny jest internet mobilny (LTE/5G) - ${ofertyMobilne} ofert. Sprawdź poniżej lub zadzwoń, aby dowiedzieć się o planach rozbudowy sieci kablowej.`
            }
          </p>
        </div>

        {/* Info o braku kablowego - ale NIE blokujące */}
        {!maKablowy && (
          <div className="alert alert--info">
            <div className="alert__icon">📡</div>
            <div className="alert__content">
              <h2 className="alert__title">Internet mobilny (LTE/5G)</h2>
              <p className="alert__text">
                Pod adresem {pelnyAdres} rekomendujemy internet mobilny. 
                Jeśli interesuje Cię internet kablowy, zadzwoń - sprawdzimy plany rozbudowy sieci.
              </p>
              <a href="tel:+48532274808" className="btn btn-primary">
                📞 Zadzwoń: 532 274 808
              </a>
            </div>
          </div>
        )}

        {/* Lista ofert - ZAWSZE pokazuj */}
        <OffersList 
          offers={serializedOffers} 
          operators={operators}
          miejscowosc={miejscowoscData.miejscowosc}
          miejscowoscSlug={miejscowoscSlug}
          simc={miejscowoscData.simc}
          level="adres"
          ulicaData={{
            ulica: adresData?.ulica || ulicaNazwa,
            ulicaSlug: ulicaSlug,
            id_ulicy: adresData?.id_ulicy || '00000'
          }}
          numerBudynku={numerSafe}
        />

        {/* Linki nawigacyjne */}
        <div className="page-links">
          <Link href={`/internet/${miejscowoscSlug}/${ulicaSlug}`} className="link">
            ← Zmień numer budynku
          </Link>
          <span className="page-links__separator">|</span>
          <Link href={`/internet/${miejscowoscSlug}`} className="link">
            Zmień adres
          </Link>
        </div>
      </div>
    </div>
  );
}
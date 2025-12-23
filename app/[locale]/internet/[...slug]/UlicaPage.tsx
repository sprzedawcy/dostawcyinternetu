import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import OffersList from "./OffersList";

interface Props {
  miejscowoscSlug: string;
  ulicaSlug: string;
  locale: string;
}

function formatUlicaNazwa(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function UlicaPage({ miejscowoscSlug, ulicaSlug, locale }: Props) {
  const miejscowoscData = await prisma.polska.findFirst({
    where: { slug: miejscowoscSlug },
    select: { miejscowosc: true, simc: true, slug: true }
  });

  if (!miejscowoscData) {
    notFound();
  }

  const ulicaNazwa = formatUlicaNazwa(ulicaSlug);

  const ulicaData = await prisma.polska.findFirst({
    where: {
      simc: miejscowoscData.simc,
      ulica: { contains: ulicaNazwa, mode: 'insensitive' }
    },
    select: { id_ulicy: true, ulica: true }
  });

  const operatorzyZZasiegiem = await prisma.operatorCoverage.findMany({
    where: { simc: miejscowoscData.simc, id_ulicy: ulicaData?.id_ulicy || '00000' },
    select: { operator_id: true },
    distinct: ['operator_id']
  });

  const operatorIds = operatorzyZZasiegiem.map(o => o.operator_id);

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
            <span className="breadcrumbs__current">{ulicaNazwa}</span>
          </nav>
        </div>
      </div>

      <div className="container section">
        {/* Hero section */}
        <div className="page-hero">
          <h1 className="page-hero__title">
            Internet {ulicaNazwa}, {miejscowoscData.miejscowosc}
          </h1>
          
          {operatorIds.length > 0 ? (
            <p className="page-hero__description">
              Znaleźliśmy {ofertyKablowe} ofert internetu kablowego dostępnych pod adresem {ulicaNazwa}, {miejscowoscData.miejscowosc}. 
              {ofertyMobilne > 0 && ` Dodatkowo ${ofertyMobilne} ofert internetu mobilnego.`}
              {' '}Wybierz ofertę i podaj numer budynku, aby sprawdzić dokładną dostępność.
            </p>
          ) : (
            <p className="page-hero__description">
              Sprawdź oferty internetu - {ulicaNazwa}, {miejscowoscData.miejscowosc}. 
              Wybierz ofertę i podaj dokładny adres, aby zweryfikować dostępność.
            </p>
          )}

          {operatorIds.length > 0 && (
            <span className="status-badge status-badge--success">
              <span className="status-badge__dot"></span>
              {operatorIds.length} operatorów z potwierdzonym zasięgiem
            </span>
          )}
        </div>

        {/* Lista ofert */}
        <OffersList 
          offers={serializedOffers} 
          operators={operators}
          miejscowosc={miejscowoscData.miejscowosc}
          miejscowoscSlug={miejscowoscSlug}
          simc={miejscowoscData.simc}
          level="ulica"
          ulicaData={{
            ulica: ulicaData?.ulica || ulicaNazwa,
            ulicaSlug: ulicaSlug,
            id_ulicy: ulicaData?.id_ulicy || '00000'
          }}
        />

        {/* Artykuł SEO */}
        <div className="content-box">
          <h2 className="content-box__title">
            Internet {ulicaNazwa}, {miejscowoscData.miejscowosc}
          </h2>
          <p className="content-box__text">
            {ulicaNazwa}, {miejscowoscData.miejscowosc} - ulica z dostępem do internetu 
            {operatorIds.length > 0 
              ? ` od ${operatorIds.length} operatorów kablowych. ` 
              : '. '}
            Aby sprawdzić dokładną dostępność usług pod Twoim adresem, wybierz interesującą Cię ofertę 
            i podaj numer budynku.
          </p>
          <p className="content-box__text">
            Oferty internetu mobilnego (LTE, 5G) są dostępne niezależnie od adresu 
            i mogą stanowić alternatywę przy braku zasięgu operatorów kablowych.
          </p>
        </div>
      </div>
    </div>
  );
}
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
  // 1. Pobierz dane miejscowości
  const miejscowoscData = await prisma.polska.findFirst({
    where: { slug: miejscowoscSlug },
    select: {
      miejscowosc: true,
      simc: true,
      slug: true
    }
  });

  if (!miejscowoscData) {
    notFound();
  }

  const ulicaNazwa = formatUlicaNazwa(ulicaSlug);

  // 2. Znajdź ulicę - pobierz id_ulicy
  const ulicaData = await prisma.polska.findFirst({
    where: {
      simc: miejscowoscData.simc,
      ulica: {
        contains: ulicaNazwa,
        mode: 'insensitive'
      }
    },
    select: {
      id_ulicy: true,
      ulica: true
    }
  });

  // 3. Pobierz operatorów z zasięgiem na tej ulicy
  const operatorzyZZasiegiem = await prisma.operatorCoverage.findMany({
    where: {
      simc: miejscowoscData.simc,
      id_ulicy: ulicaData?.id_ulicy || '00000'
    },
    select: {
      operator_id: true
    },
    distinct: ['operator_id']
  });

  const operatorIds = operatorzyZZasiegiem.map(o => o.operator_id);

  // 4. Pobierz oferty - kablowe od operatorów z zasięgiem + wszystkie komórkowe
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

  // Policz oferty kablowe vs mobilne
  const ofertyKablowe = offers.filter(o => o.typ_polaczenia === 'kablowe').length;
  const ofertyMobilne = offers.filter(o => o.typ_polaczenia === 'komorkowe').length;

  return (
    <div className="bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Strona główna</Link>
            <span className="text-gray-400">/</span>
            <Link href={`/internet/${miejscowoscSlug}`} className="hover:text-blue-600">
              {miejscowoscData.miejscowosc}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{ulicaNazwa}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-4">
            Internet {ulicaNazwa}, {miejscowoscData.miejscowosc}
          </h1>
          
          {/* Intro text */}
          {operatorIds.length > 0 ? (
            <p className="text-gray-800 text-lg leading-relaxed">
              Znaleźliśmy {ofertyKablowe} ofert internetu kablowego dostępnych pod adresem {ulicaNazwa}, {miejscowoscData.miejscowosc}. 
              {ofertyMobilne > 0 && ` Dodatkowo ${ofertyMobilne} ofert internetu mobilnego.`}
              {' '}Wybierz ofertę i podaj numer budynku, aby sprawdzić dokładną dostępność.
            </p>
          ) : (
            <p className="text-gray-800 text-lg leading-relaxed">
              Sprawdź oferty internetu - {ulicaNazwa}, {miejscowoscData.miejscowosc}. 
              Wybierz ofertę i podaj dokładny adres, aby zweryfikować dostępność.
            </p>
          )}

          {/* Info o weryfikacji */}
          {operatorIds.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {operatorIds.length} operatorów z potwierdzonym zasięgiem
            </div>
          )}
        </div>

        {/* Lista ofert z modalem - level='ulica' */}
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
        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Internet {ulicaNazwa}, {miejscowoscData.miejscowosc}
          </h2>
          <p className="text-gray-900 leading-relaxed mb-4">
            {ulicaNazwa}, {miejscowoscData.miejscowosc} - ulica z dostępem do internetu 
            {operatorIds.length > 0 
              ? ` od ${operatorIds.length} operatorów kablowych. ` 
              : '. '}
            Aby sprawdzić dokładną dostępność usług pod Twoim adresem, wybierz interesującą Cię ofertę 
            i podaj numer budynku.
          </p>
          <p className="text-gray-900 leading-relaxed">
            Oferty internetu mobilnego (LTE, 5G) są dostępne niezależnie od adresu 
            i mogą stanowić alternatywę przy braku zasięgu operatorów kablowych.
          </p>
        </div>
      </div>
    </div>
  );
}
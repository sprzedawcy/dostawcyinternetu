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

// Sanityzacja numeru budynku
function sanitizeNumer(nr: string): string {
  return nr.replace(/[<>'"`;(){}[\]\\]/g, '').trim().slice(0, 20);
}

export default async function AdresPage({ miejscowoscSlug, ulicaSlug, numer, locale }: Props) {
  const numerSafe = sanitizeNumer(decodeURIComponent(numer));
  
  // Pobierz dane miejscowości
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
  const pelnyAdres = `${ulicaNazwa} ${numerSafe}, ${miejscowoscData.miejscowosc}`;

  // Znajdź dokładny adres w bazie
  const adresData = await prisma.polska.findFirst({
    where: {
      simc: miejscowoscData.simc,
      ulica: {
        contains: ulicaNazwa,
        mode: 'insensitive'
      },
      nr: numerSafe
    },
    select: {
      teryt: true,
      miejscowosc: true,
      ulica: true,
      nr: true,
      simc: true,
      id_ulicy: true
    }
  });

  const adresIstnieje = !!adresData;

  // Znajdź operatorów z zasięgiem pod tym adresem
  let operatorzyZZasiegiem: number[] = [];
  
  if (adresData) {
    const coverage = await prisma.operatorCoverage.findMany({
      where: {
        simc: adresData.simc,
        id_ulicy: adresData.id_ulicy,
        nr: adresData.nr
      },
      select: {
        operator_id: true,
        hp_count: true
      }
    });
    operatorzyZZasiegiem = coverage.filter(c => c.hp_count > 0).map(c => c.operator_id);
  }

  // Pobierz oferty - TYLKO od operatorów z zasięgiem (kablowe) + wszystkie mobilne
  const offers = await prisma.oferta.findMany({
    where: {
      aktywna: true,
      OR: [
        { typ_polaczenia: 'komorkowe' },
        { 
          typ_polaczenia: 'kablowe',
          operator_id: { in: operatorzyZZasiegiem.length > 0 ? operatorzyZZasiegiem : [-1] }
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
      { priorytet: 'desc' },
      { abonament: 'asc' }
    ]
  });

  const operators = [...new Map(offers.map(o => [o.operator.id, o.operator])).values()];
  const serializedOffers = JSON.parse(JSON.stringify(offers));
  
  const ofertyKablowe = offers.filter(o => o.typ_polaczenia === 'kablowe').length;

  return (
    <div className="bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <Link href="/" className="hover:text-blue-600">Strona główna</Link>
            <span className="text-gray-400">/</span>
            <Link href={`/internet/${miejscowoscSlug}`} className="hover:text-blue-600">
              {miejscowoscData.miejscowosc}
            </Link>
            <span className="text-gray-400">/</span>
            <Link href={`/internet/${miejscowoscSlug}/${ulicaSlug}`} className="hover:text-blue-600">
              {ulicaNazwa}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{numerSafe}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <h1 className="text-3xl font-black text-gray-900">
              Internet: {pelnyAdres}
            </h1>
            
            {adresIstnieje ? (
              operatorzyZZasiegiem.length > 0 ? (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  ✓ {operatorzyZZasiegiem.length} operatorów kablowych
                </span>
              ) : (
                <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
                  ⚠ Brak zasięgu kablowego
                </span>
              )
            ) : (
              <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                Adres do weryfikacji
              </span>
            )}
          </div>
          
          <p className="text-gray-800 text-lg leading-relaxed">
            {adresIstnieje && operatorzyZZasiegiem.length > 0 
              ? `Znaleźliśmy ${ofertyKablowe} ofert internetu kablowego dostępnych pod tym adresem. Możesz zamówić bez dodatkowej weryfikacji.`
              : 'Poniżej znajdziesz oferty internetu mobilnego dostępne w Twojej lokalizacji.'
            }
          </p>
        </div>

        {/* Brak zasięgu kablowego - komunikat */}
        {adresIstnieje && operatorzyZZasiegiem.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-3xl">📡</div>
              <div>
                <h2 className="text-lg font-bold text-amber-900 mb-2">
                  Brak internetu kablowego pod tym adresem
                </h2>
                <p className="text-amber-700 mb-4">
                  Żaden z operatorów kablowych nie ma jeszcze zasięgu pod adresem {pelnyAdres}.
                  Poniżej znajdziesz oferty internetu mobilnego (LTE/5G), które są dostępne w każdej lokalizacji.
                </p>
                <a
                  href="tel:+48532274808"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                >
                  📞 Zadzwoń - sprawdzimy dostępność
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Adres nie istnieje w bazie */}
        {!adresIstnieje && (
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🔍</div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Adres wymaga weryfikacji
                </h2>
                <p className="text-gray-600 mb-4">
                  Adres {pelnyAdres} nie został jeszcze zweryfikowany w naszej bazie. 
                  Skontaktuj się z nami, aby sprawdzić dostępność.
                </p>
                <a
                  href="tel:+48532274808"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📞 Zadzwoń: 532 274 808
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Lista ofert - level='adres' = bez modala */}
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

        {/* Link do zmiany adresu */}
        <div className="mt-8 text-center">
          <Link
            href={`/internet/${miejscowoscSlug}/${ulicaSlug}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Zmień numer budynku
          </Link>
          <span className="mx-3 text-gray-300">|</span>
          <Link
            href={`/internet/${miejscowoscSlug}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Zmień adres
          </Link>
        </div>
      </div>
    </div>
  );
}

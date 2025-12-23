import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import CitySearch from "./CitySearch";
import OperatorBadge from "./OperatorBadge";
import LocalOperatorsList from "./LocalOperatorsList";
import { cleanOperatorName } from "@/src/lib/operator-utils";

export const metadata: Metadata = {
  title: "Dostawcy internetu w Polsce - porównaj oferty | DostawcyInternetu.pl",
  description: "Lista ponad 2200 dostawców internetu w Polsce. Porównaj operatorów krajowych, regionalnych i lokalnych.",
};

export default async function OperatorsListPage() {
  // Pobierz WSZYSTKICH operatorów
  const operators = await prisma.operator.findMany({
    include: {
      _count: { select: { oferty: { where: { aktywna: true } } } },
      oferty: { 
        where: { aktywna: true }, 
        select: { abonament: true, download_mbps: true, typ_uslugi: true } 
      }
    },
    orderBy: { nazwa: 'asc' }
  });

  // Grupuj operatorów
  const krajowi = operators.filter(o => o.typ === 'krajowy');
  const komorkowi = operators.filter(o => o.typ === 'komórkowy');
  const regionalni = operators.filter(o => o.typ === 'regionalny');
  const lokalni = operators.filter(o => o.typ === 'lokalny' || !o.typ);

  // Dla listy lokalnych
  const lokalniForList = lokalni.map(op => ({
    id: op.id,
    nazwa: op.nazwa,
    slug: op.slug,
    typ: op.typ,
    logo_url: op.logo_url,
    regiony: op.regiony,
    strona_www: op.strona_www,
    totalOffers: op._count.oferty,
  }));

  // Statystyki z podziałem na typ usługi
  const getStats = (op: typeof operators[0]) => {
    const stacjonarne = op.oferty.filter(o => o.typ_uslugi === 'stacjonarny' || !o.typ_uslugi).length;
    const komorkowe = op.oferty.filter(o => o.typ_uslugi === 'komórkowy').length;
    const minPrice = op.oferty.length > 0 
      ? Math.min(...op.oferty.map(o => parseFloat(o.abonament?.toString() || '0'))) 
      : null;
    
    return {
      totalOffers: op._count.oferty,
      stacjonarne,
      komorkowe,
      minPrice: minPrice && minPrice > 0 ? minPrice : null,
    };
  };

  // Komponent dla statystyk ofert
  const OfferStats = ({ stats }: { stats: ReturnType<typeof getStats> }) => {
    if (stats.totalOffers === 0) return null;
    
    const hasMultipleTypes = stats.stacjonarne > 0 && stats.komorkowe > 0;
    
    if (hasMultipleTypes) {
      return (
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1">
            <span>🏠</span> {stats.stacjonarne}
          </span>
          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium flex items-center gap-1">
            <span>📱</span> {stats.komorkowe}
          </span>
          {stats.minPrice && (
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">
              od {stats.minPrice} zł
            </span>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
          {stats.totalOffers} ofert
        </span>
        {stats.minPrice && (
          <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">
            od {stats.minPrice} zł
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Internet</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">Dostawcy internetu</span>
          </nav>
        </div>
      </div>

      {/* Header z wyszukiwarką miejscowości */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Dostawcy internetu w Polsce
          </h1>
          <p className="text-blue-100 mb-6 text-lg">
            Porównaj oferty <strong className="text-white">{operators.length}</strong> operatorów internetowych i komórkowych
          </p>
          
          {/* Wyszukiwarka miejscowości */}
          <CitySearch />
          <p className="text-blue-200 text-sm mt-3">
            Sprawdź dostępnych operatorów w Twojej lokalizacji
          </p>
          
          {/* Statystyki */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-2xl font-bold">{krajowi.length}</span>
              <span className="text-blue-200 ml-2">krajowych</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-2xl font-bold">{komorkowi.length}</span>
              <span className="text-blue-200 ml-2">komórkowych</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-2xl font-bold">{regionalni.length}</span>
              <span className="text-blue-200 ml-2">regionalnych</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-2xl font-bold">{lokalni.length}</span>
              <span className="text-blue-200 ml-2">lokalnych</span>
            </div>
          </div>
        </div>
      </div>

      {/* Baner - bezpłatna usługa */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
              <span className="text-gray-700"><strong className="text-emerald-700">Porównanie bezpłatne</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
              <span className="text-gray-700">Oferty identyczne <strong className="text-blue-700">(lub lepsze)</strong> niż na WWW</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
              <span className="text-gray-700"><strong className="text-purple-700">Bez ukrytych prowizji</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
              <span className="text-gray-700"><strong className="text-orange-700">14 dni na rezygnację</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Operatorzy krajowi */}
        {krajowi.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Operatorzy krajowi</h2>
              <OperatorBadge type="krajowy" size="sm" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {krajowi.map((operator) => {
                const stats = getStats(operator);
                return (
                  <Link
                    key={operator.id}
                    href={`/dostawca-internetu/${operator.slug}`}
                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all overflow-hidden group"
                  >
                    <div className="h-24 bg-gray-50 flex items-center justify-center border-b group-hover:bg-blue-50 transition-colors">
                      {operator.logo_url ? (
                        <img src={operator.logo_url} alt={operator.nazwa} className="max-h-14 max-w-[80%] object-contain" />
                      ) : (
                        <span className="text-4xl font-bold text-gray-300">
                          {cleanOperatorName(operator.nazwa).charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2">{cleanOperatorName(operator.nazwa)}</h3>
                      <OfferStats stats={stats} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Operatorzy komórkowi */}
        {komorkowi.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Operatorzy komórkowi</h2>
              <OperatorBadge type="komórkowy" size="sm" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {komorkowi.map((operator) => {
                const stats = getStats(operator);
                return (
                  <Link
                    key={operator.id}
                    href={`/dostawca-internetu/${operator.slug}`}
                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all overflow-hidden group"
                  >
                    <div className="h-20 bg-gray-50 flex items-center justify-center border-b group-hover:bg-purple-50 transition-colors">
                      {operator.logo_url ? (
                        <img src={operator.logo_url} alt={operator.nazwa} className="max-h-12 max-w-[80%] object-contain" />
                      ) : (
                        <span className="text-3xl font-bold text-gray-300">
                          {cleanOperatorName(operator.nazwa).charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{cleanOperatorName(operator.nazwa)}</h3>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {stats.totalOffers > 0 && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                            {stats.totalOffers} ofert
                          </span>
                        )}
                        {operator.technologie && operator.technologie.length > 0 && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                            {operator.technologie.includes('5G') ? '5G' : 'LTE'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Operatorzy regionalni */}
        {regionalni.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Operatorzy regionalni</h2>
              <OperatorBadge type="regionalny" size="sm" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {regionalni.map((operator) => {
                const stats = getStats(operator);
                return (
                  <Link
                    key={operator.id}
                    href={`/dostawca-internetu/${operator.slug}`}
                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all overflow-hidden group"
                  >
                    <div className="h-20 bg-gray-50 flex items-center justify-center border-b group-hover:bg-green-50 transition-colors">
                      {operator.logo_url ? (
                        <img src={operator.logo_url} alt={operator.nazwa} className="max-h-12 max-w-[80%] object-contain" />
                      ) : (
                        <span className="text-3xl font-bold text-gray-300">
                          {cleanOperatorName(operator.nazwa).charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{cleanOperatorName(operator.nazwa)}</h3>
                      {operator.regiony && operator.regiony.length > 0 && (
                        <p className="text-xs text-gray-500 mb-2">{operator.regiony.join(', ')}</p>
                      )}
                      <OfferStats stats={stats} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Operatorzy lokalni */}
        {lokalni.length > 0 && (
          <section id="lokalni-section" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Operatorzy lokalni</h2>
              <OperatorBadge type="lokalny" size="sm" />
              <span className="text-sm text-gray-500">({lokalni.length})</span>
            </div>
            
            <LocalOperatorsList operators={lokalniForList} />
          </section>
        )}

        {/* SEO content */}
        <div className="mt-12 bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Jak wybrać dostawcę internetu?</h2>
          <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
            <p>
              W Polsce działa ponad <strong>{operators.length} dostawców internetu</strong> - od dużych operatorów krajowych 
              jak Orange, Play czy T-Mobile, przez operatorów komórkowych jak Lycamobile czy Virgin Mobile,
              regionalnych jak Inea czy Toya, aż po setki małych, lokalnych firm oferujących internet 
              w konkretnych miastach i osiedlach.
            </p>
            <p>
              Wybór odpowiedniego dostawcy zależy od kilku czynników: dostępności w Twojej lokalizacji, 
              wymaganej prędkości, budżetu oraz dodatkowych usług. <strong>Operatorzy lokalni</strong> często oferują 
              konkurencyjne ceny i lepszą obsługę klienta niż duże firmy.
            </p>
            <p>
              <strong>Wpisz swoją miejscowość w wyszukiwarce</strong> powyżej, aby sprawdzić którzy 
              operatorzy oferują usługi w Twojej lokalizacji i porównać ich oferty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

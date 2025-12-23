"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  results: any;
  onClose: () => void;
}

// Funkcja do obliczania "siły sygnału" na podstawie odległości
function getSignalStrength(distanceM: number): { level: number; color: string; label: string } {
  if (distanceM <= 500) return { level: 5, color: 'bg-green-500', label: 'Doskonały' };
  if (distanceM <= 1000) return { level: 4, color: 'bg-green-400', label: 'Bardzo dobry' };
  if (distanceM <= 2000) return { level: 3, color: 'bg-yellow-400', label: 'Dobry' };
  if (distanceM <= 3500) return { level: 2, color: 'bg-orange-400', label: 'Średni' };
  if (distanceM <= 5000) return { level: 1, color: 'bg-red-400', label: 'Słaby' };
  return { level: 0, color: 'bg-red-600', label: 'Bardzo słaby' };
}

export default function OfferResults({ results, onClose }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'default' | 'speed-desc' | 'speed-asc' | 'price-asc' | 'price-desc'>('default');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  
  // KPO Form
  const [kpoFormData, setKpoFormData] = useState({ imie: '', telefon: '', email: '', uwagi: '' });
  const [kpoSubmitting, setKpoSubmitting] = useState(false);
  const [kpoSubmitted, setKpoSubmitted] = useState(false);
  const [kpoError, setKpoError] = useState('');

  const ITEMS_PER_PAGE = 12;

  // Redirect do właściwego URL po załadowaniu wyników
  useEffect(() => {
    if (results?.address) {
      const { miejscowosc, ulica, nr, slug, simc } = results.address;
      
      // Buduj URL
      let url = `/internet/${slug || miejscowosc?.toLowerCase().replace(/\s+/g, '-')}`;
      
      if (ulica) {
        const ulicaSlug = ulica.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        url += `/${ulicaSlug}`;
      }
      
      if (nr) {
        url += `/${nr}`;
      }
      
      // Zmień URL bez przeładowania strony
      window.history.replaceState(null, '', url);
    }
  }, [results]);

  const availableOperators = useMemo(() => {
    const ops = new Map<string, { slug: string; nazwa: string; logo_url?: string }>();
    results.offers?.forEach((offer: any) => {
      if (offer.operator && !ops.has(offer.operator.slug)) {
        ops.set(offer.operator.slug, offer.operator);
      }
    });
    return Array.from(ops.values());
  }, [results.offers]);

  const processedOffers = useMemo(() => {
    let offers = [...(results.offers || [])];
    if (selectedOperator) {
      offers = offers.filter(o => o.operator?.slug === selectedOperator);
    }
    if (sortBy === 'speed-desc') offers.sort((a, b) => b.download_mbps - a.download_mbps);
    else if (sortBy === 'speed-asc') offers.sort((a, b) => a.download_mbps - b.download_mbps);
    else if (sortBy === 'price-asc') offers.sort((a, b) => parseFloat(a.abonament) - parseFloat(b.abonament));
    else if (sortBy === 'price-desc') offers.sort((a, b) => parseFloat(b.abonament) - parseFloat(a.abonament));
    return offers;
  }, [results.offers, selectedOperator, sortBy]);

  const totalPages = Math.ceil(processedOffers.length / ITEMS_PER_PAGE);
  const paginatedOffers = processedOffers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleKpoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKpoError('');
    setKpoSubmitting(true);

    try {
      const res = await fetch('/api/kpo-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          miejscowosc: results.address?.miejscowosc,
          ulica: results.address?.ulica,
          nr: results.address?.nr,
          simc: results.address?.simc,
          id_ulicy: results.address?.id_ulicy,
          ...kpoFormData
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Błąd zapisu');
      }

      setKpoSubmitted(true);
    } catch (err: any) {
      setKpoError(err.message || 'Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setKpoSubmitting(false);
    }
  };

  const hasCable = results.hasCable;
  const hasKpoFerc = results.hasKpoFerc;
  const btsData = results.bts || [];
  const seoData = results.seoData; // Dane SEO miejscowości

  // Adres do wyświetlenia
  const fullAddress = [
    results.address?.miejscowosc,
    results.address?.ulica,
    results.address?.nr
  ].filter(Boolean).join(', ');

  return (
    <div className="mt-8">
      {/* Header z adresem */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">{fullAddress}</h2>
          <p className="text-gray-600">
            {hasCable ? 'Dostępny internet kablowy' : 'Tylko internet mobilny'}
            {' - '}{processedOffers.length} ofert
          </p>
          
          {/* Krótki opis miejscowości */}
          {seoData?.opis_krotki && !hasCable && (
            <p className="text-gray-700 mt-2 text-sm leading-relaxed max-w-2xl">
              {seoData.opis_krotki}
            </p>
          )}
        </div>
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
        >
          Nowe wyszukiwanie
        </button>
      </div>

      {/* KPO/FERC - Powiadomienie o budowie światłowodu */}
      {hasKpoFerc && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">🎉</span>
            <div>
              <h3 className="text-xl font-bold text-green-800">
                Dobra wiadomość! Ten adres jest przewidziany do budowy sieci światłowodowej
              </h3>
              <p className="text-green-700 mt-1">
                Zostaw kontakt, a skontaktujemy się z propozycjami kilkunastu operatorów tuż przed odbiorami.
              </p>
            </div>
          </div>
          
          {kpoSubmitted ? (
            <div className="p-4 bg-green-100 rounded-xl">
              <p className="font-bold text-green-800 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Dziękujemy! Skontaktujemy się wkrótce.
              </p>
            </div>
          ) : (
            <form onSubmit={handleKpoSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input 
                    type="text" 
                    placeholder="Imię *" 
                    required 
                    value={kpoFormData.imie}
                    onChange={(e) => setKpoFormData(prev => ({ ...prev, imie: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input 
                    type="tel" 
                    placeholder="Telefon *" 
                    required 
                    value={kpoFormData.telefon}
                    onChange={(e) => setKpoFormData(prev => ({ ...prev, telefon: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={kpoFormData.email}
                    onChange={(e) => setKpoFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <textarea 
                  placeholder="Uwagi (opcjonalnie)" 
                  rows={2}
                  value={kpoFormData.uwagi}
                  onChange={(e) => setKpoFormData(prev => ({ ...prev, uwagi: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <button 
                  type="submit" 
                  disabled={kpoSubmitting}
                  className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:bg-green-400 transition-colors"
                >
                  {kpoSubmitting ? 'Wysyłam...' : 'Powiadom mnie'}
                </button>
                <p className="text-xs text-green-700">* Wszystkie pola z gwiazdką są wymagane</p>
              </div>
              {kpoError && (
                <p className="text-red-600 text-sm font-medium">{kpoError}</p>
              )}
            </form>
          )}
        </div>
      )}

      {/* BTS - Stacje bazowe z graficzną siłą sygnału */}
      {!hasCable && btsData.length > 0 && (
        <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">📡</span>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">
                Internet mobilny LTE/5G w Twojej okolicy
              </h3>
              <p className="text-blue-700 text-sm mt-1">
                Do czasu budowy światłowodu możesz skorzystać z internetu mobilnego. 
                Poniżej najbliższe nadajniki - im bliżej, tym lepszy sygnał.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {btsData.map((bts: any, i: number) => {
              const signal = getSignalStrength(bts.distance_m);
              return (
                <div key={i} className="p-4 bg-white rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{bts.isp}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{bts.tech}</p>
                    </div>
                    <span className="text-lg font-black text-blue-600">{bts.distance_m}m</span>
                  </div>
                  
                  {/* Graficzny pasek siły sygnału */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Siła sygnału</span>
                      <span className={`text-xs font-medium ${signal.level >= 3 ? 'text-green-600' : signal.level >= 2 ? 'text-orange-600' : 'text-red-600'}`}>
                        {signal.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <div
                          key={bar}
                          className={`h-3 flex-1 rounded-sm ${bar <= signal.level ? signal.color : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rekomendacja anteny */}
          <div className="mt-4 p-3 bg-blue-100 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>💡 Wskazówka:</strong> Jeśli sygnał jest słaby, zewnętrzna antena LTE może znacząco poprawić jakość połączenia. 
              <Link href="/sklep/anteny" className="underline hover:text-blue-600 ml-1">
                Zobacz anteny w naszym sklepie →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Filtry */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-100 rounded-xl">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Operator</label>
          <select 
            value={selectedOperator || ''} 
            onChange={(e) => { setSelectedOperator(e.target.value || null); setPage(1); }}
            className="px-4 py-2 border rounded-lg bg-white min-w-[150px] text-gray-900"
          >
            <option value="">Wszyscy</option>
            {availableOperators.map(op => (
              <option key={op.slug} value={op.slug}>{op.nazwa}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sortowanie</label>
          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
            className="px-4 py-2 border rounded-lg bg-white min-w-[180px] text-gray-900"
          >
            <option value="default">Rekomendowane</option>
            <option value="speed-desc">Najszybsze</option>
            <option value="speed-asc">Najwolniejsze</option>
            <option value="price-asc">Najtańsze</option>
            <option value="price-desc">Najdroższe</option>
          </select>
        </div>
        <div className="flex-1 flex items-end justify-end">
          <p className="text-sm text-gray-600">
            Pokazuję {paginatedOffers.length} z {processedOffers.length} ofert
          </p>
        </div>
      </div>

      {/* Lista ofert */}
      <div className="space-y-4">
        {paginatedOffers.map((offer: any) => (
          <OfferCard key={offer.id} offer={offer} address={results.address} />
        ))}
      </div>

      {/* Paginacja */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button onClick={() => setPage(1)} disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100 bg-white">
            «
          </button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100 bg-white">
            ‹ Poprzednia
          </button>
          <span className="px-4 py-2 text-gray-700">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100 bg-white">
            Następna ›
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100 bg-white">
            »
          </button>
        </div>
      )}

      {/* Brak ofert */}
      {paginatedOffers.length === 0 && (
        <div className="p-12 text-center bg-gray-100 rounded-xl">
          <p className="text-gray-600 text-lg">Brak ofert spełniających kryteria</p>
          {selectedOperator && (
            <button onClick={() => setSelectedOperator(null)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Pokaż wszystkie oferty
            </button>
          )}
        </div>
      )}

      {/* Artykuł SEO miejscowości - pod ofertami */}
      {seoData?.article_text && (
        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <div 
            className="prose prose-gray max-w-none [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mb-4 [&>p]:text-gray-700 [&>p]:leading-relaxed [&>p]:mb-4"
            dangerouslySetInnerHTML={{ __html: seoData.article_text }}
          />
        </div>
      )}

      {/* FAQ miejscowości */}
      {seoData?.faq && Array.isArray(seoData.faq) && seoData.faq.length > 0 && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Często zadawane pytania - Internet w {results.address?.miejscowosc}
          </h2>
          <div className="space-y-6">
            {seoData.faq.map((item: any, index: number) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-900 mb-2">
                  {item.question || item.pytanie}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {item.answer || item.odpowiedz}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer, address }: { offer: any; address: any }) {
  const isMobile = offer.typ_polaczenia === 'komorkowe';
  
  const addressParam = address 
    ? `?adres=${encodeURIComponent(`${address.miejscowosc || ''}|${address.ulica || ''}|${address.nr || ''}|${address.slug || ''}`)}` 
    : '';
  const offerUrl = `/oferta/${offer.operator?.slug}/${offer.custom_url || offer.id}${addressParam}`;
  
  return (
    <div className={`p-5 bg-white rounded-2xl border-2 ${offer.wyrozoniona ? 'border-yellow-400 shadow-lg' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
          {offer.operator?.logo_url ? (
            <img src={offer.operator.logo_url} alt={offer.operator.nazwa} className="w-full h-full object-contain p-2" />
          ) : (
            <span className="text-2xl font-bold text-gray-400">{offer.operator?.nazwa?.charAt(0) || '?'}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-1">
            {offer.wyrozoniona && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">WYRÓŻNIONA</span>
            )}
            {offer.lokalna && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded">LOKALNA</span>
            )}
            {isMobile ? (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">📱 LTE/5G</span>
            ) : (
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">🔌 KABLOWA</span>
            )}
          </div>
          <h3 className="font-bold text-lg text-gray-900 truncate">{offer.nazwa}</h3>
          <p className="text-sm text-gray-600">{offer.operator?.nazwa}</p>

          <div className="flex flex-wrap gap-4 mt-3">
            <div>
              <p className="text-xl font-black text-gray-900">{offer.download_mbps} Mb/s</p>
              <p className="text-xs text-gray-500">pobieranie</p>
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">{offer.upload_mbps} Mb/s</p>
              <p className="text-xs text-gray-500">wysyłanie</p>
            </div>
            {offer.technologia && (
              <div>
                <p className="font-bold text-gray-900">{offer.technologia}</p>
                <p className="text-xs text-gray-500">Technologia</p>
              </div>
            )}
            {offer.zobowiazanie_miesiace && (
              <div>
                <p className="font-bold text-gray-900">{offer.zobowiazanie_miesiace} mies.</p>
                <p className="text-xs text-gray-500">Umowa</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 text-right w-full md:w-auto mt-4 md:mt-0">
          <div className="mb-3">
            <p className="text-3xl font-black text-gray-900">
              {parseFloat(offer.abonament).toFixed(0)} <span className="text-lg">zł</span>
            </p>
            <p className="text-sm text-gray-500">/miesiąc</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href={offerUrl} className="inline-block px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors text-center">
              Sprawdź ofertę
            </Link>
            <a href="tel:532274808" className="text-xs text-gray-500 hover:text-gray-700">
              lub zadzwoń: 532 274 808
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
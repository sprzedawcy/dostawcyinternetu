"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

interface Props {
  results: any;
  onClose: () => void;
}

export default function OfferResults({ results, onClose }: Props) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'default' | 'speed-desc' | 'speed-asc' | 'price-asc' | 'price-desc'>('default');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [kpoFormData, setKpoFormData] = useState({ name: '', phone: '', email: '' });
  const [kpoSubmitted, setKpoSubmitted] = useState(false);

  const ITEMS_PER_PAGE = 12;

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

  const handleKpoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('KPO Form:', kpoFormData);
    setKpoSubmitted(true);
  };

  const hasCable = results.hasCable;
  const hasKpoFerc = results.hasKpoFerc;
  const btsData = results.bts || [];

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            {results.address?.miejscowosc}
            {results.address?.ulica && `, ${results.address.ulica}`}
            {results.address?.nr && ` ${results.address.nr}`}
          </h2>
          <p className="text-gray-600">
            {hasCable ? 'Dostepny internet kablowy' : 'Tylko internet mobilny'}
            {' - '}{processedOffers.length} ofert
          </p>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium">
          Nowe wyszukiwanie
        </button>
      </div>

      {hasKpoFerc && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl">
          <h3 className="text-xl font-bold text-green-800 mb-2">
            Dobra wiadomosc! Ten adres jest przewidziany do budowy sieci swiatlowodowej
          </h3>
          <p className="text-green-700 mb-4">
            Zostaw kontakt, a skontaktujemy sie z propozycjami kilkunastu operatorow tuz przed odbiorami.
          </p>
          {kpoSubmitted ? (
            <p className="font-bold text-green-800">Dziekujemy! Skontaktujemy sie wkrotce.</p>
          ) : (
            <form onSubmit={handleKpoSubmit} className="flex flex-wrap gap-3">
              <input type="text" placeholder="Imie" required value={kpoFormData.name}
                onChange={(e) => setKpoFormData(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1 min-w-[150px] px-4 py-3 border-2 border-green-300 rounded-xl" />
              <input type="tel" placeholder="Telefon" required value={kpoFormData.phone}
                onChange={(e) => setKpoFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="flex-1 min-w-[150px] px-4 py-3 border-2 border-green-300 rounded-xl" />
              <input type="email" placeholder="Email" value={kpoFormData.email}
                onChange={(e) => setKpoFormData(prev => ({ ...prev, email: e.target.value }))}
                className="flex-1 min-w-[200px] px-4 py-3 border-2 border-green-300 rounded-xl" />
              <button type="submit" className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700">
                Powiadom mnie
              </button>
            </form>
          )}
        </div>
      )}

      {!hasCable && btsData.length > 0 && (
        <div className="mb-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl">
          <h3 className="font-bold text-blue-900 mb-3">Najblizsze stacje bazowe (BTS)</h3>
          <p className="text-blue-700 text-sm mb-3">
            Na tym adresie nie ma sieci kablowej. Ponizej informacje o najblizszych nadajnikach.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {btsData.map((bts: any, i: number) => (
              <div key={i} className="p-3 bg-white rounded-xl border border-blue-200">
                <p className="font-bold text-gray-900">{bts.isp}</p>
                <p className="text-sm text-gray-600">{bts.tech}</p>
                <p className="text-lg font-black text-blue-600">{bts.distance_m}m</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-100 rounded-xl">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Operator</label>
          <select value={selectedOperator || ''} onChange={(e) => { setSelectedOperator(e.target.value || null); setPage(1); }}
            className="px-4 py-2 border rounded-lg bg-white min-w-[150px]">
            <option value="">Wszyscy</option>
            {availableOperators.map(op => (
              <option key={op.slug} value={op.slug}>{op.nazwa}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sortowanie</label>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
            className="px-4 py-2 border rounded-lg bg-white min-w-[180px]">
            <option value="default">Rekomendowane</option>
            <option value="speed-desc">Najszybsze</option>
            <option value="speed-asc">Najwolniejsze</option>
            <option value="price-asc">Najtansze</option>
            <option value="price-desc">Najdrozsze</option>
          </select>
        </div>
        <div className="flex-1 flex items-end justify-end">
          <p className="text-sm text-gray-600">
            Pokazuje {paginatedOffers.length} z {processedOffers.length} ofert
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {paginatedOffers.map((offer: any) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button onClick={() => setPage(1)} disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100">
            &laquo;&laquo;
          </button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100">
            &laquo;
          </button>
          <span className="px-4 py-2">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100">
            &raquo;
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100">
            &raquo;&raquo;
          </button>
        </div>
      )}

      {paginatedOffers.length === 0 && (
        <div className="p-12 text-center bg-gray-100 rounded-xl">
          <p className="text-gray-600 text-lg">Brak ofert spelniajacych kryteria</p>
          {selectedOperator && (
            <button onClick={() => setSelectedOperator(null)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Pokaz wszystkie oferty
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer }: { offer: any }) {
  const isMobile = offer.typ_polaczenia === 'komorkowe';
  const offerUrl = offer.custom_url ? `/oferta/${offer.custom_url}` : `/oferta/${offer.id}`;
  
  return (
    <div className={`p-5 bg-white rounded-2xl border-2 ${offer.wyrozoniona ? 'border-yellow-400 shadow-lg' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-4">
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
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">WYROOZNIONA</span>
            )}
            {offer.lokalna && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded">LOKALNA</span>
            )}
            {isMobile && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">MOBILNA</span>
            )}
          </div>
          <h3 className="font-bold text-lg text-gray-900 truncate">{offer.nazwa}</h3>
          <p className="text-sm text-gray-600">{offer.operator?.nazwa}</p>

          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xl font-black text-gray-900">{offer.download_mbps} Mb/s</p>
                <p className="text-xs text-gray-500">pobieranie</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xl font-black text-gray-900">{offer.upload_mbps} Mb/s</p>
                <p className="text-xs text-gray-500">wysylanie</p>
              </div>
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

        <div className="flex-shrink-0 text-right">
          <div className="mb-3">
            <p className="text-3xl font-black text-gray-900">
              {parseFloat(offer.abonament).toFixed(0)} <span className="text-lg">zl</span>
            </p>
            <p className="text-sm text-gray-500">/miesiac</p>
          </div>
          <Link href={offerUrl} className="inline-block px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors">
            Zamow
          </Link>
        </div>
      </div>
    </div>
  );
}

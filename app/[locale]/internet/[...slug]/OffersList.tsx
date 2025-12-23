"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AddressModal from "./AddressModal";

interface Offer {
  id: number;
  nazwa: string;
  abonament: string;
  download_mbps: number;
  upload_mbps: number;
  technologia?: string;
  typ_polaczenia?: string;
  wyrozoniona?: boolean;
  lokalna?: boolean;
  zobowiazanie_miesiace?: number;
  custom_url?: string;
  operator: {
    id: number;
    nazwa: string;
    slug: string;
    logo_url?: string;
  };
}

interface Props {
  offers: Offer[];
  operators: { id: number; nazwa: string; slug: string; logo_url?: string }[];
  miejscowosc: string;
  miejscowoscSlug: string;
  simc: string;
  /** Poziom walidacji: 'miasto' | 'ulica' | 'adres' */
  level: 'miasto' | 'ulica' | 'adres';
  /** Dane ulicy jeśli level='ulica' */
  ulicaData?: { ulica: string; ulicaSlug: string; id_ulicy: string };
  /** Numer budynku jeśli level='adres' */
  numerBudynku?: string;
}

export default function OffersList({ 
  offers, 
  operators, 
  miejscowosc, 
  miejscowoscSlug, 
  simc,
  level,
  ulicaData,
  numerBudynku
}: Props) {
  const router = useRouter();
  
  const [selectedOperator, setSelectedOperator] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'speed-desc'>('default');
  const [page, setPage] = useState(1);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  
  const ITEMS_PER_PAGE = 12;

  const processedOffers = useMemo(() => {
    let filtered = [...offers];
    
    if (selectedOperator) {
      filtered = filtered.filter(o => o.operator.id === selectedOperator);
    }

    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => parseFloat(a.abonament) - parseFloat(b.abonament));
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => parseFloat(b.abonament) - parseFloat(a.abonament));
    } else if (sortBy === 'speed-desc') {
      filtered.sort((a, b) => b.download_mbps - a.download_mbps);
    }

    return filtered;
  }, [offers, selectedOperator, sortBy]);

  const totalPages = Math.ceil(processedOffers.length / ITEMS_PER_PAGE);
  const paginatedOffers = processedOffers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Obsługa kliknięcia "Zamów"
  const handleOrderClick = (offer: Offer) => {
    if (level === 'adres') {
      // Mamy pełny adres - przechodzimy od razu do oferty
      const url = `/oferta/${offer.operator.slug}/${offer.custom_url || offer.id}?adres=${encodeURIComponent(
        `${miejscowosc}|${ulicaData?.ulica || ''}|${numerBudynku}|${miejscowoscSlug}|${simc}`
      )}`;
      router.push(url);
    } else {
      // Brak pełnego adresu - otwórz modal
      setSelectedOffer(offer);
      setModalOpen(true);
    }
  };

  // Po potwierdzeniu adresu w modalu - przekieruj na stronę adresu
  const handleAddressConfirm = (address: { ulica: string; nr: string; id_ulicy: string }) => {
    setModalOpen(false);
    
    // Buduj URL do strony adresu (gdzie są przefiltrowane oferty)
    const ulicaSlug = address.ulica
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    
    const url = `/internet/${miejscowoscSlug}/${ulicaSlug}/${address.nr}`;
    router.push(url);
  };

  return (
    <div>
      {/* Filtry */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Operator</label>
          <select
            value={selectedOperator || ''}
            onChange={(e) => { setSelectedOperator(e.target.value ? parseInt(e.target.value) : null); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white min-w-[180px] text-gray-900"
          >
            <option value="">Wszyscy operatorzy</option>
            {operators.map(op => (
              <option key={op.id} value={op.id}>{op.nazwa}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sortowanie</label>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white min-w-[180px] text-gray-900"
          >
            <option value="default">Rekomendowane</option>
            <option value="price-asc">Cena: od najniższej</option>
            <option value="price-desc">Cena: od najwyższej</option>
            <option value="speed-desc">Prędkość: od najszybszej</option>
          </select>
        </div>

        <div className="flex-1 flex items-end justify-end">
          <p className="text-sm text-gray-600">
            {processedOffers.length} ofert
          </p>
        </div>
      </div>

      {/* Lista ofert */}
      <div className="space-y-4">
        {paginatedOffers.map((offer) => (
          <OfferCard 
            key={offer.id} 
            offer={offer} 
            level={level}
            onOrderClick={() => handleOrderClick(offer)}
          />
        ))}
      </div>

      {/* Paginacja */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100 bg-white"
          >
            Poprzednia
          </button>
          <span className="px-4 py-2 text-gray-700">
            Strona {page} z {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100 bg-white"
          >
            Następna
          </button>
        </div>
      )}

      {/* Brak ofert */}
      {paginatedOffers.length === 0 && (
        <div className="p-12 text-center bg-white rounded-xl">
          <p className="text-gray-600 text-lg">Brak ofert spełniających kryteria</p>
        </div>
      )}

      {/* Modal walidacji adresu */}
      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleAddressConfirm}
        miejscowosc={miejscowosc}
        simc={simc}
        prefilledUlica={level === 'ulica' && ulicaData ? { 
          ulica: ulicaData.ulica, 
          id_ulicy: ulicaData.id_ulicy 
        } : undefined}
      />
    </div>
  );
}

// Karta pojedynczej oferty
function OfferCard({ 
  offer, 
  level,
  onOrderClick
}: { 
  offer: Offer; 
  level: 'miasto' | 'ulica' | 'adres';
  onOrderClick: () => void;
}) {
  const isMobile = offer.typ_polaczenia === 'komorkowe';
  
  return (
    <div className={`p-5 bg-white rounded-2xl border-2 ${
      offer.wyrozoniona ? 'border-yellow-400 shadow-lg' : 'border-gray-200'
    } hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
        {/* Logo */}
        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
          {offer.operator?.logo_url ? (
            <img 
              src={offer.operator.logo_url} 
              alt={offer.operator.nazwa}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <span className="text-2xl font-bold text-gray-400">
              {offer.operator?.nazwa?.charAt(0) || '?'}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-1">
            {offer.wyrozoniona && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                WYRÓŻNIONA
              </span>
            )}
            {offer.lokalna && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded">
                LOKALNA
              </span>
            )}
            {isMobile ? (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                MOBILNA
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
                ✓ KABLOWA
              </span>
            )}
            {level === 'adres' && !isMobile && (
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded">
                ✓ DOSTĘPNA
              </span>
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
                <p className="text-xs text-gray-500">technologia</p>
              </div>
            )}
            {offer.zobowiazanie_miesiace && (
              <div>
                <p className="font-bold text-gray-900">{offer.zobowiazanie_miesiace} mies.</p>
                <p className="text-xs text-gray-500">umowa</p>
              </div>
            )}
          </div>
        </div>

        {/* Cena i przycisk */}
        <div className="flex-shrink-0 text-right w-full md:w-auto mt-4 md:mt-0">
          <div className="mb-3">
            <p className="text-3xl font-black text-gray-900">
              {parseFloat(offer.abonament).toFixed(0)} <span className="text-lg">zł</span>
            </p>
            <p className="text-sm text-gray-500">/miesiąc</p>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={onOrderClick}
              className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors text-center"
            >
              {level === 'adres' ? 'Zamów teraz' : 'Sprawdź dostępność'}
            </button>
            <a href="tel:532274808" className="text-xs text-gray-500 hover:text-gray-700 text-center">
              lub zadzwoń: 532 274 808
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

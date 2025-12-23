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
  level: 'miasto' | 'ulica' | 'adres';
  ulicaData?: { ulica: string; ulicaSlug: string; id_ulicy: string };
  numerBudynku?: string;
}

const ITEMS_PER_PAGE = 12;

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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

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

  const handleOrderClick = (offer: Offer) => {
    if (level === 'adres') {
      const url = `/oferta/${offer.operator.slug}/${offer.custom_url || offer.id}?adres=${encodeURIComponent(
        `${miejscowosc}|${ulicaData?.ulica || ''}|${numerBudynku}|${miejscowoscSlug}|${simc}`
      )}`;
      router.push(url);
    } else {
      setSelectedOffer(offer);
      setModalOpen(true);
    }
  };

  const handleAddressConfirm = (address: { ulica: string; nr: string; id_ulicy: string }) => {
    setModalOpen(false);
    const ulicaSlug = address.ulica
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    router.push(`/internet/${miejscowoscSlug}/${ulicaSlug}/${address.nr}`);
  };

  return (
    <div>
      {/* Filtry */}
      <div className="filters-bar">
        <div className="filters-bar__group">
          <label className="form-label--small">Operator</label>
          <select
            value={selectedOperator || ''}
            onChange={(e) => { setSelectedOperator(e.target.value ? parseInt(e.target.value) : null); setPage(1); }}
            className="form-select"
          >
            <option value="">Wszyscy operatorzy</option>
            {operators.map(op => (
              <option key={op.id} value={op.id}>{op.nazwa}</option>
            ))}
          </select>
        </div>

        <div className="filters-bar__group">
          <label className="form-label--small">Sortowanie</label>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
            className="form-select"
          >
            <option value="default">Rekomendowane</option>
            <option value="price-asc">Cena: od najniższej</option>
            <option value="price-desc">Cena: od najwyższej</option>
            <option value="speed-desc">Prędkość: od najszybszej</option>
          </select>
        </div>

        <div className="filters-bar__count">
          {processedOffers.length} ofert
        </div>
      </div>

      {/* Lista ofert */}
      <div className="offers-list">
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
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline"
          >
            Poprzednia
          </button>
          <span className="pagination__info">
            Strona {page} z {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-outline"
          >
            Następna
          </button>
        </div>
      )}

      {/* Brak ofert */}
      {paginatedOffers.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__text">Brak ofert spełniających kryteria</p>
        </div>
      )}

      {/* Modal */}
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
    <div className={`offer-card ${offer.wyrozoniona ? 'offer-card--featured' : ''}`}>
      <div className="offer-card__layout">
        {/* Logo */}
        <div className="offer-card__logo">
          {offer.operator?.logo_url ? (
            <img src={offer.operator.logo_url} alt={offer.operator.nazwa} />
          ) : (
            <span className="offer-card__logo-placeholder">
              {offer.operator?.nazwa?.charAt(0) || '?'}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="offer-card__info">
          <div className="offer-card__badges">
            {offer.wyrozoniona && <span className="badge badge--featured">WYRÓŻNIONA</span>}
            {offer.lokalna && <span className="badge badge--local">LOKALNA</span>}
            {isMobile ? (
              <span className="badge badge--mobile">MOBILNA</span>
            ) : (
              <span className="badge badge--cable">✓ KABLOWA</span>
            )}
            {level === 'adres' && !isMobile && (
              <span className="badge badge--available">✓ DOSTĘPNA</span>
            )}
          </div>
          
          <h3 className="offer-card__title">{offer.nazwa}</h3>
          <p className="offer-card__operator">{offer.operator?.nazwa}</p>

          <div className="offer-card__specs">
            <div className="offer-card__spec">
              <span className="offer-card__spec-value">{offer.download_mbps} Mb/s</span>
              <span className="offer-card__spec-label">pobieranie</span>
            </div>
            <div className="offer-card__spec">
              <span className="offer-card__spec-value">{offer.upload_mbps} Mb/s</span>
              <span className="offer-card__spec-label">wysyłanie</span>
            </div>
            {offer.technologia && (
              <div className="offer-card__spec">
                <span className="offer-card__spec-value offer-card__spec-value--small">{offer.technologia}</span>
                <span className="offer-card__spec-label">technologia</span>
              </div>
            )}
            {offer.zobowiazanie_miesiace && (
              <div className="offer-card__spec">
                <span className="offer-card__spec-value offer-card__spec-value--small">{offer.zobowiazanie_miesiace} mies.</span>
                <span className="offer-card__spec-label">umowa</span>
              </div>
            )}
          </div>
        </div>

        {/* Cena i przycisk */}
        <div className="offer-card__price-section">
          <div className="offer-card__price">
            <span className="offer-card__price-value">
              {parseFloat(offer.abonament).toFixed(0)} <span className="offer-card__price-currency">zł</span>
            </span>
            <p className="offer-card__price-period">/miesiąc</p>
          </div>
          
          <div className="offer-card__actions">
            <button onClick={onOrderClick} className="btn btn-success">
              {level === 'adres' ? 'Zamów teraz' : 'Sprawdź dostępność'}
            </button>
            <a href="tel:532274808" className="offer-card__phone">
              lub zadzwoń: 532 274 808
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
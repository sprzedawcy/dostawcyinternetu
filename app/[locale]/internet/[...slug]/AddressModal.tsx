"use client";
import { useState, useEffect, useCallback } from "react";
import { searchStreets, searchNumbers, cityHasStreets } from "@/src/features/coverage/actions/search";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: { ulica: string; nr: string; id_ulicy: string }) => void;
  miejscowosc: string;
  simc: string;
  /** Jeśli mamy już ulicę (poziom UlicaPage), pytamy tylko o numer */
  prefilledUlica?: { ulica: string; id_ulicy: string };
}

// Sanityzacja inputu - usuwa potencjalnie szkodliwe znaki
function sanitize(input: string): string {
  return input
    .replace(/[<>'"`;(){}[\]\\]/g, '') // usuń znaki specjalne
    .trim()
    .slice(0, 100); // max 100 znaków
}

export default function AddressModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  miejscowosc, 
  simc,
  prefilledUlica 
}: Props) {
  const [hasStreets, setHasStreets] = useState(true);
  const [streets, setStreets] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  
  const [streetQuery, setStreetQuery] = useState('');
  const [numberQuery, setNumberQuery] = useState('');
  
  const [selectedStreet, setSelectedStreet] = useState<any>(prefilledUlica || null);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);

  // Sprawdź czy miejscowość ma ulice
  useEffect(() => {
    if (!simc) return;
    cityHasStreets(simc).then(setHasStreets);
  }, [simc]);

  // Szukaj ulic
  useEffect(() => {
    if (!simc || !hasStreets || prefilledUlica) return;
    
    const query = sanitize(streetQuery);
    if (query.length < 2) {
      setStreets([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchStreets(simc, query);
        setStreets(result);
      } catch {
        setStreets([]);
      }
      setLoading(false);
    }, 250);
    
    return () => clearTimeout(timer);
  }, [streetQuery, simc, hasStreets, prefilledUlica]);

  // Szukaj numerów
  useEffect(() => {
    const id_ulicy = selectedStreet?.id_ulicy || (hasStreets ? null : '00000');
    if (!id_ulicy) {
      setNumbers([]);
      return;
    }
    
    const query = sanitize(numberQuery);
    if (query.length < 1) {
      setNumbers([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchNumbers(id_ulicy, query);
        setNumbers(result);
      } catch {
        setNumbers([]);
      }
      setLoading(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [numberQuery, selectedStreet, hasStreets]);

  // Reset przy zamknięciu
  useEffect(() => {
    if (!isOpen) {
      if (!prefilledUlica) {
        setSelectedStreet(null);
        setStreetQuery('');
      }
      setSelectedNumber(null);
      setNumberQuery('');
      setStreets([]);
      setNumbers([]);
    }
  }, [isOpen, prefilledUlica]);

  const handleConfirm = useCallback(() => {
    if (!selectedNumber) return;
    
    onConfirm({
      ulica: selectedStreet?.ulica || '',
      nr: selectedNumber.nr,
      id_ulicy: selectedStreet?.id_ulicy || '00000'
    });
  }, [selectedStreet, selectedNumber, onConfirm]);

  // ESC zamyka modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const needsStreet = hasStreets && !prefilledUlica && !selectedStreet;
  const canConfirm = selectedNumber !== null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Zamknij"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl font-bold">
            {prefilledUlica ? 'Podaj numer budynku' : 'Podaj dokładny adres'}
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Sprawdzimy dostępność oferty
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Miejscowość - readonly */}
          <div className="p-3 bg-gray-100 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Miejscowość</p>
            <p className="font-bold text-gray-900">{miejscowosc}</p>
          </div>

          {/* Ulica */}
          {hasStreets && !prefilledUlica && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ulica
              </label>
              {selectedStreet ? (
                <div className="relative p-3 bg-green-50 border-2 border-green-500 rounded-xl">
                  <span className="font-bold text-green-900">{selectedStreet.ulica}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStreet(null);
                      setSelectedNumber(null);
                      setNumberQuery('');
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={streetQuery}
                    onChange={e => setStreetQuery(sanitize(e.target.value))}
                    placeholder="Wpisz nazwę ulicy..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900"
                    autoComplete="off"
                  />
                  {loading && (
                    <div className="absolute right-3 top-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {streets.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {streets.map((street, i) => (
                        <button
                          key={`${street.id_ulicy}-${i}`}
                          type="button"
                          onClick={() => {
                            setSelectedStreet(street);
                            setStreets([]);
                            setStreetQuery('');
                          }}
                          className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 text-gray-900"
                        >
                          {street.ulica}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Prefilled ulica */}
          {prefilledUlica && (
            <div className="p-3 bg-gray-100 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Ulica</p>
              <p className="font-bold text-gray-900">{prefilledUlica.ulica}</p>
            </div>
          )}

          {/* Numer budynku */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numer budynku
            </label>
            {selectedNumber ? (
              <div className="relative p-3 bg-green-50 border-2 border-green-500 rounded-xl text-center">
                <span className="font-bold text-green-900 text-xl">{selectedNumber.nr}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNumber(null);
                    setNumberQuery('');
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={numberQuery}
                  onChange={e => setNumberQuery(sanitize(e.target.value))}
                  placeholder={needsStreet ? "Najpierw wybierz ulicę..." : "Wpisz numer..."}
                  disabled={needsStreet}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  autoComplete="off"
                />
                {loading && !needsStreet && (
                  <div className="absolute right-3 top-3">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {numbers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto p-2">
                    <div className="grid grid-cols-5 gap-1">
                      {numbers.map((num, i) => (
                        <button
                          key={`${num.id}-${i}`}
                          type="button"
                          onClick={() => {
                            setSelectedNumber(num);
                            setNumbers([]);
                            setNumberQuery('');
                          }}
                          className="p-2 bg-gray-100 hover:bg-blue-500 hover:text-white rounded font-bold text-sm text-gray-900 transition-colors"
                        >
                          {num.nr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Przycisk */}
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
          >
            Sprawdź dostępność
          </button>

          <p className="text-xs text-gray-500 text-center">
            Podanie adresu pozwoli zweryfikować dostępność usług
          </p>
        </div>
      </div>
    </div>
  );
}

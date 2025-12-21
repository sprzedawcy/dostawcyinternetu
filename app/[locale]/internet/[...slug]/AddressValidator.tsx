"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { searchStreets, searchNumbers, cityHasStreets } from "@/src/features/coverage/actions/search";
import { searchOffersForAddress } from "@/src/features/offers/actions/search";

interface Props {
  miejscowosc: string;
  miejscowoscSlug: string;
  simc: string;
  offer: any;
  onAddressComplete: (address: { miejscowosc: string; ulica: string; nr: string; hpCount?: number }) => void;
}

export default function AddressValidator({ miejscowosc, miejscowoscSlug, simc, offer, onAddressComplete }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [streets, setStreets] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  
  const [streetQuery, setStreetQuery] = useState('');
  const [numberQuery, setNumberQuery] = useState('');
  
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [hasStreets, setHasStreets] = useState(true);
  
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'available' | 'unavailable' | null>(null);

  useEffect(() => {
    const checkStreets = async () => {
      if (simc) {
        const result = await cityHasStreets(simc);
        setHasStreets(result);
      }
    };
    checkStreets();
  }, [simc]);

  useEffect(() => {
    if (!simc || !hasStreets || streetQuery.length < 2) {
      setStreets([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoadingStreets(true);
      try {
        const result = await searchStreets(simc, streetQuery);
        setStreets(result);
      } catch (err) {
        console.error('Blad szukania ulic:', err);
      }
      setLoadingStreets(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [streetQuery, simc, hasStreets]);

  useEffect(() => {
    if (!selectedStreet && hasStreets) {
      setNumbers([]);
      return;
    }
    
    if (numberQuery.length < 1) {
      setNumbers([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoadingNumbers(true);
      try {
        const id_ulicy = selectedStreet?.id_ulicy || '00000';
        const result = await searchNumbers(id_ulicy, numberQuery);
        setNumbers(result);
      } catch (err) {
        console.error('Blad szukania numerow:', err);
      }
      setLoadingNumbers(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [numberQuery, selectedStreet, hasStreets]);

  const handleConfirm = async () => {
    if (!selectedNumber) return;
    
    setChecking(true);
    
    try {
      const id_ulicy = selectedStreet?.id_ulicy || '00000';
      const results = await searchOffersForAddress(simc, id_ulicy, selectedNumber.nr);
      
      const isOfferAvailable = results.offers?.some((o: any) => o.id === offer.id);
      
      if (isOfferAvailable) {
        setCheckResult('available');
        
        const operatorData = results.address?.operators?.find(
          (op: any) => op.slug === offer.operator?.slug
        );
        const hpCount = operatorData?.hp_count || null;
        
        const newAddress = {
          miejscowosc,
          ulica: selectedStreet?.ulica || '',
          nr: selectedNumber.nr,
          hpCount
        };
        
        const newAdresParam = encodeURIComponent(
          `${miejscowosc}|${newAddress.ulica}|${newAddress.nr}|${miejscowoscSlug}|${simc}|${hpCount || ''}`
        );
        
        const newUrl = `${pathname}?adres=${newAdresParam}`;
        router.replace(newUrl);
        
        setTimeout(() => {
          onAddressComplete(newAddress);
        }, 1500);
      } else {
        setCheckResult('unavailable');
      }
    } catch (err) {
      console.error('Blad sprawdzania dostepnosci:', err);
      setCheckResult('unavailable');
    }
    
    setChecking(false);
  };

  const handleGoToResults = () => {
    const id_ulicy = selectedStreet?.id_ulicy || '00000';
    const params = new URLSearchParams({
      simc: simc,
      id_ulicy: id_ulicy,
      nr: selectedNumber?.nr || ''
    });
    router.push(`/?${params.toString()}`);
  };

  if (checkResult === 'available') {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-green-500" id="kontakt">
        <div className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Oferta dostepna!</h3>
          <p className="text-green-100">
            {offer.nazwa} jest dostepna pod adresem:<br />
            <strong>{miejscowosc}{selectedStreet?.ulica ? `, ${selectedStreet.ulica}` : ''} {selectedNumber?.nr}</strong>
          </p>
        </div>
        <div className="p-4 text-center">
          <div className="animate-pulse text-gray-600">Ladowanie formularza kontaktowego...</div>
        </div>
      </div>
    );
  }

  if (checkResult === 'unavailable') {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-red-500" id="kontakt">
        <div className="p-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Oferta niedostepna</h3>
          <p className="text-red-100">
            Niestety ta oferta nie jest dostepna pod adresem:<br />
            <strong>{miejscowosc}{selectedStreet?.ulica ? `, ${selectedStreet.ulica}` : ''} {selectedNumber?.nr}</strong>
          </p>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 text-center">
            Sprawdz inne oferty dostepne pod Twoim adresem:
          </p>
          <button
            onClick={handleGoToResults}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-lg"
          >
            Zobacz dostepne oferty
          </button>
          <button
            onClick={() => {
              setCheckResult(null);
              setSelectedStreet(null);
              setSelectedNumber(null);
              setNumberQuery('');
            }}
            className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
          >
            Sprawdz inny adres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-orange-500" id="kontakt">
      <div className="p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <h2 className="text-xl font-bold mb-1">
          Doprecyzuj adres instalacji
        </h2>
        <p className="text-orange-100 text-sm">
          Podaj ulice i numer budynku, zeby sprawdzic dostepnosc oferty
        </p>
      </div>

      <div className="p-5 space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-gray-700 mb-1">Miejscowosc</p>
          <p className="text-gray-900 font-bold">{miejscowosc}</p>
        </div>

        {hasStreets && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ulica</label>
            {selectedStreet ? (
              <div className="relative p-4 bg-green-100 border-2 border-green-500 rounded-xl">
                <div className="font-bold text-green-900">{selectedStreet.ulica}</div>
                <button
                  type="button"
                  onClick={() => { setSelectedStreet(null); setSelectedNumber(null); setNumberQuery(''); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700"
                >✕</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={streetQuery}
                  onChange={(e) => setStreetQuery(e.target.value)}
                  placeholder="Wpisz nazwe ulicy..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none text-gray-900"
                />
                {loadingStreets && (
                  <div className="absolute right-4 top-3">
                    <div className="animate-spin h-6 w-6 border-4 border-orange-600 rounded-full border-t-transparent"></div>
                  </div>
                )}
                {streets.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {streets.map((street, index) => (
                      <button
                        key={`${street.id_ulicy}-${index}`}
                        type="button"
                        onClick={() => { setSelectedStreet(street); setStreets([]); setStreetQuery(''); }}
                        className="w-full p-3 text-left hover:bg-orange-100 border-b border-gray-200 last:border-0 font-medium text-gray-900"
                      >{street.ulica}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Numer budynku *</label>
          {selectedNumber ? (
            <div className="relative p-4 bg-green-100 border-2 border-green-500 rounded-xl">
              <div className="font-bold text-green-900 text-center text-2xl">{selectedNumber.nr}</div>
              <button
                type="button"
                onClick={() => { setSelectedNumber(null); setNumberQuery(''); }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700"
              >✕</button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={numberQuery}
                onChange={(e) => setNumberQuery(e.target.value)}
                placeholder={hasStreets && !selectedStreet ? "Najpierw wybierz ulice..." : "Wpisz numer..."}
                disabled={hasStreets && !selectedStreet}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {loadingNumbers && (
                <div className="absolute right-4 top-3">
                  <div className="animate-spin h-6 w-6 border-4 border-orange-600 rounded-full border-t-transparent"></div>
                </div>
              )}
              {numbers.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {numbers.map((num, index) => (
                      <button
                        key={`${num.id}-${index}`}
                        type="button"
                        onClick={() => { setSelectedNumber(num); setNumbers([]); setNumberQuery(''); }}
                        className="p-2 bg-gray-100 hover:bg-orange-500 hover:text-white rounded font-bold text-sm text-gray-900"
                      >{num.nr}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedNumber || checking}
          className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:bg-gray-400 text-lg"
        >
          {checking ? 'Sprawdzam dostepnosc...' : 'Sprawdz dostepnosc oferty'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Podanie dokladnego adresu pozwoli sprawdzic dostepnosc uslug
        </p>
      </div>
    </div>
  );
}

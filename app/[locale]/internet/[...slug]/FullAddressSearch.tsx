"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { searchCities, searchStreets, searchNumbers, cityHasStreets } from "@/src/features/coverage/actions/search";
import { searchOffersForAddress } from "@/src/features/offers/actions/search";

interface Props {
  offer: any;
  onAddressComplete: (address: { miejscowosc: string; ulica: string; nr: string; simc: string; miejscowoscSlug: string; hpCount?: number }) => void;
}

export default function FullAddressSearch({ offer, onAddressComplete }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [cities, setCities] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  
  const [cityQuery, setCityQuery] = useState('');
  const [streetQuery, setStreetQuery] = useState('');
  const [numberQuery, setNumberQuery] = useState('');
  
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [hasStreets, setHasStreets] = useState(true);
  
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'available' | 'unavailable' | null>(null);

  useEffect(() => {
    if (cityQuery.length < 2) { setCities([]); return; }
    const timer = setTimeout(async () => {
      setLoadingCities(true);
      try {
        const result = await searchCities(cityQuery);
        setCities(result);
      } catch (err) { console.error('Blad szukania miejscowosci:', err); }
      setLoadingCities(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  useEffect(() => {
    if (selectedCity?.simc) { cityHasStreets(selectedCity.simc).then(setHasStreets); }
  }, [selectedCity]);

  useEffect(() => {
    if (!selectedCity?.simc || !hasStreets || streetQuery.length < 2) { setStreets([]); return; }
    const timer = setTimeout(async () => {
      setLoadingStreets(true);
      try {
        const result = await searchStreets(selectedCity.simc, streetQuery);
        setStreets(result);
      } catch (err) { console.error('Blad szukania ulic:', err); }
      setLoadingStreets(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [streetQuery, selectedCity, hasStreets]);

  useEffect(() => {
    if (!selectedStreet && hasStreets) { setNumbers([]); return; }
    if (numberQuery.length < 1) { setNumbers([]); return; }
    const timer = setTimeout(async () => {
      setLoadingNumbers(true);
      try {
        const id_ulicy = selectedStreet?.id_ulicy || '00000';
        const result = await searchNumbers(id_ulicy, numberQuery);
        setNumbers(result);
      } catch (err) { console.error('Blad szukania numerow:', err); }
      setLoadingNumbers(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [numberQuery, selectedStreet, hasStreets]);

  const handleCitySelect = (city: any) => {
    setSelectedCity(city); setCities([]); setCityQuery('');
  };

  const handleStreetSelect = (street: any) => {
    setSelectedStreet(street); setStreets([]); setStreetQuery('');
  };

  const handleNumberSelect = async (num: any) => {
    setSelectedNumber(num); setNumbers([]); setNumberQuery('');
    setChecking(true);
    
    try {
      const id_ulicy = selectedStreet?.id_ulicy || '00000';
      const results = await searchOffersForAddress(selectedCity.simc, id_ulicy, num.nr);
      const isOfferAvailable = results.offers?.some((o: any) => o.id === offer.id);
      
      if (isOfferAvailable) {
        setCheckResult('available');
        const operatorData = results.address?.operators?.find((op: any) => op.slug === offer.operator?.slug);
        const hpCount = operatorData?.hp_count || null;
        const miejscowoscSlug = selectedCity.nazwa.toLowerCase().replace(/\s+/g, '-');
        const newAddress = {
          miejscowosc: selectedCity.nazwa,
          ulica: selectedStreet?.ulica || '',
          nr: num.nr,
          simc: selectedCity.simc,
          miejscowoscSlug,
          hpCount
        };
        const newAdresParam = encodeURIComponent(
          `${newAddress.miejscowosc}|${newAddress.ulica}|${newAddress.nr}|${miejscowoscSlug}|${selectedCity.simc}|${hpCount || ''}`
        );
        router.replace(`${pathname}?adres=${newAdresParam}`);
        setTimeout(() => { onAddressComplete(newAddress); }, 1500);
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
    const params = new URLSearchParams({ simc: selectedCity.simc, id_ulicy, nr: selectedNumber?.nr || '' });
    router.push(`/?${params.toString()}`);
  };

  const resetSearch = () => {
    setSelectedCity(null); setSelectedStreet(null); setSelectedNumber(null);
    setCheckResult(null); setCityQuery(''); setStreetQuery(''); setNumberQuery('');
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
          <p className="text-green-100">{offer.nazwa} jest dostepna pod adresem:<br />
            <strong>{selectedCity?.nazwa}{selectedStreet?.ulica ? `, ${selectedStreet.ulica}` : ''} {selectedNumber?.nr}</strong>
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
          <p className="text-red-100">Niestety ta oferta nie jest dostepna pod adresem:<br />
            <strong>{selectedCity?.nazwa}{selectedStreet?.ulica ? `, ${selectedStreet.ulica}` : ''} {selectedNumber?.nr}</strong>
          </p>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 text-center">Sprawdz inne oferty dostepne pod Twoim adresem:</p>
          <button onClick={handleGoToResults} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-lg">
            Zobacz dostepne oferty
          </button>
          <button onClick={resetSearch} className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors">
            Sprawdz inny adres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-blue-500" id="kontakt">
      <div className="p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <h2 className="text-xl font-bold mb-1">Sprawdz dostepnosc oferty</h2>
        <p className="text-blue-100 text-sm">Podaj adres, zeby sprawdzic czy {offer.nazwa} jest dostepna</p>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Miejscowosc *</label>
          {selectedCity ? (
            <div className="relative p-4 bg-green-100 border-2 border-green-500 rounded-xl">
              <div className="font-bold text-green-900">{selectedCity.nazwa}</div>
              {selectedCity.powiat && <div className="text-sm text-green-700">{selectedCity.powiat}</div>}
              <button type="button" onClick={() => { setSelectedCity(null); setSelectedStreet(null); setSelectedNumber(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700">✕</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={cityQuery} onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Wpisz nazwe miejscowosci..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900" />
              {loadingCities && <div className="absolute right-4 top-3"><div className="animate-spin h-6 w-6 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>}
              {cities.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {cities.map((city) => (
                    <button key={city.simc} type="button" onClick={() => handleCitySelect(city)}
                      className="w-full p-3 text-left hover:bg-blue-100 border-b border-gray-200 last:border-0">
                      <div className="font-medium text-gray-900">{city.nazwa}</div>
                      {city.powiat && <div className="text-sm text-gray-500">{city.powiat}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedCity && hasStreets && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ulica</label>
            {selectedStreet ? (
              <div className="relative p-4 bg-green-100 border-2 border-green-500 rounded-xl">
                <div className="font-bold text-green-900">{selectedStreet.ulica}</div>
                <button type="button" onClick={() => { setSelectedStreet(null); setSelectedNumber(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input type="text" value={streetQuery} onChange={(e) => setStreetQuery(e.target.value)}
                  placeholder="Wpisz nazwe ulicy..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900" />
                {loadingStreets && <div className="absolute right-4 top-3"><div className="animate-spin h-6 w-6 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>}
                {streets.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {streets.map((street, index) => (
                      <button key={`${street.id_ulicy}-${index}`} type="button" onClick={() => handleStreetSelect(street)}
                        className="w-full p-3 text-left hover:bg-blue-100 border-b border-gray-200 last:border-0 font-medium text-gray-900">{street.ulica}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedCity && (hasStreets ? selectedStreet : true) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer budynku *</label>
            {selectedNumber ? (
              <div className="relative p-4 bg-green-100 border-2 border-green-500 rounded-xl">
                <div className="font-bold text-green-900 text-center text-2xl">{selectedNumber.nr}</div>
              </div>
            ) : (
              <div className="relative">
                <input type="text" value={numberQuery} onChange={(e) => setNumberQuery(e.target.value)}
                  placeholder="Wpisz numer..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900" />
                {loadingNumbers && <div className="absolute right-4 top-3"><div className="animate-spin h-6 w-6 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>}
                {numbers.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-1 p-2">
                      {numbers.map((num, index) => (
                        <button key={`${num.id}-${index}`} type="button" onClick={() => handleNumberSelect(num)}
                          className="p-2 bg-gray-100 hover:bg-blue-500 hover:text-white rounded font-bold text-sm text-gray-900">{num.nr}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {checking && (
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-2"></div>
            <p className="text-blue-700 font-medium">Sprawdzam dostepnosc oferty...</p>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">Podanie dokladnego adresu pozwoli sprawdzic dostepnosc uslug</p>
      </div>
    </div>
  );
}

"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchCities, searchStreets, searchNumbers, cityHasStreets } from "@/src/features/coverage/actions/search";

// Helper do tworzenia slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function SearchManager() {
  const router = useRouter();
  
  // City
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [cityHasStreetsFlag, setCityHasStreetsFlag] = useState(true);
  
  // Street
  const [streetQuery, setStreetQuery] = useState('');
  const [streets, setStreets] = useState<any[]>([]);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  
  // Number
  const [numberQuery, setNumberQuery] = useState('');
  const [numbers, setNumbers] = useState<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  
  // Loading
  const [loading, setLoading] = useState(false);

  // City search
  useEffect(() => {
    if (cityQuery.length < 2) {
      setCities([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchCities(cityQuery);
      setCities(res);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  // Street search
  useEffect(() => {
    if (!selectedCity || !cityHasStreetsFlag || streetQuery.length < 2) {
      setStreets([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchStreets(selectedCity.simc, streetQuery);
      setStreets(res);
    }, 300);
    return () => clearTimeout(timer);
  }, [streetQuery, selectedCity, cityHasStreetsFlag]);

  // Number search (po wpisaniu 1 znaku)
  useEffect(() => {
    if (!selectedCity) {
      setNumbers([]);
      return;
    }
    
    if (numberQuery.length < 1) {
      setNumbers([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoadingNumbers(true);
      const res = await searchNumbers(
        selectedStreet?.id_ulicy || '00000',
        numberQuery
      );
      setNumbers(res);
      setLoadingNumbers(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [numberQuery, selectedCity, selectedStreet]);

  const handleCitySelect = async (city: any) => {
    setSelectedCity(city);
    setCities([]);
    setCityQuery('');
    
    const hasStreets = await cityHasStreets(city.simc);
    setCityHasStreetsFlag(hasStreets);
  };

  const handleSearch = async () => {
    if (!selectedCity) {
      alert('Wybierz miejscowość');
      return;
    }
    
    setLoading(true);
    
    // Buduj URL
    const citySlug = slugify(selectedCity.nazwa);
    let url = `/internet/${citySlug}`;
    
    if (selectedStreet) {
      const streetSlug = slugify(selectedStreet.ulica);
      url += `/${streetSlug}`;
    }
    
    if (selectedNumber) {
      url += `/${selectedNumber.nr}`;
    }
    
    // Przekieruj na stronę
    router.push(url);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* MIASTO */}
        <div>
          <label className="block font-bold text-gray-900 mb-2">Miejscowość *</label>
          {selectedCity ? (
            <div className="relative p-4 bg-green-100 border-4 border-green-500 rounded-xl">
              <div className="font-bold text-green-900">{selectedCity.nazwa}</div>
              <div className="text-xs text-green-700">{selectedCity.powiat}</div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCity(null);
                  setSelectedStreet(null);
                  setSelectedNumber(null);
                  setCityHasStreetsFlag(true);
                  setNumberQuery('');
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Wpisz nazwę..."
                className="w-full p-4 border-4 border-gray-300 rounded-xl font-bold focus:border-blue-500 focus:outline-none text-gray-900"
              />
              {cities.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border-4 border-gray-300 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleCitySelect(city)}
                      className="w-full p-4 text-left hover:bg-blue-100 border-b-2 border-gray-200 last:border-0"
                    >
                      <div className="font-bold text-gray-900">{city.nazwa}</div>
                      <div className="text-sm text-gray-600">{city.powiat}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ULICA */}
        <div>
          <label className="block font-bold text-gray-900 mb-2">
            Ulica {!cityHasStreetsFlag && selectedCity && '(brak)'}
          </label>
          {selectedStreet ? (
            <div className="relative p-4 bg-green-100 border-4 border-green-500 rounded-xl">
              <div className="font-bold text-green-900">{selectedStreet.ulica}</div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStreet(null);
                  setSelectedNumber(null);
                  setNumberQuery('');
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={streetQuery}
                onChange={(e) => setStreetQuery(e.target.value)}
                placeholder={!selectedCity ? "Wybierz miasto" : !cityHasStreetsFlag ? "Brak ulic" : "Wpisz ulicę..."}
                disabled={!selectedCity || !cityHasStreetsFlag}
                className="w-full p-4 border-4 border-gray-300 rounded-xl font-bold focus:border-blue-500 focus:outline-none disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-500 text-gray-900"
              />
              {streets.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border-4 border-gray-300 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  {streets.map((street) => (
                    <button
                      key={street.id}
                      type="button"
                      onClick={() => {
                        setSelectedStreet(street);
                        setStreets([]);
                        setStreetQuery('');
                        setSelectedNumber(null);
                        setNumberQuery('');
                      }}
                      className="w-full p-4 text-left hover:bg-blue-100 border-b-2 border-gray-200 last:border-0 font-bold text-gray-900"
                    >
                      {street.ulica}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedCity && !selectedStreet && cityHasStreetsFlag && (
            <p className="text-xs text-gray-500 mt-1">Opcjonalne</p>
          )}
        </div>

        {/* NUMER */}
        <div>
          <label className="block font-bold text-gray-900 mb-2">Numer</label>
          {selectedNumber ? (
            <div className="relative p-4 bg-green-100 border-4 border-green-500 rounded-xl">
              <div className="font-bold text-green-900 text-center text-2xl">{selectedNumber.nr}</div>
              <button
                type="button"
                onClick={() => {
                  setSelectedNumber(null);
                  setNumberQuery('');
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={numberQuery}
                onChange={(e) => setNumberQuery(e.target.value)}
                placeholder={!selectedCity ? "Wybierz miasto" : "Wpisz numer..."}
                disabled={!selectedCity}
                className="w-full p-4 border-4 border-gray-300 rounded-xl font-bold focus:border-blue-500 focus:outline-none disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-500 text-gray-900"
              />
              {loadingNumbers && (
                <div className="absolute right-4 top-4">
                  <div className="animate-spin h-6 w-6 border-4 border-blue-600 rounded-full border-t-transparent"></div>
                </div>
              )}
              {numbers.length > 0 && !loadingNumbers && (
                <div className="absolute z-50 w-full mt-2 bg-white border-4 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {numbers.map((num) => (
                      <button
                        key={num.id}
                        type="button"
                        onClick={() => {
                          setSelectedNumber(num);
                          setNumberQuery('');
                          setNumbers([]);
                        }}
                        className="p-2 bg-gray-100 hover:bg-blue-500 hover:text-white rounded font-bold text-sm text-gray-900"
                      >
                        {num.nr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {selectedCity && !selectedNumber && (
            <p className="text-xs text-gray-500 mt-1">Opcjonalne</p>
          )}
        </div>
      </div>

      {/* PRZYCISK */}
      <button
        onClick={handleSearch}
        disabled={!selectedCity || loading}
        className="w-full bg-black text-white py-5 rounded-xl text-xl font-black hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
      >
        {loading ? '⏳ PRZEKIEROWUJĘ...' : '🔍 SPRAWDŹ OFERTY'}
      </button>
    </div>
  );
}

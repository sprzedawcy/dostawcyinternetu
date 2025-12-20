"use client";
import { useState, useEffect } from "react";
import { searchCities, searchStreets, searchNumbers } from "../actions/search";

interface Props {
  onCitySelect: (city: any) => void;
  onStreetSelect: (street: any) => void;
  onNumberSelect: (number: any) => void;
}

export default function AddressSearch({ onCitySelect, onStreetSelect, onNumberSelect }: Props) {
  // City
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [loadingCities, setLoadingCities] = useState(false);
  
  // Street
  const [streetQuery, setStreetQuery] = useState('');
  const [streets, setStreets] = useState<any[]>([]);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [loadingStreets, setLoadingStreets] = useState(false);
  
  // Number
  const [numberQuery, setNumberQuery] = useState('');
  const [numbers, setNumbers] = useState<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  const [loadingNumbers, setLoadingNumbers] = useState(false);

  // Debounced city search
  useEffect(() => {
    if (cityQuery.length < 2) {
      setCities([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoadingCities(true);
      const results = await searchCities(cityQuery);
      setCities(results);
      setLoadingCities(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [cityQuery]);

  // Debounced street search
  useEffect(() => {
    if (!selectedCity || streetQuery.length < 2) {
      setStreets([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoadingStreets(true);
      const results = await searchStreets(selectedCity.simc, streetQuery);
      setStreets(results);
      setLoadingStreets(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [streetQuery, selectedCity]);

  // Load numbers when street selected or when typing in number field
  useEffect(() => {
    if (!selectedStreet) return;
    
    const loadNumbers = async () => {
      setLoadingNumbers(true);
      const results = await searchNumbers(selectedStreet.id_ulicy, numberQuery);
      setNumbers(results);
      setLoadingNumbers(false);
    };
    
    loadNumbers();
  }, [selectedStreet, numberQuery]);

  const handleCitySelect = (city: any) => {
    setSelectedCity(city);
    onCitySelect(city);
    setCityQuery('');
    setCities([]);
  };

  const handleStreetSelect = (street: any) => {
    setSelectedStreet(street);
    onStreetSelect(street);
    setStreetQuery('');
    setStreets([]);
  };

  const handleNumberSelect = (number: any) => {
    setSelectedNumber(number);
    onNumberSelect(number);
    setNumberQuery('');
  };

  const resetCity = () => {
    setSelectedCity(null);
    setSelectedStreet(null);
    setSelectedNumber(null);
    onCitySelect(null);
    onStreetSelect(null);
    onNumberSelect(null);
  };

  const resetStreet = () => {
    setSelectedStreet(null);
    setSelectedNumber(null);
    onStreetSelect(null);
    onNumberSelect(null);
  };

  const resetNumber = () => {
    setSelectedNumber(null);
    onNumberSelect(null);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* MIEJSCOWOŚĆ */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Miejscowość *
        </label>
        {selectedCity ? (
          <div className="relative">
            <div className="px-4 py-3 bg-green-50 border-2 border-green-500 rounded-lg">
              <div className="font-bold text-green-900">{selectedCity.nazwa}</div>
              <div className="text-xs text-green-700">{selectedCity.powiat}</div>
            </div>
            <button
              type="button"
              onClick={resetCity}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-xs font-bold"
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
              placeholder="Wpisz miejscowość..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            {loadingCities && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 rounded-full border-t-transparent"></div>
              </div>
            )}
            {cities.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {cities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-200 last:border-0"
                  >
                    <div className="font-bold text-gray-900">{city.nazwa}</div>
                    <div className="text-xs text-gray-600">{city.powiat}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ULICA */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Ulica
        </label>
        {selectedStreet ? (
          <div className="relative">
            <div className="px-4 py-3 bg-green-50 border-2 border-green-500 rounded-lg">
              <div className="font-bold text-green-900">{selectedStreet.ulica}</div>
            </div>
            <button
              type="button"
              onClick={resetStreet}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-xs font-bold"
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
              placeholder={selectedCity ? "Wpisz ulicę..." : "Wybierz miasto"}
              disabled={!selectedCity}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {loadingStreets && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 rounded-full border-t-transparent"></div>
              </div>
            )}
            {streets.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {streets.map((street) => (
                  <button
                    key={street.id}
                    type="button"
                    onClick={() => handleStreetSelect(street)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-200 last:border-0 font-medium"
                  >
                    {street.ulica}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {selectedCity && !selectedStreet && (
          <p className="text-xs text-gray-500 mt-1">Zostaw puste dla całego miasta</p>
        )}
      </div>

      {/* NUMER */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Numer
        </label>
        {selectedNumber ? (
          <div className="relative">
            <div className="px-4 py-3 bg-green-50 border-2 border-green-500 rounded-lg">
              <div className="font-bold text-green-900">{selectedNumber.nr}</div>
            </div>
            <button
              type="button"
              onClick={resetNumber}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-xs font-bold"
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
              placeholder={selectedCity ? "Wpisz numer..." : "Wybierz miasto"}
              disabled={!selectedCity}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {loadingNumbers && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 rounded-full border-t-transparent"></div>
              </div>
            )}
            {numbers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                <div className="grid grid-cols-5 gap-1 p-2">
                  {numbers.map((num) => (
                    <button
                      key={num.id}
                      type="button"
                      onClick={() => handleNumberSelect(num)}
                      className="px-2 py-2 bg-gray-100 hover:bg-blue-500 hover:text-white rounded font-bold text-sm"
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
          <p className="text-xs text-gray-500 mt-1">Zostaw puste dla {selectedStreet ? 'całej ulicy' : 'całego miasta'}</p>
        )}
      </div>
    </div>
  );
}

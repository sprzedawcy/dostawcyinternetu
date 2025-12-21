"use client";
import { useState, useEffect } from "react";
import { searchCities, searchStreets, searchNumbers, cityHasStreets } from "@/src/features/coverage/actions/search";
import { searchOffersForAddress } from "@/src/features/offers/actions/search";
import Link from "next/link";

interface Props {
  operatorSlug: string;
  operatorName: string;
}

export default function OperatorCoverageSearch({ operatorSlug, operatorName }: Props) {
  const [cities, setCities] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [streetQuery, setStreetQuery] = useState('');
  const [numberQuery, setNumberQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  const [hasStreets, setHasStreets] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (cityQuery.length < 2) { setCities([]); return; }
    const timer = setTimeout(async () => {
      const res = await searchCities(cityQuery);
      setCities(res);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  useEffect(() => {
    if (selectedCity?.simc) {
      cityHasStreets(selectedCity.simc).then(setHasStreets);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (!selectedCity?.simc || !hasStreets || streetQuery.length < 2) { setStreets([]); return; }
    const timer = setTimeout(async () => {
      const res = await searchStreets(selectedCity.simc, streetQuery);
      setStreets(res);
    }, 300);
    return () => clearTimeout(timer);
  }, [streetQuery, selectedCity, hasStreets]);

  useEffect(() => {
    if (!selectedStreet && hasStreets) { setNumbers([]); return; }
    if (numberQuery.length < 1) { setNumbers([]); return; }
    const timer = setTimeout(async () => {
      const id_ulicy = selectedStreet?.id_ulicy || '00000';
      const res = await searchNumbers(id_ulicy, numberQuery);
      setNumbers(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [numberQuery, selectedStreet, hasStreets]);

  const handleCheck = async () => {
    if (!selectedCity || !selectedNumber) return;
    setChecking(true);
    const id_ulicy = selectedStreet?.id_ulicy || '00000';
    const res = await searchOffersForAddress(selectedCity.simc, id_ulicy, selectedNumber.nr);
    const operatorOffers = res.offers?.filter((o: any) => o.operator?.slug === operatorSlug) || [];
    setResult({
      available: operatorOffers.length > 0,
      offers: operatorOffers,
      address: `${selectedCity.nazwa}${selectedStreet?.ulica ? ', ' + selectedStreet.ulica : ''} ${selectedNumber.nr}`
    });
    setChecking(false);
  };

  const reset = () => {
    setSelectedCity(null); setSelectedStreet(null); setSelectedNumber(null);
    setCityQuery(''); setStreetQuery(''); setNumberQuery('');
    setResult(null);
  };

  if (result) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className={`p-6 rounded-xl mb-4 ${result.available ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
          <div className="text-center">
            <span className="text-5xl">{result.available ? '✅' : '❌'}</span>
            <h3 className="text-xl font-bold mt-3 mb-1">{result.available ? `${operatorName} jest dostępny!` : `${operatorName} niedostępny`}</h3>
            <p className="text-gray-600">{result.address}</p>
          </div>
        </div>
        {result.available && result.offers.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="font-bold text-gray-900">Dostępne oferty:</h4>
            {result.offers.map((offer: any) => (
              <Link key={offer.id} href={`/internet/${operatorSlug}/${offer.custom_url || offer.id}`}
                className="block p-4 border-2 rounded-xl hover:border-blue-500 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{offer.nazwa}</p>
                    <p className="text-sm text-gray-500">{offer.download_mbps}/{offer.upload_mbps} Mb/s</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{parseFloat(offer.abonament).toFixed(0)} zł</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        <button onClick={reset} className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300">
          Sprawdź inny adres
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="font-bold text-gray-900 mb-4">Sprawdź czy {operatorName} jest dostępny pod Twoim adresem</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Miejscowość</label>
          {selectedCity ? (
            <div className="relative p-3 bg-green-50 border-2 border-green-500 rounded-xl">
              <span className="font-bold text-green-800">{selectedCity.nazwa}</span>
              <button onClick={() => { setSelectedCity(null); setSelectedStreet(null); setSelectedNumber(null); }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600">✕</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={cityQuery} onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Wpisz miejscowość..." className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:ring-0" />
              {cities.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {cities.map((c) => (
                    <button key={c.simc} onClick={() => { setSelectedCity(c); setCities([]); setCityQuery(''); }}
                      className="w-full p-3 text-left hover:bg-blue-50 border-b last:border-0">
                      <span className="font-medium">{c.nazwa}</span>
                      {c.powiat && <span className="text-gray-500 text-sm ml-2">{c.powiat}</span>}
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
              <div className="relative p-3 bg-green-50 border-2 border-green-500 rounded-xl">
                <span className="font-bold text-green-800">{selectedStreet.ulica}</span>
                <button onClick={() => { setSelectedStreet(null); setSelectedNumber(null); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input type="text" value={streetQuery} onChange={(e) => setStreetQuery(e.target.value)}
                  placeholder="Wpisz ulicę..." className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:ring-0" />
                {streets.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {streets.map((s, i) => (
                      <button key={i} onClick={() => { setSelectedStreet(s); setStreets([]); setStreetQuery(''); }}
                        className="w-full p-3 text-left hover:bg-blue-50 border-b last:border-0 font-medium">{s.ulica}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedCity && (hasStreets ? selectedStreet : true) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer budynku</label>
            {selectedNumber ? (
              <div className="relative p-3 bg-green-50 border-2 border-green-500 rounded-xl text-center">
                <span className="font-bold text-green-800 text-xl">{selectedNumber.nr}</span>
                <button onClick={() => setSelectedNumber(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input type="text" value={numberQuery} onChange={(e) => setNumberQuery(e.target.value)}
                  placeholder="Wpisz numer..." className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:ring-0" />
                {numbers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg p-2">
                    <div className="grid grid-cols-5 gap-1">
                      {numbers.map((n, i) => (
                        <button key={i} onClick={() => { setSelectedNumber(n); setNumbers([]); setNumberQuery(''); }}
                          className="p-2 bg-gray-100 hover:bg-blue-500 hover:text-white rounded font-bold text-sm">{n.nr}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button onClick={handleCheck} disabled={!selectedCity || !selectedNumber || checking}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
          {checking ? 'Sprawdzam...' : '🔍 Sprawdź dostępność'}
        </button>
      </div>
    </div>
  );
}

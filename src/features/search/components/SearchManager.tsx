"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchCities, searchStreets, searchNumbers, cityHasStreets } from "@/src/features/coverage/actions/search";

interface Props {
  content: Record<string, string>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function SearchManager({ content }: Props) {
  const router = useRouter();
  
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [cityHasStreetsFlag, setCityHasStreetsFlag] = useState(true);
  
  const [streetQuery, setStreetQuery] = useState('');
  const [streets, setStreets] = useState<any[]>([]);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  
  const [numberQuery, setNumberQuery] = useState('');
  const [numbers, setNumbers] = useState<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!selectedCity || numberQuery.length < 1) {
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
    const citySlug = slugify(selectedCity.nazwa);
    let url = `/internet/${citySlug}`;
    if (selectedStreet) {
      url += `/${slugify(selectedStreet.ulica)}`;
    }
    if (selectedNumber) {
      url += `/${selectedNumber.nr}`;
    }
    router.push(url);
  };

  const clearCity = () => {
    setSelectedCity(null);
    setSelectedStreet(null);
    setSelectedNumber(null);
    setCityHasStreetsFlag(true);
    setNumberQuery('');
  };

  const clearStreet = () => {
    setSelectedStreet(null);
    setSelectedNumber(null);
    setNumberQuery('');
  };

  const clearNumber = () => {
    setSelectedNumber(null);
    setNumberQuery('');
  };

  return (
    <div className="search-card">
      <div className="search-grid">
        {/* MIASTO */}
        <div>
          <label className="form-label">{content['search.city_label']}</label>
          {selectedCity ? (
            <div className="selected-box">
              <div className="selected-box__title">{selectedCity.nazwa}</div>
              <div className="selected-box__subtitle">{selectedCity.powiat}</div>
              <button type="button" onClick={clearCity} className="selected-box__remove">✕</button>
            </div>
          ) : (
            <div className="input-wrapper">
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Wpisz nazwę..."
                className="form-input"
              />
              {cities.length > 0 && (
                <div className="dropdown">
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleCitySelect(city)}
                      className="dropdown-item"
                    >
                      <div className="dropdown-item__title">{city.nazwa}</div>
                      <div className="dropdown-item__subtitle">{city.powiat}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ULICA */}
        <div>
          <label className="form-label">
            {content['search.street_label']} {!cityHasStreetsFlag && selectedCity && '(brak)'}
          </label>
          {selectedStreet ? (
            <div className="selected-box">
              <div className="selected-box__title">{selectedStreet.ulica}</div>
              <button type="button" onClick={clearStreet} className="selected-box__remove">✕</button>
            </div>
          ) : (
            <div className="input-wrapper">
              <input
                type="text"
                value={streetQuery}
                onChange={(e) => setStreetQuery(e.target.value)}
                placeholder={!selectedCity ? "Wybierz miasto" : !cityHasStreetsFlag ? "Brak ulic" : "Wpisz ulicę..."}
                disabled={!selectedCity || !cityHasStreetsFlag}
                className="form-input"
              />
              {streets.length > 0 && (
                <div className="dropdown">
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
                      className="dropdown-item"
                    >
                      <div className="dropdown-item__title">{street.ulica}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedCity && !selectedStreet && cityHasStreetsFlag && (
            <p className="form-hint">Opcjonalne</p>
          )}
        </div>

        {/* NUMER */}
        <div>
          <label className="form-label">{content['search.number_label']}</label>
          {selectedNumber ? (
            <div className="selected-box">
              <div className="selected-box__value">{selectedNumber.nr}</div>
              <button type="button" onClick={clearNumber} className="selected-box__remove">✕</button>
            </div>
          ) : (
            <div className="input-wrapper">
              <input
                type="text"
                value={numberQuery}
                onChange={(e) => setNumberQuery(e.target.value)}
                placeholder={!selectedCity ? "Wybierz miasto" : "Wpisz numer..."}
                disabled={!selectedCity}
                className="form-input"
              />
              {loadingNumbers && (
                <div className="spinner-container">
                  <div className="spinner"></div>
                </div>
              )}
              {numbers.length > 0 && !loadingNumbers && (
                <div className="number-dropdown">
                  <div className="number-grid">
                    {numbers.map((num) => (
                      <button
                        key={num.id}
                        type="button"
                        onClick={() => {
                          setSelectedNumber(num);
                          setNumberQuery('');
                          setNumbers([]);
                        }}
                        className="number-grid__item"
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
            <p className="form-hint">Opcjonalne</p>
          )}
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={!selectedCity || loading}
        className="btn btn-search"
      >
        {loading ? '⏳ PRZEKIEROWUJĘ...' : `🔍 ${content['search.button']}`}
      </button>
    </div>
  );
}
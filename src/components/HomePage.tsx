"use client";

import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MapFacade from "./MapFacade";
import SearchManager from "../features/search/components/SearchManager";

const cities = [
  { name: "Warszawa", slug: "warszawa" },
  { name: "Kraków", slug: "krakow" },
  { name: "Wrocław", slug: "wroclaw" },
  { name: "Poznań", slug: "poznan" },
  { name: "Gdańsk", slug: "gdansk" },
  { name: "Łódź", slug: "lodz" },
  { name: "Katowice", slug: "katowice" },
  { name: "Lublin", slug: "lublin" },
];

const operators = [
  "Orange", "Play", "UPC", "Vectra", "Netia", "Plus", "T-Mobile", "Multimedia"
];

// Rate limiting
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem("_sr");
    const now = Date.now();
    if (!stored) {
      localStorage.setItem("_sr", JSON.stringify({ c: 1, t: now }));
      return true;
    }
    const data = JSON.parse(stored);
    if (now - data.t > RATE_WINDOW_MS) {
      localStorage.setItem("_sr", JSON.stringify({ c: 1, t: now }));
      return true;
    }
    if (data.c >= RATE_LIMIT) return false;
    localStorage.setItem("_sr", JSON.stringify({ c: data.c + 1, t: data.t }));
    return true;
  } catch {
    return true;
  }
}

export default function HomePage() {
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const isBot = honeypot.length > 0;

  const handleGeolocation = async () => {
    if (isBot) return;
    if (!checkRateLimit()) {
      setIsLocating(true);
      setTimeout(() => {
        setIsLocating(false);
        alert("Nie udało się pobrać lokalizacji. Spróbuj ponownie później.");
      }, 2000);
      return;
    }

    if (!navigator.geolocation) {
      alert("Twoja przeglądarka nie wspiera geolokalizacji.");
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        alert(`Lokalizacja pobrana!\n\n${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nReverse geocoding w przygotowaniu.`);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        alert("Nie udało się pobrać lokalizacji. Wpisz adres ręcznie.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
        aria-hidden="true"
      />
      
      <main className="flex-1 relative">
        {/* Mapa z mniejszymi pulsami */}
        <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
          <MapFacade />
        </div>
        
        <div className="relative z-10">
          <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 md:pt-12 pb-8">
            
            {/* CTA */}
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-3 md:mb-4 leading-tight">
                Znajdź <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">najlepszy internet</span>
                <br className="hidden sm:block" />
                <span> w Twojej okolicy</span>
              </h1>
              
              {/* Zmieniony tekst */}
              <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-medium">
                Porównaj oferty <strong className="text-gray-900">850+ dostawców internetu</strong>
              </p>
              
              <div className="flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-4 gap-y-1 text-sm sm:text-base text-gray-600 mt-3">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Bezpłatnie
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Instalacja już jutro
                </span>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <span className="hidden sm:flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Umowa z Operatorem bez pośredników
                </span>
              </div>
            </div>
            
            {/* Szukajka */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 border border-gray-200">
                
                {/* MOBILE */}
                <div className="sm:hidden">
                  {!showMobileForm ? (
                    <>
                      <button
                        onClick={handleGeolocation}
                        disabled={isLocating}
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70"
                      >
                        {isLocating ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Pobieram lokalizację...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Zlokalizuj mnie</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => setShowMobileForm(true)}
                        className="w-full mt-4 py-3 text-blue-600 hover:text-blue-700 font-medium text-base flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Wpisz adres ręcznie
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowMobileForm(false)}
                        className="mb-4 text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Wróć
                      </button>
                      
                      <div className="search-form-wrapper">
                        <SearchManager />
                      </div>
                    </>
                  )}
                </div>
                
                {/* DESKTOP */}
                <div className="hidden sm:block">
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={handleGeolocation}
                      disabled={isLocating}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 disabled:opacity-70"
                    >
                      {isLocating ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Lokalizuję...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Użyj mojej lokalizacji</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="search-form-wrapper">
                    <SearchManager />
                  </div>
                </div>
                
                {/* Style - CIEMNIEJSZE TEKSTY */}
                <style jsx global>{`
                  /* Inputy */
                  .search-form-wrapper input,
                  .search-form-wrapper select {
                    background: #f8fafc !important;
                    border: 2px solid #e2e8f0 !important;
                    border-radius: 12px !important;
                    color: #1e293b !important;
                    font-weight: 500 !important;
                    font-size: 16px !important;
                    padding: 14px 16px !important;
                    transition: all 0.2s ease !important;
                    width: 100% !important;
                  }
                  .search-form-wrapper input:focus,
                  .search-form-wrapper select:focus {
                    background: #ffffff !important;
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
                    outline: none !important;
                  }
                  .search-form-wrapper input::placeholder {
                    color: #64748b !important;
                  }
                  .search-form-wrapper label {
                    color: #1e293b !important;
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    margin-bottom: 6px !important;
                    display: block !important;
                  }
                  
                  /* DROPDOWN - CIEMNIEJSZE LITERY */
                  .search-form-wrapper ul,
                  .search-form-wrapper [role="listbox"] {
                    border-radius: 12px !important;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.08) !important;
                    background: white !important;
                  }
                  .search-form-wrapper li,
                  .search-form-wrapper [role="option"],
                  .search-form-wrapper ul li,
                  .search-form-wrapper ul button,
                  .search-form-wrapper ul a,
                  .search-form-wrapper [role="listbox"] > * {
                    color: #1e293b !important;
                    font-weight: 500 !important;
                  }
                  .search-form-wrapper li:hover,
                  .search-form-wrapper [role="option"]:hover {
                    background: #eff6ff !important;
                    color: #1d4ed8 !important;
                  }
                  /* Podpowiedzi miejscowości/ulic */
                  .search-form-wrapper [class*="suggestion"],
                  .search-form-wrapper [class*="option"],
                  .search-form-wrapper [class*="item"],
                  .search-form-wrapper [class*="result"] {
                    color: #1e293b !important;
                  }
                  
                  /* Niebieski X zamiast czerwonego */
                  .search-form-wrapper button[type="button"]:has(svg) {
                    background: #eff6ff !important;
                    border-color: #3b82f6 !important;
                  }
                  .search-form-wrapper button[type="button"] svg {
                    width: 14px !important;
                    height: 14px !important;
                    color: #3b82f6 !important;
                  }
                  .search-form-wrapper [class*="bg-red"] {
                    background-color: #eff6ff !important;
                  }
                  .search-form-wrapper [class*="text-red"] {
                    color: #3b82f6 !important;
                  }
                  .search-form-wrapper [class*="border-red"] {
                    border-color: #3b82f6 !important;
                  }
                  
                  /* Wybrana miejscowość */}
                  .search-form-wrapper [class*="selected"],
                  .search-form-wrapper input[readonly] {
                    border-color: #3b82f6 !important;
                    background: #eff6ff !important;
                  }
                  
                  /* Mobile: pola pod sobą */
                  @media (max-width: 639px) {
                    .search-form-wrapper form > div,
                    .search-form-wrapper > div > div {
                      display: flex;
                      flex-direction: column;
                      gap: 12px;
                    }
                  }
                  
                  /* Desktop: pola obok siebie */
                  @media (min-width: 640px) {
                    .search-form-wrapper form > div:first-child,
                    .search-form-wrapper > div > div:first-child {
                      display: flex;
                      flex-direction: row;
                      gap: 16px;
                    }
                    .search-form-wrapper form > div:first-child > div,
                    .search-form-wrapper > div > div:first-child > div {
                      flex: 1;
                    }
                  }
                  
                  /* Przycisk szukaj */
                  .search-form-wrapper button[type="submit"],
                  .search-form-wrapper form > button {
                    background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%) !important;
                    color: white !important;
                    font-weight: 700 !important;
                    font-size: 16px !important;
                    padding: 16px 24px !important;
                    border-radius: 12px !important;
                    border: none !important;
                    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35) !important;
                    transition: all 0.2s ease !important;
                    width: 100% !important;
                    margin-top: 12px !important;
                  }
                  @media (min-width: 640px) {
                    .search-form-wrapper button[type="submit"],
                    .search-form-wrapper form > button {
                      width: auto !important;
                      padding: 16px 32px !important;
                      font-size: 18px !important;
                    }
                  }
                  .search-form-wrapper button[type="submit"]:hover {
                    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45) !important;
                    transform: translateY(-1px) !important;
                  }
                `}</style>
              </div>
            </div>
            
            {/* Popularne miasta - CIEMNIEJSZY TEKST */}
            <div className="mt-6 sm:mt-8 md:mt-10 text-center">
              <p className="text-xs font-semibold text-gray-500 mb-2 sm:mb-3 uppercase tracking-wider">
                Popularne lokalizacje
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {cities.map((city) => (
                  <a
                    key={city.slug}
                    href={"/internet/" + city.slug}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-full text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
                  >
                    {city.name}
                  </a>
                ))}
              </div>
            </div>
            
            {/* Operatorzy - CIEMNIEJSZY TEKST */}
            <div className="hidden sm:block mt-10 md:mt-14 pt-8 border-t border-gray-100">
              <p className="text-center text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                Porównujemy oferty od 850+ dostawców internetu
              </p>
              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
                {operators.map((op) => (
                  <span 
                    key={op} 
                    className="text-sm md:text-base font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {op}
                  </span>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

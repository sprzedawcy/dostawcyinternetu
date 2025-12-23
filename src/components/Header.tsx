"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { searchCities } from "@/src/features/coverage/actions/search";

const menuItems = [
  { label: "Porównaj oferty", href: "/" },
  { label: "Operatorzy", href: "/dostawcy-internetu" },
  { label: "Blog", href: "/blog" },
];

const languages = [
  { code: "pl", label: "Polski", src: "https://flagcdn.com/w40/pl.png" },
  { code: "en", label: "English", src: "https://flagcdn.com/w40/gb.png" },
  { code: "ua", label: "Українська", src: "https://flagcdn.com/w40/ua.png" },
];

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

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("pl");
  const [mapMenuOpen, setMapMenuOpen] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapMenuRef = useRef<HTMLDivElement>(null);

  // Zamknij dropdown przy kliknięciu poza
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mapMenuRef.current && !mapMenuRef.current.contains(e.target as Node)) {
        setMapMenuOpen(false);
        setMapSearchQuery("");
        setMapSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prawdziwe wyszukiwanie miejscowości - używa tego samego API co szukajka
  useEffect(() => {
    if (mapSearchQuery.length < 2) {
      setMapSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(mapSearchQuery);
        setMapSuggestions(results);
      } catch (error) {
        console.error("Błąd wyszukiwania:", error);
        setMapSuggestions([]);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [mapSearchQuery]);

  const handleCitySelect = (city: any) => {
    const citySlug = slugify(city.nazwa);
    router.push(`/internet/${citySlug}`);
    setMapMenuOpen(false);
    setMapSearchQuery("");
    setMapSuggestions([]);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/dostawcyinternetu-logo.webp"
              alt="DostawcyInternetu.pl"
              width={160}
              height={28}
              className="h-5 sm:h-6 md:h-7 w-auto"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            
            {/* Mapa Internetu - dropdown z prawdziwym autocomplete */}
            <div className="relative" ref={mapMenuRef}>
              <button
                onClick={() => setMapMenuOpen(!mapMenuOpen)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  mapMenuOpen
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Mapa internetu
                <svg 
                  className={`w-4 h-4 transition-transform ${mapMenuOpen ? "rotate-180" : ""}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {mapMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Sprawdź internet w miejscowości</p>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                      placeholder="Wpisz nazwę miejscowości..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      autoFocus
                    />
                    
                    {isSearching && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Wyniki wyszukiwania */}
                  {mapSuggestions.length > 0 && (
                    <ul className="mt-2 border border-gray-100 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                      {mapSuggestions.map((city) => (
                        <li key={city.id}>
                          <button
                            onClick={() => handleCitySelect(city)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-50 last:border-0"
                          >
                            <div className="font-semibold text-gray-900">{city.nazwa}</div>
                            <div className="text-xs text-gray-500">{city.powiat}</div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {/* Brak wyników */}
                  {mapSearchQuery.length >= 2 && !isSearching && mapSuggestions.length === 0 && (
                    <p className="mt-2 text-sm text-gray-400 text-center py-3">
                      Nie znaleziono miejscowości
                    </p>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop: telefon + języki */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="tel:+48532274808"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">532 274 808</span>
            </a>

            <div className="w-px h-5 bg-gray-200" />

            {/* Flagi prostokątne */}
            <div className="flex items-center gap-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setCurrentLang(lang.code)}
                  className={`w-8 h-6 rounded overflow-hidden transition-all ${
                    currentLang === lang.code
                      ? "ring-2 ring-blue-500 ring-offset-1"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  title={lang.label}
                >
                  <img 
                    src={lang.src} 
                    alt={lang.label}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: telefon + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <a
              href="tel:+48532274808"
              className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md"
              title="Zadzwoń"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 bg-white">
            <nav className="flex flex-col gap-1 mb-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-base font-medium ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            <div className="h-px bg-gray-100 mx-4 my-3" />
            
            <a
              href="tel:+48532274808"
              className="mx-4 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Zadzwoń: +48 532 274 808
            </a>
            
            {/* Flagi prostokątne - mobile */}
            <div className="flex justify-center gap-2 mt-4">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setCurrentLang(lang.code)}
                  className={`w-10 h-7 rounded overflow-hidden transition-all ${
                    currentLang === lang.code
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  title={lang.label}
                >
                  <img 
                    src={lang.src} 
                    alt={lang.label}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

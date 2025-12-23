"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AddressSuggestion {
  id: string;
  display: string;
  miejscowosc: string;
  ulica?: string;
  nr?: string;
  slug: string;
  type: "miejscowosc" | "ulica" | "adres";
}

interface HomeSearchBoxProps {
  onSelect: (address: {
    miejscowosc: string;
    ulica?: string;
    nr?: string;
    slug: string;
  }) => void;
  isLoading?: boolean;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function HomeSearchBox({ onSelect, isLoading = false }: HomeSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsFetching(true);
    try {
      // TODO: Podłącz do swojego API
      // const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      // const data = await response.json();
      // setSuggestions(data.suggestions);

      // Mock data - zamień na prawdziwe API
      const mockSuggestions: AddressSuggestion[] = [
        {
          id: "1",
          display: `${searchQuery}, Mazowieckie`,
          miejscowosc: searchQuery,
          slug: searchQuery.toLowerCase().replace(/\s+/g, "-"),
          type: "miejscowosc",
        },
        {
          id: "2",
          display: `Warszawa, ul. ${searchQuery}`,
          miejscowosc: "Warszawa",
          ulica: searchQuery,
          slug: "warszawa",
          type: "ulica",
        },
        {
          id: "3",
          display: `Warszawa, ul. Marszałkowska ${searchQuery.match(/\d+/)?.[0] || "1"}`,
          miejscowosc: "Warszawa",
          ulica: "Marszałkowska",
          nr: searchQuery.match(/\d+/)?.[0] || "1",
          slug: "warszawa",
          type: "adres",
        },
      ];

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error("Błąd wyszukiwania:", error);
      setSuggestions([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    setQuery(suggestion.display);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect({
      miejscowosc: suggestion.miejscowosc,
      ulica: suggestion.ulica,
      nr: suggestion.nr,
      slug: suggestion.slug,
    });
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTypeIcon = (type: AddressSuggestion["type"]) => {
    switch (type) {
      case "miejscowosc":
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case "ulica":
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case "adres":
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: AddressSuggestion["type"]) => {
    switch (type) {
      case "miejscowosc":
        return "Miasto";
      case "ulica":
        return "Ulica";
      case "adres":
        return "Adres";
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="relative">
        {/* Input container */}
        <div className="relative bg-white rounded-2xl shadow-xl shadow-blue-500/10 border border-gray-100 overflow-hidden">
          <div className="flex items-center">
            {/* Search icon */}
            <div className="pl-5 pr-3">
              {isFetching ? (
                <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => query.length >= 2 && setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Wpisz miasto, ulicę lub adres..."
              className="flex-1 py-5 pr-4 text-lg text-gray-900 placeholder-gray-400 bg-transparent border-0 focus:outline-none focus:ring-0"
              autoComplete="off"
            />

            {/* Submit button */}
            <button
              onClick={() => {
                if (suggestions.length > 0) {
                  handleSelect(suggestions[0]);
                }
              }}
              disabled={isLoading || suggestions.length === 0}
              className="m-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="hidden sm:inline">Szukam...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Sprawdź oferty</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestions dropdown */}
        {isOpen && suggestions.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden"
          >
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id}>
                <button
                  onClick={() => handleSelect(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {getTypeIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate">
                      {suggestion.display}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded-full">
                    {getTypeLabel(suggestion.type)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {isOpen && query.length >= 2 && !isFetching && suggestions.length === 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">Nie znaleziono adresu</p>
            <p className="text-sm text-gray-400 mt-1">Sprawdź pisownię lub wpisz inny adres</p>
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="mt-3 text-center text-sm text-gray-500">
        Np. <span className="text-gray-700">Warszawa, Marszałkowska 1</span> lub <span className="text-gray-700">Kraków</span>
      </p>
    </div>
  );
}

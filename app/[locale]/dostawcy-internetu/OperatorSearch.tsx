"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cleanOperatorName } from "@/src/lib/operator-utils";

interface Operator {
  id: number;
  nazwa: string;
  slug: string;
  typ: string | null;
  logo_url: string | null;
}

interface Props {
  operators: Operator[];
}

export default function OperatorSearch({ operators }: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();

  // Filtruj operatorów po nazwie
  const filtered = query.length >= 2
    ? operators
        .filter(op => {
          const cleanedName = cleanOperatorName(op.nazwa).toLowerCase();
          const originalName = op.nazwa.toLowerCase();
          const q = query.toLowerCase();
          return cleanedName.includes(q) || originalName.includes(q);
        })
        .slice(0, 10) // Max 10 wyników
    : [];

  // Zamknij dropdown przy kliknięciu poza
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node) &&
          listRef.current && !listRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      goToOperator(filtered[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const goToOperator = (op: Operator) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/dostawca-internetu/${op.slug}`);
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Szukaj operatora..."
          className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown z wynikami */}
      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {filtered.map((op, index) => (
            <li key={op.id}>
              <button
                onClick={() => goToOperator(op)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                  index === highlightedIndex ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {op.logo_url ? (
                    <img src={op.logo_url} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {cleanOperatorName(op.nazwa).charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{cleanOperatorName(op.nazwa)}</div>
                  <div className="text-xs text-gray-500">
                    {op.typ === 'krajowy' && 'Operator krajowy'}
                    {op.typ === 'regionalny' && 'Operator regionalny'}
                    {(op.typ === 'lokalny' || !op.typ) && 'Operator lokalny'}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Brak wyników */}
      {isOpen && query.length >= 2 && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          Nie znaleziono operatora "{query}"
        </div>
      )}
    </div>
  );
}

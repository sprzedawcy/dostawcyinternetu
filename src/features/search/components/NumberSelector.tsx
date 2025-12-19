"use client"
import { useState, useEffect } from "react";
import { searchNumbers } from "../actions"; // upewnij się, że ścieżka jest ok

interface Props {
  cityName: string;  // NOWE: Nazwa miasta zamiast simc
  streetId: string;  // NOWE: Konkretne ID ulicy
  onSelect: (address: any) => void;
}

export default function NumberSelector({ cityName, streetId, onSelect }: Props) {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // WAŻNE: Tu wywołujemy nową wersję funkcji (Miasto + ID Ulicy)
      const data = await searchNumbers(cityName, streetId);
      setNumbers(data);
      setLoading(false);
    }
    
    if (cityName && streetId) {
      load();
    }
  }, [cityName, streetId]);

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Ładowanie numerów...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black text-black uppercase tracking-tight">Wybierz numer budynku</h3>
      
      {numbers.length === 0 ? (
        <div className="p-4 text-red-500 font-bold bg-red-50 rounded-xl">
          Brak numerów dla tej ulicy w tym mieście.
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto p-1">
          {numbers.map((addr, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(addr)}
              className="aspect-square flex items-center justify-center p-2 bg-white border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:text-blue-600 font-black transition-all text-sm shadow-sm hover:shadow-md"
            >
              {addr.nr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
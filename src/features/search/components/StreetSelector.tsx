"use client"
import { useState, useEffect } from "react";
import { safeSearchUlice } from "../actions";

interface Props {
  cityName: string;
  terytPowiat: string;
  onSelect: (street: any) => void;
}

export default function StreetSelector({ cityName, terytPowiat, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length === 0) {
      setResults([]);
      return;
    }

    if (query.length < 3) {
      setResults([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      const data = await safeSearchUlice(cityName, terytPowiat, query);
      setResults(data);
      setLoading(false);
    };
    load();
  }, [cityName, terytPowiat, query]);

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Wybierz ulicę</h3>
      <input
        type="text"
        autoFocus
        placeholder="Wpisz minimum 3 znaki..."
        className="w-full p-4 bg-gray-50 border rounded-xl mb-4 text-lg font-bold"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {loading && <div className="text-blue-500 font-bold p-2">⏳ Ładowanie...</div>}
      
      <div className="max-h-60 overflow-y-auto">
        {results.map((street, idx) => (
          <div 
            key={idx} 
            onClick={() => onSelect(street)} 
            className="p-3 hover:bg-blue-50 cursor-pointer font-medium border-b"
          >
            {street.ulica}
          </div>
        ))}
        {results.length === 0 && query.length >= 3 && !loading && (
          <div className="p-3 text-gray-500">Brak wyników...</div>
        )}
      </div>
    </div>
  );
}
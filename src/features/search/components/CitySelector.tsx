"use client"
import { useState } from "react";
import { searchMiejscowosci } from "../actions"; 

interface City {
  label: string;       
  teryt: string;  // 🔧 Zmienione z teryt_powiat na teryt
  simc: string;
  powiat: string;
}

interface Props {
  onSelect: (city: City) => void;
}

export default function CitySelector({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (val.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("🚀 Frontend wysyła:", val);
      const data = await searchMiejscowosci(val);
      console.log("✅ Frontend odebrał:", data);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Błąd pobierania danych");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-4 bg-white rounded-xl border-2 border-blue-100">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Test Izolowany: Miasta</h3>
      
      <input
        type="text"
        className="w-full p-4 bg-gray-50 border rounded-xl mb-4 text-lg font-bold outline-none focus:border-blue-500"
        placeholder="Wpisz cokolwiek (np. warsz)..."
        value={query}
        onChange={handleInput}
        autoFocus
      />
      
      {loading && <div className="text-blue-500 font-bold p-2">⏳ Ładowanie...</div>}
      {error && <div className="text-red-500 font-bold p-2">{error}</div>}

      <div className="max-h-[300px] overflow-y-auto border-t">
        {results.map((city, idx) => (
          <div 
            key={idx} 
            onClick={() => onSelect(city)}
            className="p-3 hover:bg-blue-50 cursor-pointer border-b"
          >
            <span className="font-bold">{city.label}</span>
            <span className="text-xs text-gray-500 ml-2">({city.powiat})</span>
          </div>
        ))}
        {results.length === 0 && query.length > 1 && !loading && (
          <div className="p-4 text-gray-400">Brak wyników.</div>
        )}
      </div>
    </div>
  );
}
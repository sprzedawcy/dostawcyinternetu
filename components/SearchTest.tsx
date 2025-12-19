"use client"

import { useState, useEffect } from 'react';
// Upewnij się, że ścieżka do actions jest poprawna
import { searchMiejscowosci, safeSearchUlice, searchNumbers } from '@/src/features/search/actions'; 

export default function SearchTest() {
  const [step, setStep] = useState<'CITY' | 'STREET' | 'NUMBER' | 'RESULT'>('CITY');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedStreetGroup, setSelectedStreetGroup] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Jeśli query jest puste i nie jesteśmy na etapie numerów, czyścimy wyniki
      if (step !== 'NUMBER' && query.length < 2) { setResults([]); return; }
      
      setLoading(true);
      try {
        let res: any[] = [];
        
        // 1. SZUKANIE MIASTA
        if (step === 'CITY') {
          res = await searchMiejscowosci(query);
        } 
        // 2. SZUKANIE ULICY
        else if (step === 'STREET' && selectedCity) {
          // 👇 DEBUG: Sprawdź w konsoli przeglądarki (F12), co dokładnie wysyłasz
          console.log("FRONTEND DEBUG: Cały obiekt miasta:", selectedCity);
          console.log("FRONTEND DEBUG: Wysyłam ID (simc):", selectedCity.simc);

          // Jeśli selectedCity.simc jest undefined, to znaczy że baza nie zwraca tego pola
          if (selectedCity.simc) {
             res = await safeSearchUlice(selectedCity.simc, query);
          } else {
             console.error("BŁĄD: Brak pola 'simc' w obiekcie miasta!");
          }
        } 
        // 3. SZUKANIE NUMERU
        else if (step === 'NUMBER' && selectedStreetGroup) {
          // Pobieramy numery dla konkretnego ID ulicy i miasta
          const allNumbers = await searchNumbers(selectedCity.simc, selectedStreetGroup.id_ulicy);
          
          // Filtrujemy numery po stronie klienta
          if (query) {
             res = allNumbers.filter((n: any) => n.nr.toLowerCase().includes(query.toLowerCase()));
          } else {
             res = allNumbers;
          }
        }
        
        setResults(res || []);
      } catch (err) { 
        console.error("Błąd wyszukiwania:", err);
        setResults([]); 
      } finally { 
        setLoading(false); 
      }
    };

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [query, step, selectedCity, selectedStreetGroup]);

  const handleSelect = (item: any) => {
    if (step === 'CITY') { 
      console.log("Wybrano miasto:", item);
      setSelectedCity(item); 
      setStep('STREET'); 
      setQuery(''); // Czyścimy input pod wpisywanie ulicy
    }
    else if (step === 'STREET') { 
      console.log("Wybrano ulicę:", item);
      setSelectedStreetGroup(item); 
      setStep('NUMBER'); 
      setQuery(''); // Czyścimy input pod wpisywanie numeru
    }
    else if (step === 'NUMBER') { 
      setSelectedAddress(item); 
      setStep('RESULT'); 
      setQuery('');
    }
  };

  // --- WIDOK WYNIKU ---
  if (step === 'RESULT' && selectedAddress) {
    const ops = [
      { n: 'Orange', v: selectedAddress.opl_hp },
      { n: 'T-Mobile', v: selectedAddress.timo_hp },
      { n: 'UPC/Play', v: selectedAddress.upc_hp },
      { n: 'Netia', v: selectedAddress.netia_hp },
      { n: 'Vectra', v: selectedAddress.vectra_hp }
    ].filter(o => Number(o.v || 0) > 0);
    
    const czyBlok = ops.some(o => Number(o.v) > 1) || Number(selectedAddress.hp) > 1;

    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-3xl shadow-2xl text-black border text-center font-sans">
        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${czyBlok ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
          {czyBlok ? "Budynek wielorodzinny / Blok" : "Dom jednorodzinny"}
        </span>
        <h2 className="text-2xl font-black mt-4">{selectedCity?.label}</h2>
        <p className="text-xl text-gray-500 font-bold">
          {selectedStreetGroup?.ulica} {selectedAddress.nr}
        </p>
        <div className="space-y-2 mt-6">
          {ops.length > 0 ? ops.map((o, i) => (
            <div key={i} className="flex justify-between p-4 bg-gray-50 rounded-2xl border font-black text-sm">
              <span>{o.n}</span> <span className="text-blue-600">{o.v} HP</span>
            </div>
          )) : (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">
              Brak ofert światłowodowych w bazie.
            </div>
          )}
        </div>
        <button onClick={() => window.location.reload()} className="w-full mt-8 py-4 bg-black text-white rounded-2xl font-black hover:bg-gray-800 transition-colors">
          NOWE SZUKANIE
        </button>
      </div>
    );
  }

  // --- WIDOK FORMULARZA ---
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl border overflow-hidden text-black font-sans">
      <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-black text-xl">
          {step === 'CITY' ? 'Wybierz Miasto' : step === 'STREET' ? 'Wybierz Ulicę' : 'Numer Budynku'}
        </h3>
        {loading && <div className="w-5 h-5 border-t-2 border-blue-600 rounded-full animate-spin"></div>}
      </div>

      <input
        type="text" 
        autoFocus 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder={step === 'CITY' ? "Np. Warszawa..." : step === 'STREET' ? "Np. Wilanowska..." : "Np. 5..."}
        className="w-full p-6 outline-none text-xl font-bold border-b focus:bg-blue-50/10 transition-colors"
      />

      <div className="max-h-[400px] overflow-y-auto">
        {results.length === 0 && query.length > 1 && !loading && (
          <div className="p-6 text-center text-gray-400 font-bold">Brak wyników</div>
        )}
        
        {results.map((item, idx) => (
          <div key={idx} onClick={() => handleSelect(item)} 
               className="mx-2 my-1 p-4 flex flex-row justify-between items-center hover:bg-blue-600 hover:text-white rounded-2xl cursor-pointer group transition-all">
            <div className="font-black text-lg truncate pr-2">
              {step === 'STREET' ? item.ulica : (step === 'CITY' ? item.label : `Budynek ${item.nr}`)}
            </div>
            
            {/* Wyświetlanie powiatu dla miast (jeśli istnieje) */}
            {step === 'CITY' && item.powiat && (
              <div className="flex-shrink-0 text-[11px] font-bold text-gray-400 group-hover:text-white bg-gray-100 group-hover:bg-blue-500 px-3 py-1.5 rounded-xl transition-colors">
                {item.powiat}
              </div>
            )}
            
            {/* Wyświetlanie strzałki dla ulic */}
            {step === 'STREET' && (
               <div className="text-gray-300 group-hover:text-blue-200">➝</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
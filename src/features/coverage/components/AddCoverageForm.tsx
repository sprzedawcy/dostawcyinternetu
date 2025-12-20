"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AddressSearch from "./AddressSearch";
import { addCityCoverage, addStreetCoverage, addAddressCoverage } from "../actions";

interface Props {
  operator_id: number;
}

export default function AddCoverageForm({ operator_id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  const [notatka, setNotatka] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCity) {
      setError("Wybierz miejscowość");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      
      // Konkretny adres (z numerem)
      if (selectedNumber) {
        formData.append('teryt', selectedNumber.teryt || selectedCity.teryt);
        formData.append('miejscowosc', selectedCity.nazwa);
        formData.append('simc', selectedCity.simc);
        formData.append('ulica', selectedStreet.ulica);
        formData.append('id_ulicy', selectedStreet.id_ulicy);
        formData.append('nr', selectedNumber.nr);
        formData.append('notatka', notatka);
        
        await addAddressCoverage(operator_id, formData);
      }
      // Konkretna ulica (bez numeru)
      else if (selectedStreet) {
        formData.append('teryt', selectedCity.teryt);
        formData.append('miejscowosc', selectedCity.nazwa);
        formData.append('simc', selectedCity.simc);
        formData.append('ulica', selectedStreet.ulica);
        formData.append('id_ulicy', selectedStreet.id_ulicy);
        formData.append('notatka', notatka);
        
        await addStreetCoverage(operator_id, formData);
      }
      // Całe miasto
      else {
        formData.append('teryt', selectedCity.teryt);
        formData.append('miejscowosc', selectedCity.nazwa);
        formData.append('simc', selectedCity.simc);
        formData.append('notatka', notatka);
        
        await addCityCoverage(operator_id, formData);
      }
      
      // Reset form
      setSelectedCity(null);
      setSelectedStreet(null);
      setSelectedNumber(null);
      setNotatka("");
      
      router.refresh();
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd");
      setLoading(false);
    }
  };

  // Określ typ zasięgu
  const coverageType = selectedNumber 
    ? "konkretny_adres" 
    : selectedStreet 
      ? "konkretna_ulica" 
      : "cale_miasto";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <AddressSearch
        onCitySelect={setSelectedCity}
        onStreetSelect={setSelectedStreet}
        onNumberSelect={setSelectedNumber}
      />

      {/* Notatka */}
      {selectedCity && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notatka (opcjonalnie)
          </label>
          <textarea
            value={notatka}
            onChange={(e) => setNotatka(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="np. Zasięg ograniczony do budynków wielorodzinnych"
          />
        </div>
      )}

      {/* Podsumowanie */}
      {selectedCity && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Dodajesz zasięg:</h3>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Typ:</span>{" "}
              {coverageType === "konkretny_adres" && "Konkretny adres"}
              {coverageType === "konkretna_ulica" && "Cała ulica"}
              {coverageType === "cale_miasto" && "Całe miasto"}
            </div>
            <div>
              <span className="font-medium">Lokalizacja:</span>{" "}
              {selectedCity.nazwa}
              {selectedStreet && `, ${selectedStreet.ulica}`}
              {selectedNumber && ` ${selectedNumber.nr}`}
            </div>
          </div>
        </div>
      )}

      {/* Przyciski */}
      {selectedCity && (
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Dodawanie..." : "Dodaj zasięg"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCity(null);
              setSelectedStreet(null);
              setSelectedNumber(null);
              setNotatka("");
            }}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Wyczyść
          </button>
        </div>
      )}
    </form>
  );
}

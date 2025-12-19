"use client"
import { useState } from "react";
import CitySelector from "./CitySelector";
import StreetSelector from "./StreetSelector";
import NumberSelector from "./NumberSelector";
import AddressReport from "./AddressReport";

export default function SearchManager() {
  const [step, setStep] = useState<'CITY' | 'STREET' | 'NUMBER' | 'RESULT'>('CITY');
  const [selection, setSelection] = useState({ city: null as any, street: null as any, address: null as any });

  const handleCitySelect = (city: any) => { setSelection(p => ({ ...p, city })); setStep('STREET'); };
  const handleStreetSelect = (street: any) => { setSelection(p => ({ ...p, street })); setStep('NUMBER'); };
  const handleAddressSelect = (address: any) => { setSelection(p => ({ ...p, address })); setStep('RESULT'); };

  return (
    <div className="w-full max-w-xl mx-auto p-4 bg-white rounded-3xl shadow-xl">
      {step === 'CITY' && <CitySelector onSelect={handleCitySelect} />}
      
      {step === 'STREET' && selection.city && (
        <>
          <button 
            onClick={() => setStep('CITY')} 
            className="text-sm text-blue-600 font-bold mb-4 hover:underline"
          >
            ← ZMIEŃ MIASTO ({selection.city.label})
          </button>
          
          <StreetSelector 
            cityName={selection.city.simc}
            terytPowiat={selection.city.teryt}
            onSelect={handleStreetSelect} 
          />
        </>
      )}

      {step === 'NUMBER' && selection.street && (
        <>
          <button 
            onClick={() => setStep('STREET')} 
            className="text-sm text-blue-600 font-bold mb-4 hover:underline"
          >
            ← ZMIEŃ ULICĘ ({selection.street.ulica})
          </button>
          
          <NumberSelector 
            cityName={selection.city.label} 
            streetId={selection.street.id_ulicy} 
            onSelect={handleAddressSelect} 
          />
        </>
      )}

      {step === 'RESULT' && selection.address && <AddressReport data={selection.address} />}
    </div>
  );
}
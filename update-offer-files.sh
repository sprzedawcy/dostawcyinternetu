#!/bin/bash
# Skrypt aktualizujący pliki oferty z obsługą HP

echo "Aktualizuję pliki w app/[locale]/internet/[...slug]/..."

# 1. OfferPageClient.tsx
cat > app/\[locale\]/internet/\[...slug\]/OfferPageClient.tsx << 'EOF'
"use client";
import { useState } from "react";
import ContactForm from "./ContactForm";
import AddressValidator from "./AddressValidator";
import FullAddressSearch from "./FullAddressSearch";
import RewardsModule from "./RewardsModule";

interface AddressData {
  miejscowosc: string;
  ulica?: string;
  nr?: string;
  miejscowoscSlug?: string;
  simc?: string;
  hpCount?: number;
}

interface Props {
  offer: any;
  addressData: AddressData | null;
}

export default function OfferPageClient({ offer, addressData: initialAddressData }: Props) {
  const [addressData, setAddressData] = useState<AddressData | null>(initialAddressData);
  
  const hasAnyAddress = addressData?.miejscowosc;
  const isAddressComplete = addressData?.miejscowosc && addressData?.nr;

  const handleAddressComplete = (newAddress: AddressData) => {
    setAddressData({
      ...addressData,
      ...newAddress
    });
  };

  return (
    <div className="space-y-6">
      {isAddressComplete ? (
        <ContactForm offer={offer} addressData={addressData} />
      ) : hasAnyAddress && addressData?.simc ? (
        <AddressValidator 
          miejscowosc={addressData.miejscowosc}
          miejscowoscSlug={addressData.miejscowoscSlug || ''}
          simc={addressData.simc}
          offer={offer}
          onAddressComplete={handleAddressComplete}
        />
      ) : (
        <FullAddressSearch 
          offer={offer}
          onAddressComplete={handleAddressComplete}
        />
      )}
      <RewardsModule operatorName={offer.operator.nazwa} operatorSlug={offer.operator.slug} />
    </div>
  );
}
EOF
echo "1/5 OfferPageClient.tsx ✓"

# 2. OfferPage.tsx
cat > app/\[locale\]/internet/\[...slug\]/OfferPage.tsx << 'EOF'
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import OfferDetailsView from "./OfferDetailsView";
import OfferInfoView from "./OfferInfoView";
import OfferPageClient from "./OfferPageClient";

interface Props {
  operatorSlug: string;
  offerSlug: string;
  locale: string;
  searchParams: { info?: string; adres?: string };
}

export default async function OfferPage({ operatorSlug, offerSlug, locale, searchParams }: Props) {
  const { info, adres } = searchParams;
  const showInfoView = info === '1';

  const operator = await prisma.operator.findFirst({
    where: { slug: operatorSlug }
  });

  if (!operator) {
    notFound();
  }

  const offer = await prisma.oferta.findFirst({
    where: {
      operator_id: operator.id,
      OR: [
        { custom_url: offerSlug },
        { id: isNaN(parseInt(offerSlug)) ? -1 : parseInt(offerSlug) }
      ],
      aktywna: true
    },
    include: {
      operator: true,
      lokalizacje: true
    }
  });

  if (!offer) {
    notFound();
  }

  let addressData = null;
  if (adres) {
    const parts = decodeURIComponent(adres).split('|');
    addressData = { 
      miejscowosc: parts[0] || '', 
      ulica: parts[1] || '', 
      nr: parts[2] || '', 
      miejscowoscSlug: parts[3] || '',
      simc: parts[4] || '',
      hpCount: parts[5] ? parseInt(parts[5]) : undefined
    };
  }

  const serializedOffer = JSON.parse(JSON.stringify(offer));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <Link href="/" className="hover:text-blue-600">Internet</Link>
            
            {addressData?.miejscowosc && (
              <>
                <span className="text-gray-400">&gt;</span>
                <Link 
                  href={`/internet/${addressData.miejscowoscSlug || encodeURIComponent(addressData.miejscowosc.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="hover:text-blue-600"
                >
                  {addressData.miejscowosc}
                </Link>
              </>
            )}
            
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium truncate max-w-[300px]">
              {offer.nazwa}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {showInfoView ? (
              <OfferInfoView offer={serializedOffer} addressData={addressData} />
            ) : (
              <OfferDetailsView offer={serializedOffer} addressData={addressData} />
            )}
          </div>

          <div>
            <OfferPageClient offer={serializedOffer} addressData={addressData} />
          </div>
        </div>
      </div>
    </div>
  );
}
EOF
echo "2/5 OfferPage.tsx ✓"

# 3. AddressValidator.tsx
cat > app/\[locale\]/internet/\[...slug\]/AddressValidator.tsx << 'EOF'
"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { searchStreets, searchNumbers, cityHasStreets } from "@/src/features/coverage/actions/search";
import { searchOffersForAddress } from "@/src/features/offers/actions/search";

interface Props {
  miejscowosc: string;
  miejscowoscSlug: string;
  simc: string;
  offer: any;
  onAddressComplete: (address: { miejscowosc: string; ulica: string; nr: string; hpCount?: number }) => void;
}

export default function AddressValidator({ miejscowosc, miejscowoscSlug, simc, offer, onAddressComplete }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [streets, setStreets] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  
  const [streetQuery, setStreetQuery] = useState('');
  const [numberQuery, setNumberQuery] = useState('');
  
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [hasStreets, setHasStreets] = useState(true);
  
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'available' | 'unavailable' | null>(null);

  useEffect(() => {
    const checkStreets = async () => {
      if (simc) {
        const result = await cityHasStreets(simc);
        setHasStreets(result);
      }
    };
    checkStreets();
  }, [simc]);

  useEffect(() => {
    if (!simc || !hasStreets || streetQuery.length < 2) {
      setStreets([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoadingStreets(true);
      try {
        const result = await searchStreets(simc, streetQuery);
        setStreets(result);
      } catch (err) {
        console.error('Blad szukania ulic:', err);
      }
      setLoadingStreets(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [streetQuery, simc, hasStreets]);

  useEffect(() => {
    if (!selectedStreet && hasStreets) {
      setNumbers([]);
      return;
    }
    
    if (numberQuery.length < 1) {
      setNumbers([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoadingNumbers(true);
      try {
        const id_ulicy = selectedStreet?.id_ulicy || '00000';
        const result = await searchNumbers(id_ulicy, numberQuery);
        setNumbers(result);
      } catch (err) {
        console.error('Blad szukania numerow:', err);
      }
      setLoadingNumbers(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [numberQuery, selectedStreet, hasStreets]);

  const handleConfirm = async () => {
    if (!selectedNumber) return;
    
    setChecking(true);
    
    try {
      const id_ulicy = selectedStreet?.id_ulicy || '00000';
      const results = await searchOffersForAddress(simc, id_ulicy, selectedNumber.nr);
      
      const isOfferAvailable = results.offers?.some((o: any) => o.id === offer.id);
      
      if (isOfferAvailable) {
        setCheckResult('available');
        
        const operatorData = results.address?.operators?.find(
          (op: any) => op.slug === offer.operator?.slug
        );
        const hpCount = operatorData?.hp_count || null;
        
        const newAddress = {
          miejscowosc,
          ulica: selectedStreet?.ulica || '',
          nr: selectedNumber.nr,
          hpCount
        };
        
        const newAdresParam = encodeURIComponent(
          `${miejscowosc}|${newAddress.ulica}|${newAddress.nr}|${miejscowoscSlug}|${simc}|${hpCount || ''}`
        );
        
        const newUrl = `${pathname}?adres=${newAdresParam}`;
        router.replace(newUrl);
        
        setTimeout(() => {
          onAddressComplete(newAddress);
        }, 1500);
      } else {
        setCheckResult('unavailable');
      }
    } catch (err) {
      console.error('Blad sprawdzania dostepnosci:', err);
      setCheckResult('unavailable');
    }
    
    setChecking(false);
  };

  const handleGoToResults = () => {
    const id_ulicy = selectedStreet?.id_ulicy || '00000';
    const params = new URLSearchParams({
      simc: simc,
      id_ulicy: id_ulicy,
      nr: selectedNumber?.nr || ''
    });
    router.push(`/?${params.toString()}`);
  };

  if (checkResult === 'available') {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-green-500" id="kontakt">
        <div className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Oferta dostepna!</h3>
          <p className="text-green-100">
            {offer.nazwa} jest dostepna pod adresem:<br />
            <strong>{miejscowosc}{selectedStreet?.ulica ? `, ${selectedStreet.ulica}` : ''} {selectedNumber?.nr}</strong>
          </p>
        </div>
        <div className="p-4 text-center">
          <div className="animate-pulse text-gray-600">Ladowanie formularza kontaktowego...</div>
        </div>
      </div>
    );
  }

  if (checkResult === 'unavailable') {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-red-500" id="kontakt">
        <div className="p-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Oferta niedostepna</h3>
          <p className="text-red-100">
            Niestety ta oferta nie jest dostepna pod adresem:<br />
            <strong>{miejscowosc}{selectedStreet?.ulica ? `, ${selectedStreet.ulica}` : ''} {selectedNumber?.nr}</strong>
          </p>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 text-center">
            Sprawdz inne oferty dostepne pod Twoim adresem:
          </p>
          <button
            onClick={handleGoToResults}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-lg"
          >
            Zobacz dostepne oferty
          </button>
          <button
            onClick={() => {
              setCheckResult(null);
              setSelectedStreet(null);
              setSelectedNumber(null);
              setNumberQuery('');
            }}
            className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
          >
            Sprawdz inny adres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-orange-500" id="kontakt">
      <div className="p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <h2 className="text-xl font-bold mb-1">
          Doprecyzuj adres instalacji
        </h2>
        <p className="text-orange-100 text-sm">
          Podaj ulice i numer budynku, zeby sprawdzic dostepnosc oferty
        </p>
      </div>

      <div className="p-5 space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-gray-700 mb-1">Miejscowosc</p>
          <p className="text-gray-900 font-bold">{miejscowosc}</p>
        </div>

        {hasStreets && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ulica</label>
            {selectedStreet ? (
              <div className="relative p-4 bg-green-100 border-2 border-green-500 rounded-xl">
                <div className="font-bold text-green-900">{selectedStreet.ulica}</div>
                <button
                  type="button"
                  onClick={() => { setSelectedStreet(null); setSelectedNumber(null); setNumberQuery(''); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700"
                >✕</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={streetQuery}
                  onChange={(e) => setStreetQuery(e.target.value)}
                  placeholder="Wpisz nazwe ulicy..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none text-gray-900"
                />
                {loadingStreets && (
                  <div className="absolute right-4 top-3">
                    <div className="animate-spin h-6 w-6 border-4 border-orange-600 rounded-full border-t-transparent"></div>
                  </div>
                )}
                {streets.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {streets.map((street, index) => (
                      <button
                        key={`${street.id_ulicy}-${index}`}
                        type="button"
                        onClick={() => { setSelectedStreet(street); setStreets([]); setStreetQuery(''); }}
                        className="w-full p-3 text-left hover:bg-orange-100 border-b border-gray-200 last:border-0 font-medium text-gray-900"
                      >{street.ulica}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Numer budynku *</label>
          {selectedNumber ? (
            <div className="relative p-4 bg-green-100 border-2 border-green-500 rounded-xl">
              <div className="font-bold text-green-900 text-center text-2xl">{selectedNumber.nr}</div>
              <button
                type="button"
                onClick={() => { setSelectedNumber(null); setNumberQuery(''); }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700"
              >✕</button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={numberQuery}
                onChange={(e) => setNumberQuery(e.target.value)}
                placeholder={hasStreets && !selectedStreet ? "Najpierw wybierz ulice..." : "Wpisz numer..."}
                disabled={hasStreets && !selectedStreet}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {loadingNumbers && (
                <div className="absolute right-4 top-3">
                  <div className="animate-spin h-6 w-6 border-4 border-orange-600 rounded-full border-t-transparent"></div>
                </div>
              )}
              {numbers.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {numbers.map((num, index) => (
                      <button
                        key={`${num.id}-${index}`}
                        type="button"
                        onClick={() => { setSelectedNumber(num); setNumbers([]); setNumberQuery(''); }}
                        className="p-2 bg-gray-100 hover:bg-orange-500 hover:text-white rounded font-bold text-sm text-gray-900"
                      >{num.nr}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedNumber || checking}
          className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:bg-gray-400 text-lg"
        >
          {checking ? 'Sprawdzam dostepnosc...' : 'Sprawdz dostepnosc oferty'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Podanie dokladnego adresu pozwoli sprawdzic dostepnosc uslug
        </p>
      </div>
    </div>
  );
}
EOF
echo "3/5 AddressValidator.tsx ✓"

# 4. FullAddressSearch.tsx
cat > app/\[locale\]/internet/\[...slug\]/FullAddressSearch.tsx << 'EOF'
"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { searchCities, searchStreets, searchNumbers, cityHasStreets } from "@/src/features/coverage/actions/search";
import { searchOffersForAddress } from "@/src/features/offers/actions/search";

interface Props {
  offer: any;
  onAddressComplete: (address: { miejscowosc: string; ulica: string; nr: string; simc: string; miejscowoscSlug: string; hpCount?: number }) => void;
}

export default function FullAddressSearch({ offer, onAddressComplete }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [cities, setCities] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  
  const [cityQuery, setCityQuery] = useState('');
  const [streetQuery, setStreetQuery] = useState('');
  const [numberQuery, setNumberQuery] = useState('');
  
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [hasStreets, setHasStreets] = useState(true);
  
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'available' | 'unavailable' | null>(null);

  useEffect(() => {
    if (cityQuery.length < 2) { setCities([]); return; }
    const timer = setTimeout(async () => {
      setLoadingCities(true);
      try {
        const result = await searchCities(cityQuery);
        setCities(result);
      } catch (err) { console.error('Blad szukania miejscowosci:', err); }
      setLoadingCities(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  useEffect(() => {
    if (selectedCity?.simc) { cityHasStreets(selectedCity.simc).then(setHasStreets); }
  }, [selectedCity]);

  useEffect(() => {
    if (!selectedCity?.simc || !hasStreets || streetQuery.length < 2) { setStreets([]); return; }
    const timer = setTimeout(async () => {
      setLoadingStreets(true);
      try {
        const result = await searchStreets(selectedCity.simc, streetQuery);
        setStreets(result);
      } catch (err) { console.error('Blad szukania ulic:', err); }
      setLoadingStreets(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [streetQuery, selectedCity, hasStreets]);

  useEffect(() => {
    if (!selectedStreet && hasStreets) { setNumbers([]); return; }
    if (numberQuery.length < 1) { setNumbers([]); return; }
    const timer = setTimeout(async () => {
      setLoadingNumbers(true);
      try {
        const id_ulicy = selectedStreet?.id_ulicy || '00000';
        const result = await searchNumbers(id_ulicy, numberQuery);
        setNumbers(result);
      } catch (err) { console.error('Blad szukania numerow:', err); }
      setLoadingNumbers(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [numberQuery, selectedStreet, hasStreets]);

  const handleCitySelect = (city: any) => {
    setSelectedCity(city); setCities([]); setCityQuery('');
  };

  const handleStreetSelect = (street: any) => {
    setSelectedStreet(street); setStreets([]); setStreetQuery('');
  };

  const handleNumberSelect = async (num: any) => {
    setSelectedNumber(num); setNumbers([]); setNumberQuery('');
    setChecking(true);
    
    try {
      const id_ulicy = selectedStreet?.id_ulicy || '00000';
      const results = await searchOffersForAddress(selectedCity.simc, id_ulicy, num.nr);
      const isOfferAvailable = results.offers?.some((o: any) => o.id === offer.id);
      
      if (isOfferAvailable) {
        setCheckResult('available');
        const operatorData = results.address?.operators?.find((op: any) => op.slug === offer.operator?.slug);
        const hpCount = operatorData?.hp_count || null;
        const miejscowoscSlug = selectedCity.nazwa.toLowerCase().replace(/\s+/g, '-');
        const newAddress = {
          miejscowosc: selectedCity.nazwa,
          ulica: selectedStreet?.ulica || '',
          nr: num.nr,
          simc: selectedCity.simc,
          miejscowoscSlug,
          hpCount
        };
        const newAdresParam = encodeURIComponent(
          `${newAddress.miejscowosc}|${newAddress.ulica}|${newAddress.nr}|${miejscowoscSlug}|${selectedCity.simc}|${hpCount || ''}`
        );
        router.replace(`${pathname}?adres=${newAdresParam}`);
        setTimeout(() => { onAddressComplete(newAddress); }, 1500);
      } else {
        setCheckResult('unavailable');
      }
    } catch (err) {
      console.error('Blad sprawdzania dostepnosci:', err);
      setCheckResult('unavailable');
    }
    setChecking(false);
  };

  const handleGoToResults = () => {
    const id_ulicy = selectedStreet?.id_ulicy || '00000';
    const params = new URLSearchParams({ simc: selectedCity.simc, id_ulicy, nr: selectedNumber?.nr || '' });
    router.push(`/?${params.toString()}`);
  };

  const resetSearch = () => {
    setSelectedCity(null); setSelectedStreet(null); setSelectedNumber(null);
    setCheckResult(null); setCityQuery(''); setStreetQuery(''); setNumberQuery('');
  };

  if (checkResult === 'available') {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-green-500" id="kontakt">
        <div className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Oferta dostepna!</h3>
          <p className="text-green-100">{offer.nazwa} jest dostepna pod adresem:<br />
            <strong>{selectedCity?.nazwa}{selectedStreet?.ulica ? `, ${selectedStreet.ulica}` : ''} {selectedNumber?.nr}</strong>
          </p>
        </div>
        <div className="p-4 text-center">
          <div className="animate-pulse text-gray-600">Ladowanie formularza kontaktowego...</div>
        </div>
      </div>
    );
  }

  if (checkResult === 'unavailable') {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-red-500" id="kontakt">
        <div className="p-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Oferta niedostepna</h3>
          <p className="text-red-100">Niestety ta oferta nie jest dostepna pod adresem:<br />
            <strong>{selectedCity?.nazwa}{selectedStreet?.ulica ? `, ${selectedStreet.ulica}` : ''} {selectedNumber?.nr}</strong>
          </p>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-700 text-center">Sprawdz inne oferty dostepne pod Twoim adresem:</p>
          <button onClick={handleGoToResults} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-lg">
            Zobacz dostepne oferty
          </button>
          <button onClick={resetSearch} className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors">
            Sprawdz inny adres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-blue-500" id="kontakt">
      <div className="p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <h2 className="text-xl font-bold mb-1">Sprawdz dostepnosc oferty</h2>
        <p className="text-blue-100 text-sm">Podaj adres, zeby sprawdzic czy {offer.nazwa} jest dostepna</p>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Miejscowosc *</label>
          {selectedCity ? (
            <div className="relative p-4 bg-green-100 border-2 border-green-500 rounded-xl">
              <div className="font-bold text-green-900">{selectedCity.nazwa}</div>
              {selectedCity.powiat && <div className="text-sm text-green-700">{selectedCity.powiat}</div>}
              <button type="button" onClick={() => { setSelectedCity(null); setSelectedStreet(null); setSelectedNumber(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700">✕</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={cityQuery} onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Wpisz nazwe miejscowosci..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900" />
              {loadingCities && <div className="absolute right-4 top-3"><div className="animate-spin h-6 w-6 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>}
              {cities.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {cities.map((city) => (
                    <button key={city.simc} type="button" onClick={() => handleCitySelect(city)}
                      className="w-full p-3 text-left hover:bg-blue-100 border-b border-gray-200 last:border-0">
                      <div className="font-medium text-gray-900">{city.nazwa}</div>
                      {city.powiat && <div className="text-sm text-gray-500">{city.powiat}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedCity && hasStreets && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ulica</label>
            {selectedStreet ? (
              <div className="relative p-4 bg-green-100 border-2 border-green-500 rounded-xl">
                <div className="font-bold text-green-900">{selectedStreet.ulica}</div>
                <button type="button" onClick={() => { setSelectedStreet(null); setSelectedNumber(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full font-bold hover:bg-red-700">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input type="text" value={streetQuery} onChange={(e) => setStreetQuery(e.target.value)}
                  placeholder="Wpisz nazwe ulicy..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900" />
                {loadingStreets && <div className="absolute right-4 top-3"><div className="animate-spin h-6 w-6 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>}
                {streets.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {streets.map((street, index) => (
                      <button key={`${street.id_ulicy}-${index}`} type="button" onClick={() => handleStreetSelect(street)}
                        className="w-full p-3 text-left hover:bg-blue-100 border-b border-gray-200 last:border-0 font-medium text-gray-900">{street.ulica}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedCity && (hasStreets ? selectedStreet : true) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer budynku *</label>
            {selectedNumber ? (
              <div className="relative p-4 bg-green-100 border-2 border-green-500 rounded-xl">
                <div className="font-bold text-green-900 text-center text-2xl">{selectedNumber.nr}</div>
              </div>
            ) : (
              <div className="relative">
                <input type="text" value={numberQuery} onChange={(e) => setNumberQuery(e.target.value)}
                  placeholder="Wpisz numer..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900" />
                {loadingNumbers && <div className="absolute right-4 top-3"><div className="animate-spin h-6 w-6 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>}
                {numbers.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-1 p-2">
                      {numbers.map((num, index) => (
                        <button key={`${num.id}-${index}`} type="button" onClick={() => handleNumberSelect(num)}
                          className="p-2 bg-gray-100 hover:bg-blue-500 hover:text-white rounded font-bold text-sm text-gray-900">{num.nr}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {checking && (
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-2"></div>
            <p className="text-blue-700 font-medium">Sprawdzam dostepnosc oferty...</p>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">Podanie dokladnego adresu pozwoli sprawdzic dostepnosc uslug</p>
      </div>
    </div>
  );
}
EOF
echo "4/5 FullAddressSearch.tsx ✓"

# 5. ContactForm.tsx
cat > app/\[locale\]/internet/\[...slug\]/ContactForm.tsx << 'EOF'
"use client";
import { useState } from "react";

interface Props {
  offer: any;
  addressData: { miejscowosc: string; ulica?: string; nr?: string; hpCount?: number } | null;
  onSubmitSuccess?: () => void;
}

export default function ContactForm({ offer, addressData, onSubmitSuccess }: Props) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', uwagi: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imie_nazwisko: formData.name,
          telefon: formData.phone,
          email: formData.email,
          oferta_id: offer.id,
          operator_id: offer.operator_id,
          miejscowosc: addressData?.miejscowosc || null,
          ulica: addressData?.ulica || null,
          nr: addressData?.nr || null,
          notatki: formData.uwagi || null,
          zrodlo: 'strona_oferty'
        })
      });

      if (!response.ok) throw new Error('Blad wysylania');
      setSubmitted(true);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      setError('Wystapil blad. Sprobuj ponownie lub zadzwon.');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = () => {
    if (!addressData?.miejscowosc) return null;
    let addr = addressData.miejscowosc;
    if (addressData.ulica) addr += `, ul. ${addressData.ulica}`;
    if (addressData.nr) addr += ` ${addressData.nr}`;
    return addr;
  };

  const isSmallBuilding = addressData?.hpCount && addressData.hpCount <= 2;

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-green-600" id="kontakt">
        <div className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Dziekujemy!</h3>
          <p className="text-green-100">Twoje zgloszenie zostalo przyjete.<br /><strong>{offer.operator.nazwa}</strong> skontaktuje sie z Toba wkrotce.</p>
        </div>
        <div className="p-6 space-y-4">
          <h4 className="font-bold text-gray-900 text-lg">Co dalej?</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
              <span className="text-2xl">📞</span>
              <div><p className="font-bold text-blue-900">Bezposredni kontakt z {offer.operator.nazwa}</p><p className="text-sm text-blue-700">Operator zadzwoni do Ciebie w ciagu 1-2 godzin roboczych</p></div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
              <span className="text-2xl">✅</span>
              <div><p className="font-bold text-green-900">Gwarancja najlepszej oferty</p><p className="text-sm text-green-700">Takie same warunki jak na stronie operatora (lub lepsze)</p></div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl">
              <span className="text-2xl">🎁</span>
              <div><p className="font-bold text-yellow-900">Gratis upominek do kazdej umowy*</p><p className="text-sm text-yellow-700">Odbierz bonus przy podpisaniu umowy</p></div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
              <span className="text-2xl">🛡️</span>
              <div><p className="font-bold text-purple-900">14 dni na odstapienie</p><p className="text-sm text-purple-700">Mozesz zrezygnowac bez podania powodu</p></div>
            </div>
          </div>
          <div className="pt-4 border-t"><p className="text-center text-sm text-gray-500">* Szczegoly promocji u operatora. Instalacja mozliwa juz JUTRO!</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-[3px] border-green-600" id="kontakt">
      <div className="p-5 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <h2 className="text-xl font-bold mb-1">Internet {offer.operator.nazwa} {offer.download_mbps} Mb/s</h2>
        <p className="text-green-100 text-sm">Zostaw dane - operator oddzwoni i odpowie na pytania</p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

        {formatAddress() && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-1">Adres instalacji</p>
            <p className="text-gray-900 font-bold">{formatAddress()}</p>
          </div>
        )}

        {isSmallBuilding && (
          <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-xl">🏠</span>
              <div>
                <p className="font-bold text-yellow-800 text-sm">Informacja dla domow jednorodzinnych</p>
                <p className="text-xs text-yellow-700">Ceny i warunki oferty moga sie roznic dla budynkow jednorodzinnych. Szczegoly u konsultanta.</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imie i nazwisko *</label>
          <input type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Jan Kowalski" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
          <input type="tel" required value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="532 274 808" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="jan@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi dla operatora (opcjonalnie)</label>
          <textarea value={formData.uwagi} onChange={(e) => setFormData(prev => ({ ...prev, uwagi: e.target.value }))}
            placeholder="Np. preferowane godziny kontaktu, pytania..." rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-400 text-lg">
          {loading ? 'Wysylam...' : 'Zamow'}
        </button>

        <p className="text-xs text-gray-500 text-center">Wyrazam zgode na kontakt telefoniczny i mailowy w celu przedstawienia oferty</p>
      </form>

      <div className="px-5 pb-5 space-y-3">
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
            <span className="text-xl">📞</span>
            <div><p className="font-bold text-blue-900 text-sm">Bezposredni kontakt z {offer.operator.nazwa}</p><p className="text-xs text-blue-700">Operator zadzwoni do Ciebie w ciagu 1-2 godzin roboczych</p></div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
            <span className="text-xl">✅</span>
            <div><p className="font-bold text-green-900 text-sm">Gwarancja najlepszej oferty</p><p className="text-xs text-green-700">Takie same warunki jak na stronie operatora (lub lepsze)</p></div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl">
            <span className="text-xl">🎁</span>
            <div><p className="font-bold text-yellow-900 text-sm">Gratis upominek do kazdej umowy*</p><p className="text-xs text-yellow-700">Odbierz bonus przy podpisaniu umowy</p></div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
            <span className="text-xl">🛡️</span>
            <div><p className="font-bold text-purple-900 text-sm">14 dni na odstapienie</p><p className="text-xs text-purple-700">Mozesz zrezygnowac bez podania powodu</p></div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
            <span className="text-xl">🚀</span>
            <div><p className="font-bold text-orange-900 text-sm">Instalacja nawet jutro</p><p className="text-xs text-orange-700">Szybka realizacja zamowienia</p></div>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center">* Szczegoly promocji u operatora</p>
        <div className="border-t pt-4">
          <p className="text-center text-sm text-gray-600 mb-2">lub zadzwon do nas</p>
          <a href="tel:532274808" className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-gray-900 font-bold hover:bg-gray-200 transition-colors">532 274 808</a>
        </div>
      </div>
    </div>
  );
}
EOF
echo "5/5 ContactForm.tsx ✓"

echo ""
echo "✅ Wszystkie pliki zaktualizowane!"
echo "Teraz uruchom: npm run dev"

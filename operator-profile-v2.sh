#!/bin/bash
echo "Rozbudowuję profil operatora..."

# 1. Dodaj nowe modele do schema.prisma (na końcu pliku)
cat >> prisma/schema.prisma << 'EOF'

// ========== PROFIL OPERATORA - ROZSZERZENIA ==========

model OperatorSpeedtest {
  id            Int      @id @default(autoincrement())
  operator_id   Int
  operator      Operator @relation(fields: [operator_id], references: [id], onDelete: Cascade)
  
  miejscowosc   String?
  simc          String?  @db.VarChar(7)
  
  ping_ms       Decimal  @db.Decimal(6, 2)
  download_mbps Decimal  @db.Decimal(8, 2)
  upload_mbps   Decimal  @db.Decimal(8, 2)
  jitter_ms     Decimal? @db.Decimal(6, 2)
  
  source        String?  @db.VarChar(50)
  user_ip       String?
  
  created_at    DateTime @default(now())

  @@index([operator_id])
  @@index([simc])
  @@map("operator_speedtests")
}

model OperatorPriceHistory {
  id            Int      @id @default(autoincrement())
  operator_id   Int
  operator      Operator @relation(fields: [operator_id], references: [id], onDelete: Cascade)
  
  oferta_id     Int?
  nazwa_oferty  String?
  
  abonament     Decimal  @db.Decimal(10, 2)
  download_mbps Int?
  
  data_od       DateTime
  data_do       DateTime?
  
  created_at    DateTime @default(now())

  @@index([operator_id])
  @@index([data_od])
  @@map("operator_price_history")
}

model OperatorOutage {
  id            Int       @id @default(autoincrement())
  operator_id   Int
  operator      Operator  @relation(fields: [operator_id], references: [id], onDelete: Cascade)
  
  miejscowosc   String?
  simc          String?   @db.VarChar(7)
  
  opis          String    @db.Text
  data_start    DateTime
  data_koniec   DateTime?
  
  status        String    @default("aktywna")
  
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  @@index([operator_id])
  @@index([status])
  @@map("operator_outages")
}

model OperatorFaq {
  id            Int      @id @default(autoincrement())
  operator_id   Int
  operator      Operator @relation(fields: [operator_id], references: [id], onDelete: Cascade)
  
  pytanie       String
  odpowiedz     String   @db.Text
  kolejnosc     Int      @default(0)
  
  aktywne       Boolean  @default(true)
  
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  @@index([operator_id])
  @@map("operator_faq")
}

model OperatorPromotion {
  id            Int       @id @default(autoincrement())
  operator_id   Int
  operator      Operator  @relation(fields: [operator_id], references: [id], onDelete: Cascade)
  
  tytul         String
  opis          String    @db.Text
  kod           String?
  rabat         String?
  
  data_start    DateTime
  data_koniec   DateTime?
  
  aktywna       Boolean   @default(true)
  
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  @@index([operator_id])
  @@index([aktywna])
  @@map("operator_promotions")
}
EOF
echo "1/8 Nowe modele dodane do schema.prisma ✓"

# 2. Dodaj relacje do Operator
# Używamy sed żeby dodać przed linią "created_at" w modelu Operator
sed -i '' '/^model Operator/,/^}$/{
  /created_at.*DateTime.*@default(now())/i\
\  speedtests     OperatorSpeedtest[]\
\  priceHistory   OperatorPriceHistory[]\
\  outages        OperatorOutage[]\
\  faq            OperatorFaq[]\
\  promotions     OperatorPromotion[]\

}' prisma/schema.prisma
echo "2/8 Relacje dodane do Operator ✓"

# 3. Folder tabs
mkdir -p app/\[locale\]/dostawca-internetu/\[operator\]/tabs

# 4. Komponent zakładek
cat > app/\[locale\]/dostawca-internetu/\[operator\]/OperatorTabs.tsx << 'EOF'
"use client";
import { useState } from "react";

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface Props {
  tabs: TabConfig[];
  children: React.ReactNode[];
  defaultTab?: string;
}

export default function OperatorTabs({ tabs, children, defaultTab }: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || 'oferty');

  return (
    <div>
      {/* Desktop tabs */}
      <div className="hidden md:flex gap-1 mb-6 bg-gray-100 p-1.5 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile dropdown */}
      <div className="md:hidden mb-4">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-3 border-2 rounded-xl font-medium text-gray-900 bg-white"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.icon} {tab.label} {tab.count ? `(${tab.count})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div>
        {tabs.map((tab, index) => (
          <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
            {children[index]}
          </div>
        ))}
      </div>
    </div>
  );
}
EOF
echo "3/8 OperatorTabs.tsx ✓"

# 5. Wyszukiwarka zasięgu operatora
cat > app/\[locale\]/dostawca-internetu/\[operator\]/OperatorCoverageSearch.tsx << 'EOF'
"use client";
import { useState, useEffect } from "react";
import { searchCities, searchStreets, searchNumbers, cityHasStreets } from "@/src/features/coverage/actions/search";
import { searchOffersForAddress } from "@/src/features/offers/actions/search";
import Link from "next/link";

interface Props {
  operatorSlug: string;
  operatorName: string;
}

export default function OperatorCoverageSearch({ operatorSlug, operatorName }: Props) {
  const [cities, setCities] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [streetQuery, setStreetQuery] = useState('');
  const [numberQuery, setNumberQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedStreet, setSelectedStreet] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  const [hasStreets, setHasStreets] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (cityQuery.length < 2) { setCities([]); return; }
    const timer = setTimeout(async () => {
      const res = await searchCities(cityQuery);
      setCities(res);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  useEffect(() => {
    if (selectedCity?.simc) {
      cityHasStreets(selectedCity.simc).then(setHasStreets);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (!selectedCity?.simc || !hasStreets || streetQuery.length < 2) { setStreets([]); return; }
    const timer = setTimeout(async () => {
      const res = await searchStreets(selectedCity.simc, streetQuery);
      setStreets(res);
    }, 300);
    return () => clearTimeout(timer);
  }, [streetQuery, selectedCity, hasStreets]);

  useEffect(() => {
    if (!selectedStreet && hasStreets) { setNumbers([]); return; }
    if (numberQuery.length < 1) { setNumbers([]); return; }
    const timer = setTimeout(async () => {
      const id_ulicy = selectedStreet?.id_ulicy || '00000';
      const res = await searchNumbers(id_ulicy, numberQuery);
      setNumbers(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [numberQuery, selectedStreet, hasStreets]);

  const handleCheck = async () => {
    if (!selectedCity || !selectedNumber) return;
    setChecking(true);
    const id_ulicy = selectedStreet?.id_ulicy || '00000';
    const res = await searchOffersForAddress(selectedCity.simc, id_ulicy, selectedNumber.nr);
    const operatorOffers = res.offers?.filter((o: any) => o.operator?.slug === operatorSlug) || [];
    setResult({
      available: operatorOffers.length > 0,
      offers: operatorOffers,
      address: `${selectedCity.nazwa}${selectedStreet?.ulica ? ', ' + selectedStreet.ulica : ''} ${selectedNumber.nr}`
    });
    setChecking(false);
  };

  const reset = () => {
    setSelectedCity(null); setSelectedStreet(null); setSelectedNumber(null);
    setCityQuery(''); setStreetQuery(''); setNumberQuery('');
    setResult(null);
  };

  if (result) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className={`p-6 rounded-xl mb-4 ${result.available ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
          <div className="text-center">
            <span className="text-5xl">{result.available ? '✅' : '❌'}</span>
            <h3 className="text-xl font-bold mt-3 mb-1">{result.available ? `${operatorName} jest dostępny!` : `${operatorName} niedostępny`}</h3>
            <p className="text-gray-600">{result.address}</p>
          </div>
        </div>
        {result.available && result.offers.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="font-bold text-gray-900">Dostępne oferty:</h4>
            {result.offers.map((offer: any) => (
              <Link key={offer.id} href={`/internet/${operatorSlug}/${offer.custom_url || offer.id}`}
                className="block p-4 border-2 rounded-xl hover:border-blue-500 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{offer.nazwa}</p>
                    <p className="text-sm text-gray-500">{offer.download_mbps}/{offer.upload_mbps} Mb/s</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{parseFloat(offer.abonament).toFixed(0)} zł</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        <button onClick={reset} className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300">
          Sprawdź inny adres
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="font-bold text-gray-900 mb-4">Sprawdź czy {operatorName} jest dostępny pod Twoim adresem</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Miejscowość</label>
          {selectedCity ? (
            <div className="relative p-3 bg-green-50 border-2 border-green-500 rounded-xl">
              <span className="font-bold text-green-800">{selectedCity.nazwa}</span>
              <button onClick={() => { setSelectedCity(null); setSelectedStreet(null); setSelectedNumber(null); }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600">✕</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={cityQuery} onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Wpisz miejscowość..." className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:ring-0" />
              {cities.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {cities.map((c) => (
                    <button key={c.simc} onClick={() => { setSelectedCity(c); setCities([]); setCityQuery(''); }}
                      className="w-full p-3 text-left hover:bg-blue-50 border-b last:border-0">
                      <span className="font-medium">{c.nazwa}</span>
                      {c.powiat && <span className="text-gray-500 text-sm ml-2">{c.powiat}</span>}
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
              <div className="relative p-3 bg-green-50 border-2 border-green-500 rounded-xl">
                <span className="font-bold text-green-800">{selectedStreet.ulica}</span>
                <button onClick={() => { setSelectedStreet(null); setSelectedNumber(null); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input type="text" value={streetQuery} onChange={(e) => setStreetQuery(e.target.value)}
                  placeholder="Wpisz ulicę..." className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:ring-0" />
                {streets.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {streets.map((s, i) => (
                      <button key={i} onClick={() => { setSelectedStreet(s); setStreets([]); setStreetQuery(''); }}
                        className="w-full p-3 text-left hover:bg-blue-50 border-b last:border-0 font-medium">{s.ulica}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedCity && (hasStreets ? selectedStreet : true) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer budynku</label>
            {selectedNumber ? (
              <div className="relative p-3 bg-green-50 border-2 border-green-500 rounded-xl text-center">
                <span className="font-bold text-green-800 text-xl">{selectedNumber.nr}</span>
                <button onClick={() => setSelectedNumber(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input type="text" value={numberQuery} onChange={(e) => setNumberQuery(e.target.value)}
                  placeholder="Wpisz numer..." className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:ring-0" />
                {numbers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg p-2">
                    <div className="grid grid-cols-5 gap-1">
                      {numbers.map((n, i) => (
                        <button key={i} onClick={() => { setSelectedNumber(n); setNumbers([]); setNumberQuery(''); }}
                          className="p-2 bg-gray-100 hover:bg-blue-500 hover:text-white rounded font-bold text-sm">{n.nr}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button onClick={handleCheck} disabled={!selectedCity || !selectedNumber || checking}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
          {checking ? 'Sprawdzam...' : '🔍 Sprawdź dostępność'}
        </button>
      </div>
    </div>
  );
}
EOF
echo "4/8 OperatorCoverageSearch.tsx ✓"

# 6. Komponenty zakładek
cat > app/\[locale\]/dostawca-internetu/\[operator\]/tabs/OffersTab.tsx << 'EOF'
import Link from "next/link";

interface Offer {
  id: number;
  nazwa: string;
  custom_url: string | null;
  abonament: any;
  download_mbps: number;
  upload_mbps: number;
  technologia: string | null;
  wifi: string | null;
  wyrozoniona: boolean;
  lokalna: boolean;
  kategoria: string;
}

interface Props {
  offers: Offer[];
  operatorSlug: string;
  operatorName: string;
}

export default function OffersTab({ offers, operatorSlug, operatorName }: Props) {
  const offersByCategory = offers.reduce((acc, offer) => {
    const cat = offer.kategoria || 'Internet';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(offer);
    return acc;
  }, {} as Record<string, Offer[]>);

  if (offers.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-4xl mb-4 block">📦</span>
        <p className="text-gray-500">Brak aktywnych ofert.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(offersByCategory).map(([category, categoryOffers]) => (
        <div key={category}>
          <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            {category === 'Internet' && '🌐'}
            {category === 'Internet + TV' && '📺'}
            {category === 'Internet + TV + Telefon' && '📱'}
            {category}
            <span className="text-sm font-normal text-gray-500">({categoryOffers.length})</span>
          </h3>
          <div className="grid gap-4">
            {categoryOffers.map((offer) => (
              <Link key={offer.id} href={`/internet/${operatorSlug}/${offer.custom_url || offer.id}`}
                className="block bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 text-lg">{offer.nazwa}</h4>
                      {offer.wyrozoniona && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">⭐ Wyróżniona</span>}
                      {offer.lokalna && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">📍 Lokalna</span>}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {offer.technologia && <span className="mr-3">🔌 {offer.technologia}</span>}
                      {offer.wifi && <span>📶 {offer.wifi}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-black text-blue-600">{offer.download_mbps}<span className="text-sm font-normal text-gray-500 ml-1">Mb/s</span></p>
                      <p className="text-xs text-gray-500">pobieranie</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-green-600">{offer.upload_mbps}<span className="text-sm font-normal text-gray-500 ml-1">Mb/s</span></p>
                      <p className="text-xs text-gray-500">wysyłanie</p>
                    </div>
                    <div className="text-right pl-4 border-l-2">
                      <p className="text-3xl font-black text-gray-900">{parseFloat(offer.abonament).toFixed(0)}<span className="text-lg font-normal text-gray-500 ml-1">zł</span></p>
                      <p className="text-xs text-gray-500">/miesiąc</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
EOF

cat > app/\[locale\]/dostawca-internetu/\[operator\]/tabs/ReviewsTab.tsx << 'EOF'
"use client";
import { useState } from "react";

interface Review {
  id: number;
  autor: string;
  ocena: number;
  tytul: string | null;
  tresc: string;
  created_at: string;
}

interface Props {
  operatorId: number;
  operatorName: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export default function ReviewsTab({ operatorId, operatorName, reviews, averageRating, totalReviews }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ autor: '', email: '', ocena: 5, tytul: '', tresc: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/opinie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, operator_id: operatorId })
      });
      if (!res.ok) throw new Error('Błąd');
      setSubmitted(true);
      setShowForm(false);
    } catch (err) {
      setError('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (n: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type={interactive ? "button" : undefined}
          onClick={interactive && onChange ? () => onChange(n) : undefined}
          className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          disabled={!interactive}>
          {n <= rating ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );

  const getRatingDistribution = () => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach(r => { if (r.ocena >= 1 && r.ocena <= 5) dist[r.ocena - 1]++; });
    return dist.reverse();
  };
  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      {/* Podsumowanie */}
      <div className="bg-white rounded-xl p-6">
        <div className="flex flex-wrap gap-8 mb-6 pb-6 border-b">
          <div className="text-center">
            <p className="text-5xl font-black text-gray-900">{averageRating > 0 ? averageRating.toFixed(1) : '-'}</p>
            <div className="my-2">{renderStars(Math.round(averageRating))}</div>
            <p className="text-gray-500 text-sm">{totalReviews} opinii</p>
          </div>
          <div className="flex-1 min-w-[200px]">
            {[5, 4, 3, 2, 1].map((stars, idx) => (
              <div key={stars} className="flex items-center gap-2 mb-1">
                <span className="text-sm w-12">{stars} ⭐</span>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full"
                    style={{ width: totalReviews > 0 ? `${(distribution[idx] / totalReviews) * 100}%` : '0%' }} />
                </div>
                <span className="text-sm text-gray-500 w-8">{distribution[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {!showForm && !submitted && (
          <button onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
            ✍️ Dodaj opinię
          </button>
        )}

        {submitted && (
          <div className="p-4 bg-green-50 border border-green-300 rounded-xl">
            <p className="text-green-800 font-medium">✅ Dziękujemy! Opinia zostanie opublikowana po weryfikacji.</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="p-6 bg-gray-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-4">Dodaj opinię o {operatorName}</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Twoja ocena *</label>
              {renderStars(formData.ocena, true, (n) => setFormData(prev => ({ ...prev, ocena: n })))}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię / Nick *</label>
                <input type="text" required value={formData.autor} onChange={(e) => setFormData(prev => ({ ...prev, autor: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcjonalnie)</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł opinii</label>
              <input type="text" value={formData.tytul} onChange={(e) => setFormData(prev => ({ ...prev, tytul: e.target.value }))}
                placeholder="Np. Świetny internet!" className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Treść opinii *</label>
              <textarea required value={formData.tresc} onChange={(e) => setFormData(prev => ({ ...prev, tresc: e.target.value }))}
                rows={4} placeholder="Opisz swoje doświadczenia..." className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                {submitting ? 'Wysyłam...' : 'Wyślij opinię'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300">Anuluj</button>
            </div>
          </form>
        )}
      </div>

      {/* Lista opinii */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-500">Brak opinii. Bądź pierwszy!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-5 rounded-xl border">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-900">{review.autor}</p>
                  <div className="flex items-center gap-2">
                    {renderStars(review.ocena)}
                    <span className="text-gray-400 text-sm">{new Date(review.created_at).toLocaleDateString('pl-PL')}</span>
                  </div>
                </div>
              </div>
              {review.tytul && <p className="font-medium text-gray-900 mb-1">{review.tytul}</p>}
              <p className="text-gray-700">{review.tresc}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
EOF

cat > app/\[locale\]/dostawca-internetu/\[operator\]/tabs/QualityTab.tsx << 'EOF'
interface Speedtest {
  id: number;
  ping_ms: any;
  download_mbps: any;
  upload_mbps: any;
  jitter_ms: any;
  miejscowosc: string | null;
  created_at: string;
}

interface Props {
  speedtests: Speedtest[];
  operatorName: string;
}

export default function QualityTab({ speedtests, operatorName }: Props) {
  if (speedtests.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-5xl mb-4 block">📊</span>
        <p className="text-gray-500 text-lg">Brak danych o jakości połączenia</p>
        <p className="text-gray-400 text-sm mt-2">Dane będą dostępne wkrótce</p>
      </div>
    );
  }

  const avgPing = speedtests.reduce((sum, s) => sum + Number(s.ping_ms), 0) / speedtests.length;
  const avgDown = speedtests.reduce((sum, s) => sum + Number(s.download_mbps), 0) / speedtests.length;
  const avgUp = speedtests.reduce((sum, s) => sum + Number(s.upload_mbps), 0) / speedtests.length;
  const minPing = Math.min(...speedtests.map(s => Number(s.ping_ms)));
  const maxPing = Math.max(...speedtests.map(s => Number(s.ping_ms)));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 text-center">
          <span className="text-3xl mb-2 block">🏓</span>
          <p className="text-gray-500 text-sm mb-1">Średni ping</p>
          <p className="text-3xl font-black text-blue-600">{avgPing.toFixed(0)}<span className="text-lg">ms</span></p>
        </div>
        <div className="bg-white rounded-xl p-5 text-center">
          <span className="text-3xl mb-2 block">📉📈</span>
          <p className="text-gray-500 text-sm mb-1">Ping (min-max)</p>
          <p className="text-xl font-bold text-gray-700">{minPing.toFixed(0)} - {maxPing.toFixed(0)} ms</p>
        </div>
        <div className="bg-white rounded-xl p-5 text-center">
          <span className="text-3xl mb-2 block">⬇️</span>
          <p className="text-gray-500 text-sm mb-1">Średnie pobieranie</p>
          <p className="text-3xl font-black text-green-600">{avgDown.toFixed(0)}<span className="text-lg">Mb/s</span></p>
        </div>
        <div className="bg-white rounded-xl p-5 text-center">
          <span className="text-3xl mb-2 block">⬆️</span>
          <p className="text-gray-500 text-sm mb-1">Średnie wysyłanie</p>
          <p className="text-3xl font-black text-purple-600">{avgUp.toFixed(0)}<span className="text-lg">Mb/s</span></p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">Ostatnie pomiary ({speedtests.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Lokalizacja</th>
                <th className="text-right py-2 px-3">Ping</th>
                <th className="text-right py-2 px-3">Download</th>
                <th className="text-right py-2 px-3">Upload</th>
                <th className="text-right py-2 px-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {speedtests.slice(0, 10).map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{s.miejscowosc || '-'}</td>
                  <td className="py-2 px-3 text-right font-medium">{Number(s.ping_ms).toFixed(0)} ms</td>
                  <td className="py-2 px-3 text-right font-medium text-green-600">{Number(s.download_mbps).toFixed(0)} Mb/s</td>
                  <td className="py-2 px-3 text-right font-medium text-purple-600">{Number(s.upload_mbps).toFixed(0)} Mb/s</td>
                  <td className="py-2 px-3 text-right text-gray-500">{new Date(s.created_at).toLocaleDateString('pl-PL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
EOF

cat > app/\[locale\]/dostawca-internetu/\[operator\]/tabs/PriceHistoryTab.tsx << 'EOF'
interface PriceHistory {
  id: number;
  nazwa_oferty: string | null;
  abonament: any;
  download_mbps: number | null;
  data_od: string;
}

interface Props {
  priceHistory: PriceHistory[];
  operatorName: string;
}

export default function PriceHistoryTab({ priceHistory, operatorName }: Props) {
  if (priceHistory.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-5xl mb-4 block">💰</span>
        <p className="text-gray-500 text-lg">Brak historii cen</p>
        <p className="text-gray-400 text-sm mt-2">Dane będą dostępne wkrótce</p>
      </div>
    );
  }

  const avgPrice = priceHistory.reduce((sum, p) => sum + Number(p.abonament), 0) / priceHistory.length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 text-lg">Historia cen {operatorName}</h3>
          <div className="text-right">
            <p className="text-sm text-gray-500">Średnia cena (12 mies.)</p>
            <p className="text-3xl font-black text-green-600">{avgPrice.toFixed(0)} zł</p>
          </div>
        </div>
        <div className="space-y-3">
          {priceHistory.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">{p.nazwa_oferty || 'Oferta'}</p>
                {p.download_mbps && <p className="text-sm text-gray-500">{p.download_mbps} Mb/s</p>}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{Number(p.abonament).toFixed(0)} zł</p>
                <p className="text-xs text-gray-500">{new Date(p.data_od).toLocaleDateString('pl-PL')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
EOF

cat > app/\[locale\]/dostawca-internetu/\[operator\]/tabs/ServiceTab.tsx << 'EOF'
interface Props {
  operatorName: string;
}

export default function ServiceTab({ operatorName }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 text-center">
          <span className="text-4xl mb-3 block">⏱️</span>
          <p className="text-gray-500 text-sm mb-1">Średni czas instalacji</p>
          <p className="text-2xl font-bold text-gray-900">3-5 dni</p>
        </div>
        <div className="bg-white rounded-xl p-6 text-center">
          <span className="text-4xl mb-3 block">📞</span>
          <p className="text-gray-500 text-sm mb-1">Infolinia</p>
          <p className="text-2xl font-bold text-green-600">24/7</p>
        </div>
        <div className="bg-white rounded-xl p-6 text-center">
          <span className="text-4xl mb-3 block">💬</span>
          <p className="text-gray-500 text-sm mb-1">Czat online</p>
          <p className="text-xl font-bold text-green-600">Dostępny</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">Kontakt z {operatorName}</h3>
        <p className="text-gray-600">Szczegółowe dane kontaktowe będą dostępne wkrótce.</p>
      </div>
    </div>
  );
}
EOF

cat > app/\[locale\]/dostawca-internetu/\[operator\]/tabs/OutagesTab.tsx << 'EOF'
interface Outage {
  id: number;
  miejscowosc: string | null;
  opis: string;
  data_start: string;
  data_koniec: string | null;
  status: string;
}

interface Props {
  outages: Outage[];
  operatorName: string;
}

export default function OutagesTab({ outages, operatorName }: Props) {
  const active = outages.filter(o => o.status === 'aktywna');
  const resolved = outages.filter(o => o.status === 'zakonczona');

  if (outages.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-5xl mb-4 block">✅</span>
        <p className="text-green-600 font-bold text-lg">Brak zgłoszonych awarii</p>
        <p className="text-gray-400 text-sm mt-2">Wszystko działa prawidłowo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <h3 className="font-bold text-red-800 mb-4 text-lg">⚠️ Aktywne awarie ({active.length})</h3>
          <div className="space-y-3">
            {active.map((o) => (
              <div key={o.id} className="bg-white p-4 rounded-lg">
                <p className="font-medium text-gray-900">{o.opis}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {o.miejscowosc && `📍 ${o.miejscowosc} • `}Od: {new Date(o.data_start).toLocaleString('pl-PL')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {resolved.length > 0 && (
        <div className="bg-white rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">Historia awarii</h3>
          <div className="space-y-3">
            {resolved.slice(0, 10).map((o) => (
              <div key={o.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <p className="text-gray-700">{o.opis}</p>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Rozwiązana</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {o.miejscowosc && `📍 ${o.miejscowosc} • `}{new Date(o.data_start).toLocaleDateString('pl-PL')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
EOF

cat > app/\[locale\]/dostawca-internetu/\[operator\]/tabs/FaqTab.tsx << 'EOF'
"use client";
import { useState } from "react";

interface Faq {
  id: number;
  pytanie: string;
  odpowiedz: string;
}

interface Props {
  faqs: Faq[];
  operatorName: string;
}

export default function FaqTab({ faqs, operatorName }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (faqs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-5xl mb-4 block">❓</span>
        <p className="text-gray-500 text-lg">Brak pytań FAQ</p>
        <p className="text-gray-400 text-sm mt-2">Sekcja będzie dostępna wkrótce</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="font-bold text-gray-900 mb-4 text-lg">Najczęściej zadawane pytania</h3>
      <div className="space-y-2">
        {faqs.map((faq) => (
          <div key={faq.id} className="border rounded-xl overflow-hidden">
            <button onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors">
              <span className="font-medium text-gray-900">{faq.pytanie}</span>
              <span className="text-2xl text-gray-400">{openId === faq.id ? '−' : '+'}</span>
            </button>
            {openId === faq.id && (
              <div className="px-4 pb-4 text-gray-600">{faq.odpowiedz}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

cat > app/\[locale\]/dostawca-internetu/\[operator\]/tabs/PromotionsTab.tsx << 'EOF'
interface Promotion {
  id: number;
  tytul: string;
  opis: string;
  kod: string | null;
  rabat: string | null;
  data_koniec: string | null;
}

interface Props {
  promotions: Promotion[];
  operatorName: string;
}

export default function PromotionsTab({ promotions, operatorName }: Props) {
  if (promotions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-5xl mb-4 block">🎁</span>
        <p className="text-gray-500 text-lg">Brak aktywnych promocji</p>
        <p className="text-gray-400 text-sm mt-2">Sprawdź później</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {promotions.map((p) => (
        <div key={p.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{p.tytul}</h3>
              <p className="text-gray-600 mt-1">{p.opis}</p>
              {p.data_koniec && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  ⏰ Ważne do: {new Date(p.data_koniec).toLocaleDateString('pl-PL')}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {p.rabat && <p className="text-3xl font-black text-green-600">{p.rabat}</p>}
              {p.kod && (
                <div className="mt-2 px-4 py-2 bg-white border-2 border-dashed border-gray-400 rounded-lg font-mono font-bold text-lg">
                  {p.kod}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
EOF

echo "5/8 Komponenty zakładek ✓"

# 7. API opinii
mkdir -p app/api/opinie
cat > app/api/opinie/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { autor, email, ocena, tytul, tresc, operator_id, oferta_id } = body;

    if (!autor || !tresc || !ocena) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    if (ocena < 1 || ocena > 5) {
      return NextResponse.json({ error: "Ocena musi być 1-5" }, { status: 400 });
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "";

    const opinia = await prisma.opinia.create({
      data: {
        autor,
        email: email || null,
        ocena,
        tytul: tytul || null,
        tresc,
        operator_id: operator_id || null,
        oferta_id: oferta_id || null,
        widoczna: false,
        ip_address: ip,
        user_agent: userAgent
      }
    });

    return NextResponse.json({ success: true, id: opinia.id });
  } catch (error) {
    console.error("Błąd zapisywania opinii:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
EOF
echo "6/8 API opinii ✓"

# 8. Główna strona profilu - będzie w osobnym pliku
echo "7/8 Komponenty gotowe ✓"
echo "8/8 Strona profilu - wymaga aktualizacji ✓"

echo ""
echo "=========================================="
echo "✅ Struktura gotowa!"
echo ""
echo "NASTĘPNE KROKI:"
echo ""
echo "1. Sprawdź schema.prisma - czy relacje dodały się poprawnie"
echo "   do modelu Operator (speedtests, priceHistory, outages, faq, promotions)"
echo ""
echo "2. Uruchom migrację:"
echo "   npx prisma migrate dev --name operator_profile_extensions"
echo ""
echo "3. Powiem Ci jak zaktualizować stronę profilu"
echo "=========================================="

#!/bin/bash
echo "Przenoszę box domów do OfferDetailsView..."

# 1. OfferDetailsView.tsx - dodaj box dla domów
cat > app/\[locale\]/internet/\[...slug\]/OfferDetailsView.tsx << 'EOFFILE'
"use client";
import { useRouter } from "next/navigation";

interface Props {
  offer: any;
  addressData: { miejscowosc: string; ulica?: string; nr?: string; miejscowoscSlug?: string; hpCount?: number } | null;
}

export default function OfferDetailsView({ offer, addressData }: Props) {
  const router = useRouter();

  // Sprawdź czy to dom jednorodzinny (HP = 1 lub 2)
  const isSmallBuilding = addressData?.hpCount && (addressData.hpCount === 1 || addressData.hpCount === 2);
  
  // Sprawdź czy są dane dla domów
  const hasDomData = offer.abonament_dom || offer.instalacja_dom || offer.aktywacja_dom || offer.dom_blok_tekst;
  
  // Pokaż box gdy HP = 1 lub 2 i są jakiekolwiek dane dla domów
  const showDomInfo = isSmallBuilding && hasDomData;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Wroc do wynikow
        </button>
      </div>

      <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
          <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border">
            {offer.operator?.logo_url ? (
              <img 
                src={offer.operator.logo_url} 
                alt={offer.operator.nazwa}
                className="w-full h-full object-contain p-3"
              />
            ) : (
              <span className="text-3xl font-bold text-gray-400">
                {offer.operator?.nazwa?.charAt(0) || '?'}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              {offer.wyrozoniona && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full">
                  Wyrozoniona oferta
                </span>
              )}
              {offer.lokalna && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded-full">
                  Oferta lokalna
                </span>
              )}
              {offer.typ_polaczenia === 'komorkowe' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                  Internet mobilny
                </span>
              )}
            </div>
            
            <h1 className="text-2xl font-black text-gray-900 mb-1">
              {offer.nazwa}
            </h1>
            <p className="text-gray-600">{offer.operator.nazwa}</p>
          </div>
          
          <div className="text-right">
            <p className="text-4xl font-black text-green-600">
              {parseFloat(offer.abonament).toFixed(0)} <span className="text-xl">zl</span>
            </p>
            <p className="text-gray-500">/miesiac</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Parametry oferty</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <div className="text-3xl mb-1">⬇️</div>
            <p className="text-3xl font-black text-blue-600">{offer.download_mbps}</p>
            <p className="text-sm text-blue-800">Mb/s pobieranie</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <div className="text-3xl mb-1">⬆️</div>
            <p className="text-3xl font-black text-green-600">{offer.upload_mbps}</p>
            <p className="text-sm text-green-800">Mb/s wysylanie</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl text-center">
            <div className="text-3xl mb-1">📅</div>
            <p className="text-2xl font-black text-purple-600">
              {offer.zobowiazanie_miesiace || 'Brak'}
            </p>
            <p className="text-sm text-purple-800">
              {offer.zobowiazanie_miesiace ? 'mies. umowa' : 'zobowiazania'}
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl text-center">
            <div className="text-3xl mb-1">🔌</div>
            <p className="text-xl font-black text-orange-600">{offer.technologia || '-'}</p>
            <p className="text-sm text-orange-800">technologia</p>
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y">
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-600">Predkosc pobierania</td>
                <td className="px-4 py-3 text-gray-900 font-bold">{offer.download_mbps} Mb/s</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-600">Predkosc wysylania</td>
                <td className="px-4 py-3 text-gray-900 font-bold">{offer.upload_mbps} Mb/s</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-600">Abonament</td>
                <td className="px-4 py-3 text-gray-900 font-bold">{offer.abonament} zl/mies.</td>
              </tr>
              {offer.instalacja && parseFloat(offer.instalacja) > 0 && (
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-600">Instalacja</td>
                  <td className="px-4 py-3 text-gray-900">{offer.instalacja} zl</td>
                </tr>
              )}
              {offer.aktywacja && parseFloat(offer.aktywacja) > 0 && (
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-600">Aktywacja</td>
                  <td className="px-4 py-3 text-gray-900">{offer.aktywacja} zl</td>
                </tr>
              )}
              <tr>
                <td className="px-4 py-3 font-medium text-gray-600">Okres umowy</td>
                <td className="px-4 py-3 text-gray-900">
                  {offer.zobowiazanie_miesiace ? offer.zobowiazanie_miesiace + ' miesiecy' : 'Bez zobowiazania'}
                </td>
              </tr>
              {offer.technologia && (
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-600">Technologia</td>
                  <td className="px-4 py-3 text-gray-900">{offer.technologia}</td>
                </tr>
              )}
              {offer.wifi && (
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-600">Router WiFi</td>
                  <td className="px-4 py-3 text-gray-900">{offer.wifi}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Box dla domów jednorodzinnych - po parametrach */}
        {showDomInfo && (
          <div className="mt-6 p-5 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🏠</span>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-800 text-lg mb-3">Ceny dla domow jednorodzinnych</h3>
                
                {(offer.abonament_dom || offer.instalacja_dom || offer.aktywacja_dom) && (
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    {offer.abonament_dom && (
                      <div className="p-3 bg-white rounded-lg text-center">
                        <p className="text-2xl font-black text-yellow-700">{parseFloat(offer.abonament_dom).toFixed(0)} zl</p>
                        <p className="text-xs text-yellow-600">abonament/mies.</p>
                      </div>
                    )}
                    {offer.instalacja_dom && (
                      <div className="p-3 bg-white rounded-lg text-center">
                        <p className="text-2xl font-black text-yellow-700">{parseFloat(offer.instalacja_dom).toFixed(0)} zl</p>
                        <p className="text-xs text-yellow-600">instalacja</p>
                      </div>
                    )}
                    {offer.aktywacja_dom && (
                      <div className="p-3 bg-white rounded-lg text-center">
                        <p className="text-2xl font-black text-yellow-700">{parseFloat(offer.aktywacja_dom).toFixed(0)} zl</p>
                        <p className="text-xs text-yellow-600">aktywacja</p>
                      </div>
                    )}
                  </div>
                )}
                
                {offer.dom_blok_tekst && (
                  <p className="text-sm text-yellow-700">{offer.dom_blok_tekst}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Artykuł SEO */}
        {addressData?.miejscowosc && (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Internet w miejscowosci {addressData.miejscowosc}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Szukasz szybkiego internetu w {addressData.miejscowosc}? Oferta {offer.nazwa} od {offer.operator.nazwa} to 
              {offer.technologia === 'swiatlowod' || offer.technologia === 'FTTH' ? ' nowoczesny swiatlowod' : ' niezawodne polaczenie'} z 
              predkoscia do {offer.download_mbps} Mb/s. {offer.operator.nazwa} oferuje internet domowy, internet mobilny 
              oraz swiatlowod w {addressData.miejscowosc}. Sprawdz dostepnosc i zamow instalacje - mozliwa juz nastepnego dnia roboczego!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
EOFFILE
echo "1/2 OfferDetailsView.tsx ✓"

# 2. ContactForm.tsx - usuń box dla domów
cat > app/\[locale\]/internet/\[...slug\]/ContactForm.tsx << 'EOFFILE'
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
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl"><span className="text-2xl">📞</span><div><p className="font-bold text-blue-900">Bezposredni kontakt z {offer.operator.nazwa}</p><p className="text-sm text-blue-700">Operator zadzwoni do Ciebie w ciagu 1-2 godzin roboczych</p></div></div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl"><span className="text-2xl">✅</span><div><p className="font-bold text-green-900">Gwarancja najlepszej oferty</p><p className="text-sm text-green-700">Takie same warunki jak na stronie operatora (lub lepsze)</p></div></div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl"><span className="text-2xl">🎁</span><div><p className="font-bold text-yellow-900">Gratis upominek do kazdej umowy*</p><p className="text-sm text-yellow-700">Odbierz bonus przy podpisaniu umowy</p></div></div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl"><span className="text-2xl">🛡️</span><div><p className="font-bold text-purple-900">14 dni na odstapienie</p><p className="text-sm text-purple-700">Mozesz zrezygnowac bez podania powodu</p></div></div>
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

        <div><label className="block text-sm font-medium text-gray-700 mb-1">Imie i nazwisko *</label><input type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Jan Kowalski" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label><input type="tel" required value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="532 274 808" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="jan@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Uwagi dla operatora (opcjonalnie)</label><textarea value={formData.uwagi} onChange={(e) => setFormData(prev => ({ ...prev, uwagi: e.target.value }))} placeholder="Np. preferowane godziny kontaktu, pytania..." rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" /></div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-400 text-lg">{loading ? 'Wysylam...' : 'Zamow'}</button>
        <p className="text-xs text-gray-500 text-center">Wyrazam zgode na kontakt telefoniczny i mailowy w celu przedstawienia oferty</p>
      </form>

      <div className="px-5 pb-5 space-y-3">
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl"><span className="text-xl">📞</span><div><p className="font-bold text-blue-900 text-sm">Bezposredni kontakt z {offer.operator.nazwa}</p><p className="text-xs text-blue-700">Operator zadzwoni do Ciebie w ciagu 1-2 godzin roboczych</p></div></div>
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl"><span className="text-xl">✅</span><div><p className="font-bold text-green-900 text-sm">Gwarancja najlepszej oferty</p><p className="text-xs text-green-700">Takie same warunki jak na stronie operatora (lub lepsze)</p></div></div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl"><span className="text-xl">🎁</span><div><p className="font-bold text-yellow-900 text-sm">Gratis upominek do kazdej umowy*</p><p className="text-xs text-yellow-700">Odbierz bonus przy podpisaniu umowy</p></div></div>
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl"><span className="text-xl">🛡️</span><div><p className="font-bold text-purple-900 text-sm">14 dni na odstapienie</p><p className="text-xs text-purple-700">Mozesz zrezygnowac bez podania powodu</p></div></div>
          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl"><span className="text-xl">🚀</span><div><p className="font-bold text-orange-900 text-sm">Instalacja nawet jutro</p><p className="text-xs text-orange-700">Szybka realizacja zamowienia</p></div></div>
        </div>
        <p className="text-xs text-gray-500 text-center">* Szczegoly promocji u operatora</p>
        <div className="border-t pt-4"><p className="text-center text-sm text-gray-600 mb-2">lub zadzwon do nas</p><a href="tel:532274808" className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-gray-900 font-bold hover:bg-gray-200 transition-colors">532 274 808</a></div>
      </div>
    </div>
  );
}
EOFFILE
echo "2/2 ContactForm.tsx ✓"

echo ""
echo "✅ Box przeniesiony do szczegółów oferty (pod parametry, nad SEO)"

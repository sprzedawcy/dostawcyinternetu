#!/bin/bash
echo "Aktualizuję ContactForm z nową logiką HP..."

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

  // Sprawdź czy to dom jednorodzinny (HP = 1 lub 2, nie 0)
  const isSmallBuilding = addressData?.hpCount && (addressData.hpCount === 1 || addressData.hpCount === 2);
  
  // Sprawdź czy są dane dla domów
  const hasDomData = offer.abonament_dom || offer.instalacja_dom || offer.aktywacja_dom || offer.dom_blok_tekst;
  
  // Pokaż box gdy HP = 1 lub 2 i są jakiekolwiek dane dla domów
  const showDomInfo = isSmallBuilding && hasDomData;

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

        {showDomInfo && (
          <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-xl">🏠</span>
              <div className="flex-1">
                <p className="font-bold text-yellow-800 text-sm mb-2">Ceny dla domow jednorodzinnych</p>
                
                {(offer.abonament_dom || offer.instalacja_dom || offer.aktywacja_dom) && (
                  <div className="space-y-1 text-sm text-yellow-800">
                    {offer.abonament_dom && (
                      <p>Abonament: <strong>{parseFloat(offer.abonament_dom).toFixed(0)} zl/mies.</strong></p>
                    )}
                    {offer.instalacja_dom && (
                      <p>Instalacja: <strong>{parseFloat(offer.instalacja_dom).toFixed(0)} zl</strong></p>
                    )}
                    {offer.aktywacja_dom && (
                      <p>Aktywacja: <strong>{parseFloat(offer.aktywacja_dom).toFixed(0)} zl</strong></p>
                    )}
                  </div>
                )}
                
                {offer.dom_blok_tekst && (
                  <p className="text-xs text-yellow-700 mt-2">{offer.dom_blok_tekst}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div><label className="block text-sm font-medium text-gray-700 mb-1">Imie i nazwisko *</label><input type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Jan Kowalski" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label><input type="tel" required value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="532 274 808" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="jan@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Uwagi dla operatora (opcjonalnie)</label><textarea value={formData.uwagi} onChange={(e) => setFormData(prev => ({ ...prev, uwagi: e.target.value }))} placeholder="Np. preferowane godziny kontaktu, pytania..." rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900" /></textarea></div>

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

echo "✅ ContactForm.tsx zaktualizowany!"
echo ""
echo "Logika: HP = 1 lub 2 (nie 0) + są dane dla domów → pokazuje box"

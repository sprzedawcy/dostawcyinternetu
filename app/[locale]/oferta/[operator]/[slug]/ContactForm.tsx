"use client";
import { useState } from "react";

interface Props {
  offer: any;
  addressData: { miejscowosc: string; ulica?: string; nr?: string } | null;
}

export default function ContactForm({ offer, addressData }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // TODO: Wyslij do API
    console.log('Contact form:', {
      ...formData,
      offer: offer.nazwa,
      operator: offer.operator.nazwa,
      address: addressData
    });
    
    // Symulacja
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Dziękujemy!</h3>
          <p className="text-gray-600 mb-4">
            Twoje zgłoszenie zostało wysłane.<br />
            <strong>{offer.operator.nazwa}</strong> skontaktuje się z Tobą wkrótce.
          </p>
          <p className="text-sm text-gray-500">
            Pamiętaj o odebraniu upominku przy podpisaniu umowy!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* NAGLOWEK */}
      <div className="p-5 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <h2 className="text-xl font-bold mb-1">
          Kontakt z {offer.operator.nazwa}
        </h2>
        <p className="text-green-100 text-sm">
          Zostaw dane - operator oddzwoni i odpowie na pytania
        </p>
      </div>

      {/* FORMULARZ */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imię i nazwisko *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Jan Kowalski"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="532 274 808"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (opcjonalnie)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="jan@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
          />
        </div>

        {addressData && addressData.miejscowosc && (
          <div className="p-3 bg-gray-50 rounded-xl text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Adres instalacji:</span><br />
              {addressData.miejscowosc}
              {addressData.ulica && `, ul. ${addressData.ulica}`}
              {addressData.nr && ` ${addressData.nr}`}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-400 text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Wysyłam...
            </span>
          ) : (
            `Poproś o kontakt z ${offer.operator.nazwa}`
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Wyrażam zgodę na kontakt telefoniczny w celu przedstawienia oferty
        </p>
      </form>

      {/* TELEFON */}
      <div className="px-5 pb-5">
        <div className="border-t pt-4">
          <p className="text-center text-sm text-gray-600 mb-2">lub zadzwoń do nas</p>
          <a 
            href="tel:532274808" 
            className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-gray-900 font-bold hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            532 274 808
          </a>
        </div>
      </div>
    </div>
  );
}

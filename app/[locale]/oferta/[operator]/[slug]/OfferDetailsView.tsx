"use client";
import { useRouter } from "next/navigation";

interface Props {
  offer: any;
  addressData: { miejscowosc: string; ulica?: string; nr?: string; miejscowoscSlug?: string } | null;
}

export default function OfferDetailsView({ offer, addressData }: Props) {
  const router = useRouter();

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

        {/* SEKCJA SEO - Internet w miejscowosci */}
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
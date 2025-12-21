"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  offer: any;
  addressData: { miejscowosc: string; ulica?: string; nr?: string } | null;
}

export default function OfferInfoView({ offer, addressData }: Props) {
  const pathname = usePathname();
  const contactUrl = pathname.split('?')[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* NAGLOWEK */}
      <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
          {/* Logo operatora */}
          <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border">
            {offer.operator?.logo_url ? (
              <img 
                src={offer.operator.logo_url} 
                alt={offer.operator.nazwa}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-400">
                {offer.operator?.nazwa?.charAt(0) || '?'}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900 mb-1">
              {offer.nazwa}
            </h1>
            <p className="text-gray-600">{offer.operator.nazwa}</p>
          </div>
          
          <div className="text-right">
            <p className="text-3xl font-black text-green-600">
              {parseFloat(offer.abonament).toFixed(0)} <span className="text-lg">zł</span>
            </p>
            <p className="text-sm text-gray-500">/miesiąc</p>
          </div>
        </div>
      </div>

      {/* SEKCJE SZCZEGÓŁÓW */}
      <div className="p-6 space-y-6">
        
        {/* DOSTAWCA */}
        <div>
          <table className="w-full border rounded-lg overflow-hidden">
            <tbody>
              <tr className="bg-gray-100">
                <td colSpan={2} className="px-4 py-2 font-bold text-gray-700">Dostawca</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-3 text-gray-600 w-1/3">Operator</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{offer.operator.nazwa}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* INTERNET */}
        <div>
          <table className="w-full border rounded-lg overflow-hidden">
            <tbody>
              <tr className="bg-gray-100">
                <td colSpan={2} className="px-4 py-2 font-bold text-gray-700">Internet</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-3 text-gray-600 w-1/3">Prędkość pobierania</td>
                <td className="px-4 py-3 text-gray-900 font-bold">{offer.download_mbps} Mb/s</td>
              </tr>
              <tr className="border-t bg-gray-50">
                <td className="px-4 py-3 text-gray-600">Prędkość wysyłania</td>
                <td className="px-4 py-3 text-gray-900 font-bold">{offer.upload_mbps} Mb/s</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-3 text-gray-600">Limit danych</td>
                <td className="px-4 py-3 text-gray-900">bez limitu</td>
              </tr>
              {offer.wifi && (
                <tr className="border-t bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">Router WiFi</td>
                  <td className="px-4 py-3 text-gray-900">{offer.wifi}</td>
                </tr>
              )}
              {offer.technologia && (
                <tr className="border-t">
                  <td className="px-4 py-3 text-gray-600">Technologia</td>
                  <td className="px-4 py-3 text-gray-900">{offer.technologia}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* OPŁATY I ZOBOWIĄZANIA */}
        <div>
          <table className="w-full border rounded-lg overflow-hidden">
            <tbody>
              <tr className="bg-gray-100">
                <td colSpan={2} className="px-4 py-2 font-bold text-gray-700">Opłaty i czas zobowiązania</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-3 text-gray-600 w-1/3">Abonament miesięczny</td>
                <td className="px-4 py-3 text-gray-900 font-bold text-lg">{offer.abonament} zł</td>
              </tr>
              {offer.instalacja && (
                <tr className="border-t bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">Instalacja</td>
                  <td className="px-4 py-3 text-gray-900">
                    {parseFloat(offer.instalacja) > 0 ? `${offer.instalacja} zł` : 'Gratis'}
                  </td>
                </tr>
              )}
              {offer.aktywacja && (
                <tr className="border-t">
                  <td className="px-4 py-3 text-gray-600">Aktywacja</td>
                  <td className="px-4 py-3 text-gray-900">
                    {parseFloat(offer.aktywacja) > 0 ? `${offer.aktywacja} zł` : 'Gratis'}
                  </td>
                </tr>
              )}
              <tr className="border-t bg-gray-50">
                <td className="px-4 py-3 text-gray-600">Okres umowy</td>
                <td className="px-4 py-3 text-gray-900">
                  {offer.zobowiazanie_miesiace ? `${offer.zobowiazanie_miesiace} miesięcy` : 'Bez zobowiązania'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CENY DLA DOMÓW (jeśli są) */}
        {(offer.abonament_dom || offer.instalacja_dom || offer.aktywacja_dom) && (
          <div>
            <table className="w-full border rounded-lg overflow-hidden border-orange-200">
              <tbody>
                <tr className="bg-orange-50">
                  <td colSpan={2} className="px-4 py-2 font-bold text-orange-800">
                    🏠 Ceny dla domów jednorodzinnych
                  </td>
                </tr>
                {offer.abonament_dom && (
                  <tr className="border-t border-orange-100">
                    <td className="px-4 py-3 text-gray-600 w-1/3">Abonament</td>
                    <td className="px-4 py-3 text-gray-900 font-bold">{offer.abonament_dom} zł/mies.</td>
                  </tr>
                )}
                {offer.instalacja_dom && (
                  <tr className="border-t border-orange-100 bg-orange-50/50">
                    <td className="px-4 py-3 text-gray-600">Instalacja</td>
                    <td className="px-4 py-3 text-gray-900">{offer.instalacja_dom} zł</td>
                  </tr>
                )}
                {offer.aktywacja_dom && (
                  <tr className="border-t border-orange-100">
                    <td className="px-4 py-3 text-gray-600">Aktywacja</td>
                    <td className="px-4 py-3 text-gray-900">{offer.aktywacja_dom} zł</td>
                  </tr>
                )}
                {offer.dom_blok_tekst && (
                  <tr className="border-t border-orange-100 bg-orange-50/50">
                    <td colSpan={2} className="px-4 py-3 text-sm text-orange-700">
                      {offer.dom_blok_tekst}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* OPIS (jeśli istnieje) */}
        {offer.opis && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2">
              <h3 className="font-bold text-gray-700">Opis oferty</h3>
            </div>
            <div className="px-4 py-4 prose prose-sm max-w-none text-gray-700">
              <div dangerouslySetInnerHTML={{ __html: offer.opis }} />
            </div>
          </div>
        )}

        {/* LINK DO KONTAKTU */}
        <div className="pt-4 border-t">
          <Link
            href={contactUrl}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
          >
            ← Wróć i skontaktuj się z {offer.operator.nazwa}
          </Link>
        </div>
      </div>
    </div>
  );
}

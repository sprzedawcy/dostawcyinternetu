"use client";
import { useState } from "react";
import Link from "next/link";
import ToggleOfferStatusButton from "./ToggleOfferStatusButton";

interface Props {
  offers: any[];
  operators: { id: number; nazwa: string }[];
}

export default function OffersListClient({ offers, operators }: Props) {
  const [selectedOperator, setSelectedOperator] = useState<number | null>(null);

  const filteredOffers = selectedOperator
    ? offers.filter(o => o.operator_id === selectedOperator)
    : offers;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Oferty</h1>
        
        <div className="flex gap-4 items-center">
          {/* Filtr operatorów */}
          <select
            value={selectedOperator || ""}
            onChange={(e) => setSelectedOperator(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wszyscy operatorzy</option>
            {operators.map((op) => (
              <option key={op.id} value={op.id}>
                {op.nazwa}
              </option>
            ))}
          </select>
          
          <Link
            href="/admin/oferty/nowa"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Dodaj ofertę
          </Link>
        </div>
      </div>

      {/* Info o filtrze */}
      {selectedOperator && (
        <div className="mb-4 px-4 py-2 bg-blue-50 rounded-lg flex justify-between items-center">
          <span className="text-blue-800">
            Pokazuję {filteredOffers.length} ofert dla: <strong>{operators.find(o => o.id === selectedOperator)?.nazwa}</strong>
          </span>
          <button
            onClick={() => setSelectedOperator(null)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Wyczyść filtr ✕
          </button>
        </div>
      )}

      {filteredOffers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">
            {selectedOperator ? "Brak ofert dla tego operatora" : "Brak ofert w systemie"}
          </p>
          <Link
            href="/admin/oferty/nowa"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Dodaj ofertę
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Oferta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prędkość
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cena
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOffers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {offer.nazwa}
                          {offer.wyrozoniona && (
                            <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                              ⭐ Wyróżniona
                            </span>
                          )}
                          {offer.lokalna && (
                            <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                              📍 Lokalna
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{offer.kategoria}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {offer.operator.nazwa}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {offer.download_mbps} / {offer.upload_mbps} Mb/s
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {offer.abonament} PLN/mies.
                  </td>
                  <td className="px-6 py-4">
                    {offer.aktywna ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Aktywna
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        Nieaktywna
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <Link
                      href={`/admin/oferty/${offer.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edytuj
                    </Link>
                    <ToggleOfferStatusButton id={offer.id} nazwa={offer.nazwa} aktywna={offer.aktywna} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

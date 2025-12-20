"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleCoverageStatus, deleteCoverage } from "../actions";

interface Props {
  items: any[];
  operator_id: number;
  currentPage: number;
  totalPages: number;
}

export default function CoverageList({ items, operator_id, currentPage, totalPages }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleToggle = async (id: number) => {
    setLoadingId(id);
    try {
      await toggleCoverageStatus(id, operator_id);
      router.refresh();
    } catch (error) {
      alert("Błąd podczas zmiany statusu");
    }
    setLoadingId(null);
  };

  const handleDelete = async (id: number, miejscowosc: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć zasięg dla: ${miejscowosc}?`)) {
      return;
    }
    
    setLoadingId(id);
    try {
      await deleteCoverage(id, operator_id);
      router.refresh();
    } catch (error) {
      alert("Błąd podczas usuwania");
    }
    setLoadingId(null);
  };

  const getTypeLabel = (typ: string) => {
    switch (typ) {
      case 'cale_miasto': return '🏙️ Całe miasto';
      case 'konkretna_ulica': return '🛣️ Ulica';
      case 'konkretny_adres': return '🏠 Adres';
      default: return typ;
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        Brak zasięgów. Dodaj pierwszy zasięg powyżej.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Typ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Miejscowość
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ulica
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Numer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Notatka
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
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getTypeLabel(item.typ)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{item.miejscowosc}</div>
                  <div className="text-xs text-gray-500">SIMC: {item.simc}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.ulica || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.nr || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {item.notatka || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.aktywny ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Aktywny
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      Nieaktywny
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <button
                    onClick={() => handleToggle(item.id)}
                    disabled={loadingId === item.id}
                    className={`${
                      item.aktywny 
                        ? "text-orange-600 hover:text-orange-900" 
                        : "text-green-600 hover:text-green-900"
                    } disabled:opacity-50`}
                  >
                    {loadingId === item.id ? "..." : item.aktywny ? "Dezaktywuj" : "Aktywuj"}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.miejscowosc)}
                    disabled={loadingId === item.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Strona {currentPage} z {totalPages}
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`?page=${currentPage - 1}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Poprzednia
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`?page=${currentPage + 1}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Następna
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

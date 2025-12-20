import Link from "next/link";
import { getOperators, deleteOperator } from "@/src/features/operators/actions";
import DeleteButton from "./DeleteButton";

export default async function OperatorsPage() {
  const operators = await getOperators();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Operatorzy</h1>
        <Link
          href="/admin/operatorzy/nowy"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Dodaj operatora
        </Link>
      </div>

      {operators.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">Brak operatorów w systemie</p>
          <Link
            href="/admin/operatorzy/nowy"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Dodaj pierwszego operatora
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email handlowca
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Oferty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Leady
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {operators.map((op) => (
                <tr key={op.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {op.logo_url && (
                        <img
                          src={op.logo_url}
                          alt={op.nazwa}
                          className="w-10 h-10 rounded-full mr-3 object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{op.nazwa}</div>
                        <div className="text-sm text-gray-500">{op.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {op.email_handlowca || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {op._count.oferty}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {op._count.leady}
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <Link
                      href={`/admin/operatorzy/${op.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edytuj
                    </Link>
                    <DeleteButton id={op.id} nazwa={op.nazwa} />
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

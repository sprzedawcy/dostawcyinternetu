import { getOperator } from "@/src/features/operators/actions";
import { getOperatorCoverage } from "@/src/features/coverage/actions";
import AddCoverageForm from "@/src/features/coverage/components/AddCoverageForm";
import CoverageList from "@/src/features/coverage/components/CoverageList";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function OperatorCoveragePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;
  const operator_id = parseInt(id);
  const currentPage = parseInt(page || '1');
  
  const [operator, coverage] = await Promise.all([
    getOperator(operator_id),
    getOperatorCoverage(operator_id, currentPage, 50)
  ]);

  if (!operator) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/admin/operatorzy/${operator_id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Powrót do operatora
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Zasięg: {operator.nazwa}
          </h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj zasięgiem geograficznym operatora
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Wszystkie wpisy</p>
          <p className="text-2xl font-bold">{coverage.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Aktywne</p>
          <p className="text-2xl font-bold text-green-600">
            {coverage.items.filter((c: any) => c.aktywny).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Nieaktywne</p>
          <p className="text-2xl font-bold text-gray-600">
            {coverage.items.filter((c: any) => !c.aktywny).length}
          </p>
        </div>
      </div>

      {/* Dodaj nowy zasięg */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Dodaj nowy zasięg
        </h2>
        <AddCoverageForm operator_id={operator_id} />
      </div>

      {/* Lista zasięgów */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Lista zasięgów ({coverage.total})
          </h2>
        </div>
        <CoverageList
          items={coverage.items}
          operator_id={operator_id}
          currentPage={currentPage}
          totalPages={coverage.pages}
        />
      </div>
    </div>
  );
}

import { getOperator } from "@/src/features/operators/actions";
import OperatorForm from "@/src/features/operators/components/OperatorForm";
import { notFound } from "next/navigation";

export default async function EditOperatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operator = await getOperator(parseInt(id));

  if (!operator) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Edytuj operatora: {operator.nazwa}
      </h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <OperatorForm mode="edit" operator={operator} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Oferty</p>
          <p className="text-2xl font-bold">{operator.oferty.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Leady</p>
          <p className="text-2xl font-bold">{operator.leady.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Zasięg</p>
          <p className="text-2xl font-bold">{operator.zasiegi.length}</p>
        </div>
      </div>
    </div>
  );
}
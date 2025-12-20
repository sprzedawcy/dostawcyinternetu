import OperatorForm from "@/src/features/operators/components/OperatorForm";

export default function NewOperatorPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dodaj operatora</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <OperatorForm mode="create" />
      </div>
    </div>
  );
}

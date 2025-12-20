import OfferForm from "@/src/features/offers/components/OfferForm";
import { getOperatorsForSelect } from "@/src/features/offers/actions";

export default async function NewOfferPage() {
  const operators = await getOperatorsForSelect();

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dodaj ofertę</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <OfferForm mode="create" operators={operators} />
      </div>
    </div>
  );
}

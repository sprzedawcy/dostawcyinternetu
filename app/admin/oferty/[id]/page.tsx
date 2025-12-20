import { getOffer, getOperatorsForSelect } from "@/src/features/offers/actions";
import OfferForm from "@/src/features/offers/components/OfferForm";
import { notFound } from "next/navigation";

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [offer, operators] = await Promise.all([
    getOffer(parseInt(id)),
    getOperatorsForSelect()
  ]);

  if (!offer) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Edytuj ofertę: {offer.nazwa}
      </h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <OfferForm mode="edit" offer={offer} operators={operators} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Urządzenia</p>
          <p className="text-2xl font-bold">{offer.urzadzenia.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Lokalizacje</p>
          <p className="text-2xl font-bold">{offer.lokalizacje.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Programy TV</p>
          <p className="text-2xl font-bold">{offer.programy_tv.length}</p>
        </div>
      </div>
    </div>
  );
}

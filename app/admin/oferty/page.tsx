import { getOffers, getOperatorsForSelect } from "@/src/features/offers/actions";
import OffersListClient from "./OffersListClient";

export default async function OffersPage() {
  const [offers, operators] = await Promise.all([
    getOffers(),
    getOperatorsForSelect()
  ]);

  return <OffersListClient offers={offers} operators={operators} />;
}

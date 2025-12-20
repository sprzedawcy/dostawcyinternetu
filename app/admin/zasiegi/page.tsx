import { getOperatorsForFilter } from "@/src/features/coverage/actions/coverage";
import CoverageTable from "./components/CoverageTable";

export default async function ZasiegiPage() {
  const operators = await getOperatorsForFilter();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🗺️ Zasięgi operatorów</h1>
        <p className="text-gray-700 mt-2">Zarządzaj zasięgami i ilością HP per adres</p>
      </div>

      <CoverageTable operators={operators} />
    </div>
  );
}

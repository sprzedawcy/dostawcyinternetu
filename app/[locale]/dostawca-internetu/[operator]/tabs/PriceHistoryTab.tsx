interface PriceHistory {
  id: number;
  nazwa_oferty: string | null;
  abonament: any;
  download_mbps: number | null;
  data_od: string;
}

interface Props {
  priceHistory: PriceHistory[];
  operatorName: string;
}

export default function PriceHistoryTab({ priceHistory, operatorName }: Props) {
  if (priceHistory.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-5xl mb-4 block">💰</span>
        <p className="text-gray-500 text-lg">Brak historii cen</p>
        <p className="text-gray-400 text-sm mt-2">Dane będą dostępne wkrótce</p>
      </div>
    );
  }

  const avgPrice = priceHistory.reduce((sum, p) => sum + Number(p.abonament), 0) / priceHistory.length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 text-lg">Historia cen {operatorName}</h3>
          <div className="text-right">
            <p className="text-sm text-gray-500">Średnia cena (12 mies.)</p>
            <p className="text-3xl font-black text-green-600">{avgPrice.toFixed(0)} zł</p>
          </div>
        </div>
        <div className="space-y-3">
          {priceHistory.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">{p.nazwa_oferty || 'Oferta'}</p>
                {p.download_mbps && <p className="text-sm text-gray-500">{p.download_mbps} Mb/s</p>}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{Number(p.abonament).toFixed(0)} zł</p>
                <p className="text-xs text-gray-500">{new Date(p.data_od).toLocaleDateString('pl-PL')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

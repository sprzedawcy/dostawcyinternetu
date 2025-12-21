interface Promotion {
  id: number;
  tytul: string;
  opis: string;
  kod: string | null;
  rabat: string | null;
  data_koniec: string | null;
}

interface Props {
  promotions: Promotion[];
  operatorName: string;
}

export default function PromotionsTab({ promotions, operatorName }: Props) {
  if (promotions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-5xl mb-4 block">🎁</span>
        <p className="text-gray-500 text-lg">Brak aktywnych promocji</p>
        <p className="text-gray-400 text-sm mt-2">Sprawdź później</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {promotions.map((p) => (
        <div key={p.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{p.tytul}</h3>
              <p className="text-gray-600 mt-1">{p.opis}</p>
              {p.data_koniec && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  ⏰ Ważne do: {new Date(p.data_koniec).toLocaleDateString('pl-PL')}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {p.rabat && <p className="text-3xl font-black text-green-600">{p.rabat}</p>}
              {p.kod && (
                <div className="mt-2 px-4 py-2 bg-white border-2 border-dashed border-gray-400 rounded-lg font-mono font-bold text-lg">
                  {p.kod}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

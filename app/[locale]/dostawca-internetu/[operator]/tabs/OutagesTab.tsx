interface Outage {
  id: number;
  miejscowosc: string | null;
  opis: string;
  data_start: string;
  data_koniec: string | null;
  status: string;
}

interface Props {
  outages: Outage[];
  operatorName: string;
}

export default function OutagesTab({ outages, operatorName }: Props) {
  const active = outages.filter(o => o.status === 'aktywna');
  const resolved = outages.filter(o => o.status === 'zakonczona');

  if (outages.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-5xl mb-4 block">✅</span>
        <p className="text-green-600 font-bold text-lg">Brak zgłoszonych awarii</p>
        <p className="text-gray-400 text-sm mt-2">Wszystko działa prawidłowo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <h3 className="font-bold text-red-800 mb-4 text-lg">⚠️ Aktywne awarie ({active.length})</h3>
          <div className="space-y-3">
            {active.map((o) => (
              <div key={o.id} className="bg-white p-4 rounded-lg">
                <p className="font-medium text-gray-900">{o.opis}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {o.miejscowosc && `📍 ${o.miejscowosc} • `}Od: {new Date(o.data_start).toLocaleString('pl-PL')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {resolved.length > 0 && (
        <div className="bg-white rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">Historia awarii</h3>
          <div className="space-y-3">
            {resolved.slice(0, 10).map((o) => (
              <div key={o.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <p className="text-gray-700">{o.opis}</p>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Rozwiązana</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {o.miejscowosc && `📍 ${o.miejscowosc} • `}{new Date(o.data_start).toLocaleDateString('pl-PL')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

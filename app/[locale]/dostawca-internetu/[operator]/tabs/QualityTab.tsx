interface Speedtest {
  id: number;
  ping_ms: any;
  download_mbps: any;
  upload_mbps: any;
  jitter_ms: any;
  miejscowosc: string | null;
  created_at: string;
}

interface Props {
  speedtests: Speedtest[];
  operatorName: string;
}

export default function QualityTab({ speedtests, operatorName }: Props) {
  if (speedtests.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-5xl mb-4 block">📊</span>
        <p className="text-gray-500 text-lg">Brak danych o jakości połączenia</p>
        <p className="text-gray-400 text-sm mt-2">Dane będą dostępne wkrótce</p>
      </div>
    );
  }

  const avgPing = speedtests.reduce((sum, s) => sum + Number(s.ping_ms), 0) / speedtests.length;
  const avgDown = speedtests.reduce((sum, s) => sum + Number(s.download_mbps), 0) / speedtests.length;
  const avgUp = speedtests.reduce((sum, s) => sum + Number(s.upload_mbps), 0) / speedtests.length;
  const minPing = Math.min(...speedtests.map(s => Number(s.ping_ms)));
  const maxPing = Math.max(...speedtests.map(s => Number(s.ping_ms)));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 text-center">
          <span className="text-3xl mb-2 block">🏓</span>
          <p className="text-gray-500 text-sm mb-1">Średni ping</p>
          <p className="text-3xl font-black text-blue-600">{avgPing.toFixed(0)}<span className="text-lg">ms</span></p>
        </div>
        <div className="bg-white rounded-xl p-5 text-center">
          <span className="text-3xl mb-2 block">📉📈</span>
          <p className="text-gray-500 text-sm mb-1">Ping (min-max)</p>
          <p className="text-xl font-bold text-gray-700">{minPing.toFixed(0)} - {maxPing.toFixed(0)} ms</p>
        </div>
        <div className="bg-white rounded-xl p-5 text-center">
          <span className="text-3xl mb-2 block">⬇️</span>
          <p className="text-gray-500 text-sm mb-1">Średnie pobieranie</p>
          <p className="text-3xl font-black text-green-600">{avgDown.toFixed(0)}<span className="text-lg">Mb/s</span></p>
        </div>
        <div className="bg-white rounded-xl p-5 text-center">
          <span className="text-3xl mb-2 block">⬆️</span>
          <p className="text-gray-500 text-sm mb-1">Średnie wysyłanie</p>
          <p className="text-3xl font-black text-purple-600">{avgUp.toFixed(0)}<span className="text-lg">Mb/s</span></p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">Ostatnie pomiary ({speedtests.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Lokalizacja</th>
                <th className="text-right py-2 px-3">Ping</th>
                <th className="text-right py-2 px-3">Download</th>
                <th className="text-right py-2 px-3">Upload</th>
                <th className="text-right py-2 px-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {speedtests.slice(0, 10).map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{s.miejscowosc || '-'}</td>
                  <td className="py-2 px-3 text-right font-medium">{Number(s.ping_ms).toFixed(0)} ms</td>
                  <td className="py-2 px-3 text-right font-medium text-green-600">{Number(s.download_mbps).toFixed(0)} Mb/s</td>
                  <td className="py-2 px-3 text-right font-medium text-purple-600">{Number(s.upload_mbps).toFixed(0)} Mb/s</td>
                  <td className="py-2 px-3 text-right text-gray-500">{new Date(s.created_at).toLocaleDateString('pl-PL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

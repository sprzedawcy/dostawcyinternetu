// app/[locale]/dostawca-internetu/[operator]/tabs/InformacjeTab.tsx
"use client";

import { useState } from "react";

interface Speedtest {
  id: number;
  ping_ms: string;
  download_mbps: string;
  upload_mbps: string;
  jitter_ms: string | null;
  miejscowosc: string | null;
  created_at: string;
}

interface PriceHistory {
  id: number;
  nazwa_oferty: string;
  abonament: string;
  download_mbps: number;
  data_od: string;
}

interface Outage {
  id: number;
  miejscowosc: string | null;
  opis: string | null;
  data_start: string;
  data_koniec: string | null;
  status: string;
}

interface Faq {
  id: number;
  pytanie: string;
  odpowiedz: string;
}

interface Props {
  operatorName: string;
  speedtests: Speedtest[];
  priceHistory: PriceHistory[];
  outages: Outage[];
  faqs: Faq[];
}

type Section = 'jakosc' | 'ceny' | 'obsluga' | 'awarie' | 'faq';

export default function InformacjeTab({ operatorName, speedtests, priceHistory, outages, faqs }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('jakosc');

  const sections = [
    { id: 'jakosc' as Section, label: 'Jakość sieci', icon: '📊', count: speedtests.length },
    { id: 'ceny' as Section, label: 'Historia cen', icon: '💰', count: priceHistory.length },
    { id: 'obsluga' as Section, label: 'Obsługa klienta', icon: '🛠️' },
    { id: 'awarie' as Section, label: 'Awarie', icon: '⚠️', count: outages.filter(o => o.status === 'aktywna').length },
    { id: 'faq' as Section, label: 'FAQ', icon: '❓', count: faqs.length },
  ];

  // Statystyki speedtestów
  const avgDownload = speedtests.length > 0
    ? (speedtests.reduce((sum, s) => sum + parseFloat(s.download_mbps), 0) / speedtests.length).toFixed(1)
    : null;
  const avgUpload = speedtests.length > 0
    ? (speedtests.reduce((sum, s) => sum + parseFloat(s.upload_mbps), 0) / speedtests.length).toFixed(1)
    : null;
  const avgPing = speedtests.length > 0
    ? (speedtests.reduce((sum, s) => sum + parseFloat(s.ping_ms), 0) / speedtests.length).toFixed(0)
    : null;

  return (
    <div className="space-y-6">
      {/* Mini nawigacja */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === section.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{section.icon}</span>
            <span>{section.label}</span>
            {section.count !== undefined && section.count > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeSection === section.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {section.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Jakość sieci */}
      {activeSection === 'jakosc' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Jakość sieci {operatorName}</h3>
          
          {speedtests.length > 0 ? (
            <>
              {/* Średnie statystyki */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{avgDownload}</div>
                  <div className="text-sm text-blue-800">Mb/s pobieranie</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{avgUpload}</div>
                  <div className="text-sm text-green-800">Mb/s wysyłanie</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{avgPing}</div>
                  <div className="text-sm text-purple-800">ms ping</div>
                </div>
              </div>

              {/* Lista testów */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Lokalizacja</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Download</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Upload</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Ping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {speedtests.slice(0, 10).map((test) => (
                      <tr key={test.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(test.created_at).toLocaleDateString('pl-PL')}
                        </td>
                        <td className="px-4 py-3">{test.miejscowosc || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">{test.download_mbps} Mb/s</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">{test.upload_mbps} Mb/s</td>
                        <td className="px-4 py-3 text-right text-gray-600">{test.ping_ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
              Brak danych o jakości sieci. Bądź pierwszy - dodaj wynik swojego testu prędkości!
            </div>
          )}
        </div>
      )}

      {/* Historia cen */}
      {activeSection === 'ceny' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Historia cen {operatorName}</h3>
          
          {priceHistory.length > 0 ? (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Oferta</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Prędkość</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Cena</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {priceHistory.map((price) => (
                    <tr key={price.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(price.data_od).toLocaleDateString('pl-PL')}
                      </td>
                      <td className="px-4 py-3 font-medium">{price.nazwa_oferty}</td>
                      <td className="px-4 py-3 text-right">{price.download_mbps} Mb/s</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{price.abonament} zł</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
              Brak historii zmian cen dla tego operatora.
            </div>
          )}
        </div>
      )}

      {/* Obsługa klienta */}
      {activeSection === 'obsluga' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Obsługa klienta {operatorName}</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-6">
              <div className="text-2xl mb-2">📞</div>
              <h4 className="font-bold text-gray-900 mb-1">Infolinia</h4>
              <p className="text-gray-600 text-sm">Kontakt telefoniczny z biurem obsługi klienta</p>
            </div>
            <div className="bg-white rounded-xl border p-6">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-bold text-gray-900 mb-1">Chat online</h4>
              <p className="text-gray-600 text-sm">Szybki kontakt przez czat na stronie operatora</p>
            </div>
            <div className="bg-white rounded-xl border p-6">
              <div className="text-2xl mb-2">📧</div>
              <h4 className="font-bold text-gray-900 mb-1">E-mail</h4>
              <p className="text-gray-600 text-sm">Kontakt mailowy dla spraw formalnych</p>
            </div>
            <div className="bg-white rounded-xl border p-6">
              <div className="text-2xl mb-2">🏪</div>
              <h4 className="font-bold text-gray-900 mb-1">Salony</h4>
              <p className="text-gray-600 text-sm">Punkty obsługi stacjonarnej</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
            💡 Szczegółowe dane kontaktowe znajdziesz na oficjalnej stronie operatora {operatorName}.
          </div>
        </div>
      )}

      {/* Awarie */}
      {activeSection === 'awarie' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Awarie {operatorName}</h3>
          
          {outages.length > 0 ? (
            <div className="space-y-3">
              {outages.map((outage) => (
                <div 
                  key={outage.id} 
                  className={`rounded-xl border p-4 ${
                    outage.status === 'aktywna' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          outage.status === 'aktywna' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {outage.status === 'aktywna' ? '🔴 Aktywna' : '✅ Rozwiązana'}
                        </span>
                        {outage.miejscowosc && (
                          <span className="text-sm text-gray-600">📍 {outage.miejscowosc}</span>
                        )}
                      </div>
                      {outage.opis && <p className="text-gray-700">{outage.opis}</p>}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{new Date(outage.data_start).toLocaleDateString('pl-PL')}</div>
                      {outage.data_koniec && (
                        <div className="text-green-600">
                          do {new Date(outage.data_koniec).toLocaleDateString('pl-PL')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl p-8 text-center text-green-700">
              ✅ Brak zgłoszonych awarii. Sieć działa prawidłowo.
            </div>
          )}
        </div>
      )}

      {/* FAQ */}
      {activeSection === 'faq' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Najczęściej zadawane pytania - {operatorName}</h3>
          
          {faqs.length > 0 ? (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.id} className="bg-white rounded-xl border group">
                  <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 rounded-xl flex items-center justify-between">
                    <span>{faq.pytanie}</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-4 pb-4 text-gray-600 border-t">
                    <p className="pt-3">{faq.odpowiedz}</p>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
              Brak pytań FAQ dla tego operatora.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

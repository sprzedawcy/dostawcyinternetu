import Link from "next/link";

interface Offer {
  id: number;
  nazwa: string;
  custom_url: string | null;
  abonament: any;
  download_mbps: number;
  upload_mbps: number;
  technologia: string | null;
  wifi: string | null;
  wyrozoniona: boolean;
  lokalna: boolean;
  kategoria: string;
}

interface Props {
  offers: Offer[];
  operatorSlug: string;
  operatorName: string;
}

export default function OffersTab({ offers, operatorSlug, operatorName }: Props) {
  const offersByCategory = offers.reduce((acc, offer) => {
    const cat = offer.kategoria || 'Internet';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(offer);
    return acc;
  }, {} as Record<string, Offer[]>);

  if (offers.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-4xl mb-4 block">📦</span>
        <p className="text-gray-500">Brak aktywnych ofert.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(offersByCategory).map(([category, categoryOffers]) => (
        <div key={category}>
          <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            {category === 'Internet' && '🌐'}
            {category === 'Internet + TV' && '📺'}
            {category === 'Internet + TV + Telefon' && '📱'}
            {category}
            <span className="text-sm font-normal text-gray-500">({categoryOffers.length})</span>
          </h3>
          <div className="grid gap-4">
            {categoryOffers.map((offer) => (
              <Link key={offer.id} href={`/internet/${operatorSlug}/${offer.custom_url || offer.id}`}
                className="block bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 text-lg">{offer.nazwa}</h4>
                      {offer.wyrozoniona && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">⭐ Wyróżniona</span>}
                      {offer.lokalna && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">📍 Lokalna</span>}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {offer.technologia && <span className="mr-3">🔌 {offer.technologia}</span>}
                      {offer.wifi && <span>📶 {offer.wifi}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-black text-blue-600">{offer.download_mbps}<span className="text-sm font-normal text-gray-500 ml-1">Mb/s</span></p>
                      <p className="text-xs text-gray-500">pobieranie</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-green-600">{offer.upload_mbps}<span className="text-sm font-normal text-gray-500 ml-1">Mb/s</span></p>
                      <p className="text-xs text-gray-500">wysyłanie</p>
                    </div>
                    <div className="text-right pl-4 border-l-2">
                      <p className="text-3xl font-black text-gray-900">{parseFloat(offer.abonament).toFixed(0)}<span className="text-lg font-normal text-gray-500 ml-1">zł</span></p>
                      <p className="text-xs text-gray-500">/miesiąc</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

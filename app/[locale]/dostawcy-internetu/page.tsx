import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dostawcy internetu w Polsce - porównaj oferty | DostawcyInternetu.pl",
  description: "Lista wszystkich dostawców internetu w Polsce. Porównaj operatorów, sprawdź oferty i ceny.",
};

export default async function OperatorsListPage() {
  const operators = await prisma.operator.findMany({
    where: { aktywny: true },
    include: {
      _count: { select: { oferty: { where: { aktywna: true } } } },
      oferty: { where: { aktywna: true }, select: { abonament: true, download_mbps: true } }
    },
    orderBy: { nazwa: 'asc' }
  });

  const operatorsWithStats = operators.map(op => ({
    ...op,
    stats: {
      totalOffers: op._count.oferty,
      minPrice: op.oferty.length > 0 ? Math.min(...op.oferty.map(o => parseFloat(o.abonament.toString()))) : null,
      maxSpeed: op.oferty.length > 0 ? Math.max(...op.oferty.map(o => o.download_mbps)) : null
    }
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Internet</Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium">Dostawcy internetu</span>
          </nav>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Dostawcy internetu w Polsce</h1>
          <p className="text-gray-600 max-w-2xl">Porównaj wszystkich operatorów i znajdź najlepszą ofertę internetu.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operatorsWithStats.map((operator) => (
            <Link key={operator.id} href={`/dostawca-internetu/${operator.slug}`}
              className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all overflow-hidden">
              <div className="h-32 bg-gray-50 flex items-center justify-center border-b">
                {operator.logo_url ? (
                  <img src={operator.logo_url} alt={operator.nazwa} className="max-h-20 max-w-[80%] object-contain" />
                ) : (
                  <span className="text-5xl font-bold text-gray-300">{operator.nazwa.charAt(0)}</span>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-bold text-gray-900 text-lg mb-2">{operator.nazwa}</h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{operator.stats.totalOffers} ofert</span>
                  {operator.stats.minPrice && <span className="px-2 py-1 bg-green-50 text-green-700 rounded">od {operator.stats.minPrice} zł</span>}
                  {operator.stats.maxSpeed && <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">do {operator.stats.maxSpeed} Mb/s</span>}
                </div>
                {operator.opis && <p className="text-gray-500 text-sm mt-3 line-clamp-2">{operator.opis}</p>}
              </div>
            </Link>
          ))}
        </div>

        {operators.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center"><p className="text-gray-500">Brak aktywnych operatorów.</p></div>
        )}

        <div className="mt-12 bg-white rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Jak wybrać dostawcę internetu?</h2>
          <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
            <p>Wybór odpowiedniego dostawcy internetu zależy od kilku czynników: dostępności w Twojej lokalizacji, wymaganej prędkości, budżetu oraz dodatkowych usług.</p>
            <p>Wpisz swój adres w wyszukiwarce na górze strony, aby sprawdzić którzy operatorzy oferują usługi w Twojej lokalizacji.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

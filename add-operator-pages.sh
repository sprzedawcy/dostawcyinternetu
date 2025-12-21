#!/bin/bash
echo "Tworzę strony operatorów..."

# 1. Folder dla profilu operatora
mkdir -p app/\[locale\]/dostawca-internetu/\[operator\]

# 2. Strona profilu operatora
cat > app/\[locale\]/dostawca-internetu/\[operator\]/page.tsx << 'EOF'
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ locale: string; operator: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { operator: operatorSlug } = await params;
  
  const operator = await prisma.operator.findFirst({
    where: { slug: operatorSlug, aktywny: true }
  });

  if (!operator) {
    return { title: "Operator nie znaleziony" };
  }

  return {
    title: `${operator.nazwa} - Internet, oferty, zasięg | DostawcyInternetu.pl`,
    description: `Sprawdź oferty internetu od ${operator.nazwa}. Porównaj ceny, prędkości i zamów instalację online. ${operator.opis?.slice(0, 100) || ''}`,
  };
}

export default async function OperatorProfilePage({ params }: Props) {
  const { operator: operatorSlug, locale } = await params;

  const operator = await prisma.operator.findFirst({
    where: { slug: operatorSlug, aktywny: true },
    include: {
      oferty: {
        where: { aktywna: true },
        orderBy: [
          { wyrozoniona: 'desc' },
          { priorytet: 'desc' },
          { abonament: 'asc' }
        ],
        include: {
          lokalizacje: true
        }
      },
      _count: {
        select: {
          coverage: true,
          opinie: true
        }
      }
    }
  });

  if (!operator) {
    notFound();
  }

  const offersByCategory = operator.oferty.reduce((acc, offer) => {
    const cat = offer.kategoria || 'Internet';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(offer);
    return acc;
  }, {} as Record<string, typeof operator.oferty>);

  const stats = {
    totalOffers: operator.oferty.length,
    minPrice: operator.oferty.length > 0 
      ? Math.min(...operator.oferty.map(o => parseFloat(o.abonament.toString())))
      : 0,
    maxSpeed: operator.oferty.length > 0
      ? Math.max(...operator.oferty.map(o => o.download_mbps))
      : 0,
    coveragePoints: operator._count.coverage
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Internet</Link>
            <span className="text-gray-400">&gt;</span>
            <Link href="/dostawcy-internetu" className="hover:text-blue-600">Dostawcy internetu</Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium">{operator.nazwa}</span>
          </nav>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
            <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-gray-200">
              {operator.logo_url ? (
                <img src={operator.logo_url} alt={operator.nazwa} className="w-full h-full object-contain p-4" />
              ) : (
                <span className="text-5xl font-bold text-gray-400">{operator.nazwa.charAt(0)}</span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-black text-gray-900 mb-2">{operator.nazwa}</h1>
              {operator.opis && <p className="text-gray-600 mb-4 max-w-2xl">{operator.opis}</p>}

              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 bg-blue-50 rounded-xl">
                  <span className="text-2xl font-bold text-blue-600">{stats.totalOffers}</span>
                  <span className="text-blue-800 text-sm ml-2">ofert</span>
                </div>
                {stats.minPrice > 0 && (
                  <div className="px-4 py-2 bg-green-50 rounded-xl">
                    <span className="text-sm text-green-800">od</span>
                    <span className="text-2xl font-bold text-green-600 ml-1">{stats.minPrice}</span>
                    <span className="text-green-800 text-sm ml-1">zł/mies.</span>
                  </div>
                )}
                {stats.maxSpeed > 0 && (
                  <div className="px-4 py-2 bg-purple-50 rounded-xl">
                    <span className="text-sm text-purple-800">do</span>
                    <span className="text-2xl font-bold text-purple-600 ml-1">{stats.maxSpeed}</span>
                    <span className="text-purple-800 text-sm ml-1">Mb/s</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Oferty {operator.nazwa}</h2>

        {Object.entries(offersByCategory).map(([category, offers]) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              {category === 'Internet' && '🌐'}
              {category === 'Internet + TV' && '📺'}
              {category === 'Internet + TV + Telefon' && '📱'}
              {category}
              <span className="text-sm font-normal text-gray-500">({offers.length})</span>
            </h3>

            <div className="grid gap-4">
              {offers.map((offer) => (
                <Link
                  key={offer.id}
                  href={`/internet/${operator.slug}/${offer.custom_url || offer.id}`}
                  className="block bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all p-5"
                >
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
                        <p className="text-3xl font-black text-gray-900">{parseFloat(offer.abonament.toString()).toFixed(0)}<span className="text-lg font-normal text-gray-500 ml-1">zł</span></p>
                        <p className="text-xs text-gray-500">/miesiąc</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {operator.oferty.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-500">Brak aktywnych ofert dla tego operatora.</p>
          </div>
        )}

        <div className="mt-12 bg-white rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{operator.nazwa} - dostawca internetu</h2>
          <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
            <p>
              {operator.nazwa} to jeden z dostawców internetu w Polsce. 
              {stats.totalOffers > 0 && ` Oferuje ${stats.totalOffers} różnych pakietów internetowych.`}
              {stats.maxSpeed > 0 && ` Maksymalna prędkość pobierania to ${stats.maxSpeed} Mb/s.`}
              {stats.minPrice > 0 && ` Ceny zaczynają się od ${stats.minPrice} zł miesięcznie.`}
            </p>
            <p>Sprawdź dostępność usług {operator.nazwa} pod swoim adresem. Wpisz adres w wyszukiwarce na górze strony.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF
echo "1/2 Profil operatora ✓"

# 3. Folder i strona listy operatorów
mkdir -p app/\[locale\]/dostawcy-internetu

cat > app/\[locale\]/dostawcy-internetu/page.tsx << 'EOF'
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
EOF
echo "2/2 Lista operatorów ✓"

echo ""
echo "✅ Strony operatorów utworzone!"
echo ""
echo "Dostępne URL-e:"
echo "  /dostawcy-internetu - lista wszystkich operatorów"
echo "  /dostawca-internetu/orange - profil Orange"
echo "  /dostawca-internetu/vectra - profil Vectra"
echo "  itd."

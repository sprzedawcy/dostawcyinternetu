import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import OffersFilters from "./OffersFilters";

interface Props {
  params: Promise<{ miejscowosc: string }>;
}

export default async function MiejscowoscPage({ params }: Props) {
  const { miejscowosc } = await params;
  const slugDecoded = decodeURIComponent(miejscowosc);
  
  // Znajdz miejscowosc po slug
  const miejscowoscData = await prisma.polska.findFirst({
    where: { slug: slugDecoded },
    select: { 
      miejscowosc: true, 
      simc: true, 
      powiat: true,
      wojewodztwo: true 
    }
  });

  if (!miejscowoscData) {
    notFound();
  }

  // Pobierz operatorow z zasiegiem w tej miejscowosci
  const coverages = await prisma.operatorCoverage.findMany({
    where: { simc: miejscowoscData.simc },
    select: { operator_id: true },
    distinct: ['operator_id']
  });

  const operatorIds = coverages.map(c => c.operator_id);

  // Pobierz oferty kablowe tych operatorow + wszystkie komorkowe
  const offers = await prisma.oferta.findMany({
    where: {
      aktywna: true,
      OR: [
        { typ_polaczenia: 'komorkowe' },
        { 
          typ_polaczenia: 'kablowe',
          operator_id: { in: operatorIds }
        }
      ]
    },
    include: {
      operator: {
        select: { id: true, nazwa: true, slug: true, logo_url: true }
      }
    },
    orderBy: [
      { wyrozoniona: 'desc' },
      { lokalna: 'desc' },
      { priorytet: 'desc' }
    ]
  });

  // Unikalni operatorzy do filtrow
  const operators = [...new Map(offers.map(o => [o.operator.id, o.operator])).values()];

  // Serializacja
  const serializedOffers = JSON.parse(JSON.stringify(offers));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* BREADCRUMB */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Internet</Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium">{miejscowoscData.miejscowosc}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* NAGLOWEK */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Internet w miejscowości {miejscowoscData.miejscowosc}
          </h1>
          <p className="text-gray-600">
            Porównaj {offers.length} ofert internetu dostępnych w {miejscowoscData.miejscowosc} 
            {miejscowoscData.powiat && ` (powiat ${miejscowoscData.powiat})`}.
            Sprawdź ceny, prędkości i wybierz najlepszą ofertę dla siebie.
          </p>
          {operatorIds.length > 0 && (
            <p className="text-sm text-green-700 mt-2">
              ✅ W tej miejscowości działa {operatorIds.length} operatorów z internetem kablowym
            </p>
          )}
        </div>

        {/* FILTRY + LISTA */}
        <OffersFilters 
          offers={serializedOffers} 
          operators={operators}
          miejscowosc={miejscowoscData.miejscowosc}
          miejscowoscSlug={slugDecoded}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { miejscowosc } = await params;
  const slugDecoded = decodeURIComponent(miejscowosc);
  
  const miejscowoscData = await prisma.polska.findFirst({
    where: { slug: slugDecoded },
    select: { miejscowosc: true, powiat: true }
  });

  if (!miejscowoscData) {
    return { title: 'Miejscowość nie znaleziona' };
  }

  return {
    title: `Internet ${miejscowoscData.miejscowosc} - Porównaj oferty | Porównywarka`,
    description: `Sprawdź dostępne oferty internetu w ${miejscowoscData.miejscowosc}. Porównaj ceny, prędkości i operatorów. Znajdź najlepszy internet dla siebie.`
  };
}

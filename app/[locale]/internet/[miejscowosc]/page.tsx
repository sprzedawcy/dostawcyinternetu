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
  
  const miejscowoscData = await prisma.polska.findFirst({
    where: { slug: slugDecoded },
    select: { 
      miejscowosc: true, 
      simc: true
    }
  });

  if (!miejscowoscData) {
    notFound();
  }

  const coverages = await prisma.operatorCoverage.findMany({
    where: { simc: miejscowoscData.simc },
    select: { operator_id: true },
    distinct: ['operator_id']
  });

  const operatorIds = coverages.map(c => c.operator_id);

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

  const operators = [...new Map(offers.map(o => [o.operator.id, o.operator])).values()];
  const serializedOffers = JSON.parse(JSON.stringify(offers));

  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Internet w miejscowosci {miejscowoscData.miejscowosc}
          </h1>
          <p className="text-gray-600">
            Porownaj {offers.length} ofert internetu dostepnych w {miejscowoscData.miejscowosc}.
            Sprawdz ceny, predkosci i wybierz najlepsza oferte dla siebie.
          </p>
          {operatorIds.length > 0 && (
            <p className="text-sm text-green-700 mt-2">
              W tej miejscowosci dziala {operatorIds.length} operatorow z internetem kablowym
            </p>
          )}
        </div>

        <OffersFilters 
          offers={serializedOffers} 
          operators={operators}
          miejscowosc={miejscowoscData.miejscowosc || ''}
          miejscowoscSlug={slugDecoded}
          simc={miejscowoscData.simc}
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
    select: { miejscowosc: true }
  });

  if (!miejscowoscData) {
    return { title: 'Miejscowosc nie znaleziona' };
  }

  return {
    title: `Internet ${miejscowoscData.miejscowosc} - Porownaj oferty | Porowywarka`,
    description: `Sprawdz dostepne oferty internetu w ${miejscowoscData.miejscowosc}. Porownaj ceny, predkosci i operatorow. Znajdz najlepszy internet dla siebie.`
  };
}
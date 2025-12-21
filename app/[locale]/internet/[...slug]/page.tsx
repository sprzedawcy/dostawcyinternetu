import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MiejscowoscPage from "./MiejscowoscPage";
import OfferPage from "./OfferPage";

interface Props {
  params: Promise<{ slug: string[]; locale: string }>;
  searchParams: Promise<{ info?: string; adres?: string }>;
}

export default async function InternetCatchAllPage({ params, searchParams }: Props) {
  const { slug, locale } = await params;
  const searchParamsResolved = await searchParams;

  // 1 segment = miejscowość (/internet/warszawa)
  if (slug.length === 1) {
    const miejscowoscSlug = slug[0];
    return <MiejscowoscPage slug={miejscowoscSlug} locale={locale} />;
  }

  // 2 segmenty = operator/oferta (/internet/orange/nazwa-oferty)
  if (slug.length === 2) {
    const [operatorSlug, offerSlug] = slug;
    return <OfferPage 
      operatorSlug={operatorSlug} 
      offerSlug={offerSlug} 
      locale={locale}
      searchParams={searchParamsResolved}
    />;
  }

  // Inne = 404
  notFound();
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const { info } = await searchParams;

  if (slug.length === 1) {
    const miejscowoscSlug = slug[0];
    const miejscowoscData = await prisma.polska.findFirst({
      where: { slug: miejscowoscSlug },
      select: { miejscowosc: true }
    });

    if (!miejscowoscData) {
      return { title: 'Miejscowosc nie znaleziona' };
    }

    return {
      title: `Internet ${miejscowoscData.miejscowosc} - Porownaj oferty | DostawcyInternetu.pl`,
      description: `Sprawdz dostepne oferty internetu w ${miejscowoscData.miejscowosc}. Porownaj ceny, predkosci i operatorow.`
    };
  }

  if (slug.length === 2) {
    const [operatorSlug, offerSlug] = slug;
    
    const operator = await prisma.operator.findFirst({
      where: { slug: operatorSlug }
    });

    if (!operator) {
      return { title: 'Oferta nie znaleziona' };
    }

    const offer = await prisma.oferta.findFirst({
      where: {
        operator_id: operator.id,
        OR: [
          { custom_url: offerSlug },
          { id: isNaN(parseInt(offerSlug)) ? -1 : parseInt(offerSlug) }
        ]
      },
      include: { operator: true }
    });

    if (!offer) {
      return { title: 'Oferta nie znaleziona' };
    }

    const prefix = info === '1' ? 'Szczegoly: ' : '';

    return {
      title: `${prefix}${offer.nazwa} - ${offer.operator.nazwa} | DostawcyInternetu.pl`,
      description: `${offer.download_mbps} Mb/s za ${offer.abonament} zl/mies. ${offer.technologia || ''}. Sprawdz oferte ${offer.operator.nazwa}.`
    };
  }

  return { title: 'Strona nie znaleziona' };
}
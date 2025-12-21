import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import OfferDetailsView from "./OfferDetailsView";
import OfferInfoView from "./OfferInfoView";
import OfferPageClient from "./OfferPageClient";

interface Props {
  operatorSlug: string;
  offerSlug: string;
  locale: string;
  searchParams: { info?: string; adres?: string };
}

export default async function OfferPage({ operatorSlug, offerSlug, locale, searchParams }: Props) {
  const { info, adres } = searchParams;
  const showInfoView = info === '1';

  const operator = await prisma.operator.findFirst({
    where: { slug: operatorSlug }
  });

  if (!operator) {
    notFound();
  }

  const offer = await prisma.oferta.findFirst({
    where: {
      operator_id: operator.id,
      OR: [
        { custom_url: offerSlug },
        { id: isNaN(parseInt(offerSlug)) ? -1 : parseInt(offerSlug) }
      ],
      aktywna: true
    },
    include: {
      operator: true,
      lokalizacje: true
    }
  });

  if (!offer) {
    notFound();
  }

  let addressData = null;
  if (adres) {
    const parts = decodeURIComponent(adres).split('|');
    const miejscowosc = parts[0] || '';
    const ulica = parts[1] || '';
    const nr = parts[2] || '';
    const miejscowoscSlug = parts[3] || '';
    let simc = parts[4] || '';
    let hpCount = parts[5] ? parseInt(parts[5]) : undefined;

    if (miejscowosc && nr && !simc) {
      const addressRecord = await prisma.polska.findFirst({
        where: {
          miejscowosc: { contains: miejscowosc.split(' ')[0] },
          ulica: ulica || undefined,
          nr: nr
        },
        select: { simc: true, id_ulicy: true }
      });
      
      if (addressRecord) {
        simc = addressRecord.simc;
        const coverage = await prisma.operatorCoverage.findFirst({
          where: {
            simc: addressRecord.simc,
            id_ulicy: addressRecord.id_ulicy || '00000',
            nr: nr,
            operator_id: operator.id
          },
          select: { hp_count: true }
        });
        if (coverage) hpCount = coverage.hp_count;
      }
    }
    
    if (simc && nr && hpCount === undefined) {
      const addressRecord = await prisma.polska.findFirst({
        where: {
          simc: simc,
          nr: nr,
          ...(ulica ? { ulica: { contains: ulica.split(' ')[0] } } : {})
        },
        select: { id_ulicy: true }
      });
      
      if (addressRecord) {
        const coverage = await prisma.operatorCoverage.findFirst({
          where: {
            simc: simc,
            id_ulicy: addressRecord.id_ulicy || '00000',
            nr: nr,
            operator_id: operator.id
          },
          select: { hp_count: true }
        });
        if (coverage) hpCount = coverage.hp_count;
      }
    }

    addressData = { miejscowosc, ulica, nr, miejscowoscSlug, simc, hpCount };
  }

  const serializedOffer = JSON.parse(JSON.stringify(offer));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <Link href="/" className="hover:text-blue-600">Internet</Link>
            {addressData?.miejscowosc && (
              <>
                <span className="text-gray-400">&gt;</span>
                <Link href={`/internet/${addressData.miejscowoscSlug || encodeURIComponent(addressData.miejscowosc.toLowerCase().replace(/\s+/g, '-'))}`} className="hover:text-blue-600">{addressData.miejscowosc}</Link>
              </>
            )}
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium truncate max-w-[300px]">{offer.nazwa}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {showInfoView ? (
              <OfferInfoView offer={serializedOffer} addressData={addressData} />
            ) : (
              <OfferDetailsView offer={serializedOffer} addressData={addressData} />
            )}
          </div>
          <div>
            <OfferPageClient offer={serializedOffer} addressData={addressData} />
          </div>
        </div>
      </div>
    </div>
  );
}

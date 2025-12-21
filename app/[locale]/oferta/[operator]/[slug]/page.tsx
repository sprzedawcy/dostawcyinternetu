import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import OfferDetailsView from "./OfferDetailsView";
import OfferInfoView from "./OfferInfoView";
import ContactForm from "./ContactForm";
import RewardsModule from "./RewardsModule";

interface Props {
  params: Promise<{ operator: string; slug: string }>;
  searchParams: Promise<{ info?: string; adres?: string }>;
}

export default async function OfferPage({ params, searchParams }: Props) {
  const { operator: operatorSlug, slug } = await params;
  const { info, adres } = await searchParams;
  
  const showInfoView = info === '1';

  // Znajdz operatora
  const operator = await prisma.operator.findFirst({
    where: { slug: operatorSlug }
  });

  if (!operator) {
    notFound();
  }

  // Znajdz oferte po custom_url lub id
  const offer = await prisma.oferta.findFirst({
    where: {
      operator_id: operator.id,
      OR: [
        { custom_url: slug },
        { id: isNaN(parseInt(slug)) ? -1 : parseInt(slug) }
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

  // Parsuj adres z query string (format: miejscowosc|ulica|nr|slug)
  let addressData = null;
  if (adres) {
    const parts = decodeURIComponent(adres).split('|');
    addressData = { 
      miejscowosc: parts[0] || '', 
      ulica: parts[1] || '', 
      nr: parts[2] || '', 
      miejscowoscSlug: parts[3] || '' 
    };
  }

  const serializedOffer = JSON.parse(JSON.stringify(offer));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* BREADCRUMB */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <Link href="/" className="hover:text-blue-600">Internet</Link>
            
            {addressData?.miejscowosc && (
              <>
                <span className="text-gray-400">&gt;</span>
                <Link 
                  href={`/internet/${addressData.miejscowoscSlug || encodeURIComponent(addressData.miejscowosc.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="hover:text-blue-600"
                >
                  {addressData.miejscowosc}
                </Link>
              </>
            )}
            
            {addressData?.ulica && (
              <>
                <span className="text-gray-400">&gt;</span>
                <span className="text-gray-500">ul. {addressData.ulica}{addressData.nr && ` ${addressData.nr}`}</span>
              </>
            )}
            
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium truncate max-w-[300px]">
              {offer.nazwa}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEWA KOLUMNA - Szczegóły oferty */}
          <div className="lg:col-span-2">
            {showInfoView ? (
              <OfferInfoView offer={serializedOffer} addressData={addressData} />
            ) : (
              <OfferDetailsView offer={serializedOffer} addressData={addressData} />
            )}
          </div>

          {/* PRAWA KOLUMNA - Kontakt + Nagrody */}
          <div className="space-y-6">
            <ContactForm offer={serializedOffer} addressData={addressData} />
            <RewardsModule operatorName={offer.operator.nazwa} operatorSlug={offer.operator.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { operator: operatorSlug, slug } = await params;
  const { info } = await searchParams;
  
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
        { custom_url: slug },
        { id: isNaN(parseInt(slug)) ? -1 : parseInt(slug) }
      ]
    },
    include: { operator: true }
  });

  if (!offer) {
    return { title: 'Oferta nie znaleziona' };
  }

  const prefix = info === '1' ? 'Szczegóły: ' : '';

  return {
    title: `${prefix}${offer.nazwa} - ${offer.operator.nazwa} | Porównywarka Internetu`,
    description: `${offer.download_mbps} Mb/s za ${offer.abonament} zł/mies. ${offer.technologia || ''}. Sprawdź ofertę ${offer.operator.nazwa} i zamów z gratisem.`
  };
}

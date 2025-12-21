import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import OperatorTabs from "./OperatorTabs";
import OperatorCoverageSearch from "./OperatorCoverageSearch";
import OffersTab from "./tabs/OffersTab";
import ReviewsTab from "./tabs/ReviewsTab";
import QualityTab from "./tabs/QualityTab";
import PriceHistoryTab from "./tabs/PriceHistoryTab";
import ServiceTab from "./tabs/ServiceTab";
import OutagesTab from "./tabs/OutagesTab";
import FaqTab from "./tabs/FaqTab";
import PromotionsTab from "./tabs/PromotionsTab";

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
    title: `${operator.nazwa} - Internet, oferty, opinie | DostawcyInternetu.pl`,
    description: `Sprawdź oferty i opinie o ${operator.nazwa}. Porównaj ceny, prędkości i zamów instalację online.`,
  };
}

export default async function OperatorProfilePage({ params }: Props) {
  const { operator: operatorSlug } = await params;

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
        include: { lokalizacje: true }
      },
      opinie: {
        where: { widoczna: true },
        orderBy: { created_at: 'desc' },
        take: 20
      },
      speedtests: {
        orderBy: { created_at: 'desc' },
        take: 20
      },
      priceHistory: {
        orderBy: { data_od: 'desc' },
        take: 20
      },
      outages: {
        orderBy: { data_start: 'desc' },
        take: 20
      },
      faq: {
        where: { aktywne: true },
        orderBy: { kolejnosc: 'asc' }
      },
      promotions: {
        where: { aktywna: true },
        orderBy: { data_start: 'desc' }
      },
      _count: {
        select: {
          coverage: true,
          opinie: { where: { widoczna: true } }
        }
      }
    }
  });

  if (!operator) {
    notFound();
  }

  // Statystyki
  const stats = {
    totalOffers: operator.oferty.length,
    minPrice: operator.oferty.length > 0 
      ? Math.min(...operator.oferty.map(o => parseFloat(o.abonament.toString())))
      : 0,
    maxSpeed: operator.oferty.length > 0
      ? Math.max(...operator.oferty.map(o => o.download_mbps))
      : 0,
  };

  // Średnia ocena
  const totalReviews = operator._count.opinie;
  const averageRating = operator.opinie.length > 0
    ? operator.opinie.reduce((sum, r) => sum + r.ocena, 0) / operator.opinie.length
    : 0;

  // Serializacja dat
  const serializedOffers = operator.oferty.map(o => ({
    ...o,
    abonament: o.abonament.toString(),
  }));

  const serializedReviews = operator.opinie.map(r => ({
    id: r.id,
    autor: r.autor,
    ocena: r.ocena,
    tytul: r.tytul,
    tresc: r.tresc,
    created_at: r.created_at.toISOString()
  }));

  const serializedSpeedtests = operator.speedtests.map(s => ({
    id: s.id,
    ping_ms: s.ping_ms.toString(),
    download_mbps: s.download_mbps.toString(),
    upload_mbps: s.upload_mbps.toString(),
    jitter_ms: s.jitter_ms?.toString() || null,
    miejscowosc: s.miejscowosc,
    created_at: s.created_at.toISOString()
  }));

  const serializedPriceHistory = operator.priceHistory.map(p => ({
    id: p.id,
    nazwa_oferty: p.nazwa_oferty,
    abonament: p.abonament.toString(),
    download_mbps: p.download_mbps,
    data_od: p.data_od.toISOString()
  }));

  const serializedOutages = operator.outages.map(o => ({
    id: o.id,
    miejscowosc: o.miejscowosc,
    opis: o.opis,
    data_start: o.data_start.toISOString(),
    data_koniec: o.data_koniec?.toISOString() || null,
    status: o.status
  }));

  const serializedFaqs = operator.faq.map(f => ({
    id: f.id,
    pytanie: f.pytanie,
    odpowiedz: f.odpowiedz
  }));

  const serializedPromotions = operator.promotions.map(p => ({
    id: p.id,
    tytul: p.tytul,
    opis: p.opis,
    kod: p.kod,
    rabat: p.rabat,
    data_koniec: p.data_koniec?.toISOString() || null
  }));

  // Konfiguracja zakładek
  const tabs = [
    { id: 'oferty', label: 'Oferty', icon: '📦', count: operator.oferty.length },
    { id: 'zasieg', label: 'Sprawdź zasięg', icon: '🔍' },
    { id: 'opinie', label: 'Opinie', icon: '⭐', count: totalReviews },
    { id: 'jakosc', label: 'Jakość', icon: '📊', count: operator.speedtests.length },
    { id: 'ceny', label: 'Historia cen', icon: '💰', count: operator.priceHistory.length },
    { id: 'obsluga', label: 'Obsługa', icon: '🛠️' },
    { id: 'awarie', label: 'Awarie', icon: '⚠️', count: operator.outages.filter(o => o.status === 'aktywna').length },
    { id: 'faq', label: 'FAQ', icon: '❓', count: operator.faq.length },
    { id: 'promocje', label: 'Promocje', icon: '🎁', count: operator.promotions.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
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

      {/* Header operatora */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
            <div className="w-28 h-28 flex-shrink-0 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-gray-200">
              {operator.logo_url ? (
                <img src={operator.logo_url} alt={operator.nazwa} className="w-full h-full object-contain p-3" />
              ) : (
                <span className="text-4xl font-bold text-gray-400">{operator.nazwa.charAt(0)}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-black text-gray-900">{operator.nazwa}</h1>
                {averageRating > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 rounded-full">
                    <span className="text-yellow-600">⭐</span>
                    <span className="font-bold text-yellow-800">{averageRating.toFixed(1)}</span>
                    <span className="text-yellow-700 text-sm">({totalReviews})</span>
                  </div>
                )}
              </div>
              {operator.opis && <p className="text-gray-600 mb-4 max-w-2xl">{operator.opis}</p>}

              <div className="flex flex-wrap gap-3">
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

      {/* Zakładki */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <OperatorTabs tabs={tabs} defaultTab="oferty">
          {/* Oferty */}
          <OffersTab 
            offers={serializedOffers} 
            operatorSlug={operator.slug} 
            operatorName={operator.nazwa} 
          />

          {/* Sprawdź zasięg */}
          <OperatorCoverageSearch 
            operatorSlug={operator.slug} 
            operatorName={operator.nazwa} 
          />

          {/* Opinie */}
          <ReviewsTab
            operatorId={operator.id}
            operatorName={operator.nazwa}
            reviews={serializedReviews}
            averageRating={averageRating}
            totalReviews={totalReviews}
          />

          {/* Jakość */}
          <QualityTab 
            speedtests={serializedSpeedtests} 
            operatorName={operator.nazwa} 
          />

          {/* Historia cen */}
          <PriceHistoryTab 
            priceHistory={serializedPriceHistory} 
            operatorName={operator.nazwa} 
          />

          {/* Obsługa */}
          <ServiceTab operatorName={operator.nazwa} />

          {/* Awarie */}
          <OutagesTab 
            outages={serializedOutages} 
            operatorName={operator.nazwa} 
          />

          {/* FAQ */}
          <FaqTab 
            faqs={serializedFaqs} 
            operatorName={operator.nazwa} 
          />

          {/* Promocje */}
          <PromotionsTab 
            promotions={serializedPromotions} 
            operatorName={operator.nazwa} 
          />
        </OperatorTabs>

        {/* SEO content */}
        <div className="mt-8 bg-white rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{operator.nazwa} - dostawca internetu</h2>
          <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
            <p>
              {operator.nazwa} to jeden z dostawców internetu w Polsce. 
              {stats.totalOffers > 0 && ` Oferuje ${stats.totalOffers} różnych pakietów internetowych.`}
              {stats.maxSpeed > 0 && ` Maksymalna prędkość pobierania to ${stats.maxSpeed} Mb/s.`}
              {stats.minPrice > 0 && ` Ceny zaczynają się od ${stats.minPrice} zł miesięcznie.`}
              {averageRating > 0 && ` Średnia ocena użytkowników to ${averageRating.toFixed(1)}/5.`}
            </p>
            <p>Sprawdź dostępność usług {operator.nazwa} pod swoim adresem używając zakładki "Sprawdź zasięg".</p>
          </div>
        </div>
      </div>
    </div>
  );
}

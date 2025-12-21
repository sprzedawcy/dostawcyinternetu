#!/bin/bash
echo "Dodaję opinie do profilu operatora..."

# 1. Komponent opinii
cat > app/\[locale\]/dostawca-internetu/\[operator\]/ReviewsSection.tsx << 'EOF'
"use client";
import { useState } from "react";

interface Review {
  id: number;
  autor: string;
  ocena: number;
  tytul: string | null;
  tresc: string;
  created_at: string;
}

interface Props {
  operatorId: number;
  operatorName: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export default function ReviewsSection({ operatorId, operatorName, reviews, averageRating, totalReviews }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    autor: '',
    email: '',
    ocena: 5,
    tytul: '',
    tresc: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/opinie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          operator_id: operatorId
        })
      });

      if (!res.ok) throw new Error('Błąd');
      setSubmitted(true);
      setShowForm(false);
    } catch (err) {
      setError('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (n: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type={interactive ? "button" : undefined}
            onClick={interactive && onChange ? () => onChange(n) : undefined}
            className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            disabled={!interactive}
          >
            {n <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.ocena >= 1 && r.ocena <= 5) dist[r.ocena - 1]++;
    });
    return dist.reverse();
  };

  const distribution = getRatingDistribution();

  return (
    <div className="bg-white rounded-xl p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Opinie o {operatorName}</h2>

      {/* Podsumowanie */}
      <div className="flex flex-wrap gap-8 mb-8 pb-8 border-b">
        <div className="text-center">
          <p className="text-5xl font-black text-gray-900">{averageRating.toFixed(1)}</p>
          <div className="my-2">{renderStars(Math.round(averageRating))}</div>
          <p className="text-gray-500 text-sm">{totalReviews} opinii</p>
        </div>

        <div className="flex-1 min-w-[200px]">
          {[5, 4, 3, 2, 1].map((stars, idx) => (
            <div key={stars} className="flex items-center gap-2 mb-1">
              <span className="text-sm w-12">{stars} ⭐</span>
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full"
                  style={{ width: totalReviews > 0 ? `${(distribution[idx] / totalReviews) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm text-gray-500 w-8">{distribution[idx]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Przycisk dodaj opinię */}
      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
        >
          ✍️ Dodaj opinię
        </button>
      )}

      {/* Potwierdzenie */}
      {submitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-xl">
          <p className="text-green-800 font-medium">✅ Dziękujemy za opinię! Zostanie opublikowana po weryfikacji.</p>
        </div>
      )}

      {/* Formularz */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-bold text-gray-900 mb-4">Dodaj opinię o {operatorName}</h3>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Twoja ocena *</label>
            {renderStars(formData.ocena, true, (n) => setFormData(prev => ({ ...prev, ocena: n })))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imię / Nick *</label>
              <input
                type="text"
                required
                value={formData.autor}
                onChange={(e) => setFormData(prev => ({ ...prev, autor: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcjonalnie)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł opinii</label>
            <input
              type="text"
              value={formData.tytul}
              onChange={(e) => setFormData(prev => ({ ...prev, tytul: e.target.value }))}
              placeholder="Np. Świetny internet!"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Treść opinii *</label>
            <textarea
              required
              value={formData.tresc}
              onChange={(e) => setFormData(prev => ({ ...prev, tresc: e.target.value }))}
              rows={4}
              placeholder="Opisz swoje doświadczenia z tym operatorem..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {submitting ? 'Wysyłam...' : 'Wyślij opinię'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}

      {/* Lista opinii */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Brak opinii. Bądź pierwszy!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-4 border rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-900">{review.autor}</p>
                  <div className="flex items-center gap-2">
                    {renderStars(review.ocena)}
                    <span className="text-gray-400 text-sm">
                      {new Date(review.created_at).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                </div>
              </div>
              {review.tytul && <p className="font-medium text-gray-900 mb-1">{review.tytul}</p>}
              <p className="text-gray-700 text-sm">{review.tresc}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
EOF
echo "1/3 ReviewsSection.tsx ✓"

# 2. API endpoint
mkdir -p app/api/opinie
cat > app/api/opinie/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { autor, email, ocena, tytul, tresc, operator_id, oferta_id } = body;

    if (!autor || !tresc || !ocena) {
      return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
    }

    if (ocena < 1 || ocena > 5) {
      return NextResponse.json({ error: "Ocena musi być 1-5" }, { status: 400 });
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "";

    const opinia = await prisma.opinia.create({
      data: {
        autor,
        email: email || null,
        ocena,
        tytul: tytul || null,
        tresc,
        operator_id: operator_id || null,
        oferta_id: oferta_id || null,
        widoczna: false, // wymaga zatwierdzenia
        ip_address: ip,
        user_agent: userAgent
      }
    });

    return NextResponse.json({ success: true, id: opinia.id });
  } catch (error) {
    console.error("Błąd zapisywania opinii:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
EOF
echo "2/3 API /api/opinie ✓"

# 3. Zaktualizowana strona profilu operatora
cat > app/\[locale\]/dostawca-internetu/\[operator\]/page.tsx << 'EOF'
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import ReviewsSection from "./ReviewsSection";

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

  // Średnia ocena
  const totalReviews = operator._count.opinie;
  const averageRating = operator.opinie.length > 0
    ? operator.opinie.reduce((sum, r) => sum + r.ocena, 0) / operator.opinie.length
    : 0;

  const serializedReviews = operator.opinie.map(r => ({
    id: r.id,
    autor: r.autor,
    ocena: r.ocena,
    tytul: r.tytul,
    tresc: r.tresc,
    created_at: r.created_at.toISOString()
  }));

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
              <div className="flex items-center gap-3 mb-2">
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

        {/* Sekcja opinii */}
        <ReviewsSection
          operatorId={operator.id}
          operatorName={operator.nazwa}
          reviews={serializedReviews}
          averageRating={averageRating}
          totalReviews={totalReviews}
        />

        {/* SEO content */}
        <div className="mt-8 bg-white rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{operator.nazwa} - dostawca internetu</h2>
          <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
            <p>
              {operator.nazwa} to jeden z dostawców internetu w Polsce. 
              {stats.totalOffers > 0 && ` Oferuje ${stats.totalOffers} różnych pakietów internetowych.`}
              {stats.maxSpeed > 0 && ` Maksymalna prędkość pobierania to ${stats.maxSpeed} Mb/s.`}
              {stats.minPrice > 0 && ` Ceny zaczynają się od ${stats.minPrice} zł miesięcznie.`}
              {averageRating > 0 && ` Średnia ocena użytkowników to ${averageRating.toFixed(1)}/5 na podstawie ${totalReviews} opinii.`}
            </p>
            <p>Sprawdź dostępność usług {operator.nazwa} pod swoim adresem. Wpisz adres w wyszukiwarce na górze strony.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF
echo "3/3 Strona profilu z opiniami ✓"

echo ""
echo "✅ Opinie dodane!"
echo ""
echo "Funkcje:"
echo "  - Wyświetlanie opinii z oceną gwiazdkową"
echo "  - Średnia ocena w nagłówku operatora"
echo "  - Rozkład ocen (ile 5⭐, ile 4⭐, itd.)"
echo "  - Formularz dodawania opinii"
echo "  - Opinie wymagają zatwierdzenia (widoczna=false)"

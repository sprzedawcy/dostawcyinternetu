#!/bin/bash
echo "📝 Upraszczam opinie + dodaję CMS..."

# 1. Uproszczony ReviewsTab
cat > app/\[locale\]/dostawca-internetu/\[operator\]/tabs/ReviewsTab.tsx << 'EOF'
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

export default function ReviewsTab({ operatorId, operatorName, reviews, averageRating, totalReviews }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ autor: '', email: '', ocena: 5, tytul: '', tresc: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Email jest wymagany');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/opinie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, operator_id: operatorId })
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

  const renderStars = (rating: number, interactive = false, onChange?: (n: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type={interactive ? "button" : undefined}
          onClick={interactive && onChange ? () => onChange(n) : undefined}
          className={`text-xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          disabled={!interactive}>
          {n <= rating ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Podsumowanie - uproszczone */}
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-black text-gray-900">{averageRating > 0 ? averageRating.toFixed(1) : '-'}</p>
              <div className="mt-1">{renderStars(Math.round(averageRating))}</div>
            </div>
            <div className="text-gray-500">
              <span className="font-medium text-gray-900">{totalReviews}</span> {totalReviews === 1 ? 'opinia' : totalReviews < 5 ? 'opinie' : 'opinii'}
            </div>
          </div>

          {!showForm && !submitted && (
            <button onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
              ✍️ Dodaj opinię
            </button>
          )}
        </div>

        {submitted && (
          <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-xl">
            <p className="text-green-800 font-medium">✅ Dziękujemy! Opinia zostanie opublikowana po weryfikacji.</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 p-5 bg-gray-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-4">Dodaj opinię o {operatorName}</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Twoja ocena *</label>
              {renderStars(formData.ocena, true, (n) => setFormData(prev => ({ ...prev, ocena: n })))}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię / Nick *</label>
                <input type="text" required value={formData.autor} onChange={(e) => setFormData(prev => ({ ...prev, autor: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Wymagany do weryfikacji"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł opinii</label>
              <input type="text" value={formData.tytul} onChange={(e) => setFormData(prev => ({ ...prev, tytul: e.target.value }))}
                placeholder="Np. Świetny internet!" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Treść opinii *</label>
              <textarea required value={formData.tresc} onChange={(e) => setFormData(prev => ({ ...prev, tresc: e.target.value }))}
                rows={4} placeholder="Opisz swoje doświadczenia z tym operatorem..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                {submitting ? 'Wysyłam...' : 'Wyślij opinię'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300">Anuluj</button>
            </div>
            
            <p className="mt-3 text-xs text-gray-500">
              Email nie będzie publicznie widoczny. Służy do weryfikacji opinii.
            </p>
          </form>
        )}
      </div>

      {/* Lista opinii */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <span className="text-4xl mb-3 block">💬</span>
          <p className="text-gray-500">Brak opinii o tym operatorze.</p>
          <p className="text-gray-400 text-sm mt-1">Bądź pierwszy i podziel się swoim doświadczeniem!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-5 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{review.autor}</p>
                    {renderStars(review.ocena)}
                  </div>
                  <p className="text-gray-400 text-sm">{new Date(review.created_at).toLocaleDateString('pl-PL')}</p>
                </div>
              </div>
              {review.tytul && <p className="font-medium text-gray-900 mb-1">{review.tytul}</p>}
              <p className="text-gray-700">{review.tresc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
EOF
echo "1/4 ReviewsTab uproszczony ✓"

# 2. CMS - strona główna opinii
mkdir -p app/\[locale\]/admin/opinie
cat > app/\[locale\]/admin/opinie/page.tsx << 'EOF'
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import OpinionActions from "./OpinionActions";

export default async function AdminOpiniePage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams;
  const filter = params.filter || 'pending';

  const where = filter === 'pending' 
    ? { widoczna: false }
    : filter === 'approved'
    ? { widoczna: true }
    : {};

  const opinie = await prisma.opinia.findMany({
    where,
    include: {
      operator: { select: { nazwa: true, slug: true } },
      oferta: { select: { nazwa: true } }
    },
    orderBy: { created_at: 'desc' },
    take: 100
  });

  const counts = {
    pending: await prisma.opinia.count({ where: { widoczna: false } }),
    approved: await prisma.opinia.count({ where: { widoczna: true } }),
    all: await prisma.opinia.count()
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">← Admin</Link>
              <h1 className="text-2xl font-bold text-gray-900">Opinie</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filtry */}
        <div className="flex gap-2 mb-6">
          <Link href="/admin/opinie?filter=pending"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}>
            ⏳ Do zatwierdzenia ({counts.pending})
          </Link>
          <Link href="/admin/opinie?filter=approved"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'approved' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}>
            ✅ Zatwierdzone ({counts.approved})
          </Link>
          <Link href="/admin/opinie?filter=all"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}>
            📋 Wszystkie ({counts.all})
          </Link>
        </div>

        {/* Lista opinii */}
        {opinie.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-500">Brak opinii do wyświetlenia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {opinie.map((opinia) => (
              <div key={opinia.id} className={`bg-white rounded-xl p-5 border-l-4 ${
                opinia.widoczna ? 'border-green-500' : 'border-orange-500'
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900">{opinia.autor}</span>
                      <span className="text-yellow-500">{'⭐'.repeat(opinia.ocena)}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        opinia.widoczna ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {opinia.widoczna ? 'Zatwierdzona' : 'Oczekuje'}
                      </span>
                    </div>
                    
                    {opinia.operator && (
                      <p className="text-sm text-blue-600 mb-1">
                        Operator: <strong>{opinia.operator.nazwa}</strong>
                      </p>
                    )}
                    {opinia.oferta && (
                      <p className="text-sm text-purple-600 mb-1">
                        Oferta: <strong>{opinia.oferta.nazwa}</strong>
                      </p>
                    )}
                    
                    {opinia.tytul && <p className="font-medium text-gray-900 mb-1">{opinia.tytul}</p>}
                    <p className="text-gray-700 text-sm">{opinia.tresc}</p>
                    
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>📧 {opinia.email || 'brak'}</span>
                      <span>🕐 {new Date(opinia.created_at).toLocaleString('pl-PL')}</span>
                      {opinia.ip_address && <span>🌐 {opinia.ip_address}</span>}
                    </div>
                  </div>

                  <OpinionActions opinionId={opinia.id} isApproved={opinia.widoczna} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
EOF
echo "2/4 CMS strona opinii ✓"

# 3. Komponent akcji (client component)
cat > app/\[locale\]/admin/opinie/OpinionActions.tsx << 'EOF'
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  opinionId: number;
  isApproved: boolean;
}

export default function OpinionActions({ opinionId, isApproved }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (action === 'delete' && !confirm('Na pewno usunąć tę opinię?')) return;
    
    setLoading(action);
    try {
      const res = await fetch('/api/admin/opinie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opinionId, action })
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Błąd:', err);
    }
    setLoading(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {!isApproved && (
        <button
          onClick={() => handleAction('approve')}
          disabled={loading !== null}
          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading === 'approve' ? '...' : '✓ Zatwierdź'}
        </button>
      )}
      {isApproved && (
        <button
          onClick={() => handleAction('reject')}
          disabled={loading !== null}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:bg-gray-400"
        >
          {loading === 'reject' ? '...' : '↩ Cofnij'}
        </button>
      )}
      <button
        onClick={() => handleAction('delete')}
        disabled={loading !== null}
        className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400"
      >
        {loading === 'delete' ? '...' : '✕ Usuń'}
      </button>
    </div>
  );
}
EOF
echo "3/4 OpinionActions ✓"

# 4. API do zarządzania opiniami
mkdir -p app/api/admin/opinie
cat > app/api/admin/opinie/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { opinionId, action } = await request.json();

    if (!opinionId || !action) {
      return NextResponse.json({ error: "Brak danych" }, { status: 400 });
    }

    switch (action) {
      case 'approve':
        await prisma.opinia.update({
          where: { id: opinionId },
          data: { widoczna: true, zatwierdzil: 'admin' }
        });
        break;

      case 'reject':
        await prisma.opinia.update({
          where: { id: opinionId },
          data: { widoczna: false, zatwierdzil: null }
        });
        break;

      case 'delete':
        await prisma.opinia.delete({
          where: { id: opinionId }
        });
        break;

      default:
        return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
EOF
echo "4/4 API admin/opinie ✓"

echo ""
echo "✅ Gotowe!"
echo ""
echo "Uproszczone opinie:"
echo "  - Usunięto słupki rozkładu gwiazdek"
echo "  - Email jest teraz wymagany"
echo "  - Czytelniejszy układ"
echo ""
echo "CMS Opinie:"
echo "  - /admin/opinie - lista opinii"
echo "  - Filtry: Do zatwierdzenia / Zatwierdzone / Wszystkie"
echo "  - Akcje: Zatwierdź / Cofnij / Usuń"

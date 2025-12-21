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
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type={interactive ? "button" : undefined}
          onClick={interactive && onChange ? () => onChange(n) : undefined}
          className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          disabled={!interactive}>
          {n <= rating ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );

  const getRatingDistribution = () => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach(r => { if (r.ocena >= 1 && r.ocena <= 5) dist[r.ocena - 1]++; });
    return dist.reverse();
  };
  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      {/* Podsumowanie */}
      <div className="bg-white rounded-xl p-6">
        <div className="flex flex-wrap gap-8 mb-6 pb-6 border-b">
          <div className="text-center">
            <p className="text-5xl font-black text-gray-900">{averageRating > 0 ? averageRating.toFixed(1) : '-'}</p>
            <div className="my-2">{renderStars(Math.round(averageRating))}</div>
            <p className="text-gray-500 text-sm">{totalReviews} opinii</p>
          </div>
          <div className="flex-1 min-w-[200px]">
            {[5, 4, 3, 2, 1].map((stars, idx) => (
              <div key={stars} className="flex items-center gap-2 mb-1">
                <span className="text-sm w-12">{stars} ⭐</span>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full"
                    style={{ width: totalReviews > 0 ? `${(distribution[idx] / totalReviews) * 100}%` : '0%' }} />
                </div>
                <span className="text-sm text-gray-500 w-8">{distribution[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {!showForm && !submitted && (
          <button onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
            ✍️ Dodaj opinię
          </button>
        )}

        {submitted && (
          <div className="p-4 bg-green-50 border border-green-300 rounded-xl">
            <p className="text-green-800 font-medium">✅ Dziękujemy! Opinia zostanie opublikowana po weryfikacji.</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="p-6 bg-gray-50 rounded-xl">
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
                  className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcjonalnie)</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł opinii</label>
              <input type="text" value={formData.tytul} onChange={(e) => setFormData(prev => ({ ...prev, tytul: e.target.value }))}
                placeholder="Np. Świetny internet!" className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Treść opinii *</label>
              <textarea required value={formData.tresc} onChange={(e) => setFormData(prev => ({ ...prev, tresc: e.target.value }))}
                rows={4} placeholder="Opisz swoje doświadczenia..." className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                {submitting ? 'Wysyłam...' : 'Wyślij opinię'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300">Anuluj</button>
            </div>
          </form>
        )}
      </div>

      {/* Lista opinii */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-500">Brak opinii. Bądź pierwszy!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-5 rounded-xl border">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-900">{review.autor}</p>
                  <div className="flex items-center gap-2">
                    {renderStars(review.ocena)}
                    <span className="text-gray-400 text-sm">{new Date(review.created_at).toLocaleDateString('pl-PL')}</span>
                  </div>
                </div>
              </div>
              {review.tytul && <p className="font-medium text-gray-900 mb-1">{review.tytul}</p>}
              <p className="text-gray-700">{review.tresc}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

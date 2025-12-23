import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Dostawcy Internetu | Poradniki, rankingi, aktualności",
  description: "Poradniki, rankingi i aktualności ze świata internetu. Dowiedz się jak wybrać najlepszego dostawcę internetu.",
};

export default async function BlogPage() {
  const [artykuly, kategorie, wyrozonione] = await Promise.all([
    prisma.artykul.findMany({
      where: { opublikowany: true },
      include: { kategoria: true },
      orderBy: { data_publikacji: 'desc' },
      take: 50
    }),
    prisma.kategoriaBlogu.findMany({
      orderBy: { kolejnosc: 'asc' },
      include: { _count: { select: { artykuly: { where: { opublikowany: true } } } } }
    }),
    prisma.artykul.findMany({
      where: { opublikowany: true, wyrozniany: true },
      include: { kategoria: true },
      orderBy: { data_publikacji: 'desc' },
      take: 3
    })
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-black mb-3">Blog</h1>
          <p className="text-blue-100 text-lg">
            Poradniki, rankingi i aktualności ze świata internetu
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Kategorie */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/blog"
            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium"
          >
            Wszystkie
          </Link>
          {kategorie.map(kat => (
            <Link
              key={kat.id}
              href={`/blog/${kat.slug}`}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              {kat.nazwa} ({kat._count.artykuly})
            </Link>
          ))}
        </div>

        {/* Wyróżnione */}
        {wyrozonione.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⭐ Wyróżnione</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {wyrozonione.map(art => (
                <Link
                  key={art.id}
                  href={`/blog/${art.kategoria?.slug}/${art.slug}`}
                  className="bg-white rounded-xl border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-lg transition-all overflow-hidden group"
                >
                  {art.thumbnail_url && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img 
                        src={art.thumbnail_url} 
                        alt={art.tytul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    {art.kategoria && (
                      <span className="text-xs text-blue-600 font-medium">{art.kategoria.nazwa}</span>
                    )}
                    <h3 className="font-bold text-gray-900 mt-1 line-clamp-2">{art.tytul}</h3>
                    {art.zajawka && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{art.zajawka}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Wszystkie artykuły */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Najnowsze artykuły</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artykuly.map(art => (
              <Link
                key={art.id}
                href={`/blog/${art.kategoria?.slug}/${art.slug}`}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all overflow-hidden group"
              >
                {art.thumbnail_url ? (
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    <img 
                      src={art.thumbnail_url} 
                      alt={art.tytul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <span className="text-4xl">📝</span>
                  </div>
                )}
                <div className="p-4">
                  {art.kategoria && (
                    <span className="text-xs text-blue-600 font-medium">{art.kategoria.nazwa}</span>
                  )}
                  <h3 className="font-bold text-gray-900 mt-1 line-clamp-2">{art.tytul}</h3>
                  {art.data_publikacji && (
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(art.data_publikacji).toLocaleDateString('pl-PL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {artykuly.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            Brak artykułów.
          </div>
        )}
      </div>
    </div>
  );
}

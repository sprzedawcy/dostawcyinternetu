import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ kategoria: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategoria: kategoriaSlug } = await params;
  
  const kategoria = await prisma.kategoriaBlogu.findUnique({
    where: { slug: kategoriaSlug }
  });

  if (!kategoria) {
    return { title: "Kategoria nie znaleziona" };
  }

  return {
    title: `${kategoria.nazwa} - Blog | DostawcyInternetu.pl`,
    description: kategoria.opis || `Artykuły z kategorii ${kategoria.nazwa}`,
  };
}

export default async function KategoriaPage({ params }: Props) {
  const { kategoria: kategoriaSlug } = await params;

  const [kategoria, artykuly, wszystkieKategorie] = await Promise.all([
    prisma.kategoriaBlogu.findUnique({
      where: { slug: kategoriaSlug }
    }),
    prisma.artykul.findMany({
      where: {
        opublikowany: true,
        kategoria: { slug: kategoriaSlug }
      },
      include: { kategoria: true },
      orderBy: { data_publikacji: 'desc' }
    }),
    prisma.kategoriaBlogu.findMany({
      orderBy: { kolejnosc: 'asc' },
      include: { _count: { select: { artykuly: { where: { opublikowany: true } } } } }
    })
  ]);

  if (!kategoria) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <nav className="flex items-center gap-2 text-blue-200 text-sm mb-4">
            <Link href="/blog" className="hover:text-white">Blog</Link>
            <span>›</span>
            <span className="text-white">{kategoria.nazwa}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black mb-3">{kategoria.nazwa}</h1>
          {kategoria.opis && (
            <p className="text-blue-100 text-lg">{kategoria.opis}</p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Kategorie */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/blog"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            Wszystkie
          </Link>
          {wszystkieKategorie.map(kat => (
            <Link
              key={kat.id}
              href={`/blog/${kat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                kat.slug === kategoriaSlug
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600"
              }`}
            >
              {kat.nazwa} ({kat._count.artykuly})
            </Link>
          ))}
        </div>

        {/* Artykuły */}
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
                <h3 className="font-bold text-gray-900 line-clamp-2">{art.tytul}</h3>
                {art.zajawka && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{art.zajawka}</p>
                )}
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

        {artykuly.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            Brak artykułów w tej kategorii.
          </div>
        )}
      </div>
    </div>
  );
}

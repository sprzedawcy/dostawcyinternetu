import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ kategoria: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategoria, slug } = await params;
  
  const artykul = await prisma.artykul.findFirst({
    where: {
      slug,
      kategoria: { slug: kategoria },
      opublikowany: true
    }
  });

  if (!artykul) {
    return { title: "Artykuł nie znaleziony" };
  }

  return {
    title: artykul.meta_title || `${artykul.tytul} | DostawcyInternetu.pl`,
    description: artykul.meta_description || artykul.zajawka || undefined,
    openGraph: {
      title: artykul.meta_title || artykul.tytul,
      description: artykul.meta_description || artykul.zajawka || undefined,
      images: artykul.thumbnail_url ? [artykul.thumbnail_url] : undefined,
    }
  };
}

export default async function ArtykulPage({ params }: Props) {
  const { kategoria: kategoriaSlug, slug } = await params;

  const artykul = await prisma.artykul.findFirst({
    where: {
      slug,
      kategoria: { slug: kategoriaSlug },
      opublikowany: true
    },
    include: {
      kategoria: true,
      operator: { select: { id: true, nazwa: true, slug: true, logo_url: true } },
      tagi: { include: { tag: true } }
    }
  });

  if (!artykul) {
    notFound();
  }

  // Powiązane artykuły (ta sama kategoria)
  const powiazane = await prisma.artykul.findMany({
    where: {
      opublikowany: true,
      kategoria_id: artykul.kategoria_id,
      id: { not: artykul.id }
    },
    include: { kategoria: true },
    orderBy: { data_publikacji: 'desc' },
    take: 3
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/blog" className="hover:text-blue-600">Blog</Link>
            <span>›</span>
            {artykul.kategoria && (
              <>
                <Link 
                  href={`/blog/${artykul.kategoria.slug}`}
                  className="hover:text-blue-600"
                >
                  {artykul.kategoria.nazwa}
                </Link>
                <span>›</span>
              </>
            )}
            <span className="text-gray-900 truncate max-w-[200px]">{artykul.tytul}</span>
          </nav>
        </div>
      </div>

      {/* Artykuł */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Thumbnail */}
        {artykul.thumbnail_url && (
          <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8">
            <img 
              src={artykul.thumbnail_url} 
              alt={artykul.tytul}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {artykul.kategoria && (
            <Link 
              href={`/blog/${artykul.kategoria.slug}`}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100"
            >
              {artykul.kategoria.nazwa}
            </Link>
          )}
          {artykul.data_publikacji && (
            <span className="text-sm text-gray-500">
              {new Date(artykul.data_publikacji).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          )}
          {artykul.autor && (
            <span className="text-sm text-gray-500">• {artykul.autor}</span>
          )}
        </div>

        {/* Tytuł */}
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          {artykul.tytul}
        </h1>

        {/* Zajawka */}
        {artykul.zajawka && (
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {artykul.zajawka}
          </p>
        )}

        {/* Operator powiązany */}
        {artykul.operator && (
          <div className="bg-blue-50 rounded-xl p-4 mb-8 flex items-center gap-4">
            {artykul.operator.logo_url && (
              <img 
                src={artykul.operator.logo_url} 
                alt={artykul.operator.nazwa}
                className="h-10 object-contain"
              />
            )}
            <div>
              <p className="text-sm text-gray-500">Ten artykuł dotyczy operatora</p>
              <Link 
                href={`/dostawca-internetu/${artykul.operator.slug}`}
                className="font-bold text-blue-700 hover:underline"
              >
                {artykul.operator.nazwa} →
              </Link>
            </div>
          </div>
        )}

        {/* Treść */}
        {artykul.tresc && (
          <div 
            className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-blue-600 prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: artykul.tresc }}
          />
        )}

        {/* Tagi */}
        {artykul.tagi.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-500 mb-2">Tagi:</p>
            <div className="flex flex-wrap gap-2">
              {artykul.tagi.map(({ tag }) => (
                <span 
                  key={tag.id}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                >
                  {tag.nazwa}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Powiązane artykuły */}
      {powiazane.length > 0 && (
        <section className="bg-white border-t">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Podobne artykuły</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {powiazane.map(art => (
                <Link
                  key={art.id}
                  href={`/blog/${art.kategoria?.slug}/${art.slug}`}
                  className="group"
                >
                  {art.thumbnail_url ? (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                      <img 
                        src={art.thumbnail_url} 
                        alt={art.tytul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-3xl">📝</span>
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {art.tytul}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

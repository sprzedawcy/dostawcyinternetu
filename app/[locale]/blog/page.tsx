// app/[locale]/blog/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const ITEMS_PER_PAGE_DESKTOP = 12;
const ITEMS_PER_PAGE_MOBILE = 4;

export default async function BlogPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ kategoria?: string; strona?: string }> 
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.strona || '1');
  const selectedKategoria = params.kategoria;
  
  // Pobierz kategorie
  const kategorie = await prisma.kategoriaBlogu.findMany({
    orderBy: { kolejnosc: 'asc' },
    include: { _count: { select: { artykuly: { where: { opublikowany: true } } } } }
  });
  
  // Warunki filtrowania
  const where: any = { 
    opublikowany: true,
    OR: [
      { data_publikacji: { lte: new Date() } },
      { data_publikacji: null }
    ]
  };
  
  if (selectedKategoria) {
    where.kategoria = { slug: selectedKategoria };
  }
  
  // Policz wszystkie artykuły
  const totalArticles = await prisma.artykul.count({ where });
  const totalPages = Math.ceil(totalArticles / ITEMS_PER_PAGE_DESKTOP);
  
  // Pobierz artykuły z paginacją
  const artykuly = await prisma.artykul.findMany({
    where,
    include: {
      kategoria: true,
      operator: { select: { nazwa: true, slug: true } }
    },
    orderBy: { data_publikacji: 'desc' },
    take: ITEMS_PER_PAGE_DESKTOP,
    skip: (currentPage - 1) * ITEMS_PER_PAGE_DESKTOP
  });
  
  // Wyróżnione (tylko na pierwszej stronie bez filtra)
  const wyrozonione = currentPage === 1 && !selectedKategoria 
    ? await prisma.artykul.findMany({
        where: { 
          wyrozniany: true, 
          opublikowany: true,
          OR: [
            { data_publikacji: { lte: new Date() } },
            { data_publikacji: null }
          ]
        },
        include: { kategoria: true },
        orderBy: { data_publikacji: 'desc' },
        take: 3
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-600 mt-2">
            Poradniki, aktualności i wiedza o internecie w Polsce
          </p>
        </div>
        
        {/* Kategorie - bez "Wszystkie" */}
        <div className="flex flex-wrap gap-2 mb-8">
          {kategorie.filter(k => k._count.artykuly > 0).map(kat => (
            <Link
              key={kat.id}
              href={selectedKategoria === kat.slug ? '/pl/blog' : `/pl/blog?kategoria=${kat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedKategoria === kat.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {kat.nazwa} ({kat._count.artykuly})
            </Link>
          ))}
          {selectedKategoria && (
            <Link
              href="/pl/blog"
              className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              ✕ Wyczyść filtr
            </Link>
          )}
        </div>
        
        {/* Wyróżnione - tylko na pierwszej stronie */}
        {wyrozonione.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ⭐ Wyróżnione
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {wyrozonione.map(art => (
                <Link
                  key={art.id}
                  href={`/pl/blog/${art.kategoria?.slug}/${art.slug}`}
                  className="group bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-100 overflow-hidden hover:shadow-lg transition-shadow"
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
                    <span className="text-xs font-medium text-blue-600 uppercase">
                      {art.kategoria?.nazwa}
                    </span>
                    <h3 className="font-semibold text-gray-900 mt-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {art.tytul}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Lista artykułów */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artykuly.map(art => (
            <Link
              key={art.id}
              href={`/pl/blog/${art.kategoria?.slug}/${art.slug}`}
              className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
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
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-4xl opacity-50">📄</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-blue-600 uppercase">
                    {art.kategoria?.nazwa}
                  </span>
                  {art.data_publikacji && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(art.data_publikacji).toLocaleDateString('pl-PL')}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {art.tytul}
                </h3>
                {art.zajawka && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {art.zajawka}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        {/* Paginacja */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center gap-1">
              {/* Poprzednia */}
              {currentPage > 1 && (
                <Link
                  href={`/pl/blog?${selectedKategoria ? `kategoria=${selectedKategoria}&` : ''}strona=${currentPage - 1}`}
                  className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-700"
                >
                  ← Poprzednia
                </Link>
              )}
              
              {/* Numery stron */}
              <div className="hidden sm:flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Pokaż: pierwszą, ostatnią, aktualną i 2 wokół aktualnej
                    return page === 1 || 
                           page === totalPages || 
                           Math.abs(page - currentPage) <= 2;
                  })
                  .map((page, idx, arr) => {
                    // Dodaj ... między nieciągłymi numerami
                    const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                    return (
                      <span key={page} className="flex items-center">
                        {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                        <Link
                          href={`/pl/blog?${selectedKategoria ? `kategoria=${selectedKategoria}&` : ''}strona=${page}`}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                            page === currentPage
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'border bg-white hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {page}
                        </Link>
                      </span>
                    );
                  })}
              </div>
              
              {/* Mobile: X z Y */}
              <span className="sm:hidden px-4 py-2 text-gray-600">
                {currentPage} z {totalPages}
              </span>
              
              {/* Następna */}
              {currentPage < totalPages && (
                <Link
                  href={`/pl/blog?${selectedKategoria ? `kategoria=${selectedKategoria}&` : ''}strona=${currentPage + 1}`}
                  className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-700"
                >
                  Następna →
                </Link>
              )}
            </nav>
          </div>
        )}
        
        {/* Info o ilości */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Wyświetlono {artykuly.length} z {totalArticles} artykułów
        </div>
        
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Blog - Poradniki i aktualności o internecie | DostawcyInternetu.pl',
  description: 'Poradniki, porównania i aktualności o dostawcach internetu, technologiach światłowodowych, LTE, 5G i WiFi w Polsce.',
};

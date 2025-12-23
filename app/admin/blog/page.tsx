// app/admin/blog/page.tsx
import Link from "next/link";
import { getArtykuly, getKategorie } from "./actions";
import ImageWithSize from "./ImageWithSize";

interface Props {
  searchParams: Promise<{ 
    kategoria?: string; 
    szukaj?: string; 
    strona?: string;
    status?: string;
  }>;
}

export default async function AdminBlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const kategoriaFilter = params.kategoria || null;
  const szukaj = params.szukaj || '';
  const strona = parseInt(params.strona || '1');
  const statusFilter = params.status || 'aktywne';
  
  const [{ artykuly, total, totalPages }, kategorie] = await Promise.all([
    getArtykuly(strona, 50, kategoriaFilter, szukaj, statusFilter),
    getKategorie()
  ]);

  const buildUrl = (newParams: Record<string, string | null>) => {
    const current = new URLSearchParams();
    if (kategoriaFilter) current.set('kategoria', kategoriaFilter);
    if (szukaj) current.set('szukaj', szukaj);
    if (strona > 1) current.set('strona', strona.toString());
    if (statusFilter !== 'aktywne') current.set('status', statusFilter);
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        current.delete(key);
      } else {
        current.set(key, value);
        if (key !== 'strona') current.delete('strona');
      }
    });
    
    const qs = current.toString();
    return `/admin/blog${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-500">{total} artykułów</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Wyszukiwarka */}
          <form action="/admin/blog" method="GET" className="flex items-center gap-2">
            {kategoriaFilter && <input type="hidden" name="kategoria" value={kategoriaFilter} />}
            {statusFilter !== 'aktywne' && <input type="hidden" name="status" value={statusFilter} />}
            <input
              type="text"
              name="szukaj"
              defaultValue={szukaj}
              placeholder="Szukaj artykułów..."
              className="px-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button type="submit" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
              🔍
            </button>
            {szukaj && (
              <Link href={buildUrl({ szukaj: null })} className="px-3 py-2 text-gray-500 hover:text-red-600">
                ✕
              </Link>
            )}
          </form>
          
          <Link
            href="/admin/blog/generator"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🤖 Generator
          </Link>
          
          <Link
            href="/admin/blog/nowy"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nowy artykuł
          </Link>
        </div>
      </div>

      {/* Filtry statusu */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-500">Status:</span>
        <Link
          href={buildUrl({ status: null })}
          className={`px-3 py-1 rounded-full text-sm ${
            statusFilter === 'aktywne' 
              ? 'bg-green-100 text-green-700 font-medium' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Aktywne
        </Link>
        <Link
          href={buildUrl({ status: 'nieaktywne' })}
          className={`px-3 py-1 rounded-full text-sm ${
            statusFilter === 'nieaktywne' 
              ? 'bg-red-100 text-red-700 font-medium' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Nieaktywne
        </Link>
        <Link
          href={buildUrl({ status: 'wszystkie' })}
          className={`px-3 py-1 rounded-full text-sm ${
            statusFilter === 'wszystkie' 
              ? 'bg-blue-100 text-blue-700 font-medium' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Wszystkie
        </Link>
      </div>

      {/* Kategorie - klikalne filtry */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={buildUrl({ kategoria: null })}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            !kategoriaFilter 
              ? 'bg-blue-600 text-white' 
              : 'bg-white border text-gray-700 hover:bg-gray-50'
          }`}
        >
          Wszystkie ({kategorie.reduce((sum, k) => sum + k._count.artykuly, 0)})
        </Link>
        {kategorie.map((kat) => (
          <Link
            key={kat.id}
            href={buildUrl({ kategoria: kat.slug })}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              kategoriaFilter === kat.slug
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {kat.nazwa} ({kat._count.artykuly})
          </Link>
        ))}
      </div>

      {/* Info o aktywnych filtrach */}
      {(kategoriaFilter || szukaj) && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-gray-500">Filtry:</span>
          {kategoriaFilter && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded flex items-center gap-1">
              Kategoria: {kategorie.find(k => k.slug === kategoriaFilter)?.nazwa}
              <Link href={buildUrl({ kategoria: null })} className="ml-1 hover:text-red-600">✕</Link>
            </span>
          )}
          {szukaj && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded flex items-center gap-1">
              Szukaj: &quot;{szukaj}&quot;
              <Link href={buildUrl({ szukaj: null })} className="ml-1 hover:text-red-600">✕</Link>
            </span>
          )}
          <Link href="/admin/blog" className="text-gray-500 hover:text-red-600 ml-2">
            Wyczyść wszystkie
          </Link>
        </div>
      )}

      {/* Lista artykułów */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Obrazek</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tytuł</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kategoria</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {artykuly.map((artykul) => (
              <tr 
                key={artykul.id} 
                className={`hover:bg-gray-50 ${artykul.redirect_url ? 'bg-red-50/50' : ''}`}
              >
                <td className="px-4 py-3">
                  <ImageWithSize url={artykul.thumbnail_url} />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className={`font-medium line-clamp-1 ${artykul.redirect_url ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {artykul.tytul}
                    </div>
                    <div className="text-xs text-gray-500">
                      /blog/{artykul.kategoria?.slug}/{artykul.slug}
                    </div>
                    {artykul.redirect_url && (
                      <div className="text-xs text-orange-600 mt-1">
                        → {artykul.redirect_url}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {artykul.kategoria && (
                    <Link
                      href={buildUrl({ kategoria: artykul.kategoria.slug })}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100"
                    >
                      {artykul.kategoria.nazwa}
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {artykul.redirect_url ? (
                      <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full">
                        🚫 Przekierowany
                      </span>
                    ) : artykul.opublikowany ? (
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                        ✓ Opublikowany
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Szkic
                      </span>
                    )}
                    {artykul.wyrozniany && (
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                        ⭐
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {artykul.data_publikacji 
                    ? new Date(artykul.data_publikacji).toLocaleDateString('pl-PL')
                    : '-'
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {artykul.opublikowany && artykul.kategoria && !artykul.redirect_url && (
                      <a
                        href={`/blog/${artykul.kategoria.slug}/${artykul.slug}`}
                        target="_blank"
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Zobacz na stronie"
                      >
                        🔗
                      </a>
                    )}
                    <Link
                      href={`/admin/blog/${artykul.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edytuj"
                    >
                      ✏️
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {artykuly.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {szukaj || kategoriaFilter 
              ? 'Brak artykułów pasujących do filtrów.'
              : 'Brak artykułów.'
            }
            {' '}
            <Link href="/admin/blog/nowy" className="text-blue-600 hover:underline">
              Dodaj nowy
            </Link>
          </div>
        )}
      </div>

      {/* Paginacja */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {strona > 1 && (
            <Link
              href={buildUrl({ strona: (strona - 1).toString() })}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              ← Poprzednia
            </Link>
          )}
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - strona) <= 2)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <Link
                    href={buildUrl({ strona: p === 1 ? null : p.toString() })}
                    className={`px-3 py-1 rounded ${
                      p === strona
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </Link>
                </span>
              ))
            }
          </div>
          
          {strona < totalPages && (
            <Link
              href={buildUrl({ strona: (strona + 1).toString() })}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              Następna →
            </Link>
          )}
          
          <span className="text-sm text-gray-500 ml-4">
            Strona {strona} z {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}

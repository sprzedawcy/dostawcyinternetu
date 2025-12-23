import Link from "next/link";
import { getArtykuly, getKategorie, deleteArtykul } from "./actions";
import DeleteButton from "./DeleteButton";

export default async function AdminBlogPage() {
  const [{ artykuly, total }, kategorie] = await Promise.all([
    getArtykuly(),
    getKategorie()
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-500">{total} artykułów</p>
        </div>
        <Link
          href="/admin/blog/nowy"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nowy artykuł
        </Link>
      </div>

      {/* Kategorie - statystyki */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {kategorie.map((kat) => (
          <div key={kat.id} className="bg-white rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{kat._count.artykuly}</div>
            <div className="text-xs text-gray-500">{kat.nazwa}</div>
          </div>
        ))}
      </div>

      {/* Lista artykułów */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tytuł</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kategoria</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {artykuly.map((artykul) => (
              <tr key={artykul.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {artykul.thumbnail_url ? (
                      <img 
                        src={artykul.thumbnail_url} 
                        alt="" 
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        📝
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 line-clamp-1">{artykul.tytul}</div>
                      <div className="text-xs text-gray-500">
                        /blog/{artykul.kategoria?.slug}/{artykul.slug}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {artykul.kategoria && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {artykul.kategoria.nazwa}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {artykul.opublikowany ? (
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
                    {artykul.opublikowany && artykul.kategoria && (
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
                    >
                      ✏️
                    </Link>
                    <DeleteButton id={artykul.id} tytul={artykul.tytul} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {artykuly.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Brak artykułów. <Link href="/admin/blog/nowy" className="text-blue-600 hover:underline">Dodaj pierwszy</Link>
          </div>
        )}
      </div>
    </div>
  );
}

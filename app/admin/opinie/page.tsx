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

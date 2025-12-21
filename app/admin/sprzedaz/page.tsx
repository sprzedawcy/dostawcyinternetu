import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function SprzedazPage() {
  const leads = await prisma.lead.findMany({
    include: {
      operator: { select: { nazwa: true } },
      oferta: { select: { nazwa: true } }
    },
    orderBy: { created_at: 'desc' },
    take: 100
  });

  const statusLabels: Record<string, string> = {
    nowy: 'Nowy',
    kontakt: 'Kontakt',
    umowiony: 'Umowiony',
    zainstalowany: 'Zainstalowany',
    rozliczony: 'Rozliczony',
    spad: 'Spad'
  };

  const statusColors: Record<string, string> = {
    nowy: 'bg-blue-600 text-white',
    kontakt: 'bg-yellow-500 text-white',
    umowiony: 'bg-orange-500 text-white',
    zainstalowany: 'bg-green-600 text-white',
    rozliczony: 'bg-emerald-700 text-white',
    spad: 'bg-red-600 text-white'
  };

  const alertTime = new Date(Date.now() - 30 * 60 * 1000);
  const alertLeads = leads.filter(l =>
    l.status === 'nowy' && new Date(l.created_at) < alertTime
  );

  const formatKontaktDate = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    return `${hours}:${mins} ${day}.${month}.${year}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sprzedaz - Leady</h1>
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
            Nowe: {leads.filter(l => l.status === 'nowy').length}
          </span>
          <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium">
            Kontakt: {leads.filter(l => l.status === 'kontakt').length}
          </span>
          <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-medium">
            Umowione: {leads.filter(l => l.status === 'umowiony').length}
          </span>
        </div>
      </div>

      {alertLeads.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
          <p className="font-bold text-red-900">
            {alertLeads.length} lead(ow) czeka dluzej niz 30 minut!
          </p>
          <p className="text-red-800 text-sm">
            Wymagana pilna reakcja.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Data</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Klient</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Miejscowosc</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Operator</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => {
              const isAlert = lead.status === 'nowy' && new Date(lead.created_at) < alertTime;
              return (
                <tr key={lead.id} className={isAlert ? 'bg-red-50' : lead.status === 'nowy' ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(lead.created_at).toLocaleDateString('pl-PL')}
                    <br />
                    <span className="text-xs text-gray-600">{new Date(lead.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-gray-900">{lead.imie_nazwisko}</p>
                    <p className="text-xs text-gray-600">{lead.telefon}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {lead.miejscowosc || '-'}
                    {lead.ulica && <span className="text-gray-600 text-xs block">{lead.ulica} {lead.nr}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {lead.operator?.nazwa || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[lead.status] || 'bg-gray-500 text-white'}`}>
                      {statusLabels[lead.status] || lead.status}
                    </span>
                    {lead.status === 'kontakt' && lead.data_kontaktu_plan && (
                      <span className="block text-xs text-gray-700 mt-1 font-medium">
                        {formatKontaktDate(lead.data_kontaktu_plan)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/sprzedaz/${lead.id}`}
                      className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                    >
                      Otworz
                    </Link>
                  </td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-600 font-medium">
                  Brak leadow
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

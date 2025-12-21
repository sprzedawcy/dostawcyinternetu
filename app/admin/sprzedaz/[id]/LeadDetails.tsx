"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  lead: any;
}

export default function LeadDetails({ lead }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [notatki, setNotatki] = useState(lead.notatki || '');
  const [dataKontaktu, setDataKontaktu] = useState(lead.data_kontaktu_plan?.slice(0, 16) || '');
  const [dataUmowiony, setDataUmowiony] = useState(lead.data_umowiony?.slice(0, 10) || '');
  const [dataInstalacji, setDataInstalacji] = useState(lead.data_instalacji?.slice(0, 10) || '');
  const [miesiacRozliczenia, setMiesiacRozliczenia] = useState(lead.miesiac_rozliczenia || '');
  const [spadPowod, setSpadPowod] = useState(lead.spad_powod || '');
  const [nowyKontaktUwagi, setNowyKontaktUwagi] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notatki,
          data_kontaktu_plan: dataKontaktu || null,
          data_umowiony: dataUmowiony || null,
          data_instalacji: dataInstalacji || null,
          miesiac_rozliczenia: miesiacRozliczenia || null,
          spad_powod: spadPowod || null
        })
      });
      router.refresh();
    } catch (error) {
      alert('Blad zapisu');
    } finally {
      setSaving(false);
    }
  };

  const handleDodajKontakt = async () => {
    if (!nowyKontaktUwagi.trim()) return;
    try {
      await fetch(`/api/leads/${lead.id}/kontakt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uwagi: nowyKontaktUwagi })
      });
      setNowyKontaktUwagi('');
      router.refresh();
    } catch (error) {
      alert('Blad dodawania kontaktu');
    }
  };

  const ofertaUrl = lead.oferta?.custom_url
    ? `/pl/oferta/${lead.operator?.slug}/${lead.oferta.custom_url}`
    : lead.oferta?.id
      ? `/pl/oferta/${lead.operator?.slug}/${lead.oferta.id}`
      : null;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <Link href="/admin/sprzedaz" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
          Wroc do listy
        </Link>
        <span className={`px-4 py-2 text-sm font-bold rounded-full ${
          status === 'nowy' ? 'bg-blue-600 text-white' :
          status === 'kontakt' ? 'bg-yellow-500 text-white' :
          status === 'umowiony' ? 'bg-orange-500 text-white' :
          status === 'zainstalowany' ? 'bg-green-600 text-white' :
          status === 'rozliczony' ? 'bg-emerald-700 text-white' :
          'bg-red-600 text-white'
        }`}>
          {status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Dane klienta</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Imie i nazwisko</label>
              <p className="text-lg font-bold text-gray-900">{lead.imie_nazwisko}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Telefon</label>
              <p className="text-lg font-bold">
                <a href={`tel:${lead.telefon}`} className="text-blue-700 hover:underline">{lead.telefon}</a>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-lg font-bold">
                <a href={`mailto:${lead.email}`} className="text-blue-700 hover:underline">{lead.email}</a>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Adres instalacji</label>
              <p className="text-lg font-bold text-gray-900">
                {lead.miejscowosc || '-'}
                {lead.ulica && `, ul. ${lead.ulica}`}
                {lead.nr && ` ${lead.nr}`}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Data zgloszenia</label>
              <p className="text-lg font-bold text-gray-900">
                {new Date(lead.created_at).toLocaleString('pl-PL')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Oferta</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Operator</label>
              <p className="text-lg font-bold text-gray-900">{lead.operator?.nazwa || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Oferta</label>
              <p className="text-lg font-bold text-gray-900">{lead.oferta?.nazwa || '-'}</p>
              {ofertaUrl && (
                <a href={ofertaUrl} target="_blank" className="text-sm text-blue-700 hover:underline font-medium">
                  Zobacz oferte
                </a>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Upominek</label>
              <p className="text-lg font-bold text-gray-900">{lead.upominek || 'Nie wybrano'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Zrodlo</label>
              <p className="text-lg font-bold text-gray-900">{lead.zrodlo || 'strona'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Status</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900 font-medium"
              >
                <option value="nowy">Nowy</option>
                <option value="kontakt">W kontakcie</option>
                <option value="umowiony">Umowiony</option>
                <option value="zainstalowany">Zainstalowany</option>
                <option value="rozliczony">Rozliczony</option>
                <option value="spad">Spad</option>
              </select>
            </div>

            {status === 'kontakt' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Planowany kontakt</label>
                <input
                  type="datetime-local"
                  value={dataKontaktu}
                  onChange={(e) => setDataKontaktu(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
                />
              </div>
            )}

            {status === 'umowiony' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Data umowienia</label>
                <input
                  type="date"
                  value={dataUmowiony}
                  onChange={(e) => setDataUmowiony(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
                />
              </div>
            )}

            {status === 'zainstalowany' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Data instalacji</label>
                <input
                  type="date"
                  value={dataInstalacji}
                  onChange={(e) => setDataInstalacji(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
                />
              </div>
            )}

            {status === 'rozliczony' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Miesiac rozliczenia</label>
                <input
                  type="month"
                  value={miesiacRozliczenia}
                  onChange={(e) => setMiesiacRozliczenia(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
                />
              </div>
            )}

            {status === 'spad' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Powod spad</label>
                <select
                  value={spadPowod}
                  onChange={(e) => setSpadPowod(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900 font-medium"
                >
                  <option value="">Wybierz powod...</option>
                  <option value="brak_kontaktu">Brak kontaktu</option>
                  <option value="zadluzenie">Zadluzenie</option>
                  <option value="brak_sieci">Brak sieci</option>
                  <option value="rezygnacja">Rezygnacja klienta</option>
                  <option value="inny">Inny</option>
                </select>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Zapisuje...' : 'Zapisz status'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Historia kontaktow</h2>
          <div className="mb-4">
            <textarea
              value={nowyKontaktUwagi}
              onChange={(e) => setNowyKontaktUwagi(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
              placeholder="Dodaj notatke z kontaktu..."
            />
            <button
              onClick={handleDodajKontakt}
              className="mt-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              + Dodaj kontakt
            </button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {lead.kontakty?.map((kontakt: any) => (
              <div key={kontakt.id} className="p-3 bg-gray-100 rounded-lg border-l-4 border-blue-600">
                <p className="text-xs font-bold text-gray-600">
                  {new Date(kontakt.data).toLocaleString('pl-PL')}
                </p>
                <p className="text-sm text-gray-900">{kontakt.uwagi}</p>
              </div>
            ))}
            {(!lead.kontakty || lead.kontakty.length === 0) && (
              <p className="text-gray-600 text-sm font-medium">Brak historii kontaktow</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Notatki ogolne</h2>
          <textarea
            value={notatki}
            onChange={(e) => setNotatki(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
            placeholder="Notatki..."
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Zapisz notatki
          </button>
        </div>
      </div>
    </div>
  );
}

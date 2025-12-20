"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOffer, updateOffer } from "../actions";

interface Props {
  offer?: any;
  operators: any[];
  mode: "create" | "edit";
}

export default function OfferForm({ offer, operators, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      if (mode === "create") {
        await createOffer(formData);
        router.push("/admin/oferty");
      } else {
        await updateOffer(offer.id, formData);
        router.push("/admin/oferty");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Operator */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Operator *
        </label>
        <select
          name="operator_id"
          required
          defaultValue={offer?.operator_id || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Wybierz operatora</option>
          {operators.map((op) => (
            <option key={op.id} value={op.id}>
              {op.nazwa}
            </option>
          ))}
        </select>
      </div>

      {/* Nazwa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nazwa oferty *
        </label>
        <input
          type="text"
          name="nazwa"
          required
          defaultValue={offer?.nazwa}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="np. Internet 1000 Mb/s"
        />
      </div>

      {/* Custom URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL przekierowania
        </label>
        <input
          type="text"
          name="custom_url"
          defaultValue={offer?.custom_url || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="https://operator.pl/oferta"
        />
      </div>

      {/* Redirect URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL przekierowania (gdy oferta nieaktywna)
        </label>
        <input
          type="text"
          name="redirect_url"
          defaultValue={offer?.redirect_url || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="https://inna-oferta.pl"
        />
        <p className="text-xs text-gray-500 mt-1">
          Gdy oferta zostanie dezaktywowana, strona przekieruje na ten adres
        </p>
      </div>

      {/* Kategoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kategoria *
        </label>
        <select
          name="kategoria"
          required
          defaultValue={offer?.kategoria || "internet"}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="internet">Internet</option>
          <option value="internet+tv">Internet + TV</option>
          <option value="internet+tv+telefon">Internet + TV + Telefon</option>
        </select>
      </div>

      {/* Prędkości */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Download (Mb/s) *
          </label>
          <input
            type="number"
            name="download_mbps"
            required
            defaultValue={offer?.download_mbps}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="1000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload (Mb/s) *
          </label>
          <input
            type="number"
            name="upload_mbps"
            required
            defaultValue={offer?.upload_mbps}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="500"
          />
        </div>
      </div>

      {/* Ceny */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Abonament (PLN/mies.) *
          </label>
          <input
            type="number"
            step="0.01"
            name="abonament"
            required
            defaultValue={offer?.abonament}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="99.99"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instalacja (PLN)
          </label>
          <input
            type="number"
            step="0.01"
            name="instalacja"
            defaultValue={offer?.instalacja || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aktywacja (PLN)
          </label>
          <input
            type="number"
            step="0.01"
            name="aktywacja"
            defaultValue={offer?.aktywacja || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
      </div>

      {/* Zobowiązanie i technologia */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zobowiązanie (miesiące)
          </label>
          <input
            type="number"
            name="zobowiazanie_miesiace"
            defaultValue={offer?.zobowiazanie_miesiace || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="24"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Technologia
          </label>
          <input
            type="text"
            name="technologia"
            defaultValue={offer?.technologia || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Światłowód"
          />
        </div>
      </div>

{/* Typ połączenia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Typ połączenia *
        </label>
        <select
          name="typ_polaczenia"
          required
          defaultValue={offer?.typ_polaczenia || "kablowe"}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="kablowe">Kablowe (światłowód, DOCSIS)</option>
          <option value="komorkowe">Komórkowe (LTE, 5G)</option>
        </select>
      </div>

      {/* Priorytet */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priorytet wyświetlania (0-100)
        </label>
        <input
          type="number"
          name="priorytet"
          min="0"
          max="100"
          defaultValue={offer?.priorytet || 0}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          Wyższy priorytet = wyżej w liście wyników (0 = domyślny)
        </p>
      </div>

      {/* Checkboxy */}
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="wyrozoniona"
            value="true"
            defaultChecked={offer?.wyrozoniona}
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">Oferta wyróżniona (na górze listy)</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="lokalna"
            value="true"
            defaultChecked={offer?.lokalna}
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">Oferta lokalna (ograniczony zasięg)</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="oferta_specjalna"
            value="true"
            defaultChecked={offer?.oferta_specjalna}
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">Oferta specjalna</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="dom_blok_info"
            value="true"
            defaultChecked={offer?.dom_blok_info}
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">Pokaż informację o różnicy cen dom/blok</span>
        </label>

        {mode === "edit" && (
          <label className="flex items-center">
            <input
              type="checkbox"
              name="aktywna"
              value="true"
              defaultChecked={offer?.aktywna}
              className="mr-2 h-4 w-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Oferta aktywna</span>
          </label>
        )}
      </div>

      {/* Tekst dom/blok */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dodatkowy tekst dla domów jednorodzinnych
        </label>
        <textarea
          name="dom_blok_tekst"
          rows={3}
          defaultValue={offer?.dom_blok_tekst || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="np. Dla domów jednorodzinnych koszt instalacji może być wyższy o 200-500 PLN"
        />
      </div>

      {/* Opis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Opis oferty
        </label>
        <textarea
          name="opis"
          rows={6}
          defaultValue={offer?.opis || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Szczegółowy opis oferty..."
        />
      </div>

      {/* Przyciski */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Zapisywanie..." : mode === "create" ? "Dodaj ofertę" : "Zapisz zmiany"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createArtykul, updateArtykul } from "./actions";

interface Kategoria {
  id: number;
  nazwa: string;
  slug: string;
}

interface Operator {
  id: number;
  nazwa: string;
}

interface Tag {
  id: number;
  nazwa: string;
  slug: string;
  typ: string | null;
}

interface Artykul {
  id: number;
  tytul: string;
  slug: string;
  zajawka: string | null;
  tresc: string | null;
  kategoria_id: number | null;
  operator_id: number | null;
  miejscowosc_simc: string | null;
  technologia: string | null;
  thumbnail_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  autor: string | null;
  opublikowany: boolean;
  wyrozniany: boolean;
  tagi: { tag: Tag }[];
}

interface Props {
  artykul?: Artykul | null;
  kategorie: Kategoria[];
  operatorzy: Operator[];
  tagi: Tag[];
}

const TECHNOLOGIE = [
  { value: 'swiatlowod', label: 'Światłowód' },
  { value: 'lte', label: 'LTE' },
  { value: '5g', label: '5G' },
  { value: 'kablowy', label: 'Kablowy HFC' },
  { value: 'dsl', label: 'DSL' },
  { value: 'radiowy', label: 'Radiowy' },
];

export default function ArtykulForm({ artykul, kategorie, operatorzy, tagi }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTagi, setSelectedTagi] = useState<number[]>(
    artykul?.tagi.map(t => t.tag.id) || []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("tagi", JSON.stringify(selectedTagi));
    formData.set("opublikowany", formData.get("opublikowany") ? "true" : "false");
    formData.set("wyrozniany", formData.get("wyrozniany") ? "true" : "false");

    let result;
    if (artykul) {
      result = await updateArtykul(artykul.id, formData);
    } else {
      result = await createArtykul(formData);
    }

    if (result.success) {
      router.push("/admin/blog");
      router.refresh();
    } else {
      alert("Błąd: " + result.error);
    }
    setLoading(false);
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagi(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sekcja 1: Podstawowe */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm">1</span>
          Podstawowe
        </h2>

        <div className="space-y-4">
          {/* Tytuł */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tytuł artykułu *
            </label>
            <input
              type="text"
              name="tytul"
              defaultValue={artykul?.tytul || ""}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Jak sprawdzić czy jest światłowód"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug URL
            </label>
            <input
              type="text"
              name="slug"
              defaultValue={artykul?.slug || ""}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="jak-sprawdzic-czy-jest-swiatlowod (auto-generowany)"
            />
            <p className="text-xs text-gray-500 mt-1">Zostaw puste dla auto-generacji</p>
          </div>

          {/* Kategoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategoria *
            </label>
            <select
              name="kategoria_id"
              defaultValue={artykul?.kategoria_id || ""}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Wybierz kategorię --</option>
              {kategorie.map(kat => (
                <option key={kat.id} value={kat.id}>{kat.nazwa}</option>
              ))}
            </select>
          </div>

          {/* Zajawka */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zajawka
            </label>
            <textarea
              name="zajawka"
              defaultValue={artykul?.zajawka || ""}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Krótki opis artykułu widoczny na liście"
            />
          </div>

          {/* Treść */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Treść (HTML)
            </label>
            <textarea
              name="tresc"
              defaultValue={artykul?.tresc || ""}
              rows={15}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="<h2>Nagłówek</h2><p>Treść artykułu...</p>"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL obrazka głównego
            </label>
            <input
              type="url"
              name="thumbnail_url"
              defaultValue={artykul?.thumbnail_url || ""}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Sekcja 2: Powiązania */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm">2</span>
          Powiązania
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Operator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operator (opcjonalnie)
            </label>
            <select
              name="operator_id"
              defaultValue={artykul?.operator_id || ""}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Brak --</option>
              {operatorzy.map(op => (
                <option key={op.id} value={op.id}>{op.nazwa}</option>
              ))}
            </select>
          </div>

          {/* Technologia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technologia (opcjonalnie)
            </label>
            <select
              name="technologia"
              defaultValue={artykul?.technologia || ""}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Brak --</option>
              {TECHNOLOGIE.map(tech => (
                <option key={tech.value} value={tech.value}>{tech.label}</option>
              ))}
            </select>
          </div>

          {/* Miejscowość SIMC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miejscowość SIMC (opcjonalnie)
            </label>
            <input
              type="text"
              name="miejscowosc_simc"
              defaultValue={artykul?.miejscowosc_simc || ""}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="np. 0918123"
            />
          </div>

          {/* Autor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Autor
            </label>
            <input
              type="text"
              name="autor"
              defaultValue={artykul?.autor || "Redakcja"}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tagi */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tagi
          </label>
          <div className="flex flex-wrap gap-2">
            {tagi.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTagi.includes(tag.id)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tag.nazwa}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sekcja 3: SEO */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm">3</span>
          SEO
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
              <span className="text-gray-400 font-normal ml-2">(max 70 znaków)</span>
            </label>
            <input
              type="text"
              name="meta_title"
              defaultValue={artykul?.meta_title || ""}
              maxLength={70}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tytuł dla Google"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
              <span className="text-gray-400 font-normal ml-2">(max 160 znaków)</span>
            </label>
            <textarea
              name="meta_description"
              defaultValue={artykul?.meta_description || ""}
              maxLength={160}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Opis dla Google"
            />
          </div>
        </div>
      </div>

      {/* Sekcja 4: Publikacja */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm">4</span>
          Publikacja
        </h2>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="opublikowany"
              defaultChecked={artykul?.opublikowany || false}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Opublikowany</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="wyrozniany"
              defaultChecked={artykul?.wyrozniany || false}
              className="w-5 h-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-gray-700">Wyróżniony ⭐</span>
          </label>
        </div>
      </div>

      {/* Przyciski */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? "⏳ Zapisywanie..." : artykul ? "💾 Zapisz zmiany" : "✓ Utwórz artykuł"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}

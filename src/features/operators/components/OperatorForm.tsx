"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOperator, updateOperator } from "../actions";

interface Props {
  operator?: any;
  mode: "create" | "edit";
}

const TYPY_OPERATORA = [
  { value: "krajowy", label: "Krajowy (ogólnopolski)" },
  { value: "regionalny", label: "Regionalny" },
  { value: "lokalny", label: "Lokalny" },
];

const TECHNOLOGIE = [
  "światłowód",
  "kablowy HFC",
  "DSL",
  "LTE",
  "5G",
  "radiowy",
];

export default function OperatorForm({ operator, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTechnologie, setSelectedTechnologie] = useState<string[]>(
    operator?.technologie || []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    // Dodaj technologie jako JSON
    formData.set("technologie", JSON.stringify(selectedTechnologie));

    try {
      if (mode === "create") {
        await createOperator(formData);
        router.push("/admin/operatorzy");
      } else {
        await updateOperator(operator.id, formData);
        router.push("/admin/operatorzy");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd");
      setLoading(false);
    }
  };

  const toggleTechnologia = (tech: string) => {
    setSelectedTechnologie((prev) =>
      prev.includes(tech)
        ? prev.filter((t) => t !== tech)
        : [...prev, tech]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* ===== SEKCJA: PODSTAWOWE ===== */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
          Podstawowe informacje
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nazwa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa operatora *
            </label>
            <input
              type="text"
              name="nazwa"
              required
              defaultValue={operator?.nazwa}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="np. Orange Polska"
            />
          </div>

          {/* Typ operatora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ operatora
            </label>
            <select
              name="typ"
              defaultValue={operator?.typ || "krajowy"}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TYPY_OPERATORA.map((typ) => (
                <option key={typ.value} value={typ.value}>
                  {typ.label}
                </option>
              ))}
            </select>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL logo
            </label>
            <input
              type="text"
              name="logo_url"
              defaultValue={operator?.logo_url || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="/uploads/operators/logo.png"
            />
          </div>

          {/* Strona WWW */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strona WWW
            </label>
            <input
              type="url"
              name="strona_www"
              defaultValue={operator?.strona_www || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://www.operator.pl"
            />
          </div>
        </div>

        {/* Technologie */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Technologie
          </label>
          <div className="flex flex-wrap gap-2">
            {TECHNOLOGIE.map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => toggleTechnologia(tech)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedTechnologie.includes(tech)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>

        {/* Regiony (dla lokalnych/regionalnych) */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Regiony działania
          </label>
          <input
            type="text"
            name="regiony"
            defaultValue={operator?.regiony?.join(", ") || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="np. Warszawa, Mazowieckie (oddzielone przecinkami)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Dla operatorów lokalnych/regionalnych. Oddziel przecinkami.
          </p>
        </div>

        {/* Status aktywny */}
        {mode === "edit" && (
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="aktywny"
                value="true"
                defaultChecked={operator?.aktywny}
                className="mr-2 h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Operator aktywny</span>
            </label>
          </div>
        )}
      </div>

      {/* ===== SEKCJA: KONTAKT ===== */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
          Dane kontaktowe
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email handlowca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email handlowca
            </label>
            <input
              type="email"
              name="email_handlowca"
              defaultValue={operator?.email_handlowca || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="handlowiec@operator.pl"
            />
            <p className="text-xs text-gray-500 mt-1">
              Powiadomienia o leadach
            </p>
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon kontaktowy
            </label>
            <input
              type="tel"
              name="telefon"
              defaultValue={operator?.telefon || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+48 123 456 789"
            />
          </div>

          {/* Redirect URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL przekierowania (gdy nieaktywny)
            </label>
            <input
              type="url"
              name="redirect_url"
              defaultValue={operator?.redirect_url || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://inny-operator.pl"
            />
          </div>
        </div>
      </div>

      {/* ===== SEKCJA: SEO ===== */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
          SEO i treści
        </h2>
        
        {/* Meta Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Title
            <span className="ml-2 text-xs text-gray-400">
              ({(operator?.meta_title?.length || 0)}/70)
            </span>
          </label>
          <input
            type="text"
            name="meta_title"
            maxLength={70}
            defaultValue={operator?.meta_title || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Internet Orange - oferty światłowodu i LTE | DostawcyInternetu.pl"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tytuł strony w Google. Zostaw puste dla automatycznego.
          </p>
        </div>

        {/* Meta Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description
            <span className="ml-2 text-xs text-gray-400">
              ({(operator?.meta_description?.length || 0)}/160)
            </span>
          </label>
          <textarea
            name="meta_description"
            maxLength={160}
            rows={2}
            defaultValue={operator?.meta_description || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Sprawdź oferty internetu Orange. Światłowód do 1 Gb/s, internet mobilny 5G. Porównaj ceny i zamów online."
          />
        </div>

        {/* Keywords */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Słowa kluczowe
          </label>
          <input
            type="text"
            name="keywords"
            defaultValue={operator?.keywords?.join(", ") || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="orange internet, światłowód orange, orange 5g"
          />
          <p className="text-xs text-gray-500 mt-1">
            Oddziel przecinkami. Używane do tagowania i sugestii AI.
          </p>
        </div>

        {/* Opis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opis operatora (HTML)
          </label>
          <textarea
            name="opis"
            rows={8}
            defaultValue={operator?.opis || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="<p>Orange Polska to jeden z największych operatorów telekomunikacyjnych w kraju...</p>"
          />
          <p className="text-xs text-gray-500 mt-1">
            Pełny opis wyświetlany na stronie operatora. Możesz użyć HTML.
          </p>
        </div>
      </div>

      {/* ===== PRZYCISKI ===== */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? "Zapisywanie..." : mode === "create" ? "Dodaj operatora" : "Zapisz zmiany"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
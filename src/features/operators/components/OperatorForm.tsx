"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOperator, updateOperator } from "../actions";

interface Props {
  operator?: any;
  mode: "create" | "edit";
}

export default function OperatorForm({ operator, mode }: Props) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Nazwa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* Email handlowca */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
          Na ten adres będą wysyłane powiadomienia o nowych leadach
        </p>
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL logo
        </label>
        <input
          type="text"
          name="logo_url"
          defaultValue={operator?.logo_url || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="/uploads/operators/logo.png"
        />
        <p className="text-xs text-gray-500 mt-1">
          Na razie wklej ścieżkę do logo ręcznie (później dodamy upload)
        </p>
      </div>

      {/* Opis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Opis operatora
        </label>
        <textarea
          name="opis"
          rows={6}
          defaultValue={operator?.opis || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Opis operatora, historia, oferta..."
        />
      </div>

      {/* Przyciski */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Zapisywanie..." : mode === "create" ? "Dodaj operatora" : "Zapisz zmiany"}
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
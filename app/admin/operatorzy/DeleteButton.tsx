"use client";
import { useState } from "react";
import { deleteOperator } from "@/src/features/operators/actions";
import { useRouter } from "next/navigation";

export default function DeleteButton({ id, nazwa }: { id: number; nazwa: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Czy na pewno chcesz usunąć operatora "${nazwa}"? Spowoduje to usunięcie wszystkich jego ofert, leadów i zasięgów.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteOperator(id);
      router.refresh();
    } catch (error) {
      alert("Błąd podczas usuwania");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-900 disabled:opacity-50"
    >
      {loading ? "Usuwanie..." : "Usuń"}
    </button>
  );
}

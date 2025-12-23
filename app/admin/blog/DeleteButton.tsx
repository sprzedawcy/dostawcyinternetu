"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteArtykul } from "./actions";

interface Props {
  id: number;
  tytul: string;
}

export default function DeleteButton({ id, tytul }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Czy na pewno chcesz usunąć artykuł "${tytul}"?`)) {
      return;
    }

    setLoading(true);
    const result = await deleteArtykul(id);
    
    if (result.success) {
      router.refresh();
    } else {
      alert("Błąd: " + result.error);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="Usuń"
    >
      {loading ? "⏳" : "🗑️"}
    </button>
  );
}

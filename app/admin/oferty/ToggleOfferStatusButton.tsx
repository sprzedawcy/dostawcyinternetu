"use client";
import { useState } from "react";
import { toggleOfferStatus } from "@/src/features/offers/actions";
import { useRouter } from "next/navigation";

export default function ToggleOfferStatusButton({ 
  id, 
  nazwa, 
  aktywna 
}: { 
  id: number; 
  nazwa: string;
  aktywna: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const action = aktywna ? "dezaktywować" : "aktywować";
    if (!confirm(`Czy na pewno chcesz ${action} ofertę "${nazwa}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await toggleOfferStatus(id);
      router.refresh();
    } catch (error) {
      alert("Błąd podczas zmiany statusu");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${
        aktywna 
          ? "text-orange-600 hover:text-orange-900" 
          : "text-green-600 hover:text-green-900"
      } disabled:opacity-50`}
    >
      {loading ? "..." : aktywna ? "Dezaktywuj" : "Aktywuj"}
    </button>
  );
}
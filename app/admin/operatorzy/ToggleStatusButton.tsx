"use client";
import { useState } from "react";
import { toggleOperatorStatus } from "@/src/features/operators/actions";
import { useRouter } from "next/navigation";

export default function ToggleStatusButton({ 
  id, 
  nazwa, 
  aktywny 
}: { 
  id: number; 
  nazwa: string;
  aktywny: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const action = aktywny ? "dezaktywować" : "aktywować";
    if (!confirm(`Czy na pewno chcesz ${action} operatora "${nazwa}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await toggleOperatorStatus(id);
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
        aktywny 
          ? "text-orange-600 hover:text-orange-900" 
          : "text-green-600 hover:text-green-900"
      } disabled:opacity-50`}
    >
      {loading ? "..." : aktywny ? "Dezaktywuj" : "Aktywuj"}
    </button>
  );
}
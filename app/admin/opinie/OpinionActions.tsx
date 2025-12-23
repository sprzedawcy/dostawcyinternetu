"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  opinionId: number;
  isApproved: boolean;
}

export default function OpinionActions({ opinionId, isApproved }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (action === 'delete' && !confirm('Na pewno usunąć tę opinię?')) return;
    
    setLoading(action);
    try {
      const res = await fetch('/api/admin/opinie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opinionId, action })
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Błąd:', err);
    }
    setLoading(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {!isApproved && (
        <button
          onClick={() => handleAction('approve')}
          disabled={loading !== null}
          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading === 'approve' ? '...' : '✓ Zatwierdź'}
        </button>
      )}
      {isApproved && (
        <button
          onClick={() => handleAction('reject')}
          disabled={loading !== null}
          className="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:bg-gray-400"
        >
          {loading === 'reject' ? '...' : '↩ Cofnij'}
        </button>
      )}
      <button
        onClick={() => handleAction('delete')}
        disabled={loading !== null}
        className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400"
      >
        {loading === 'delete' ? '...' : '✕ Usuń'}
      </button>
    </div>
  );
}

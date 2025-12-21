"use client";
import { useState } from "react";

interface Faq {
  id: number;
  pytanie: string;
  odpowiedz: string;
}

interface Props {
  faqs: Faq[];
  operatorName: string;
}

export default function FaqTab({ faqs, operatorName }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (faqs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <span className="text-5xl mb-4 block">❓</span>
        <p className="text-gray-500 text-lg">Brak pytań FAQ</p>
        <p className="text-gray-400 text-sm mt-2">Sekcja będzie dostępna wkrótce</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="font-bold text-gray-900 mb-4 text-lg">Najczęściej zadawane pytania</h3>
      <div className="space-y-2">
        {faqs.map((faq) => (
          <div key={faq.id} className="border rounded-xl overflow-hidden">
            <button onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors">
              <span className="font-medium text-gray-900">{faq.pytanie}</span>
              <span className="text-2xl text-gray-400">{openId === faq.id ? '−' : '+'}</span>
            </button>
            {openId === faq.id && (
              <div className="px-4 pb-4 text-gray-600">{faq.odpowiedz}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

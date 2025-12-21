"use client";
import { useState } from "react";

interface Props {
  operatorName: string;
  operatorSlug: string;
}

const REWARDS = [
  {
    id: 'mug',
    name: 'Kubek termiczny',
    image: '☕',
    description: 'Stylowy kubek 350ml'
  },
  {
    id: 'mouse',
    name: 'Myszka bezprzewodowa',
    image: '🖱️',
    description: 'Ergonomiczna, cicha'
  },
  {
    id: 'vpn',
    name: 'VPN na 3 miesiące',
    image: '🔒',
    description: 'Bezpieczne połączenie'
  },
  {
    id: 'pendrive',
    name: 'Pendrive 32GB',
    image: '💾',
    description: 'USB 3.0, szybki transfer'
  }
];

export default function RewardsModule({ operatorName, operatorSlug }: Props) {
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* NAGLOWEK */}
      <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎁</span>
          <div>
            <h3 className="text-lg font-bold">Odbierz upominek!</h3>
            <p className="text-amber-100 text-sm">Przy podpisaniu umowy przez nas</p>
          </div>
        </div>
      </div>

      {/* UPOMINKI */}
      <div className="p-5">
        <p className="text-sm text-gray-600 mb-4">
          Zamawiając przez naszą porównywarkę otrzymujesz <strong>gratis do wyboru</strong>:
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {REWARDS.map((reward) => (
            <button
              key={reward.id}
              onClick={() => setSelectedReward(reward.id === selectedReward ? null : reward.id)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                selectedReward === reward.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="text-3xl mb-1">{reward.image}</div>
              <p className="font-medium text-gray-900 text-sm">{reward.name}</p>
              <p className="text-xs text-gray-500">{reward.description}</p>
            </button>
          ))}
        </div>

        {selectedReward && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-800">
              ✅ Wybrałeś: <strong>{REWARDS.find(r => r.id === selectedReward)?.name}</strong>
              <br />
              <span className="text-green-600">Upominek otrzymasz przy podpisaniu umowy</span>
            </p>
          </div>
        )}
      </div>

      {/* DLACZEGO MY */}
      <div className="px-5 pb-5">
        <div className="border-t pt-4">
          <h4 className="font-bold text-gray-900 mb-3 text-sm">Dlaczego zamawiać przez nas?</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-600">
                <strong className="text-gray-900">Bezpośredni kontakt z {operatorName}</strong> - nie jesteśmy pośrednikiem
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-600">
                <strong className="text-gray-900">Te same ceny</strong> co na stronie operatora
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-600">
                <strong className="text-gray-900">Gratis upominek</strong> do każdej umowy
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-600">
                <strong className="text-gray-900">Sprawdzamy dostępność</strong> przed kontaktem
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* TRUST BADGE */}
      <div className="px-5 pb-5">
        <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🛡️</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Autoryzowany partner</p>
            <p className="text-xs text-gray-500">
              Współpracujemy bezpośrednio z operatorami. Umowę podpisujesz z {operatorName}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

interface BadgeProps {
  type: 'krajowy' | 'regionalny' | 'lokalny' | 'komórkowy' | 'aktywny' | 'nieaktywny';
  size?: 'sm' | 'md';
}

export default function OperatorBadge({ type, size = 'sm' }: BadgeProps) {
  const styles = {
    krajowy: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: '🌍',
      label: 'Ogólnopolski'
    },
    regionalny: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: '📍',
      label: 'Regionalny'
    },
    lokalny: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: '🏠',
      label: 'Lokalny'
    },
    'komórkowy': {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: '📱',
      label: 'Komórkowy'
    },
    aktywny: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: '✓',
      label: 'Aktywny'
    },
    nieaktywny: {
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      border: 'border-gray-200',
      icon: '○',
      label: 'Nieaktywny'
    }
  };

  const style = styles[type] || styles.lokalny;
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-3 py-1 text-sm gap-1.5';

  return (
    <span className={`inline-flex items-center ${sizeClasses} ${style.bg} ${style.text} border ${style.border} rounded-full font-medium`}>
      <span>{style.icon}</span>
      <span>{style.label}</span>
    </span>
  );
}

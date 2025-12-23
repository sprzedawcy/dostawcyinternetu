/**
 * MapFacade - Delikatna statyczna mapa Polski
 * Mniejsze pulsujące punkty
 */

export default function MapFacade() {
  const cities = [
    { name: "Warszawa", x: 62, y: 35, size: "lg" },
    { name: "Kraków", x: 55, y: 58, size: "md" },
    { name: "Wrocław", x: 38, y: 48, size: "md" },
    { name: "Poznań", x: 35, y: 32, size: "md" },
    { name: "Gdańsk", x: 48, y: 12, size: "md" },
    { name: "Łódź", x: 52, y: 40, size: "sm" },
    { name: "Szczecin", x: 22, y: 18, size: "sm" },
    { name: "Lublin", x: 72, y: 45, size: "sm" },
    { name: "Katowice", x: 50, y: 55, size: "sm" },
    { name: "Białystok", x: 78, y: 25, size: "sm" },
  ];

  // Mniejsze rozmiary
  const sizeMap = {
    lg: { r: 4, pulse: 8 },
    md: { r: 3, pulse: 6 },
    sm: { r: 2, pulse: 5 },
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <svg
        viewBox="0 0 100 80"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
          </linearGradient>

          <style>
            {`
              @keyframes pulse-small {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 0; transform: scale(1.8); }
              }
              .pulse-ring {
                animation: pulse-small 3s ease-in-out infinite;
                transform-origin: center;
              }
              .pulse-ring-delay-1 { animation-delay: 1s; }
              .pulse-ring-delay-2 { animation-delay: 2s; }
            `}
          </style>
        </defs>

        {/* Obrys Polski */}
        <path
          d="M25,15 L35,8 L50,5 L60,8 L75,12 L82,20 L85,35 L80,45 L75,55 L65,62 L55,65 L45,62 L35,55 L28,50 L22,40 L18,30 L20,20 Z"
          fill="none"
          stroke="url(#borderGradient)"
          strokeWidth="0.3"
        />

        {/* Punkty miast */}
        {cities.map((city, index) => {
          const size = sizeMap[city.size as keyof typeof sizeMap];
          return (
            <g key={city.name}>
              {/* Pulsujący ring - mniejszy */}
              <circle
                cx={city.x}
                cy={city.y}
                r={size.pulse}
                fill="#3B82F6"
                opacity="0.25"
                className={`pulse-ring ${index % 3 === 1 ? 'pulse-ring-delay-1' : index % 3 === 2 ? 'pulse-ring-delay-2' : ''}`}
              />
              
              {/* Wewnętrzny ring */}
              <circle
                cx={city.x}
                cy={city.y}
                r={size.r + 0.5}
                fill="#3B82F6"
                opacity="0.15"
              />
              
              {/* Główny punkt */}
              <circle
                cx={city.x}
                cy={city.y}
                r={size.r}
                fill="#3B82F6"
                opacity="0.35"
              />
            </g>
          );
        })}

        {/* Linie połączeń */}
        <g stroke="#3B82F6" strokeOpacity="0.06" strokeWidth="0.2">
          <line x1="62" y1="35" x2="52" y2="40" />
          <line x1="52" y1="40" x2="38" y2="48" />
          <line x1="62" y1="35" x2="55" y2="58" />
          <line x1="62" y1="35" x2="48" y2="12" />
          <line x1="35" y1="32" x2="48" y2="12" />
          <line x1="35" y1="32" x2="38" y2="48" />
        </g>
      </svg>
    </div>
  );
}

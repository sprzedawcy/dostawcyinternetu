"use client"

interface AddressReportProps {
  data: any;
}

export default function AddressReport({ data }: AddressReportProps) {
  // Funkcja pomocnicza do ikon technologii
  const getTechIcon = (tech: string) => {
    if (tech?.toLowerCase().includes('swiatlowod')) return "🌐";
    if (tech?.toLowerCase().includes('miedz')) return "🔌";
    return "📡";
  };

  return (
    <div className="animate-in zoom-in duration-500">
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          Punkt zweryfikowany
        </div>
        <h2 className="text-4xl font-black text-black leading-none">
          {data.ulica} {data.nr}
        </h2>
        <p className="text-gray-400 font-bold mt-2 uppercase text-sm">
          {data.miejscowosc}, {data.powiat}
        </p>
      </div>

      <div className="grid gap-4">
        {/* Karta Technologii Głównej */}
        <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-tighter">Główna technologia</p>
            <p className="text-xl font-black text-black">{data.t1_isp || "Brak danych"}</p>
          </div>
          <div className="text-3xl">{getTechIcon(data.t1_tech)}</div>
        </div>

        {/* Detale techniczne w siatce */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-blue-50 rounded-[24px] border border-blue-100">
            <p className="text-[10px] font-black text-blue-400 uppercase">Max Prędkość</p>
            <p className="text-lg font-black text-blue-900">{data.t1_m || "—"} Mbps</p>
          </div>
          <div className="p-5 bg-purple-50 rounded-[24px] border border-purple-100">
            <p className="text-[10px] font-black text-purple-400 uppercase">Odległość</p>
            <p className="text-lg font-black text-purple-900">{data.t1_d || "—"} m</p>
          </div>
        </div>

        {/* Dodatkowe info o BTS (jeśli masz w bazie) */}
        {(data.bts_1_isp || data.bts_2_isp) && (
          <div className="mt-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 ml-2">Dostępne nadajniki (Mobile/5G)</h4>
            <div className="flex flex-wrap gap-2">
              {[data.bts_1_isp, data.bts_2_isp, data.bts_3_isp].filter(Boolean).map((bts, i) => (
                <span key={i} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm">
                  📡 {bts}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="w-full mt-10 py-5 bg-black text-white rounded-2xl font-black hover:scale-[1.02] transition-transform active:scale-95 shadow-xl"
      >
        SZUKAJ PONOWNIE
      </button>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { 
  searchCoveragePivot, 
  updateCoverageHP, 
  copyAddressCoverage,
  suggestMiejscowosci,
  suggestUlice 
} from "@/src/features/coverage/actions/coverage";

interface Props {
  operators: { id: number; nazwa: string; slug: string }[];
}

export default function CoverageTable({ operators }: Props) {
  // Filtry
  const [simc, setSimc] = useState('');
  const [miejscowosc, setMiejscowosc] = useState('');
  const [ulica, setUlica] = useState('');
  const [sortBy, setSortBy] = useState<'simc' | 'miejscowosc' | 'ulica' | 'nr'>('simc');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  // Filtr operatorów z zasięgiem
  const [operatorFilters, setOperatorFilters] = useState<Record<number, boolean>>({});

  // Podpowiedzi
  const [miejscowosciSuggestions, setMiejscowosciSuggestions] = useState<string[]>([]);
  const [uliceSuggestions, setUliceSuggestions] = useState<string[]>([]);
  const [showMiejscowosciDropdown, setShowMiejscowosciDropdown] = useState(false);
  const [showUliceDropdown, setShowUliceDropdown] = useState(false);

  // Dane
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadedOperators, setLoadedOperators] = useState<any[]>(operators);

  // Edycja HP
  const [editingCell, setEditingCell] = useState<{ simc: string; id_ulicy: string; nr: string; operator_id: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Widoczność kolumn
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    simc: true,
    teryt: false,
    miejscowosc: true,
    ulica: true,
    nr: true,
    ...Object.fromEntries(operators.map(op => [`op_${op.id}`, true]))
  });

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleOperatorFilter = (opId: number) => {
    setOperatorFilters(prev => ({ ...prev, [opId]: !prev[opId] }));
    setPage(1);
  };

  // Podpowiedzi miejscowości
  useEffect(() => {
    if (miejscowosc.length < 2) {
      setMiejscowosciSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await suggestMiejscowosci(miejscowosc);
      setMiejscowosciSuggestions(results);
    }, 200);
    return () => clearTimeout(timer);
  }, [miejscowosc]);

  // Podpowiedzi ulic
  useEffect(() => {
    if (ulica.length < 2) {
      setUliceSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await suggestUlice(ulica, miejscowosc || undefined);
      setUliceSuggestions(results);
    }, 200);
    return () => clearTimeout(timer);
  }, [ulica, miejscowosc]);

  // Ładuj dane
  const loadData = async () => {
    if (!simc && !miejscowosc && !ulica) {
      setData([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    try {
      const result = await searchCoveragePivot({
        simc,
        miejscowosc,
        ulica,
        page,
        limit: 50,
        sortBy,
        sortOrder
      });
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (result.operators) {
        setLoadedOperators(result.operators);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 400);
    return () => clearTimeout(timer);
  }, [simc, miejscowosc, ulica, page, sortBy, sortOrder]);

  // Filtruj dane po operatorach
  const filteredData = data.filter(row => {
    const activeFilters = Object.entries(operatorFilters).filter(([_, active]) => active);
    if (activeFilters.length === 0) return true;
    
    // Pokaż tylko rekordy gdzie WSZYSTKIE zaznaczone operatorzy mają HP > 0
    return activeFilters.every(([opId]) => {
      const hp = row[`hp_${opId}`];
      return hp && hp > 0;
    });
  });

  const handleUpdateHP = async () => {
    if (!editingCell) return;
    const hp = parseInt(editValue);
    if (isNaN(hp) || hp < 0) {
      alert('Nieprawidłowa wartość HP');
      return;
    }
    await updateCoverageHP(
      editingCell.operator_id,
      editingCell.simc,
      editingCell.id_ulicy,
      editingCell.nr,
      hp
    );
    setEditingCell(null);
    loadData();
  };

  const handleCopy = async (row: any) => {
    const confirm1 = confirm(`Czy chcesz skopiować zasięgi z adresu:\n${row.miejscowosc}, ${row.ulica || ''} ${row.nr}?`);
    if (!confirm1) return;

    const newNr = prompt('Podaj nowy numer budynku:');
    if (!newNr || !newNr.trim()) return;

    const confirm2 = confirm(`Czy NA PEWNO skopiować zasięgi do numeru "${newNr}"?`);
    if (!confirm2) return;

    try {
      const result = await copyAddressCoverage(row.simc, row.id_ulicy, row.nr, newNr.trim());
      alert(`Skopiowano ${result.copied} zasięgów do numeru ${newNr}`);
      loadData();
    } catch (e: any) {
      alert('Błąd: ' + e.message);
    }
  };

  const handleSort = (column: 'simc' | 'miejscowosc' | 'ulica' | 'nr') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <span className="text-gray-400 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  // Liczba aktywnych filtrów operatorów
  const activeOperatorFiltersCount = Object.values(operatorFilters).filter(Boolean).length;

  return (
    <div className="flex gap-6">
      {/* LEWY PANEL - FILTRY */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow p-4 sticky top-4">
          <h3 className="font-bold text-gray-900 mb-4">🔍 Filtry</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SIMC</label>
              <input
                type="text"
                value={simc}
                onChange={(e) => { setSimc(e.target.value); setPage(1); }}
                placeholder="np. 0918123"
                className="w-full px-3 py-2 border rounded-lg text-gray-900"
              />
            </div>

            {/* Miejscowość z podpowiadaniem */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Miejscowość</label>
              <input
                type="text"
                value={miejscowosc}
                onChange={(e) => { setMiejscowosc(e.target.value); setPage(1); setShowMiejscowosciDropdown(true); }}
                onFocus={() => setShowMiejscowosciDropdown(true)}
                onBlur={() => setTimeout(() => setShowMiejscowosciDropdown(false), 200)}
                placeholder="np. Warszawa"
                className="w-full px-3 py-2 border rounded-lg text-gray-900"
              />
              {showMiejscowosciDropdown && miejscowosciSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {miejscowosciSuggestions.map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => {
                        setMiejscowosc(m);
                        setShowMiejscowosciDropdown(false);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 text-gray-900 text-sm"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ulica z podpowiadaniem */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ulica</label>
              <input
                type="text"
                value={ulica}
                onChange={(e) => { setUlica(e.target.value); setPage(1); setShowUliceDropdown(true); }}
                onFocus={() => setShowUliceDropdown(true)}
                onBlur={() => setTimeout(() => setShowUliceDropdown(false), 200)}
                placeholder="np. Marszałkowska"
                className="w-full px-3 py-2 border rounded-lg text-gray-900"
              />
              {showUliceDropdown && uliceSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {uliceSuggestions.map((u, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => {
                        setUlica(u);
                        setShowUliceDropdown(false);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 text-gray-900 text-sm"
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* WIDOCZNOŚĆ KOLUMN */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-bold text-gray-900 mb-3">👁️ Kolumny</h3>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 text-gray-700">
                <input type="checkbox" checked={visibleColumns.simc} onChange={() => toggleColumn('simc')} className="rounded" />
                SIMC
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input type="checkbox" checked={visibleColumns.teryt} onChange={() => toggleColumn('teryt')} className="rounded" />
                TERYT
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input type="checkbox" checked={visibleColumns.miejscowosc} onChange={() => toggleColumn('miejscowosc')} className="rounded" />
                Miejscowość
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input type="checkbox" checked={visibleColumns.ulica} onChange={() => toggleColumn('ulica')} className="rounded" />
                Ulica
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input type="checkbox" checked={visibleColumns.nr} onChange={() => toggleColumn('nr')} className="rounded" />
                Nr
              </label>
              
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-gray-600 mb-2">Operatorzy:</p>
                {loadedOperators.map(op => (
                  <label key={op.id} className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={visibleColumns[`op_${op.id}`] !== false}
                      onChange={() => toggleColumn(`op_${op.id}`)}
                      className="rounded"
                    />
                    {op.nazwa}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* INFO */}
          <div className="mt-6 pt-4 border-t text-sm text-gray-700">
            <p>Znaleziono: <strong className="text-gray-900">{total.toLocaleString()}</strong></p>
            {activeOperatorFiltersCount > 0 && (
              <p>Po filtrze: <strong className="text-gray-900">{filteredData.length}</strong></p>
            )}
            {totalPages > 1 && <p>Strona {page} z {totalPages}</p>}
          </div>
        </div>
      </div>

      {/* PRAWA STRONA - TABELA */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        {!simc && !miejscowosc && !ulica ? (
          <div className="p-8 text-center text-gray-700">
            Wpisz filtr aby wyszukać adresy
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-gray-700">
            ⏳ Ładowanie...
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-700">
            Brak wyników dla podanych filtrów
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    {visibleColumns.simc && (
                      <th onClick={() => handleSort('simc')} className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-200">
                        SIMC <SortIcon column="simc" />
                      </th>
                    )}
                    {visibleColumns.teryt && (
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase">TERYT</th>
                    )}
                    {visibleColumns.miejscowosc && (
                      <th onClick={() => handleSort('miejscowosc')} className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-200">
                        Miejscowość <SortIcon column="miejscowosc" />
                      </th>
                    )}
                    {visibleColumns.ulica && (
                      <th onClick={() => handleSort('ulica')} className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-200">
                        Ulica <SortIcon column="ulica" />
                      </th>
                    )}
                    {visibleColumns.nr && (
                      <th onClick={() => handleSort('nr')} className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-200">
                        Nr <SortIcon column="nr" />
                      </th>
                    )}
                    {loadedOperators.map(op => visibleColumns[`op_${op.id}`] !== false && (
                      <th 
                        key={op.id} 
                        onClick={() => toggleOperatorFilter(op.id)}
                        className={`px-3 py-3 text-center text-xs uppercase cursor-pointer hover:bg-gray-200 select-none ${
                          operatorFilters[op.id] 
                            ? 'font-black text-blue-700 bg-blue-100' 
                            : 'font-bold text-gray-700'
                        }`}
                        title={operatorFilters[op.id] ? `Kliknij aby wyłączyć filtr ${op.nazwa}` : `Kliknij aby pokazać tylko adresy z ${op.nazwa}`}
                      >
                        {operatorFilters[op.id] && <span className="mr-1">✓</span>}
                        {op.nazwa}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((row) => (
                    <tr key={`${row.simc}-${row.id_ulicy}-${row.nr}`} className="hover:bg-gray-50">
                      {visibleColumns.simc && <td className="px-3 py-2 text-sm font-mono text-gray-900">{row.simc}</td>}
                      {visibleColumns.teryt && <td className="px-3 py-2 text-sm font-mono text-gray-900">{row.teryt}</td>}
                      {visibleColumns.miejscowosc && <td className="px-3 py-2 text-sm text-gray-900">{row.miejscowosc}</td>}
                      {visibleColumns.ulica && <td className="px-3 py-2 text-sm text-gray-900">{row.ulica || '-'}</td>}
                      {visibleColumns.nr && <td className="px-3 py-2 text-sm font-bold text-gray-900">{row.nr}</td>}
                      {loadedOperators.map(op => visibleColumns[`op_${op.id}`] !== false && (
                        <td key={op.id} className="px-3 py-2 text-center">
                          {editingCell?.simc === row.simc && 
                           editingCell?.id_ulicy === row.id_ulicy && 
                           editingCell?.nr === row.nr &&
                           editingCell?.operator_id === op.id ? (
                            <div className="flex gap-1 justify-center">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-16 px-2 py-1 border rounded text-center text-gray-900"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateHP();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                              />
                              <button onClick={handleUpdateHP} className="px-2 py-1 bg-green-500 text-white rounded text-xs">✓</button>
                              <button onClick={() => setEditingCell(null)} className="px-2 py-1 bg-gray-400 text-white rounded text-xs">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingCell({ simc: row.simc, id_ulicy: row.id_ulicy, nr: row.nr, operator_id: op.id });
                                setEditValue(String(row[`hp_${op.id}`] || 0));
                              }}
                              className={`px-3 py-1 rounded text-sm font-bold ${
                                row[`hp_${op.id}`] ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {row[`hp_${op.id}`] || '-'}
                            </button>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => handleCopy(row)} className="text-gray-600 hover:text-blue-600 text-lg" title="Kopiuj">📋</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t flex justify-center gap-2">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-2 border rounded text-gray-700 disabled:opacity-50">««</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 border rounded text-gray-700 disabled:opacity-50">←</button>
                <span className="px-4 py-2 text-gray-700">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 border rounded text-gray-700 disabled:opacity-50">→</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-2 border rounded text-gray-700 disabled:opacity-50">»»</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

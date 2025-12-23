"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  getMiejscowosciDoGeneracji, 
  getOperatorzyDoGeneracji,
  getMiejscowoscData,
  getOperatorData,
  generateArtykulMiejscowosc,
  generateArtykulOperator
} from "../actions";
import { createArtykul } from "../actions";

type TabType = 'miejscowosc' | 'operator';

interface GeneratedArticle {
  tytul: string;
  zajawka: string;
  tresc: string;
  meta_title: string;
  meta_description: string;
  dane_snapshot: any;
}

export default function GeneratorClient({ 
  miejscowosci, 
  operatorzy,
  kategorie 
}: { 
  miejscowosci: any[];
  operatorzy: any[];
  kategorie: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('miejscowosc');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedKategoria, setSelectedKategoria] = useState('');

  // Załaduj podgląd danych
  const loadPreview = async () => {
    if (!selectedSlug) return;
    
    setLoadingPreview(true);
    setError('');
    setGeneratedArticle(null);
    
    try {
      const data = activeTab === 'miejscowosc' 
        ? await getMiejscowoscData(selectedSlug)
        : await getOperatorData(selectedSlug);
      
      setPreviewData(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoadingPreview(false);
  };

  // Generuj artykuł
  const handleGenerate = async () => {
    if (!selectedSlug) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = activeTab === 'miejscowosc'
        ? await generateArtykulMiejscowosc(selectedSlug)
        : await generateArtykulOperator(selectedSlug);
      
      if (result.success && result.article) {
        setGeneratedArticle(result.article);
      } else {
        setError(result.error || 'Błąd generowania');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Zapisz artykuł
  const handleSave = async () => {
    if (!generatedArticle || !selectedKategoria) {
      setError('Wybierz kategorię przed zapisem');
      return;
    }
    
    setSaving(true);
    
    const formData = new FormData();
    formData.set('tytul', generatedArticle.tytul);
    formData.set('slug', selectedSlug);
    formData.set('zajawka', generatedArticle.zajawka);
    formData.set('tresc', generatedArticle.tresc);
    formData.set('meta_title', generatedArticle.meta_title);
    formData.set('meta_description', generatedArticle.meta_description);
    formData.set('kategoria_id', selectedKategoria);
    formData.set('opublikowany', 'false'); // domyślnie szkic
    formData.set('tagi', '[]');
    
    // Powiązania
    if (activeTab === 'miejscowosc') {
      formData.set('miejscowosc_simc', previewData?.miejscowosc?.slug || '');
    } else {
      const op = operatorzy.find(o => o.slug === selectedSlug);
      if (op) formData.set('operator_id', op.id.toString());
    }
    
    const result = await createArtykul(formData);
    
    if (result.success) {
      router.push(`/admin/blog/${result.id}`);
    } else {
      setError(result.error || 'Błąd zapisu');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab('miejscowosc'); setSelectedSlug(''); setPreviewData(null); setGeneratedArticle(null); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'miejscowosc' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🏙️ Miejscowość
        </button>
        <button
          onClick={() => { setActiveTab('operator'); setSelectedSlug(''); setPreviewData(null); setGeneratedArticle(null); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'operator' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📡 Operator
        </button>
      </div>

      {/* Selektor */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">
          {activeTab === 'miejscowosc' ? 'Wybierz miejscowość' : 'Wybierz operatora'}
        </h2>
        
        <div className="flex gap-4">
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Wybierz --</option>
            {activeTab === 'miejscowosc' ? (
              miejscowosci.map(m => (
                <option key={m.slug} value={m.slug}>
                  {m.nazwa} ({m.powiat}) - {Number(m.budynkow).toLocaleString()} budynków
                </option>
              ))
            ) : (
              operatorzy.map(o => (
                <option key={o.slug} value={o.slug}>
                  {o.nazwa} ({o.typ}) - {o._count.oferty} ofert
                </option>
              ))
            )}
          </select>
          
          <button
            onClick={loadPreview}
            disabled={!selectedSlug || loadingPreview}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {loadingPreview ? '⏳' : '👁️ Podgląd danych'}
          </button>
        </div>
      </div>

      {/* Podgląd danych */}
      {previewData && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Dane z bazy (będą użyte w artykule)</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-auto max-h-80">
            <pre>{JSON.stringify(previewData, null, 2)}</pre>
          </div>
          
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {loading ? '⏳ Generuję artykuł...' : '🤖 Generuj artykuł z AI'}
            </button>
          </div>
        </div>
      )}

      {/* Błąd */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Wygenerowany artykuł */}
      {generatedArticle && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">✅ Wygenerowany artykuł</h2>
          
          {/* Meta */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Meta Title:</p>
            <p className="text-gray-900">{generatedArticle.meta_title}</p>
            <p className="text-sm text-blue-600 font-medium mt-2">Meta Description:</p>
            <p className="text-gray-900">{generatedArticle.meta_description}</p>
          </div>

          {/* Tytuł */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {generatedArticle.tytul}
          </h1>
          
          {/* Zajawka */}
          <p className="text-lg text-gray-600 mb-6">
            {generatedArticle.zajawka}
          </p>
          
          {/* Treść */}
          <div 
            className="prose prose-lg max-w-none border-t pt-6"
            dangerouslySetInnerHTML={{ __html: generatedArticle.tresc }}
          />
          
          {/* Zapis */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold mb-3">Zapisz artykuł</h3>
            
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategoria *
                </label>
                <select
                  value={selectedKategoria}
                  onChange={(e) => setSelectedKategoria(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Wybierz kategorię --</option>
                  {kategorie.map(k => (
                    <option key={k.id} value={k.id}>{k.nazwa}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving || !selectedKategoria}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '⏳ Zapisuję...' : '💾 Zapisz jako szkic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

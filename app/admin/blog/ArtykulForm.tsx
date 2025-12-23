// app/admin/blog/ArtykulForm.tsx
"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createArtykul, updateArtykul, deactivateArtykul, reactivateArtykul, generateSlug } from './actions';
import { generateArtykulSEO } from './seo-actions';

interface Props {
  artykul?: any;
  kategorie: any[];
}

export default function ArtykulForm({ artykul, kategorie }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [seoStatus, setSeoStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [seoMessage, setSeoMessage] = useState('');
  
  // Deaktywacja
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [deactivateError, setDeactivateError] = useState('');
  
  // Stan formularza
  const [tytul, setTytul] = useState(artykul?.tytul || '');
  const [slug, setSlug] = useState(artykul?.slug || '');
  const [zajawka, setZajawka] = useState(artykul?.zajawka || '');
  const [tresc, setTresc] = useState(artykul?.tresc || '');
  const [kategoriaId, setKategoriaId] = useState(artykul?.kategoria_id || kategorie[0]?.id);
  const [opublikowany, setOpublikowany] = useState(artykul?.opublikowany || false);
  const [thumbnailUrl, setThumbnailUrl] = useState(artykul?.thumbnail_url || '');
  const [autor, setAutor] = useState(artykul?.autor || 'Redakcja');
  const [dataPublikacji, setDataPublikacji] = useState(
    artykul?.data_publikacji 
      ? new Date(artykul.data_publikacji).toISOString().slice(0, 16)
      : ''
  );
  const [regenerateSEO, setRegenerateSEO] = useState(false);
  
  // Generuj slug z tytułu
  const handleGenerateSlug = async () => {
    if (!tytul) return;
    const newSlug = await generateSlug(tytul);
    setSlug(newSlug);
  };
  
  // Zapisz artykuł
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.set('tytul', tytul);
    formData.set('slug', slug);
    formData.set('zajawka', zajawka);
    formData.set('tresc', tresc);
    formData.set('kategoria_id', kategoriaId.toString());
    formData.set('opublikowany', opublikowany.toString());
    formData.set('thumbnail_url', thumbnailUrl);
    formData.set('autor', autor);
    formData.set('data_publikacji', dataPublikacji);
    formData.set('generate_seo', regenerateSEO.toString());
    formData.set('regenerate_seo', regenerateSEO.toString());
    
    startTransition(async () => {
      const result = artykul 
        ? await updateArtykul(artykul.id, formData)
        : await createArtykul(formData);
      
      if (result.success) {
        router.push('/admin/blog');
        router.refresh();
      } else {
        alert('Błąd: ' + result.error);
      }
    });
  };
  
  // Ręczne generowanie SEO
  const handleGenerateSEO = async () => {
    if (!artykul?.id) {
      alert('Najpierw zapisz artykuł');
      return;
    }
    
    setSeoStatus('generating');
    setSeoMessage('Generowanie SEO przez AI...');
    
    try {
      const result = await generateArtykulSEO(artykul.id);
      
      if (result.success) {
        setSeoStatus('done');
        setSeoMessage('SEO wygenerowane pomyślnie!');
      } else {
        setSeoStatus('error');
        setSeoMessage('Błąd: ' + result.error);
      }
    } catch (error: any) {
      setSeoStatus('error');
      setSeoMessage('Błąd: ' + error.message);
    }
  };
  
  // Deaktywacja
  const handleDeactivate = async () => {
    if (!artykul?.id) return;
    
    setDeactivateError('');
    
    startTransition(async () => {
      const result = await deactivateArtykul(artykul.id, redirectUrl);
      
      if (result.success) {
        router.push('/admin/blog');
        router.refresh();
      } else {
        setDeactivateError(result.error || 'Błąd deaktywacji');
      }
    });
  };
  
  // Reaktywacja
  const handleReactivate = async () => {
    if (!artykul?.id) return;
    
    startTransition(async () => {
      const result = await reactivateArtykul(artykul.id);
      
      if (result.success) {
        router.refresh();
      } else {
        alert('Błąd: ' + result.error);
      }
    });
  };
  
  // Status publikacji
  const getPublishStatus = () => {
    if (artykul?.redirect_url) return { label: '🚫 Przekierowany', color: 'bg-red-100 text-red-700' };
    if (!opublikowany) return { label: '📝 Szkic', color: 'bg-gray-100 text-gray-700' };
    if (dataPublikacji && new Date(dataPublikacji) > new Date()) {
      return { label: '⏰ Zaplanowany', color: 'bg-yellow-100 text-yellow-700' };
    }
    return { label: '✅ Opublikowany', color: 'bg-green-100 text-green-700' };
  };
  
  const status = getPublishStatus();
  const currentUrl = artykul?.kategoria 
    ? `/blog/${artykul.kategoria.slug}/${artykul.slug}`
    : null;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status i akcje */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
          {artykul?.redirect_url && (
            <span className="text-sm text-orange-600">
              → {artykul.redirect_url}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {artykul && !artykul.redirect_url && (
            <button
              type="button"
              onClick={handleGenerateSEO}
              disabled={seoStatus === 'generating'}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {seoStatus === 'generating' ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generowanie...
                </>
              ) : (
                <>🤖 Generuj SEO</>
              )}
            </button>
          )}
          
          {artykul?.redirect_url && (
            <button
              type="button"
              onClick={handleReactivate}
              disabled={isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              ♻️ Reaktywuj
            </button>
          )}
        </div>
      </div>
      
      {/* SEO Status Message */}
      {seoMessage && (
        <div className={`p-3 rounded-lg ${
          seoStatus === 'done' ? 'bg-green-100 text-green-700' :
          seoStatus === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {seoMessage}
        </div>
      )}
      
      {/* Tytuł */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tytuł *
        </label>
        <input
          type="text"
          value={tytul}
          onChange={(e) => setTytul(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Slug z przyciskiem generowania */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Slug (URL)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="nazwa-artykulu"
          />
          <button
            type="button"
            onClick={handleGenerateSlug}
            className="px-4 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200 text-sm font-medium"
            title="Generuj slug z tytułu"
          >
            🔄 Generuj
          </button>
        </div>
        {currentUrl && (
          <p className="text-xs text-gray-500 mt-1">
            URL: {currentUrl}
          </p>
        )}
      </div>
      
      {/* Kategoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategoria
        </label>
        <select
          value={kategoriaId}
          onChange={(e) => setKategoriaId(parseInt(e.target.value))}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {kategorie.map(kat => (
            <option key={kat.id} value={kat.id}>{kat.nazwa}</option>
          ))}
        </select>
      </div>
      
      {/* Zajawka */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Zajawka (opis)
        </label>
        <textarea
          value={zajawka}
          onChange={(e) => setZajawka(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Treść */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Treść (HTML)
        </label>
        <textarea
          value={tresc}
          onChange={(e) => setTresc(e.target.value)}
          rows={15}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
      </div>
      
      {/* Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL obrazka
        </label>
        <input
          type="url"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {thumbnailUrl && (
          <div className="mt-2">
            <img src={thumbnailUrl} alt="Preview" className="h-32 object-cover rounded" />
          </div>
        )}
      </div>
      
      {/* Autor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Autor
        </label>
        <input
          type="text"
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Data publikacji */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data publikacji
        </label>
        <input
          type="datetime-local"
          value={dataPublikacji}
          onChange={(e) => setDataPublikacji(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Pozostaw puste dla natychmiastowej publikacji
        </p>
      </div>
      
      {/* Opcje */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={opublikowany}
            onChange={(e) => setOpublikowany(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="font-medium">Opublikuj artykuł</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={regenerateSEO}
            onChange={(e) => setRegenerateSEO(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded"
          />
          <span className="font-medium">
            🤖 {artykul ? 'Regeneruj SEO przy zapisie' : 'Generuj SEO automatycznie'}
          </span>
        </label>
        <p className="text-sm text-gray-500 ml-6">
          AI wygeneruje unikalne: title, description, JSON-LD, FAQ, breadcrumbs
        </p>
      </div>
      
      {/* Przyciski zapisu */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Zapisywanie...' : (artykul ? 'Zapisz zmiany' : 'Utwórz artykuł')}
        </button>
        
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Anuluj
        </button>
      </div>
      
      {/* Sekcja deaktywacji - tylko dla istniejących, aktywnych artykułów */}
      {artykul && !artykul.redirect_url && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-red-700 mb-3">⚠️ Strefa niebezpieczna</h3>
          
          {!showDeactivate ? (
            <button
              type="button"
              onClick={() => setShowDeactivate(true)}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              🚫 Deaktywuj artykuł...
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
              <p className="text-sm text-red-700">
                Deaktywacja ukryje artykuł i utworzy przekierowanie 301 na podany URL.
                Artykuł NIE zostanie usunięty - można go później reaktywować.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">
                  Przekieruj na URL (wymagane) *
                </label>
                <input
                  type="text"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="/blog/kategoria/inny-artykul"
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-red-600 mt-1">
                  Podaj względny URL aktywnej strony (np. /blog/kategoria/slug)
                </p>
              </div>
              
              {deactivateError && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  ❌ {deactivateError}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={isPending || !redirectUrl}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? 'Deaktywacja...' : '🚫 Potwierdź deaktywację'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeactivate(false);
                    setRedirectUrl('');
                    setDeactivateError('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

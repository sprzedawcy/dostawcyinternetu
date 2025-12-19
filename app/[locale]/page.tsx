import SearchManager from "../../src/features/search/components/SearchManager";

export default function LocalePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-black text-black mb-2">
            Sprawdź dostępność usług
          </h1>
          <p className="text-gray-500 font-medium">
            Wybierz adres, aby zobaczyć parametry techniczne łącza
          </p>
        </header>

        {/* Główny dyrygent wyszukiwarki */}
        <SearchManager />
        
      </div>
    </main>
  );
}
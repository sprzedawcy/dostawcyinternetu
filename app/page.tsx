import SearchTest from '@/components/SearchTest';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 font-sans text-center">
        <header className="mb-12 mt-10">
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
            Znajdź ofertę internetu
          </h1>
          <p className="text-lg text-gray-600">
            Wpisz swoją miejscowość, aby sprawdzić dostępność i ceny.
          </p>
        </header>

        {/* Twoja nowa wyszukiwarka */}
        <div className="bg-white p-2 rounded-xl shadow-xl border border-gray-100">
          <SearchTest />
        </div>

        <footer className="mt-20 text-sm text-gray-400">
          Baza danych aktualizowana na bieżąco • System Provider Proba
        </footer>
      </div>
    </main>
  );
}
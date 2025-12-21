"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOffer, updateOffer, getActiveOffersForOperator } from "../actions";
import { suggestMiejscowosci } from "@/src/features/coverage/actions/coverage";

interface Props {
  offer?: any;
  operators: any[];
  mode: "create" | "edit";
}

export default function OfferForm({ offer, operators, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Custom URL
  const [nazwa, setNazwa] = useState(offer?.nazwa || "");
  const [customUrl, setCustomUrl] = useState(offer?.custom_url || "");
  
  // Status aktywności
  const [aktywna, setAktywna] = useState(offer?.aktywna ?? true);
  const [redirectUrl, setRedirectUrl] = useState(offer?.redirect_url || "");
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  const [operatorId, setOperatorId] = useState(offer?.operator_id || "");
  
  // Oferta lokalna
  const [lokalna, setLokalna] = useState(offer?.lokalna || false);
  const [lokalizacje, setLokalizacje] = useState<string[]>(
    offer?.lokalizacje?.map((l: any) => l.nazwa) || []
  );
  const [lokalizacjaQuery, setLokalizacjaQuery] = useState("");
  const [lokalizacjeSuggestions, setLokalizacjeSuggestions] = useState<string[]>([]);
  const [showLokalizacjeDropdown, setShowLokalizacjeDropdown] = useState(false);

  // Generuj przyjazny URL
  const generateFriendlyUrl = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);
  };

  // Auto-generuj URL z nazwy
  const handleGenerateUrl = () => {
    setCustomUrl(generateFriendlyUrl(nazwa));
  };

  // Pobierz aktywne oferty operatora dla redirect
  useEffect(() => {
    if (operatorId && !aktywna) {
      getActiveOffersForOperator(parseInt(operatorId), offer?.id).then(setActiveOffers);
    }
  }, [operatorId, aktywna, offer?.id]);

  // Podpowiedzi lokalizacji
  useEffect(() => {
    if (lokalizacjaQuery.length < 2) {
      setLokalizacjeSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await suggestMiejscowosci(lokalizacjaQuery);
      setLokalizacjeSuggestions(results.filter(r => !lokalizacje.includes(r)));
    }, 200);
    return () => clearTimeout(timer);
  }, [lokalizacjaQuery, lokalizacje]);

  const addLokalizacja = (nazwa: string) => {
    if (!lokalizacje.includes(nazwa)) {
      setLokalizacje([...lokalizacje, nazwa]);
    }
    setLokalizacjaQuery("");
    setShowLokalizacjeDropdown(false);
  };

  const removeLokalizacja = (nazwa: string) => {
    setLokalizacje(lokalizacje.filter(l => l !== nazwa));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Walidacja
    if (!aktywna && !redirectUrl) {
      setError("Oferta nieaktywna wymaga URL przekierowania do aktywnej oferty");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    // Dodaj lokalizacje jako JSON
    formData.set("lokalizacje_json", JSON.stringify(lokalizacje));
    formData.set("aktywna", aktywna ? "true" : "false");
    formData.set("redirect_url", redirectUrl);
    formData.set("custom_url", customUrl);

    try {
      if (mode === "create") {
        await createOffer(formData);
        router.push("/admin/oferty");
      } else {
        await updateOffer(offer.id, formData);
        router.push("/admin/oferty");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Operator */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Operator *
        </label>
        <select
          name="operator_id"
          required
          value={operatorId}
          onChange={(e) => setOperatorId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Wybierz operatora</option>
          {operators.map((op) => (
            <option key={op.id} value={op.id}>
              {op.nazwa}
            </option>
          ))}
        </select>
      </div>

      {/* Nazwa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nazwa oferty *
        </label>
        <input
          type="text"
          name="nazwa"
          required
          value={nazwa}
          onChange={(e) => setNazwa(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="np. Internet 1000 Mb/s"
        />
      </div>

      {/* Custom URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Przyjazny URL (slug)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="internet-1000-mbps"
          />
          <button
            type="button"
            onClick={handleGenerateUrl}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Generuj z nazwy
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          URL w pasku przeglądarki: /internet/{customUrl || "..."}
        </p>
      </div>

      {/* Kategoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kategoria *
        </label>
        <select
          name="kategoria"
          required
          defaultValue={offer?.kategoria || "internet"}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="internet">Internet</option>
          <option value="internet+tv">Internet + TV</option>
          <option value="internet+tv+telefon">Internet + TV + Telefon</option>
        </select>
      </div>

      {/* Prędkości */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Download (Mb/s) *
          </label>
          <input
            type="number"
            name="download_mbps"
            required
            defaultValue={offer?.download_mbps}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="1000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload (Mb/s) *
          </label>
          <input
            type="number"
            name="upload_mbps"
            required
            defaultValue={offer?.upload_mbps}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="500"
          />
        </div>
      </div>

      {/* Technologia i WiFi */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Technologia
          </label>
          <input
            type="text"
            name="technologia"
            defaultValue={offer?.technologia || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Światłowód"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WiFi w routerze
          </label>
          <select
            name="wifi"
            defaultValue={offer?.wifi || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Brak / Nie dotyczy</option>
            <option value="WIFI5">WiFi 5 (802.11ac)</option>
            <option value="WIFI6">WiFi 6 (802.11ax)</option>
            <option value="WIFI7">WiFi 7 (802.11be)</option>
          </select>
        </div>
      </div>

      {/* Typ połączenia i Priorytet */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Typ połączenia *
          </label>
          <select
            name="typ_polaczenia"
            required
            defaultValue={offer?.typ_polaczenia || "kablowe"}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="kablowe">Kablowe (światłowód, DOCSIS)</option>
            <option value="komorkowe">Komórkowe (LTE, 5G)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priorytet (0-100)
          </label>
          <input
            type="number"
            name="priorytet"
            min="0"
            max="100"
            defaultValue={offer?.priorytet || 0}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Zobowiązanie */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zobowiązanie (miesiące)
        </label>
        <input
          type="number"
          name="zobowiazanie_miesiace"
          defaultValue={offer?.zobowiazanie_miesiace || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="24"
        />
      </div>

      {/* SEKCJA: Ceny dla mieszkań (bloków) */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-4">💰 Ceny dla mieszkań (bloki, HP &gt; 2)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abonament (PLN/mies.) *
            </label>
            <input
              type="number"
              step="0.01"
              name="abonament"
              required
              defaultValue={offer?.abonament}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="99.99"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instalacja (PLN)
            </label>
            <input
              type="number"
              step="0.01"
              name="instalacja"
              defaultValue={offer?.instalacja || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aktywacja (PLN)
            </label>
            <input
              type="number"
              step="0.01"
              name="aktywacja"
              defaultValue={offer?.aktywacja || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* SEKCJA: Ceny dla domów jednorodzinnych */}
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <h3 className="font-bold text-gray-900 mb-2">🏠 Ceny dla domów jednorodzinnych (HP 1-2)</h3>
        <p className="text-sm text-gray-600 mb-4">Wypełnij jeśli ceny różnią się od standardowych</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abonament DOM (PLN/mies.)
            </label>
            <input
              type="number"
              step="0.01"
              name="abonament_dom"
              defaultValue={offer?.abonament_dom || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Jak dla mieszkań"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instalacja DOM (PLN)
            </label>
            <input
              type="number"
              step="0.01"
              name="instalacja_dom"
              defaultValue={offer?.instalacja_dom || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Jak dla mieszkań"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aktywacja DOM (PLN)
            </label>
            <input
              type="number"
              step="0.01"
              name="aktywacja_dom"
              defaultValue={offer?.aktywacja_dom || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Jak dla mieszkań"
            />
          </div>
        </div>
        
        {/* Tekst dla domów */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dodatkowy tekst dla domów
          </label>
          <textarea
            name="dom_blok_tekst"
            rows={2}
            defaultValue={offer?.dom_blok_tekst || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="np. Dla domów jednorodzinnych może być wymagana dopłata za dłuższy kabel"
          />
        </div>
      </div>

      {/* SEKCJA: Status i opcje */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">⚙️ Status i opcje</h3>
        
        {/* Wyróżniona */}
        <label className="flex items-center mb-3">
          <input
            type="checkbox"
            name="wyrozoniona"
            value="true"
            defaultChecked={offer?.wyrozoniona}
            className="mr-3 h-5 w-5 text-blue-600 rounded"
          />
          <span className="font-medium text-gray-700">⭐ Oferta wyróżniona</span>
          <span className="text-sm text-gray-500 ml-2">(pokazywana na górze listy)</span>
        </label>

        {/* Lokalna */}
        <label className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={lokalna}
            onChange={(e) => setLokalna(e.target.checked)}
            className="mr-3 h-5 w-5 text-blue-600 rounded"
          />
          <span className="font-medium text-gray-700">📍 Oferta lokalna</span>
          <span className="text-sm text-gray-500 ml-2">(tylko w wybranych miejscowościach)</span>
        </label>
        <input type="hidden" name="lokalna" value={lokalna ? "true" : "false"} />

        {/* Lokalizacje - widoczne gdy lokalna */}
        {lokalna && (
          <div className="ml-8 mt-2 mb-4 p-4 bg-white rounded-lg border">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Miejscowości objęte ofertą
            </label>
            
            {/* Lista dodanych */}
            {lokalizacje.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {lokalizacje.map((lok, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {lok}
                    <button
                      type="button"
                      onClick={() => removeLokalizacja(lok)}
                      className="ml-2 text-blue-600 hover:text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Input z podpowiedziami */}
            <div className="relative">
              <input
                type="text"
                value={lokalizacjaQuery}
                onChange={(e) => { setLokalizacjaQuery(e.target.value); setShowLokalizacjeDropdown(true); }}
                onFocus={() => setShowLokalizacjeDropdown(true)}
                onBlur={() => setTimeout(() => setShowLokalizacjeDropdown(false), 200)}
                placeholder="Wpisz nazwę miejscowości..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {showLokalizacjeDropdown && lokalizacjeSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {lokalizacjeSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => addLokalizacja(sug)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-900"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status aktywności */}
        <div className="mt-4 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status oferty
          </label>
          <div className="flex gap-4">
            <label className={`flex-1 p-4 rounded-lg border-2 cursor-pointer ${aktywna ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
              <input
                type="radio"
                checked={aktywna}
                onChange={() => setAktywna(true)}
                className="mr-2"
              />
              <span className="font-medium text-green-700">✅ Aktywna</span>
            </label>
            <label className={`flex-1 p-4 rounded-lg border-2 cursor-pointer ${!aktywna ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
              <input
                type="radio"
                checked={!aktywna}
                onChange={() => setAktywna(false)}
                className="mr-2"
              />
              <span className="font-medium text-red-700">❌ Nieaktywna</span>
            </label>
          </div>
          
          {/* URL przekierowania - tylko dla nieaktywnych */}
          {!aktywna && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <label className="block text-sm font-medium text-red-700 mb-2">
                Przekieruj na aktywną ofertę *
              </label>
              {activeOffers.length > 0 ? (
                <select
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Wybierz ofertę...</option>
                  {activeOffers.map((o) => (
                    <option key={o.id} value={`/internet/${o.custom_url || o.id}`}>
                      {o.nazwa}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    placeholder="/internet/inna-oferta"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                  <p className="text-xs text-red-600 mt-1">
                    Brak innych aktywnych ofert tego operatora. Wpisz URL ręcznie.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Opis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Opis oferty
        </label>
        <textarea
          name="opis"
          rows={6}
          defaultValue={offer?.opis || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Szczegółowy opis oferty..."
        />
      </div>

      {/* Przyciski */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? "Zapisywanie..." : mode === "create" ? "Dodaj ofertę" : "Zapisz zmiany"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GeneratorClient from "./GeneratorClient";

export default async function GeneratorPage() {
  const [miejscowosci, operatorzy, kategorie] = await Promise.all([
    // Top 50 miejscowości po liczbie budynków
    prisma.miejscowosci_seo.findMany({
      where: { budynkow: { gt: 100 } },
      select: {
        slug: true,
        nazwa: true,
        powiat: true,
        wojewodztwo: true,
        budynkow: true,
      },
      orderBy: { budynkow: 'desc' },
      take: 100
    }),
    // Aktywni operatorzy
    prisma.operator.findMany({
      where: { aktywny: true },
      select: {
        id: true,
        slug: true,
        nazwa: true,
        typ: true,
        _count: { select: { oferty: { where: { aktywna: true } } } }
      },
      orderBy: { nazwa: 'asc' }
    }),
    // Kategorie blogu
    prisma.kategoriaBlogu.findMany({
      orderBy: { kolejnosc: 'asc' }
    })
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/admin/blog" className="text-blue-600 hover:underline">
          ← Powrót do listy
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          🤖 Generator artykułów AI
        </h1>
        <p className="text-gray-500 mt-1">
          Twórz unikalne artykuły SEO oparte na prawdziwych danych z bazy
        </p>
      </div>

      {/* Info box */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-100 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Jak to działa?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Wybierz miejscowość lub operatora</li>
          <li>2. Zobacz dane z bazy (zasięgi, ceny, operatorzy)</li>
          <li>3. AI wygeneruje artykuł używając <strong>prawdziwych liczb</strong></li>
          <li>4. Przejrzyj, edytuj i opublikuj</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          Artykuły bazują na Twoich unikalnych danych - nie wyglądają jak typowe AI content.
        </p>
      </div>

      {/* Generator */}
      <GeneratorClient 
        miejscowosci={miejscowosci}
        operatorzy={operatorzy}
        kategorie={kategorie}
      />
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import ArtykulForm from "../ArtykulForm";
import Link from "next/link";

export default async function NowyArtykulPage() {
  const [kategorie, operatorzy, tagi] = await Promise.all([
    prisma.kategoriaBlogu.findMany({ orderBy: { kolejnosc: 'asc' } }),
    prisma.operator.findMany({ 
      where: { aktywny: true },
      orderBy: { nazwa: 'asc' },
      select: { id: true, nazwa: true }
    }),
    prisma.tag.findMany({ orderBy: { nazwa: 'asc' } })
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/admin/blog" className="text-blue-600 hover:underline">
          ← Powrót do listy
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nowy artykuł</h1>

      <ArtykulForm 
        kategorie={kategorie}
        operatorzy={operatorzy}
        tagi={tagi}
      />
    </div>
  );
}

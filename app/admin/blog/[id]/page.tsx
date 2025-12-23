import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ArtykulForm from "../ArtykulForm";
import Link from "next/link";

export default async function EdytujArtykulPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const artykulId = parseInt(id);

  if (isNaN(artykulId)) {
    notFound();
  }

  const [artykul, kategorie, operatorzy, tagi] = await Promise.all([
    prisma.artykul.findUnique({
      where: { id: artykulId },
      include: {
        tagi: { include: { tag: true } }
      }
    }),
    prisma.kategoriaBlogu.findMany({ orderBy: { kolejnosc: 'asc' } }),
    prisma.operator.findMany({ 
      where: { aktywny: true },
      orderBy: { nazwa: 'asc' },
      select: { id: true, nazwa: true }
    }),
    prisma.tag.findMany({ orderBy: { nazwa: 'asc' } })
  ]);

  if (!artykul) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/blog" className="text-blue-600 hover:underline">
          ← Powrót do listy
        </Link>
        {artykul.opublikowany && artykul.kategoria_id && (
          <a 
            href={`/blog/${artykul.kategoria_id}/${artykul.slug}`}
            target="_blank"
            className="text-gray-500 hover:text-blue-600"
          >
            Zobacz na stronie →
          </a>
        )}
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edytuj artykuł</h1>

      <ArtykulForm 
        artykul={artykul}
        kategorie={kategorie}
        operatorzy={operatorzy}
        tagi={tagi}
      />
    </div>
  );
}

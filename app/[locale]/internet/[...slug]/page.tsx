import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MiejscowoscPage from "./MiejscowoscPage";
import UlicaPage from "./UlicaPage";
import AdresPage from "./AdresPage";

interface Props {
  params: Promise<{ slug: string[]; locale: string }>;
}

export default async function InternetCatchAllPage({ params }: Props) {
  const { slug, locale } = await params;

  // 1 segment = miejscowość (/internet/warszawa)
  if (slug.length === 1) {
    return <MiejscowoscPage slug={slug[0]} locale={locale} />;
  }

  // 2 segmenty = ulica (/internet/warszawa/marszalkowska)
  if (slug.length === 2) {
    return (
      <UlicaPage 
        miejscowoscSlug={slug[0]} 
        ulicaSlug={slug[1]} 
        locale={locale} 
      />
    );
  }

  // 3 segmenty = adres (/internet/warszawa/marszalkowska/15)
  if (slug.length === 3) {
    return (
      <AdresPage 
        miejscowoscSlug={slug[0]} 
        ulicaSlug={slug[1]} 
        numer={slug[2]}
        locale={locale} 
      />
    );
  }

  // Inne = 404
  notFound();
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  // Miejscowość
  if (slug.length === 1) {
    const data = await prisma.polska.findFirst({
      where: { slug: slug[0] },
      select: { miejscowosc: true }
    });

    if (!data) return { title: 'Nie znaleziono' };

    return {
      title: `Internet ${data.miejscowosc} - Porównaj oferty | DostawcyInternetu.pl`,
      description: `Sprawdź oferty internetu w ${data.miejscowosc}. Porównaj ceny i prędkości.`
    };
  }

  // Ulica
  if (slug.length === 2) {
    const data = await prisma.polska.findFirst({
      where: { slug: slug[0] },
      select: { miejscowosc: true }
    });

    if (!data) return { title: 'Nie znaleziono' };

    const ulica = slug[1].replace(/-/g, ' ');

    return {
      title: `Internet ${ulica}, ${data.miejscowosc} | DostawcyInternetu.pl`,
      description: `Oferty internetu na ${ulica} w ${data.miejscowosc}. Sprawdź dostępność.`
    };
  }

  // Adres
  if (slug.length === 3) {
    const data = await prisma.polska.findFirst({
      where: { slug: slug[0] },
      select: { miejscowosc: true }
    });

    if (!data) return { title: 'Nie znaleziono' };

    const ulica = slug[1].replace(/-/g, ' ');

    return {
      title: `Internet ${ulica} ${slug[2]}, ${data.miejscowosc} | DostawcyInternetu.pl`,
      description: `Dostępne oferty internetu pod adresem ${ulica} ${slug[2]}, ${data.miejscowosc}.`
    };
  }

  return { title: 'Strona nie znaleziona' };
}
/**
 * Import artykułów z Octoparse JSON do bazy danych
 * 
 * Użycie:
 * 1. Skopiuj Blog_-_Dostawcy_Internetu.json do folderu projektu
 * 2. node scripts/import-blog.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Mapowanie kategorii na ID
const KATEGORIE_MAP = {
  'wiedza': 1,
  'swiatlowod': 2,
  'baza-wiedzy': 3,
  'lte-5g': 4,
  'wifi': 5,
  'biznes': 6,
  'news': 7,
};

// Mapowanie polskich miesięcy
const MIESIACE = {
  'sty': '01', 'lut': '02', 'mar': '03', 'kwi': '04',
  'maj': '05', 'cze': '06', 'lip': '07', 'sie': '08',
  'wrz': '09', 'paź': '10', 'paz': '10', 'lis': '11', 'gru': '12'
};

function parseDate(dateStr) {
  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!match) return null;
  
  const day = match[1].padStart(2, '0');
  const monthKey = match[2].toLowerCase().substring(0, 3);
  const month = MIESIACE[monthKey] || '01';
  const year = match[3];
  
  return new Date(`${year}-${month}-${day}`);
}

function extractSlugAndCategory(url) {
  // Zachowujemy DOKŁADNIE oryginalny slug i kategorię z URL
  const match = url.match(/\/blog\/([^\/]+)\/([^\/]+)\/?$/);
  if (!match) return null;
  
  return {
    kategoria: match[1],  // np. "baza-wiedzy"
    slug: match[2]        // np. "jak-podlaczyc-kabel-antenowy-do-gniazdka"
  };
}

function cleanHTML(html) {
  if (!html) return '';
  
  let cleaned = html
    // Usuń początkowe śmieci (tekst przed pierwszym tagiem)
    .replace(/^[^<]*/, '')
    
    // === USUWANIE STYLÓW INLINE ===
    // Usuń atrybuty style
    .replace(/\s*style="[^"]*"/gi, '')
    // Usuń atrybuty align
    .replace(/\s*align="[^"]*"/gi, '')
    // Usuń atrybuty dir
    .replace(/\s*dir="[^"]*"/gi, '')
    // Usuń atrybuty class (będziemy używać prose)
    .replace(/\s*class="[^"]*"/gi, '')
    
    // === ZACHOWAJ LINKI (href) ===
    // Linki <a href="..."> pozostają nienaruszone
    
    // === CZYSZCZENIE STRUKTURY ===
    // Usuń puste tagi <span></span>
    .replace(/<span>\s*<\/span>/gi, '')
    // Zamień <span>tekst</span> na sam tekst (jeśli span nie ma atrybutów)
    .replace(/<span>([^<]*)<\/span>/gi, '$1')
    // Usuń zagnieżdżone spany
    .replace(/<span><span>([^<]*)<\/span><\/span>/gi, '$1')
    
    // Usuń puste paragrafy
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
    
    // Usuń puste divy
    .replace(/<div>\s*<\/div>/gi, '')
    .replace(/<div>\s*<br\s*\/?>\s*<\/div>/gi, '')
    
    // === NORMALIZACJA ===
    // Zamień wielokrotne <br> na jeden
    .replace(/(<br\s*\/?>\s*){2,}/gi, '<br>')
    
    // Usuń <br> na końcu paragrafów
    .replace(/<br\s*\/?>\s*<\/p>/gi, '</p>')
    
    // Usuń nadmiarowe białe znaki (ale zachowaj pojedyncze spacje)
    .replace(/\n\s*\n/g, '\n')
    .replace(/\s{2,}/g, ' ')
    
    // Napraw spacje wokół tagów
    .replace(/>\s+</g, '>\n<')
    
    // Usuń puste atrybuty
    .replace(/\s+>/g, '>')
    .replace(/<\s+/g, '<')
    
    .trim();
  
  // Jeśli zaczyna się od H1, zamień na H2 (H1 będzie tytuł strony)
  cleaned = cleaned.replace(/^<h1([^>]*)>([\s\S]*?)<\/h1>/i, '<h2$1>$2</h2>');
  
  return cleaned;
}

function extractZajawka(html, maxLength = 250) {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (text.length <= maxLength) return text;
  
  // Utnij na końcu zdania jeśli możliwe
  const truncated = text.substring(0, maxLength);
  const lastDot = truncated.lastIndexOf('.');
  
  if (lastDot > maxLength * 0.6) {
    return truncated.substring(0, lastDot + 1);
  }
  
  return truncated.replace(/\s+\S*$/, '') + '...';
}

async function importArticles() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Import artykułów z Octoparse');
  console.log('  (zachowuje oryginalne URL-e i linki)');
  console.log('═══════════════════════════════════════════════\n');
  
  // Wczytaj JSON
  const jsonPath = path.join(process.cwd(), 'Blog_-_Dostawcy_Internetu.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Nie znaleziono pliku: ${jsonPath}`);
    console.log('Skopiuj plik JSON do głównego folderu projektu.');
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const articles = JSON.parse(rawData);
  
  console.log(`📄 Wczytano ${articles.length} artykułów\n`);
  
  // Sprawdź kategorie w bazie
  const kategorie = await prisma.kategoriaBlogu.findMany();
  console.log(`📁 Kategorie w bazie: ${kategorie.map(k => `${k.slug} (ID:${k.id})`).join(', ')}\n`);
  
  // Utwórz mapę kategorii z bazy
  const kategorieFromDB = {};
  kategorie.forEach(k => {
    kategorieFromDB[k.slug] = k.id;
  });
  
  let success = 0;
  let skipped = 0;
  let errors = 0;
  let newCategories = new Set();
  
  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    
    const titleShort = art.Title.length > 50 ? art.Title.substring(0, 50) + '...' : art.Title;
    console.log(`[${i + 1}/${articles.length}] ${titleShort}`);
    
    // Wyciągnij ORYGINALNY slug i kategorię z URL
    const urlData = extractSlugAndCategory(art.Title_URL);
    if (!urlData) {
      console.log(`   ⚠️ Nie można sparsować URL: ${art.Title_URL}`);
      skipped++;
      continue;
    }
    
    console.log(`   📍 /${urlData.kategoria}/${urlData.slug}`);
    
    // Znajdź lub zanotuj brakującą kategorię
    let kategoriaId = kategorieFromDB[urlData.kategoria] || KATEGORIE_MAP[urlData.kategoria];
    
    if (!kategoriaId) {
      console.log(`   ⚠️ Nieznana kategoria: ${urlData.kategoria} - używam domyślnej (wiedza)`);
      newCategories.add(urlData.kategoria);
      kategoriaId = 1; // domyślna kategoria
    }
    
    const dataPublikacji = parseDate(art.View);
    const tresc = cleanHTML(art.Field);
    const zajawka = extractZajawka(tresc);
    
    // Sprawdź czy istnieje
    const existing = await prisma.artykul.findFirst({
      where: {
        slug: urlData.slug,
        kategoria_id: kategoriaId
      }
    });
    
    if (existing) {
      console.log(`   ⏭️ Już istnieje (ID: ${existing.id})`);
      skipped++;
      continue;
    }
    
    try {
      const created = await prisma.artykul.create({
        data: {
          tytul: art.Title,
          slug: urlData.slug,
          zajawka: zajawka,
          tresc: tresc,
          kategoria_id: kategoriaId,
          thumbnail_url: art.Image || null,
          meta_title: art.Title.substring(0, 70),
          meta_description: zajawka.substring(0, 160),
          autor: 'Redakcja',
          opublikowany: true,
          data_publikacji: dataPublikacji || new Date(),
        }
      });
      
      console.log(`   ✅ Utworzono (ID: ${created.id})`);
      success++;
      
    } catch (error) {
      console.log(`   ❌ Błąd: ${error.message}`);
      errors++;
    }
  }
  
  // Podsumowanie
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  ✅ Zaimportowano: ${success}`);
  console.log(`  ⏭️ Pominięto: ${skipped}`);
  console.log(`  ❌ Błędy: ${errors}`);
  
  if (newCategories.size > 0) {
    console.log(`\n  ⚠️ Nieznane kategorie (użyto domyślnej):`);
    newCategories.forEach(cat => console.log(`     - ${cat}`));
    console.log(`\n  Dodaj je do bazy jeśli chcesz poprawić przypisania.`);
  }
  
  console.log('═══════════════════════════════════════════════');
  
  await prisma.$disconnect();
}

importArticles().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

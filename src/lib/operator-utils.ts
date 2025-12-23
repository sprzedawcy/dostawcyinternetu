/**
 * Czyści nazwę operatora do wyświetlenia
 * 
 * Przykłady:
 * "EAST AND WEST" SP. Z O.O. → East And West sp. z o.o.
 * "FALCONN" TOMASZ FALKOWSKI → Falconn
 * F.H.U. "NETKOM" JAN KOWALSKI → Netkom
 * SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ → sp. z o.o.
 */
export function cleanOperatorName(name: string): string {
  if (!name) return '';
  
  let cleaned = name.trim();
  
  // 1. Wyciągnij nazwę z cudzysłowów jeśli istnieje
  const quotedMatch = cleaned.match(/"([^"]+)"/);
  if (quotedMatch) {
    cleaned = quotedMatch[1];
  }
  
  // 2. Usuń F.H.U., FHU, P.H.U., PHU na początku
  cleaned = cleaned.replace(/^(F\.?H\.?U\.?|P\.?H\.?U\.?|P\.?P\.?H\.?U\.?)\s*/i, '');
  
  // 3. Usuń imiona i nazwiska (2-3 słowa z wielkiej litery na końcu)
  // Wzorzec: IMIĘ NAZWISKO lub IMIĘ DRUGIE NAZWISKO
  cleaned = cleaned.replace(/\s+[A-ZŁŚŻŹĆŃ][a-złśżźćńęą]+\s+[A-ZŁŚŻŹĆŃ][a-złśżźćńęą]+(\s+[A-ZŁŚŻŹĆŃ][a-złśżźćńęą]+)?$/i, '');
  cleaned = cleaned.replace(/\s+[A-ZŁŚŻŹĆŃ]+\s+[A-ZŁŚŻŹĆŃ]+(\s+[A-ZŁŚŻŹĆŃ]+)?$/i, ''); // WIELKIE LITERY
  
  // 4. Skróć formy prawne
  cleaned = cleaned.replace(/SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ/gi, 'sp. z o.o.');
  cleaned = cleaned.replace(/SP\.\s*Z\s*O\.\s*O\./gi, 'sp. z o.o.');
  cleaned = cleaned.replace(/SPÓŁKA JAWNA/gi, 's.j.');
  cleaned = cleaned.replace(/SPÓŁKA KOMANDYTOWA/gi, 's.k.');
  cleaned = cleaned.replace(/SPÓŁKA CYWILNA/gi, 's.c.');
  cleaned = cleaned.replace(/S\.?\s*C\.\s*$/gi, 's.c.');
  cleaned = cleaned.replace(/S\.?\s*J\.\s*$/gi, 's.j.');
  cleaned = cleaned.replace(/S\.?\s*K\.\s*$/gi, 's.k.');
  cleaned = cleaned.replace(/SP\.?\s*Z\.?\s*O\.?\s*O\.?/gi, 'sp. z o.o.');
  cleaned = cleaned.replace(/SPZOO/gi, 'sp. z o.o.');
  
  // 5. Usuń "I WSPÓLNICY", "I WSPÓLNIK"
  cleaned = cleaned.replace(/\s+I\s+WSPÓLNI(CY|K)\s*/gi, ' ');
  
  // 6. Popraw kapitalizację (Title Case)
  cleaned = cleaned
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Zachowaj skróty małymi
      if (['sp.', 'z', 'o.o.', 's.j.', 's.c.', 's.k.', 'i'].includes(word)) {
        return word;
      }
      // Pierwsza litera wielka
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
  
  // 7. Wyczyść wielokrotne spacje i końcowe przecinki/kropki
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/[,.\s]+$/, '');
  
  // 8. Jeśli zostało samo "sp. z o.o." lub podobne, użyj oryginalnej nazwy
  if (cleaned.length < 3 || /^(sp\.|s\.|z|o\.o\.)/.test(cleaned.toLowerCase())) {
    // Fallback - weź pierwszą część oryginalnej nazwy
    const firstPart = name.split(/\s+(SP|SPÓŁKA|S\.)/i)[0];
    if (firstPart && firstPart.length > 2) {
      cleaned = firstPart.trim().toLowerCase();
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
  
  return cleaned;
}

/**
 * Grupuje operatorów według typu
 */
export function groupOperatorsByType(operators: any[]) {
  return {
    krajowi: operators.filter(o => o.typ === 'krajowy'),
    regionalni: operators.filter(o => o.typ === 'regionalny'),
    lokalni: operators.filter(o => o.typ === 'lokalny' || !o.typ),
  };
}

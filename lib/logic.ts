// Funkcja sprawdzająca typ budynku na podstawie Twoich danych
export function sprawdzTypBudynku(budynek: any) {
  // Sumujemy HP z Twoich kolumn (upc, timo, netia, opl)
  const sumaHP = (budynek.upc_hp || 0) + 
                 (budynek.timo_hp || 0) + 
                 (budynek.netia_hp || 0) + 
                 (budynek.opl_hp || 0);

  // Zwracamy informację: czy to domek?
  if (sumaHP > 0 && sumaHP <= 2) {
    return {
      typ: "DOMEK",
      info: "Możliwa dodatkowa opłata za przyłącze w budownictwie jednorodzinnym",
      klasa: "bg-orange-500" // do kolorowania ramki we froncie
    };
  }

  return {
    typ: "BLOK",
    info: "Standardowa instalacja w bloku",
    klasa: "bg-blue-500"
  };
}
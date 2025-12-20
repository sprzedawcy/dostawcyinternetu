-- Nowe pola cenowe dla domów
ALTER TABLE oferty ADD COLUMN IF NOT EXISTS abonament_dom DECIMAL(10,2);
ALTER TABLE oferty ADD COLUMN IF NOT EXISTS instalacja_dom DECIMAL(10,2);
ALTER TABLE oferty ADD COLUMN IF NOT EXISTS aktywacja_dom DECIMAL(10,2);

-- WiFi
ALTER TABLE oferty ADD COLUMN IF NOT EXISTS wifi VARCHAR(10);

-- Usuń oferta_specjalna (opcjonalnie, można zostawić)
-- ALTER TABLE oferty DROP COLUMN IF EXISTS oferta_specjalna;

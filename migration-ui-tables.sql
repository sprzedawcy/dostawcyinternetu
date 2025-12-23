-- =====================================================
-- MIGRACJA: Tabele UI Content i UI Config
-- DostawcyInternetu.pl
-- Data: 2024-12-24
-- =====================================================

-- =====================================================
-- 1. TABELA ui_content - teksty wielojęzyczne
-- =====================================================
CREATE TABLE IF NOT EXISTS ui_content (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value_pl TEXT NOT NULL,
  value_en TEXT,
  value_ua TEXT,
  category VARCHAR(50),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_ui_content_category ON ui_content(category);
CREATE INDEX IF NOT EXISTS idx_ui_content_key ON ui_content(key);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_ui_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ui_content_updated ON ui_content;
CREATE TRIGGER trigger_ui_content_updated
  BEFORE UPDATE ON ui_content
  FOR EACH ROW
  EXECUTE FUNCTION update_ui_content_timestamp();

-- =====================================================
-- 2. DANE POCZĄTKOWE - ui_content
-- =====================================================

-- Brand
INSERT INTO ui_content (key, value_pl, value_en, value_ua, category, description) VALUES
('brand.name', 'DostawcyInternetu.pl', 'DostawcyInternetu.pl', 'DostawcyInternetu.pl', 'brand', 'Nazwa serwisu'),
('brand.tagline', 'Porównaj oferty internetu w Polsce', 'Compare internet offers in Poland', 'Порівняйте пропозиції інтернету в Польщі', 'brand', 'Slogan'),
('brand.phone', '532 274 808', '532 274 808', '532 274 808', 'brand', 'Numer telefonu'),
('brand.email', 'kontakt@dostawcyinternetu.pl', 'kontakt@dostawcyinternetu.pl', 'kontakt@dostawcyinternetu.pl', 'brand', 'Email kontaktowy')
ON CONFLICT (key) DO NOTHING;

-- Szukajka
INSERT INTO ui_content (key, value_pl, value_en, value_ua, category, description) VALUES
('search.title', 'Sprawdź dostępność internetu', 'Check internet availability', 'Перевірте доступність інтернету', 'search', 'Tytuł szukajki'),
('search.city_label', 'Miejscowość *', 'City *', 'Місто *', 'search', 'Label pola miasto'),
('search.city_placeholder', 'Wpisz nazwę...', 'Enter city name...', 'Введіть назву...', 'search', 'Placeholder miasto'),
('search.street_label', 'Ulica', 'Street', 'Вулиця', 'search', 'Label pola ulica'),
('search.street_placeholder', 'Wpisz ulicę...', 'Enter street...', 'Введіть вулицю...', 'search', 'Placeholder ulica'),
('search.number_label', 'Numer', 'Number', 'Номер', 'search', 'Label pola numer'),
('search.number_placeholder', 'Wpisz numer...', 'Enter number...', 'Введіть номер...', 'search', 'Placeholder numer'),
('search.button', 'SPRAWDŹ OFERTY', 'CHECK OFFERS', 'ПЕРЕВІРИТИ ПРОПОЗИЦІЇ', 'search', 'Przycisk szukaj'),
('search.loading', 'Przekierowuję...', 'Redirecting...', 'Перенаправлення...', 'search', 'Tekst ładowania')
ON CONFLICT (key) DO NOTHING;

-- Oferty
INSERT INTO ui_content (key, value_pl, value_en, value_ua, category, description) VALUES
('offer.order_now', 'Zamów teraz', 'Order now', 'Замовити зараз', 'offers', 'Przycisk zamów (z adresem)'),
('offer.check_availability', 'Sprawdź dostępność', 'Check availability', 'Перевірити доступність', 'offers', 'Przycisk sprawdź (bez adresu)'),
('offer.call_us', 'lub zadzwoń', 'or call us', 'або зателефонуйте', 'offers', 'Tekst przed telefonem'),
('offer.per_month', '/miesiąc', '/month', '/місяць', 'offers', 'Oznaczenie ceny'),
('offer.download', 'pobieranie', 'download', 'завантаження', 'offers', 'Label prędkości'),
('offer.upload', 'wysyłanie', 'upload', 'відправка', 'offers', 'Label prędkości'),
('offer.technology', 'technologia', 'technology', 'технологія', 'offers', 'Label technologii'),
('offer.contract', 'umowa', 'contract', 'контракт', 'offers', 'Label umowy'),
('offer.no_results', 'Brak ofert spełniających kryteria', 'No offers matching criteria', 'Немає пропозицій, що відповідають критеріям', 'offers', 'Brak wyników'),
('offer.filter_all', 'Wszyscy operatorzy', 'All operators', 'Всі оператори', 'offers', 'Filtr domyślny'),
('offer.sort_recommended', 'Rekomendowane', 'Recommended', 'Рекомендовані', 'offers', 'Sortowanie'),
('offer.sort_price_asc', 'Cena: od najniższej', 'Price: lowest first', 'Ціна: від найнижчої', 'offers', 'Sortowanie'),
('offer.sort_price_desc', 'Cena: od najwyższej', 'Price: highest first', 'Ціна: від найвищої', 'offers', 'Sortowanie'),
('offer.sort_speed_desc', 'Prędkość: od najszybszej', 'Speed: fastest first', 'Швидкість: від найшвидшої', 'offers', 'Sortowanie')
ON CONFLICT (key) DO NOTHING;

-- Badges
INSERT INTO ui_content (key, value_pl, value_en, value_ua, category, description) VALUES
('badge.featured', 'WYRÓŻNIONA', 'FEATURED', 'РЕКОМЕНДОВАНА', 'badges', 'Badge wyróżniona'),
('badge.local', 'LOKALNA', 'LOCAL', 'ЛОКАЛЬНА', 'badges', 'Badge lokalna'),
('badge.mobile', 'MOBILNA', 'MOBILE', 'МОБІЛЬНА', 'badges', 'Badge mobilna'),
('badge.cable', 'KABLOWA', 'CABLE', 'КАБЕЛЬНА', 'badges', 'Badge kablowa'),
('badge.available', 'DOSTĘPNA', 'AVAILABLE', 'ДОСТУПНА', 'badges', 'Badge dostępna')
ON CONFLICT (key) DO NOTHING;

-- Modal
INSERT INTO ui_content (key, value_pl, value_en, value_ua, category, description) VALUES
('modal.title', 'Podaj dokładny adres', 'Enter exact address', 'Введіть точну адресу', 'modal', 'Tytuł modala'),
('modal.title_number', 'Podaj numer budynku', 'Enter building number', 'Введіть номер будинку', 'modal', 'Tytuł modala (tylko numer)'),
('modal.subtitle', 'Sprawdzimy dostępność oferty', 'We will check offer availability', 'Ми перевіримо доступність пропозиції', 'modal', 'Podtytuł'),
('modal.city_label', 'Miejscowość', 'City', 'Місто', 'modal', 'Label'),
('modal.street_label', 'Ulica', 'Street', 'Вулиця', 'modal', 'Label'),
('modal.number_label', 'Numer budynku', 'Building number', 'Номер будинку', 'modal', 'Label'),
('modal.street_placeholder', 'Wpisz nazwę ulicy...', 'Enter street name...', 'Введіть назву вулиці...', 'modal', 'Placeholder'),
('modal.number_placeholder', 'Wpisz numer...', 'Enter number...', 'Введіть номер...', 'modal', 'Placeholder'),
('modal.select_street_first', 'Najpierw wybierz ulicę...', 'Select street first...', 'Спочатку виберіть вулицю...', 'modal', 'Placeholder disabled'),
('modal.confirm_button', 'Sprawdź dostępność', 'Check availability', 'Перевірити доступність', 'modal', 'Przycisk'),
('modal.footer_note', 'Podanie adresu pozwoli zweryfikować dostępność usług', 'Providing address allows us to verify service availability', 'Надання адреси дозволить перевірити доступність послуг', 'modal', 'Stopka')
ON CONFLICT (key) DO NOTHING;

-- SEO templates
INSERT INTO ui_content (key, value_pl, value_en, value_ua, category, description) VALUES
('seo.title_city', 'Internet {miasto} - Porównaj oferty | DostawcyInternetu.pl', 'Internet {city} - Compare offers | DostawcyInternetu.pl', 'Інтернет {місто} - Порівняти пропозиції | DostawcyInternetu.pl', 'seo', 'Meta title miasto'),
('seo.desc_city', 'Sprawdź oferty internetu w {miasto}. Porównaj ceny i prędkości.', 'Check internet offers in {city}. Compare prices and speeds.', 'Перевірте пропозиції інтернету в {місто}. Порівняйте ціни та швидкості.', 'seo', 'Meta description miasto'),
('seo.title_street', 'Internet {ulica}, {miasto} | DostawcyInternetu.pl', 'Internet {street}, {city} | DostawcyInternetu.pl', 'Інтернет {вулиця}, {місто} | DostawcyInternetu.pl', 'seo', 'Meta title ulica'),
('seo.desc_street', 'Oferty internetu na {ulica} w {miasto}. Sprawdź dostępność.', 'Internet offers on {street} in {city}. Check availability.', 'Пропозиції інтернету на {вулиця} в {місто}. Перевірте доступність.', 'seo', 'Meta description ulica'),
('seo.title_address', 'Internet {ulica} {numer}, {miasto} | DostawcyInternetu.pl', 'Internet {street} {number}, {city} | DostawcyInternetu.pl', 'Інтернет {вулиця} {номер}, {місто} | DostawcyInternetu.pl', 'seo', 'Meta title adres'),
('seo.desc_address', 'Dostępne oferty internetu pod adresem {ulica} {numer}, {miasto}.', 'Available internet offers at {street} {number}, {city}.', 'Доступні пропозиції інтернету за адресою {вулиця} {номер}, {місто}.', 'seo', 'Meta description adres')
ON CONFLICT (key) DO NOTHING;

-- Strony adresowe
INSERT INTO ui_content (key, value_pl, value_en, value_ua, category, description) VALUES
('page.breadcrumb_home', 'Strona główna', 'Home', 'Головна', 'pages', 'Breadcrumb'),
('page.h1_city', 'Internet w {miasto}', 'Internet in {city}', 'Інтернет в {місто}', 'pages', 'H1 miasto'),
('page.h1_street', 'Internet: {ulica}, {miasto}', 'Internet: {street}, {city}', 'Інтернет: {вулиця}, {місто}', 'pages', 'H1 ulica'),
('page.h1_address', 'Internet: {adres}', 'Internet: {address}', 'Інтернет: {адреса}', 'pages', 'H1 adres'),
('page.coverage_ok', '{count} operatorów kablowych', '{count} cable operators', '{count} кабельних операторів', 'pages', 'Badge zasięgu OK'),
('page.coverage_none', 'Brak zasięgu kablowego', 'No cable coverage', 'Немає кабельного покриття', 'pages', 'Badge brak zasięgu'),
('page.address_verify', 'Adres do weryfikacji', 'Address requires verification', 'Адреса потребує перевірки', 'pages', 'Badge weryfikacji'),
('page.offers_found', 'Znaleźliśmy {count} ofert internetu kablowego dostępnych pod tym adresem.', 'We found {count} cable internet offers available at this address.', 'Ми знайшли {count} пропозицій кабельного інтернету, доступних за цією адресою.', 'pages', 'Info oferty'),
('page.mobile_only', 'Poniżej znajdziesz oferty internetu mobilnego dostępne w Twojej lokalizacji.', 'Below you will find mobile internet offers available in your location.', 'Нижче ви знайдете пропозиції мобільного інтернету, доступні у вашому місці.', 'pages', 'Info mobile'),
('page.change_number', '← Zmień numer budynku', '← Change building number', '← Змінити номер будинку', 'pages', 'Link'),
('page.change_address', 'Zmień adres', 'Change address', 'Змінити адресу', 'pages', 'Link')
ON CONFLICT (key) DO NOTHING;

-- KPO/FERC komunikaty
INSERT INTO ui_content (key, value_pl, value_en, value_ua, category, description) VALUES
('kpo.no_coverage_title', 'Brak internetu kablowego pod tym adresem', 'No cable internet at this address', 'Немає кабельного інтернету за цією адресою', 'kpo', 'Tytuł'),
('kpo.no_coverage_text', 'Żaden z operatorów kablowych nie ma jeszcze zasięgu pod adresem {adres}. Poniżej znajdziesz oferty internetu mobilnego (LTE/5G), które są dostępne w każdej lokalizacji.', 'None of the cable operators have coverage at {address} yet. Below you will find mobile internet offers (LTE/5G) available everywhere.', 'Жоден з кабельних операторів ще не має покриття за адресою {адреса}. Нижче ви знайдете пропозиції мобільного інтернету (LTE/5G), доступні скрізь.', 'kpo', 'Tekst'),
('kpo.call_button', 'Zadzwoń - sprawdzimy dostępność', 'Call us - we will check availability', 'Зателефонуйте - ми перевіримо доступність', 'kpo', 'Przycisk'),
('kpo.verify_title', 'Adres wymaga weryfikacji', 'Address requires verification', 'Адреса потребує перевірки', 'kpo', 'Tytuł'),
('kpo.verify_text', 'Adres {adres} nie został jeszcze zweryfikowany w naszej bazie. Skontaktuj się z nami, aby sprawdzić dostępność.', 'Address {address} has not been verified in our database yet. Contact us to check availability.', 'Адреса {адреса} ще не підтверджена в нашій базі даних. Зв''яжіться з нами, щоб перевірити доступність.', 'kpo', 'Tekst')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 3. TABELA ui_config - konfiguracja
-- =====================================================
CREATE TABLE IF NOT EXISTS ui_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_ui_config_updated ON ui_config;
CREATE TRIGGER trigger_ui_config_updated
  BEFORE UPDATE ON ui_config
  FOR EACH ROW
  EXECUTE FUNCTION update_ui_content_timestamp();

-- =====================================================
-- 4. DANE POCZĄTKOWE - ui_config
-- =====================================================
INSERT INTO ui_config (key, value, description) VALUES
-- Kontakt
('contact.phone', '"532274808"', 'Numer telefonu (bez formatowania)'),
('contact.phone_formatted', '"532 274 808"', 'Numer telefonu (formatowany)'),
('contact.email', '"kontakt@dostawcyinternetu.pl"', 'Email kontaktowy'),

-- Oferty
('offers.items_per_page', '12', 'Ofert na stronie'),
('offers.sort_options', '["default","price-asc","price-desc","speed-desc"]', 'Dostępne sortowania'),
('offers.default_sort', '"default"', 'Domyślne sortowanie'),

-- Szukajka
('search.debounce_ms', '300', 'Debounce wyszukiwania (ms)'),
('search.min_chars_city', '2', 'Min znaków dla miasta'),
('search.min_chars_street', '2', 'Min znaków dla ulicy'),
('search.min_chars_number', '1', 'Min znaków dla numeru'),
('search.max_results', '20', 'Max wyników autocomplete'),

-- Features toggles
('features.kpo_enabled', 'true', 'Formularz KPO włączony'),
('features.map_enabled', 'false', 'Mapa włączona'),
('features.reviews_enabled', 'true', 'Opinie włączone'),
('features.blog_enabled', 'false', 'Blog włączony'),

-- SEO
('seo.default_robots', '"index, follow"', 'Domyślne robots'),
('seo.sitemap_limit', '50000', 'Max URL w sitemap'),

-- Cache (w sekundach)
('cache.offers_ttl', '300', 'TTL cache ofert (5 min)'),
('cache.coverage_ttl', '3600', 'TTL cache zasięgu (1h)'),
('cache.content_ttl', '86400', 'TTL cache treści (24h)')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 5. POTWIERDZENIE
-- =====================================================
SELECT 'Tabele ui_content i ui_config utworzone' AS status,
       (SELECT COUNT(*) FROM ui_content) AS content_rows,
       (SELECT COUNT(*) FROM ui_config) AS config_rows;

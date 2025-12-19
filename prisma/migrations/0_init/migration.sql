-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "search_miejscowosci" (
    "id" SERIAL NOT NULL,
    "simc" VARCHAR(7),
    "nazwa" TEXT NOT NULL,
    "waga" INTEGER NOT NULL DEFAULT 0,
    "teryt" VARCHAR(7),
    "nazwa_normalized" TEXT NOT NULL,
    "powiat_label" TEXT,

    CONSTRAINT "search_miejscowosci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_ulice" (
    "id" SERIAL NOT NULL,
    "id_ulicy" VARCHAR(10) NOT NULL,
    "ulica" TEXT NOT NULL,
    "ulica_norm" TEXT NOT NULL,
    "miasto_nazwa" TEXT NOT NULL,
    "teryt_powiat" VARCHAR(4) NOT NULL,
    "simc" VARCHAR(7),

    CONSTRAINT "search_ulice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_numery" (
    "id" SERIAL NOT NULL,
    "id_ulicy" VARCHAR(10) NOT NULL,
    "nr" TEXT NOT NULL,
    "nr_int" INTEGER,
    "teryt" VARCHAR(7),
    "simc" VARCHAR(7),
    "miejscowosc" TEXT,
    "x" TEXT,
    "y" TEXT,

    CONSTRAINT "search_numery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bts" (
    "coto" TEXT,
    "ISP" TEXT,
    "Nr Decyzji" TEXT,
    "Rodzaj decyzji" TEXT,
    "Data ważności" TEXT,
    "Dł" TEXT,
    "Szer" TEXT,
    "City" TEXT,
    "Lokalizacja" TEXT,
    "IdStacji" TEXT,
    "TERYT" TEXT,
    "lon" DECIMAL(10,7),
    "lat" DECIMAL(10,7)
);

-- CreateTable
CREATE TABLE "bts_locations" (
    "lon" DECIMAL(10,7),
    "lat" DECIMAL(10,7),
    "isp" TEXT,
    "tech" TEXT
);

-- CreateTable
CREATE TABLE "kpoferc" (
    "id obszaru" VARCHAR(50),
    "id_pa" VARCHAR(50),
    "wojewodztwo" VARCHAR(100),
    "powiat" VARCHAR(100),
    "gmina" VARCHAR(100),
    "terc" VARCHAR(20),
    "miejscowosc" VARCHAR(150),
    "simc" VARCHAR(20),
    "ulica" VARCHAR(200),
    "ulic" VARCHAR(20),
    "nr_porzadkowy" VARCHAR(20),
    "szerokosc" DECIMAL(10,7),
    "dlugosc" DECIMAL(10,7),
    "RODZAJ OBIEKTU" VARCHAR(50),
    "obiekt" VARCHAR(100),
    "LICZBA LOKALI" INTEGER,
    "liczba sed" INTEGER,
    "do_100" INTEGER,
    "kategoria" VARCHAR(50),
    "kwota" DECIMAL(15,2),
    "status_dofinansowania" VARCHAR(50),
    "zrodlo" VARCHAR(20)
);

-- CreateTable
CREATE TABLE "miejscowosci" (
    "miejscowosc" TEXT,
    "simc" VARCHAR(7)
);

-- CreateTable
CREATE TABLE "miejscowosci_profile" (
    "simc" VARCHAR(7) NOT NULL,
    "nazwa" TEXT,
    "powiat" TEXT,
    "woj" TEXT,
    "pow" TEXT,
    "adresy" BIGINT,
    "duze_miasto" BOOLEAN,
    "slug" TEXT,

    CONSTRAINT "miejscowosci_profile_pkey" PRIMARY KEY ("simc")
);

-- CreateTable
CREATE TABLE "miejscowosci_seo" (
    "slug" TEXT NOT NULL,
    "nazwa" TEXT,
    "powiat" TEXT,
    "wojewodztwo" TEXT,
    "duze_miasto" BOOLEAN,
    "simc_count" BIGINT,
    "ulic" BIGINT,
    "budynkow" BIGINT,
    "mieszkan_hp" BIGINT,
    "orange_bud" BIGINT,
    "tmobile_bud" BIGINT,
    "upc_bud" BIGINT,
    "vectra_bud" BIGINT,
    "netia_bud" BIGINT,
    "moico_bud" BIGINT,
    "orange_hp" BIGINT,
    "tmobile_hp" BIGINT,
    "upc_hp" BIGINT,
    "vectra_hp" BIGINT,
    "netia_hp" BIGINT,
    "kpo_ferc_bud" BIGINT,
    "kpo_ferc_typy" VARCHAR[],
    "max_budynek_hp" INTEGER,
    "max_operatorow_budynek" INTEGER,
    "operatorow_db" INTEGER,
    "operatorzy" TEXT[],
    "lokalni_operatorzy" TEXT,
    "lokalni_opis" TEXT,
    "meta_title" VARCHAR(70),
    "meta_description" VARCHAR(160),
    "h1" VARCHAR(100),
    "opis_krotki" TEXT,
    "breadcrumbs" JSONB,
    "schema_org" JSONB,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "keywords" TEXT[],
    "robots" VARCHAR(50) DEFAULT 'index, follow',
    "canonical_url" VARCHAR(255),
    "og_title" VARCHAR(100),
    "og_description" VARCHAR(200),
    "og_image" VARCHAR(255),
    "og_url" VARCHAR(255),
    "og_type" VARCHAR(50) DEFAULT 'website',
    "og_locale" VARCHAR(10) DEFAULT 'pl_PL',
    "og_site_name" VARCHAR(100) DEFAULT 'DostawcyInternetu.pl',
    "twitter_card" VARCHAR(50) DEFAULT 'summary_large_image',
    "twitter_title" VARCHAR(100),
    "twitter_description" VARCHAR(200),
    "twitter_image" VARCHAR(255),
    "hreflang" JSONB,
    "schema_webpage" JSONB,
    "schema_breadcrumb" JSONB,
    "schema_local_business" JSONB,
    "schema_faq" JSONB,
    "schema_service" JSONB,
    "schema_aggregate_offer" JSONB,
    "ai_summary" TEXT,
    "ai_context" JSONB,
    "faq" JSONB,
    "last_seo_update" TIMESTAMP(6),
    "og_image_width" INTEGER DEFAULT 1200,
    "og_image_height" INTEGER DEFAULT 630,
    "og_image_alt" VARCHAR(200),
    "twitter_site" VARCHAR(50) DEFAULT '@dostawcyinternetu',
    "schema_organization" JSONB,
    "schema_itemlist" JSONB,
    "schema_aggregate_rating" JSONB,
    "schema_speakable" JSONB,
    "schema_sitesearch" JSONB,
    "ai_keywords" TEXT[],
    "ai_entities" JSONB,
    "ai_intent" TEXT[],
    "rich_snippet_type" VARCHAR(50),
    "schema_graph" JSONB,

    CONSTRAINT "miejscowosci_seo_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "miejscowosci_slug" (
    "id" SERIAL NOT NULL,
    "miejscowosc" TEXT,
    "simc" VARCHAR(7),
    "slug" TEXT,
    "gmina" TEXT,
    "adresy" BIGINT,

    CONSTRAINT "miejscowosci_slug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polska" (
    "teryt" TEXT,
    "miejscowosc" TEXT,
    "ulica" TEXT,
    "nr" TEXT NOT NULL,
    "adruni" TEXT,
    "simc" VARCHAR(7) NOT NULL,
    "id_ulicy" VARCHAR(7) NOT NULL,
    "x" VARCHAR(6),
    "y" VARCHAR(6),
    "upc_hp" INTEGER,
    "ulica_core" TEXT,
    "timo_hp" INTEGER,
    "netia_hp" INTEGER,
    "vectra_hp" INTEGER,
    "nju_hp" TEXT,
    "opl_hp" INTEGER,
    "moico_hp" INTEGER DEFAULT 0,
    "krawarkon_hp" INTEGER DEFAULT 0,
    "matrix" TEXT,
    "ulica_std" VARCHAR(255),
    "kpo_ferc" VARCHAR(20),
    "lon" DECIMAL(10,7),
    "lat" DECIMAL(10,7),
    "bts_1_m" INTEGER,
    "bts_1_isp" VARCHAR(30),
    "bts_1_tech" VARCHAR(150),
    "bts_2_m" INTEGER,
    "bts_2_isp" VARCHAR(30),
    "bts_2_tech" VARCHAR(150),
    "bts_3_m" INTEGER,
    "bts_3_isp" VARCHAR(30),
    "bts_3_tech" VARCHAR(150),
    "slug" VARCHAR(100),

    CONSTRAINT "polska_pkey" PRIMARY KEY ("simc","id_ulicy","nr")
);

-- CreateTable
CREATE TABLE "simc" (
    "woj" TEXT,
    "pow" TEXT,
    "gmi" TEXT,
    "rodz_gmi" TEXT,
    "rm" TEXT,
    "mz" TEXT,
    "nazwa" TEXT,
    "sym" TEXT NOT NULL,
    "sympod" TEXT,
    "stan_na" TEXT,

    CONSTRAINT "simc_pkey" PRIMARY KEY ("sym")
);

-- CreateTable
CREATE TABLE "terc" (
    "woj" TEXT NOT NULL,
    "pow" TEXT,
    "gmi" TEXT,
    "rodz" TEXT,
    "nazwa" TEXT NOT NULL,
    "nazwa_dod" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ulice" (
    "miejscowosc" TEXT,
    "ulica" TEXT,
    "ulica_core" TEXT
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feature" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operatorzy" (
    "id" SERIAL NOT NULL,
    "nazwa" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "opis" TEXT,
    "logo_url" TEXT,
    "email_handlowca" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operatorzy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oferty" (
    "id" SERIAL NOT NULL,
    "nazwa" TEXT NOT NULL,
    "custom_url" TEXT,
    "opis" TEXT,
    "abonament" DECIMAL(10,2) NOT NULL,
    "instalacja" DECIMAL(10,2),
    "aktywacja" DECIMAL(10,2),
    "zobowiazanie_miesiace" INTEGER,
    "download_mbps" INTEGER NOT NULL,
    "upload_mbps" INTEGER NOT NULL,
    "technologia" TEXT,
    "kategoria" TEXT NOT NULL,
    "wyrozoniona" BOOLEAN NOT NULL DEFAULT false,
    "lokalna" BOOLEAN NOT NULL DEFAULT false,
    "oferta_specjalna" BOOLEAN NOT NULL DEFAULT false,
    "dom_blok_info" BOOLEAN NOT NULL DEFAULT false,
    "dom_blok_tekst" TEXT,
    "operator_id" INTEGER NOT NULL,
    "aktywna" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oferty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urzadzenia_koncowe" (
    "id" SERIAL NOT NULL,
    "oferta_id" INTEGER NOT NULL,
    "typ" TEXT NOT NULL,
    "nazwa" TEXT NOT NULL,
    "opis" TEXT,
    "zdjecie_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "urzadzenia_koncowe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oferty_lokalizacje" (
    "id" SERIAL NOT NULL,
    "oferta_id" INTEGER NOT NULL,
    "typ" TEXT NOT NULL,
    "kod" TEXT NOT NULL,
    "nazwa" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oferty_lokalizacje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programy_tv" (
    "id" SERIAL NOT NULL,
    "oferta_id" INTEGER NOT NULL,
    "nazwa" TEXT NOT NULL,
    "kategoria" TEXT,
    "logo_url" TEXT,
    "pozycja" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programy_tv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zasiegi_operatorow" (
    "id" SERIAL NOT NULL,
    "operator_id" INTEGER NOT NULL,
    "teryt" TEXT NOT NULL,
    "miejscowosc" TEXT NOT NULL,
    "simc" TEXT,
    "ulica" TEXT,
    "id_ulicy" TEXT,
    "nr" TEXT,
    "typ" TEXT NOT NULL,
    "aktywny" BOOLEAN NOT NULL DEFAULT true,
    "notatka" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zasiegi_operatorow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opinie" (
    "id" SERIAL NOT NULL,
    "operator_id" INTEGER,
    "oferta_id" INTEGER,
    "autor" TEXT NOT NULL,
    "email" TEXT,
    "ocena" INTEGER NOT NULL,
    "tytul" TEXT,
    "tresc" TEXT NOT NULL,
    "widoczna" BOOLEAN NOT NULL DEFAULT false,
    "zatwierdzil" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opinie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leady" (
    "id" SERIAL NOT NULL,
    "operator_id" INTEGER NOT NULL,
    "imie" TEXT NOT NULL,
    "nazwisko" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "miasto" TEXT NOT NULL,
    "ulica" TEXT,
    "numer" TEXT NOT NULL,
    "oferta_nazwa" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'nowy',
    "notatki" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leady_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_miejscowosci_nazwa_normalized_idx" ON "search_miejscowosci"("nazwa_normalized");

-- CreateIndex
CREATE INDEX "search_miejscowosci_waga_idx" ON "search_miejscowosci"("waga" DESC);

-- CreateIndex
CREATE INDEX "search_ulice_teryt_powiat_ulica_norm_idx" ON "search_ulice"("teryt_powiat", "ulica_norm");

-- CreateIndex
CREATE INDEX "search_ulice_miasto_nazwa_idx" ON "search_ulice"("miasto_nazwa");

-- CreateIndex
CREATE INDEX "search_numery_id_ulicy_nr_int_idx" ON "search_numery"("id_ulicy", "nr_int");

-- CreateIndex
CREATE INDEX "idx_bts_loc_coords" ON "bts_locations"("lon", "lat");

-- CreateIndex
CREATE INDEX "idx_kpoferc_simc" ON "kpoferc"("simc");

-- CreateIndex
CREATE INDEX "idx_kpoferc_ulic" ON "kpoferc"("ulic");

-- CreateIndex
CREATE INDEX "idx_miejscowosci_trgm" ON "miejscowosci"("miejscowosc");

-- CreateIndex
CREATE INDEX "idx_miejscowosci_slug" ON "miejscowosci_profile"("slug");

-- CreateIndex
CREATE INDEX "idx_seo_nazwa" ON "miejscowosci_seo"("nazwa");

-- CreateIndex
CREATE INDEX "idx_seo_wojewodztwo" ON "miejscowosci_seo"("wojewodztwo");

-- CreateIndex
CREATE INDEX "idx_slug_simc" ON "miejscowosci_slug"("simc");

-- CreateIndex
CREATE INDEX "idx_slug_miejscowosc" ON "miejscowosci_slug"("miejscowosc");

-- CreateIndex
CREATE INDEX "idx_polska_coords" ON "polska"("lon", "lat");

-- CreateIndex
CREATE INDEX "idx_polska_slug" ON "polska"("slug");

-- CreateIndex
CREATE INDEX "idx_polska_miejscowosc" ON "polska"("miejscowosc");

-- CreateIndex
CREATE UNIQUE INDEX "operatorzy_nazwa_key" ON "operatorzy"("nazwa");

-- CreateIndex
CREATE UNIQUE INDEX "operatorzy_slug_key" ON "operatorzy"("slug");

-- CreateIndex
CREATE INDEX "zasiegi_operatorow_operator_id_idx" ON "zasiegi_operatorow"("operator_id");

-- CreateIndex
CREATE INDEX "zasiegi_operatorow_simc_idx" ON "zasiegi_operatorow"("simc");

-- CreateIndex
CREATE UNIQUE INDEX "zasiegi_operatorow_operator_id_teryt_key" ON "zasiegi_operatorow"("operator_id", "teryt");

-- CreateIndex
CREATE INDEX "opinie_operator_id_idx" ON "opinie"("operator_id");

-- CreateIndex
CREATE INDEX "opinie_oferta_id_idx" ON "opinie"("oferta_id");

-- CreateIndex
CREATE INDEX "opinie_widoczna_idx" ON "opinie"("widoczna");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "oferty" ADD CONSTRAINT "oferty_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operatorzy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "urzadzenia_koncowe" ADD CONSTRAINT "urzadzenia_koncowe_oferta_id_fkey" FOREIGN KEY ("oferta_id") REFERENCES "oferty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferty_lokalizacje" ADD CONSTRAINT "oferty_lokalizacje_oferta_id_fkey" FOREIGN KEY ("oferta_id") REFERENCES "oferty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programy_tv" ADD CONSTRAINT "programy_tv_oferta_id_fkey" FOREIGN KEY ("oferta_id") REFERENCES "oferty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zasiegi_operatorow" ADD CONSTRAINT "zasiegi_operatorow_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operatorzy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opinie" ADD CONSTRAINT "opinie_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operatorzy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opinie" ADD CONSTRAINT "opinie_oferta_id_fkey" FOREIGN KEY ("oferta_id") REFERENCES "oferty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leady" ADD CONSTRAINT "leady_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operatorzy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


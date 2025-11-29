-- =====================================================================
-- ======================= BANCO RPG_SAAS - INIT =======================
-- =====================================================================

-- Conectar ao banco (ajuste se precisar)
-- \c rpg_saas;

-- =====================================================================
-- LIMPEZA: DROPAR VIEWS E TABELAS EXISTENTES
-- =====================================================================

DROP VIEW IF EXISTS v_dnd_spells_full CASCADE;
DROP VIEW IF EXISTS v_dnd_class_features CASCADE;
DROP VIEW IF EXISTS v_dnd_subraces_with_races CASCADE;

DROP TABLE IF EXISTS campaign_characters CASCADE;
DROP TABLE IF EXISTS campaign_players CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS maps CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS hoards CASCADE;
DROP TABLE IF EXISTS treasures CASCADE;
DROP TABLE IF EXISTS encounter_monsters CASCADE;
DROP TABLE IF EXISTS encounters CASCADE;
DROP TABLE IF EXISTS npcs CASCADE;
DROP TABLE IF EXISTS pcs CASCADE;
DROP TABLE IF EXISTS homebrew_favorites CASCADE;
DROP TABLE IF EXISTS homebrew_ratings CASCADE;
DROP TABLE IF EXISTS homebrew_races CASCADE;
DROP TABLE IF EXISTS homebrew_classes CASCADE;
DROP TABLE IF EXISTS homebrew_backgrounds CASCADE;
DROP TABLE IF EXISTS dnd_class_spells CASCADE;
DROP TABLE IF EXISTS dnd_features CASCADE;
DROP TABLE IF EXISTS dnd_backgrounds CASCADE;
DROP TABLE IF EXISTS dnd_magic_items CASCADE;
DROP TABLE IF EXISTS dnd_subraces CASCADE;
DROP TABLE IF EXISTS dnd_conditions CASCADE;
DROP TABLE IF EXISTS dnd_languages CASCADE;
DROP TABLE IF EXISTS dnd_skills CASCADE;
DROP TABLE IF EXISTS dnd_equipment CASCADE;
DROP TABLE IF EXISTS dnd_races CASCADE;
DROP TABLE IF EXISTS dnd_classes CASCADE;
DROP TABLE IF EXISTS dnd_spells CASCADE;
DROP TABLE IF EXISTS dnd_monsters CASCADE;
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================================
-- ============================ 1. USERS ================================
-- =====================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    admin BOOLEAN NOT NULL DEFAULT FALSE,
    plan INTEGER DEFAULT 0
);

-- =====================================================================
-- ====================== 2. TABELAS D&D OFICIAIS ======================
-- =====================================================================

CREATE TABLE dnd_monsters (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    size VARCHAR(50),
    type VARCHAR(100),
    subtype VARCHAR(100),
    alignment VARCHAR(100),
    armor_class INTEGER,
    hit_points INTEGER,
    hit_dice VARCHAR(50),
    speed JSONB,
    strength INTEGER,
    dexterity INTEGER,
    constitution INTEGER,
    intelligence INTEGER,
    wisdom INTEGER,
    charisma INTEGER,
    challenge_rating DECIMAL(5,2),
    xp INTEGER,
    proficiency_bonus INTEGER,
    damage_vulnerabilities TEXT[],
    damage_resistances TEXT[],
    damage_immunities TEXT[],
    condition_immunities TEXT[],
    senses JSONB,
    languages VARCHAR(500),
    special_abilities JSONB,
    actions JSONB,
    legendary_actions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_spells (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    level INTEGER NOT NULL,
    school VARCHAR(50),
    casting_time VARCHAR(100),
    range VARCHAR(100),
    components VARCHAR(10),
    duration VARCHAR(100),
    concentration BOOLEAN DEFAULT FALSE,
    ritual BOOLEAN DEFAULT FALSE,
    description TEXT,
    higher_level TEXT,
    material VARCHAR(500),
    classes TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_classes (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    hit_die INTEGER,
    proficiencies JSONB,
    saving_throws TEXT[],
    spellcasting JSONB,
    spellcasting_ability VARCHAR(20),
    class_levels JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_races (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    speed INTEGER DEFAULT 30,
    size VARCHAR(50),
    size_description TEXT,
    ability_bonuses JSONB,
    traits JSONB,
    languages JSONB,
    proficiencies JSONB,
    subraces TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_equipment (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    equipment_category VARCHAR(100),
    cost_quantity INTEGER,
    cost_unit VARCHAR(10),
    weight DECIMAL(8,2),
    weapon_category VARCHAR(50),
    weapon_range VARCHAR(50),
    damage JSONB,
    properties TEXT[],
    armor_category VARCHAR(50),
    armor_class JSONB,
    description TEXT,
    special TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_skills (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    ability_score VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_languages (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    description TEXT,
    script VARCHAR(100),
    typical_speakers TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_conditions (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_subraces (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    race_name VARCHAR(100) NOT NULL,
    description TEXT,
    ability_bonuses JSONB,
    traits JSONB,
    proficiencies JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_magic_items (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    rarity VARCHAR(50),
    variants JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_backgrounds (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    starting_proficiencies JSONB,
    language_options JSONB,
    starting_equipment JSONB,
    starting_equipment_options JSONB,
    feature JSONB,
    personality_traits JSONB,
    ideals JSONB,
    bonds JSONB,
    flaws JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_features (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    level INTEGER,
    class_name VARCHAR(100),
    subclass_name VARCHAR(100),
    description TEXT,
    prerequisites JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

CREATE TABLE dnd_class_spells (
    id SERIAL PRIMARY KEY,
    class_api_index VARCHAR(100) REFERENCES dnd_classes(api_index),
    spell_api_index VARCHAR(100) REFERENCES dnd_spells(api_index),
    level INTEGER,
    UNIQUE(class_api_index, spell_api_index)
);

-- =====================================================================
-- ====================== 3. TABELAS HOMEBREW ==========================
-- =====================================================================

CREATE TABLE homebrew_races (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    speed INTEGER DEFAULT 30,
    size VARCHAR(20) NOT NULL,
    languages TEXT[] DEFAULT '{}',
    traits JSONB DEFAULT '[]',
    abilities JSONB DEFAULT '{}',
    proficiencies JSONB DEFAULT '{}',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE homebrew_classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    hit_die INTEGER NOT NULL,
    primary_ability VARCHAR(20) NOT NULL,
    saving_throws TEXT[] NOT NULL,
    armor_proficiency TEXT[] DEFAULT '{}',
    weapon_proficiency TEXT[] DEFAULT '{}',
    tool_proficiency TEXT[] DEFAULT '{}',
    skill_choices JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    spellcasting JSONB DEFAULT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE homebrew_backgrounds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    skill_proficiencies TEXT[] DEFAULT '{}',
    tool_proficiencies TEXT[] DEFAULT '{}',
    languages INTEGER DEFAULT 0,
    equipment JSONB DEFAULT '[]',
    feature JSONB DEFAULT '{}',
    suggested_traits JSONB DEFAULT '{}',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função genérica para updated_at em homebrew_*
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_homebrew_races_updated_at
BEFORE UPDATE ON homebrew_races
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homebrew_classes_updated_at
BEFORE UPDATE ON homebrew_classes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homebrew_backgrounds_updated_at
BEFORE UPDATE ON homebrew_backgrounds
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- ============ 4. FAVORITES & RATINGS (HOMEBREW) ======================
-- =====================================================================

CREATE TABLE homebrew_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('race', 'class', 'background')),
    content_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, content_type, content_id)
);

CREATE TABLE homebrew_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('race', 'class', 'background')),
    content_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, content_type, content_id)
);

-- Timestamp automático em ratings
CREATE OR REPLACE FUNCTION update_homebrew_rating_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_homebrew_rating_timestamp_trigger
BEFORE UPDATE ON homebrew_ratings
FOR EACH ROW EXECUTE FUNCTION update_homebrew_rating_timestamp();

-- Atualização de média de rating
CREATE OR REPLACE FUNCTION update_homebrew_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(2,1);
    total_count INTEGER;
    table_name TEXT;
BEGIN
    IF COALESCE(NEW.content_type, OLD.content_type) = 'race' THEN
        table_name := 'homebrew_races';
    ELSIF COALESCE(NEW.content_type, OLD.content_type) = 'class' THEN
        table_name := 'homebrew_classes';
    ELSIF COALESCE(NEW.content_type, OLD.content_type) = 'background' THEN
        table_name := 'homebrew_backgrounds';
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT
        COALESCE(ROUND(AVG(rating), 1), 0),
        COUNT(*)
    INTO avg_rating, total_count
    FROM homebrew_ratings
    WHERE content_type = COALESCE(NEW.content_type, OLD.content_type)
      AND content_id = COALESCE(NEW.content_id, OLD.content_id);

    EXECUTE format(
        'UPDATE %I SET average_rating = $1, rating_count = $2 WHERE id = $3',
        table_name
    ) USING avg_rating, total_count, COALESCE(NEW.content_id, OLD.content_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_stats_on_insert
AFTER INSERT ON homebrew_ratings
FOR EACH ROW EXECUTE FUNCTION update_homebrew_rating_stats();

CREATE TRIGGER update_rating_stats_on_update
AFTER UPDATE ON homebrew_ratings
FOR EACH ROW EXECUTE FUNCTION update_homebrew_rating_stats();

CREATE TRIGGER update_rating_stats_on_delete
AFTER DELETE ON homebrew_ratings
FOR EACH ROW EXECUTE FUNCTION update_homebrew_rating_stats();

-- Atualização de favoritos
CREATE OR REPLACE FUNCTION update_homebrew_favorites_count()
RETURNS TRIGGER AS $$
DECLARE
    fav_count INTEGER;
    table_name TEXT;
BEGIN
    IF COALESCE(NEW.content_type, OLD.content_type) = 'race' THEN
        table_name := 'homebrew_races';
    ELSIF COALESCE(NEW.content_type, OLD.content_type) = 'class' THEN
        table_name := 'homebrew_classes';
    ELSIF COALESCE(NEW.content_type, OLD.content_type) = 'background' THEN
        table_name := 'homebrew_backgrounds';
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT COUNT(*)
    INTO fav_count
    FROM homebrew_favorites
    WHERE content_type = COALESCE(NEW.content_type, OLD.content_type)
      AND content_id = COALESCE(NEW.content_id, OLD.content_id);

    EXECUTE format(
        'UPDATE %I SET favorites_count = $1 WHERE id = $2',
        table_name
    ) USING fav_count, COALESCE(NEW.content_id, OLD.content_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_favorites_count_on_insert
AFTER INSERT ON homebrew_favorites
FOR EACH ROW EXECUTE FUNCTION update_homebrew_favorites_count();

CREATE TRIGGER update_favorites_count_on_delete
AFTER DELETE ON homebrew_favorites
FOR EACH ROW EXECUTE FUNCTION update_homebrew_favorites_count();

-- =====================================================================
-- ===================== 5. SISTEMA RPG-SAAS CORE ======================
-- =====================================================================

-- TABELAS SIMPLES (COMENTADAS, COMO PEDIDO)

-- CREATE TABLE races (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     description TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
--
-- CREATE TABLE classes (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     description TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CAMPANHAS
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dm_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_players INTEGER DEFAULT 6,
    current_session INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'planning', -- planning, active, paused, completed
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    allow_homebrew BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RELAÇÃO JOGADORES-CAMPANHAS
CREATE TABLE campaign_players (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, removed
    UNIQUE(campaign_id, user_id)
);

-- PCS
CREATE TABLE pcs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    race VARCHAR(100),
    class VARCHAR(100),
    background VARCHAR(100),
    alignment VARCHAR(50),
    attributes JSONB,
    abilities JSONB,
    equipment JSONB,
    hp INTEGER,
    ca INTEGER,
    current_hp INTEGER,
    proficiency_bonus INTEGER DEFAULT 2,
    inspiration BOOLEAN DEFAULT FALSE,
    skills JSONB DEFAULT '{}',
    attacks JSONB DEFAULT '[]',
    spells JSONB DEFAULT '{"spell_slots": {}, "known_spells": []}',
    personality_traits TEXT DEFAULT '',
    ideals TEXT DEFAULT '',
    bonds TEXT DEFAULT '',
    flaws TEXT DEFAULT '',
    features TEXT[] DEFAULT '{}',
    player_name VARCHAR(100),
    player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_homebrew BOOLEAN DEFAULT FALSE,
    is_unique BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PERSONAGENS DE CAMPANHA (SNAPSHOT DOS PCS)
CREATE TABLE campaign_characters (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_pc_id INTEGER NOT NULL REFERENCES pcs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    race VARCHAR(100),
    class VARCHAR(100),
    background VARCHAR(100),
    alignment VARCHAR(50),
    attributes JSONB,
    abilities JSONB,
    equipment JSONB,
    hp INTEGER,
    ca INTEGER,
    current_hp INTEGER,
    proficiency_bonus INTEGER DEFAULT 2,
    inspiration BOOLEAN DEFAULT FALSE,
    skills JSONB DEFAULT '{}',
    attacks JSONB DEFAULT '[]',
    spells JSONB DEFAULT '{"spell_slots": {}, "known_spells": []}',
    personality_traits TEXT DEFAULT '',
    ideals TEXT DEFAULT '',
    bonds TEXT DEFAULT '',
    flaws TEXT DEFAULT '',
    features TEXT[] DEFAULT '{}',
    player_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, dead, retired, removed
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync TIMESTAMP NULL,
    campaign_notes TEXT,
    UNIQUE(campaign_id, source_pc_id)
);

-- NPCS
CREATE TABLE npcs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1,
    race VARCHAR(100),
    class VARCHAR(100),
    background VARCHAR(100),
    attributes JSONB,
    abilities JSONB,
    equipment JSONB,
    hp INTEGER,
    ca INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_homebrew BOOLEAN DEFAULT FALSE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL
);

-- ENCOUNTERS
CREATE TABLE encounters (
    id SERIAL PRIMARY KEY,
    theme VARCHAR(100),
    difficulty VARCHAR(10),
    total_xp INTEGER,
    player_level INTEGER,
    player_count INTEGER,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE encounter_monsters (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    xp INTEGER,
    cr DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TESOUROS / HOARDS / ITENS
CREATE TABLE treasures (
    id SERIAL PRIMARY KEY,
    level INTEGER DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    total_value INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hoards (
    id SERIAL PRIMARY KEY,
    treasure_id INTEGER REFERENCES treasures(id) ON DELETE CASCADE,
    value DECIMAL(12,2) DEFAULT 0,
    coins JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    hoard_id INTEGER REFERENCES hoards(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- "magic_item", "gem", "art_object"
    category VARCHAR(50),
    value DECIMAL(12,2) DEFAULT 0,
    rank VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MAPAS
CREATE TABLE maps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    width INTEGER DEFAULT 50,
    height INTEGER DEFAULT 50,
    scale DECIMAL(5,2) DEFAULT 20.0,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- =========================== 6. ÍNDICES ==============================
-- =====================================================================

-- D&D
CREATE INDEX idx_dnd_monsters_type ON dnd_monsters(type);
CREATE INDEX idx_dnd_monsters_cr ON dnd_monsters(challenge_rating);
CREATE INDEX idx_dnd_monsters_name ON dnd_monsters(name);

CREATE INDEX idx_dnd_spells_level ON dnd_spells(level);
CREATE INDEX idx_dnd_spells_school ON dnd_spells(school);
CREATE INDEX idx_dnd_spells_name ON dnd_spells(name);

CREATE INDEX idx_dnd_classes_name ON dnd_classes(name);
CREATE INDEX idx_dnd_races_name ON dnd_races(name);

CREATE INDEX idx_dnd_equipment_category ON dnd_equipment(equipment_category);
CREATE INDEX idx_dnd_equipment_name ON dnd_equipment(name);

CREATE INDEX idx_dnd_skills_name ON dnd_skills(name);
CREATE INDEX idx_dnd_skills_ability ON dnd_skills(ability_score);

CREATE INDEX idx_dnd_languages_name ON dnd_languages(name);
CREATE INDEX idx_dnd_languages_type ON dnd_languages(type);

CREATE INDEX idx_dnd_conditions_name ON dnd_conditions(name);

CREATE INDEX idx_dnd_subraces_name ON dnd_subraces(name);
CREATE INDEX idx_dnd_subraces_race ON dnd_subraces(race_name);

CREATE INDEX idx_dnd_magic_items_name ON dnd_magic_items(name);
CREATE INDEX idx_dnd_magic_items_rarity ON dnd_magic_items(rarity);

CREATE INDEX idx_dnd_backgrounds_name ON dnd_backgrounds(name);

CREATE INDEX idx_dnd_features_name ON dnd_features(name);
CREATE INDEX idx_dnd_features_class ON dnd_features(class_name);
CREATE INDEX idx_dnd_features_level ON dnd_features(level);

-- HOMEBREW
CREATE INDEX idx_homebrew_races_user_id ON homebrew_races(user_id);
CREATE INDEX idx_homebrew_races_is_public ON homebrew_races(is_public);
CREATE INDEX idx_homebrew_races_name ON homebrew_races(name);
CREATE INDEX idx_homebrew_races_user_public ON homebrew_races(user_id, is_public);

CREATE INDEX idx_homebrew_classes_user_id ON homebrew_classes(user_id);
CREATE INDEX idx_homebrew_classes_is_public ON homebrew_classes(is_public);
CREATE INDEX idx_homebrew_classes_name ON homebrew_classes(name);
CREATE INDEX idx_homebrew_classes_user_public ON homebrew_classes(user_id, is_public);

CREATE INDEX idx_homebrew_backgrounds_user_id ON homebrew_backgrounds(user_id);
CREATE INDEX idx_homebrew_backgrounds_is_public ON homebrew_backgrounds(is_public);
CREATE INDEX idx_homebrew_backgrounds_name ON homebrew_backgrounds(name);
CREATE INDEX idx_homebrew_backgrounds_user_public ON homebrew_backgrounds(user_id, is_public);

-- FAVORITOS / RATINGS
CREATE INDEX idx_homebrew_favorites_user ON homebrew_favorites(user_id);
CREATE INDEX idx_homebrew_favorites_content ON homebrew_favorites(content_type, content_id);

CREATE INDEX idx_homebrew_ratings_user ON homebrew_ratings(user_id);
CREATE INDEX idx_homebrew_ratings_content ON homebrew_ratings(content_type, content_id);

-- CAMPAIGNS / PCS / NPCS
CREATE INDEX idx_campaigns_dm_id ON campaigns(dm_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_invite_code ON campaigns(invite_code);
CREATE INDEX idx_campaigns_allow_homebrew ON campaigns(allow_homebrew);

CREATE INDEX idx_campaign_players_campaign_id ON campaign_players(campaign_id);
CREATE INDEX idx_campaign_players_user_id ON campaign_players(user_id);
CREATE INDEX idx_campaign_players_status ON campaign_players(status);
CREATE INDEX idx_campaign_players_campaign_user ON campaign_players(campaign_id, user_id);

CREATE INDEX idx_pcs_player ON pcs(player_id);
CREATE INDEX idx_pcs_race ON pcs(race);
CREATE INDEX idx_pcs_class ON pcs(class);
CREATE INDEX idx_pcs_is_homebrew ON pcs(is_homebrew);
CREATE INDEX idx_pcs_is_unique ON pcs(is_unique);

CREATE INDEX idx_campaign_characters_campaign ON campaign_characters(campaign_id);
CREATE INDEX idx_campaign_characters_player ON campaign_characters(player_id);
CREATE INDEX idx_campaign_characters_source_pc ON campaign_characters(source_pc_id);
CREATE INDEX idx_campaign_characters_status ON campaign_characters(status);

CREATE INDEX idx_npcs_race ON npcs(race);
CREATE INDEX idx_npcs_class ON npcs(class);
CREATE INDEX idx_npcs_campaign_id ON npcs(campaign_id);

CREATE INDEX idx_encounter_monsters_encounter_id ON encounter_monsters(encounter_id);
CREATE INDEX idx_encounters_campaign_id ON encounters(campaign_id);

CREATE INDEX idx_hoards_treasure_id ON hoards(treasure_id);
CREATE INDEX idx_items_hoard_id ON items(hoard_id);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_category ON items(category);

-- MAPS
-- (se quiser buscas por nome)
CREATE INDEX idx_maps_name ON maps(name);

-- =====================================================================
-- ============================ 7. VIEWS ===============================
-- =====================================================================

CREATE VIEW v_dnd_subraces_with_races AS
SELECT 
    sr.api_index,
    sr.name AS subrace_name,
    sr.race_name,
    r.name AS race_full_name,
    sr.description,
    sr.ability_bonuses,
    sr.traits
FROM dnd_subraces sr
LEFT JOIN dnd_races r ON sr.race_name = r.name;

CREATE VIEW v_dnd_class_features AS
SELECT 
    f.class_name,
    f.subclass_name,
    f.level,
    f.name AS feature_name,
    f.description,
    c.hit_die,
    c.spellcasting_ability
FROM dnd_features f
LEFT JOIN dnd_classes c ON f.class_name = c.name
ORDER BY f.class_name, f.level;

CREATE VIEW v_dnd_spells_full AS
SELECT 
    s.api_index,
    s.name,
    s.level,
    s.school,
    s.casting_time,
    s.range,
    s.duration,
    s.concentration,
    s.ritual,
    s.classes,
    s.description
FROM dnd_spells s
ORDER BY s.level, s.name;

-- =====================================================================
-- ======================= 8. DADOS DE EXEMPLO =========================
-- =====================================================================

-- INSERTS EM races / classes COMENTADOS (já que tabelas estão comentadas)
-- INSERT INTO races (name, description) VALUES 
-- ('Humano', 'Uma raça versátil e adaptável'),
-- ('Elfo', 'Uma raça antiga com afinidade à magia e natureza'),
-- ('Anão', 'Uma raça robusta e resistente'),
-- ('Halfling', 'Uma raça pequena e ágil'),
-- ('Tiefling', 'Uma raça com sangue demoníaco');
--
-- INSERT INTO classes (name, description) VALUES 
-- ('Guerreiro', 'Especialista em combate e táticas'),
-- ('Mago', 'Mestre da magia arcana'),
-- ('Ladino', 'Especialista em furtividade e habilidades'),
-- ('Clérigo', 'Canal divino para cura e proteção'),
-- ('Bardo', 'Artista e inspirador');

-- NPCs de exemplo
INSERT INTO npcs (name, description, level, race, class, background) VALUES 
('Goblin Archer', 'A small green goblin with bow', 2, 'Goblin', 'Archer', 'Tribal Warrior'),
('Orc Barbarian', 'A fierce orc warrior', 5, 'Orc', 'Barbarian', 'Outlander'),
('Ancient Mage', 'A powerful human mage with white beard', 8, 'Human', 'Wizard', 'Hermit');

-- Tesouros de exemplo
INSERT INTO treasures (level, name, total_value) VALUES
(1, 'Tesouro de Goblin', 100),
(5, 'Tesouro de Dragão Jovem', 5000),
(10, 'Tesouro de Lich', 20000);

-- Hoards de exemplo
INSERT INTO hoards (treasure_id, value, coins) VALUES
(1, 100, '{"gp": 50, "sp": 200, "cp": 1000}'),
(2, 5000, '{"gp": 2000, "pp": 300}'),
(3, 20000, '{"gp": 10000, "pp": 1000}');

-- Itens de exemplo
INSERT INTO items (hoard_id, name, type, category, value, rank) VALUES
(1, 'Adaga +1', 'magic_item', 'weapons', 50, 'minor'),
(2, 'Rubi', 'gem', NULL, 500, 'medium'),
(2, 'Espada Longa +2', 'magic_item', 'weapons', 1000, 'medium'),
(3, 'Coroa Ornamentada', 'art_object', NULL, 2500, 'major'),
(3, 'Cajado do Poder', 'magic_item', 'staves', 5000, 'major');

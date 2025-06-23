-- ===== TABELAS EXISTENTES =====

CREATE TABLE dnd_monsters (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL, -- "goblin", "ancient-red-dragon"
    name VARCHAR(200) NOT NULL,
    size VARCHAR(50),
    type VARCHAR(100),
    subtype VARCHAR(100),
    alignment VARCHAR(100),
    armor_class INTEGER,
    hit_points INTEGER,
    hit_dice VARCHAR(50),
    speed JSONB, -- {"walk": "30 ft", "fly": "80 ft"}
    
    -- Ability Scores
    strength INTEGER,
    dexterity INTEGER,
    constitution INTEGER,
    intelligence INTEGER,
    wisdom INTEGER,
    charisma INTEGER,
    
    -- Combat stats
    challenge_rating DECIMAL(5,2),
    xp INTEGER,
    proficiency_bonus INTEGER,
    
    -- Resistances, immunities, etc
    damage_vulnerabilities TEXT[],
    damage_resistances TEXT[],
    damage_immunities TEXT[],
    condition_immunities TEXT[],
    
    -- Senses and languages
    senses JSONB,
    languages VARCHAR(500),
    
    -- Special abilities, actions, etc
    special_abilities JSONB,
    actions JSONB,
    legendary_actions JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para spells
CREATE TABLE dnd_spells (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    level INTEGER NOT NULL,
    school VARCHAR(50), -- "evocation", "enchantment"
    casting_time VARCHAR(100),
    range VARCHAR(100),
    components VARCHAR(10), -- "V,S,M"
    duration VARCHAR(100),
    concentration BOOLEAN DEFAULT FALSE,
    ritual BOOLEAN DEFAULT FALSE,
    description TEXT,
    higher_level TEXT,
    material VARCHAR(500), -- Material component description
    classes TEXT[], -- Array of class names that can use this spell
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para classes D&D
CREATE TABLE dnd_classes (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    hit_die INTEGER,
    proficiencies JSONB, -- Starting proficiencies
    saving_throws TEXT[], -- ["dex", "int"]
    
    -- Spellcasting info
    spellcasting JSONB,
    spellcasting_ability VARCHAR(20),
    
    -- Class features by level
    class_levels JSONB, -- Full progression table
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para raças D&D
CREATE TABLE dnd_races (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    speed INTEGER DEFAULT 30,
    size VARCHAR(50),
    size_description TEXT,
    
    -- Racial bonuses
    ability_bonuses JSONB, -- [{"ability_score": "dex", "bonus": 2}]
    
    -- Racial traits
    traits JSONB,
    languages JSONB,
    proficiencies JSONB,
    
    -- Subraces
    subraces TEXT[], -- Array of subrace names
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para equipamentos
CREATE TABLE dnd_equipment (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    equipment_category VARCHAR(100), -- "Weapon", "Armor", "Adventuring Gear"
    
    -- Cost
    cost_quantity INTEGER,
    cost_unit VARCHAR(10), -- "gp", "sp", "cp"
    
    -- Weight
    weight DECIMAL(8,2),
    
    -- Weapon specific
    weapon_category VARCHAR(50), -- "Simple", "Martial"
    weapon_range VARCHAR(50), -- "Melee", "Ranged"
    damage JSONB, -- {"damage_dice": "1d8", "damage_type": "slashing"}
    properties TEXT[], -- ["finesse", "light"]
    
    -- Armor specific
    armor_category VARCHAR(50), -- "Light", "Medium", "Heavy"
    armor_class JSONB, -- {"base": 11, "dex_bonus": true, "max_bonus": 2}
    
    -- General properties
    description TEXT,
    special TEXT[], -- Special properties
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- ===== NOVAS TABELAS =====

-- Tabela para habilidades (Skills)
CREATE TABLE dnd_skills (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL, -- "athletics", "perception"
    name VARCHAR(100) NOT NULL, -- "Athletics", "Perception"
    description TEXT,
    ability_score VARCHAR(20) NOT NULL, -- "str", "wis", etc.
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para idiomas (Languages)
CREATE TABLE dnd_languages (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL, -- "common", "elvish"
    name VARCHAR(100) NOT NULL, -- "Common", "Elvish"
    type VARCHAR(50), -- "Standard", "Exotic"
    description TEXT,
    script VARCHAR(100), -- "Common", "Elvish"
    typical_speakers TEXT[], -- ["Humans", "Halflings"]
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para condições (Conditions)
CREATE TABLE dnd_conditions (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL, -- "paralyzed", "poisoned"
    name VARCHAR(100) NOT NULL, -- "Paralyzed", "Poisoned"
    description TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para sub-raças (Subraces)
CREATE TABLE dnd_subraces (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL, -- "high-elf", "hill-dwarf"
    name VARCHAR(100) NOT NULL, -- "High Elf", "Hill Dwarf"
    race_name VARCHAR(100) NOT NULL, -- "Elf", "Dwarf"
    description TEXT,
    
    -- Racial bonuses specific to subrace
    ability_bonuses JSONB, -- [{"ability_score": "int", "bonus": 1}]
    
    -- Subrace-specific traits
    traits JSONB, -- Racial traits specific to this subrace
    proficiencies JSONB, -- Additional proficiencies
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para itens mágicos (Magic Items)
CREATE TABLE dnd_magic_items (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL, -- "bag-of-holding"
    name VARCHAR(200) NOT NULL, -- "Bag of Holding"
    description TEXT,
    category VARCHAR(100), -- Equipment category
    rarity VARCHAR(50), -- "uncommon", "rare", "legendary"
    variants JSONB, -- Variants of the item if any
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para backgrounds de personagens
CREATE TABLE dnd_backgrounds (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL, -- "acolyte", "criminal"
    name VARCHAR(100) NOT NULL, -- "Acolyte", "Criminal"
    
    -- Starting benefits
    starting_proficiencies JSONB, -- Skills, tools, languages
    language_options JSONB, -- Choice of languages
    starting_equipment JSONB, -- Equipment you start with
    starting_equipment_options JSONB, -- Equipment choices
    
    -- Background feature
    feature JSONB, -- Special background feature
    
    -- Personality generation
    personality_traits JSONB, -- Array of possible traits
    ideals JSONB, -- Array of possible ideals
    bonds JSONB, -- Array of possible bonds
    flaws JSONB, -- Array of possible flaws
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para features de classes/sub-classes
CREATE TABLE dnd_features (
    id SERIAL PRIMARY KEY,
    api_index VARCHAR(100) UNIQUE NOT NULL, -- "action-surge", "sneak-attack"
    name VARCHAR(200) NOT NULL, -- "Action Surge", "Sneak Attack"
    level INTEGER, -- Level when feature is gained
    class_name VARCHAR(100), -- "Fighter", "Rogue"
    subclass_name VARCHAR(100), -- NULL for base class features
    description TEXT,
    prerequisites JSONB, -- Any prerequisites for the feature
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '2014'
);

-- Tabela para magias por classe (relacionamento) - EXISTENTE
CREATE TABLE dnd_class_spells (
    id SERIAL PRIMARY KEY,
    class_api_index VARCHAR(100) REFERENCES dnd_classes(api_index),
    spell_api_index VARCHAR(100) REFERENCES dnd_spells(api_index),
    level INTEGER, -- Spell level
    UNIQUE(class_api_index, spell_api_index)
);

-- ===== ÍNDICES PARA PERFORMANCE =====

-- Índices existentes
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

-- Novos índices
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

-- ===== FOREIGN KEYS (se desejar enforcement) =====

-- Opcional: adicionar foreign keys para garantir integridade referencial
-- ALTER TABLE dnd_subraces ADD CONSTRAINT fk_subrace_race 
--     FOREIGN KEY (race_name) REFERENCES dnd_races(name);

-- ALTER TABLE dnd_features ADD CONSTRAINT fk_feature_class 
--     FOREIGN KEY (class_name) REFERENCES dnd_classes(name);

-- ===== VIEWS ÚTEIS =====

-- View para mostrar subraces com suas races
CREATE VIEW v_dnd_subraces_with_races AS
SELECT 
    sr.api_index,
    sr.name as subrace_name,
    sr.race_name,
    r.name as race_full_name,
    sr.description,
    sr.ability_bonuses,
    sr.traits
FROM dnd_subraces sr
LEFT JOIN dnd_races r ON sr.race_name = r.name;

-- View para mostrar features organizadas por classe e nível
CREATE VIEW v_dnd_class_features AS
SELECT 
    f.class_name,
    f.subclass_name,
    f.level,
    f.name as feature_name,
    f.description,
    c.hit_die,
    c.spellcasting_ability
FROM dnd_features f
LEFT JOIN dnd_classes c ON f.class_name = c.name
ORDER BY f.class_name, f.level;

-- View para mostrar spells com suas escolas e classes
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
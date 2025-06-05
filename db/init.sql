-- Conectar ao banco rpg_saas
\c rpg_saas;

-- Corrigir sintaxe nas tabelas existentes
DROP TABLE IF EXISTS npcs CASCADE;
DROP TABLE IF EXISTS pcs CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS encounters CASCADE;
DROP TABLE IF EXISTS encounter_monsters CASCADE;
DROP TABLE IF EXISTS treasures CASCADE;
DROP TABLE IF EXISTS hoards CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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

CREATE TABLE races (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE npcs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1,
    race VARCHAR(100),
    class VARCHAR(100),
    attributes JSONB,
    abilities JSONB,
    equipment JSONB,
    hp INTEGER,
    ca INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE pcs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    race VARCHAR(100),
    class VARCHAR(100),
    attributes JSONB,
    abilities JSONB,
    equipment JSONB,
    hp INTEGER,
    ca INTEGER,
    player_name VARCHAR(100),
    player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE encounters (
    id SERIAL PRIMARY KEY,
    theme VARCHAR(100),
    difficulty VARCHAR(10),
    total_xp INTEGER,
    player_level INTEGER,
    player_count INTEGER,
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
    category VARCHAR(50),    -- For magic items: armor, weapon, etc.
    value DECIMAL(12,2) DEFAULT 0,
    rank VARCHAR(20),       -- minor, medium, major
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    width INTEGER DEFAULT 50,
    height INTEGER DEFAULT 50,
    scale DECIMAL(5,2) DEFAULT 20.0,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de campanhas
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dm_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_players INTEGER DEFAULT 6,
    current_session INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'planning', -- planning, active, paused, completed
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para relacionar jogadores com campanhas
CREATE TABLE campaign_players (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, removed
    UNIQUE(campaign_id, user_id)
);

-- Tabela para personagens da campanha (PCs dos jogadores)
CREATE TABLE campaign_characters (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pc_id INTEGER NOT NULL REFERENCES pcs(id) ON DELETE CASCADE,
    
    -- Status específico da campanha
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, dead, retired, removed
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Stats que podem mudar durante a campanha (opcionais)
    current_hp INTEGER NULL, -- HP atual (pode ser diferente do PC original)
    temp_ac INTEGER NULL,    -- AC temporária (buffs/debuffs)
    campaign_notes TEXT,     -- Notas específicas da campanha
    
    -- Constraints
    UNIQUE(campaign_id, pc_id) -- Um PC só pode estar uma vez por campanha ativa
);

-- Atualizar tabela de NPCs para associar com campanhas
ALTER TABLE npcs ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE npcs DROP COLUMN IF EXISTS player_id;

-- Atualizar tabela de PCs para associar com campanhas (opcional, mantém independente)
ALTER TABLE pcs DROP COLUMN IF EXISTS player_id;

-- Atualizar tabela de encounters para associar com campanhas
ALTER TABLE encounters ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL;

-- Índices para melhorar performance
CREATE INDEX idx_campaigns_dm_id ON campaigns(dm_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaign_players_campaign_id ON campaign_players(campaign_id);
CREATE INDEX idx_campaign_players_user_id ON campaign_players(user_id);
CREATE INDEX idx_campaign_players_status ON campaign_players(status);
CREATE INDEX idx_campaign_characters_campaign ON campaign_characters(campaign_id);
CREATE INDEX idx_npcs_campaign_id ON npcs(campaign_id);
CREATE INDEX idx_encounters_campaign_id ON encounters(campaign_id);
CREATE INDEX idx_campaigns_invite_code ON campaigns(invite_code);

-- Inserir dados iniciais nas tabelas
-- Raças
INSERT INTO races (name, description) VALUES 
('Humano', 'Uma raça versátil e adaptável'),
('Elfo', 'Uma raça antiga com afinidade à magia e natureza'),
('Anão', 'Uma raça robusta e resistente'),
('Halfling', 'Uma raça pequena e ágil'),
('Tiefling', 'Uma raça com sangue demoníaco');

-- Classes
INSERT INTO classes (name, description) VALUES 
('Guerreiro', 'Especialista em combate e táticas'),
('Mago', 'Mestre da magia arcana'),
('Ladino', 'Especialista em furtividade e habilidades'),
('Clérigo', 'Canal divino para cura e proteção'),
('Bardo', 'Artista e inspirador');

-- NPCs de exemplo
INSERT INTO npcs (name, description, level, race, class) VALUES 
('Goblin Arqueiro', 'Um pequeno goblin verde com arco', 2, 'Goblin', 'Arqueiro'),
('Orc Bárbaro', 'Um temível guerreiro orc', 5, 'Orc', 'Bárbaro'),
('Mago Ancião', 'Um poderoso mago humano de barba branca', 8, 'Humano', 'Mago');

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

-- Índices para melhorar performance
CREATE INDEX idx_npcs_race ON npcs(race);
CREATE INDEX idx_npcs_class ON npcs(class);
CREATE INDEX idx_pcs_race ON pcs(race);
CREATE INDEX idx_pcs_class ON pcs(class);
CREATE INDEX idx_encounter_monsters_encounter_id ON encounter_monsters(encounter_id);
CREATE INDEX idx_hoards_treasure_id ON hoards(treasure_id);
CREATE INDEX idx_items_hoard_id ON items(hoard_id);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_category ON items(category);
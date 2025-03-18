-- Conectar ao banco rpg_saas
\c rpg_saas;

-- Corrigir sintaxe nas tabelas existentes
DROP TABLE IF EXISTS npcs CASCADE;
DROP TABLE IF EXISTS pcs CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS encounters CASCADE;
DROP TABLE IF EXISTS encounter_monsters CASCADE;

-- Criar tabela races (raças)
CREATE TABLE races (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela classes
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela npcs
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela pcs (personagens jogáveis)
CREATE TABLE pcs (
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
    player_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela encounters (encontros)
CREATE TABLE encounters (
    id SERIAL PRIMARY KEY,
    theme VARCHAR(100),
    difficulty VARCHAR(10),
    total_xp INTEGER,
    player_level INTEGER,
    player_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de relacionamento encounter_monsters
CREATE TABLE encounter_monsters (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    xp INTEGER,
    cr DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de mapas
CREATE TABLE maps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    width INTEGER DEFAULT 50,
    height INTEGER DEFAULT 50,
    scale DECIMAL(5,2) DEFAULT 20.0,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Índices para melhorar performance
CREATE INDEX idx_npcs_race ON npcs(race);
CREATE INDEX idx_npcs_class ON npcs(class);
CREATE INDEX idx_pcs_race ON pcs(race);
CREATE INDEX idx_pcs_class ON pcs(class);
CREATE INDEX idx_encounter_monsters_encounter_id ON encounter_monsters(encounter_id);

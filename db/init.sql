-- Conectar ao banco rpg_saas
\c rpg_saas;

-- Limpar tabelas existentes se necessário
DROP TABLE IF EXISTS encounter_monsters;
DROP TABLE IF EXISTS encounters;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS npcs;

-- Criar tabela de personagens (unifica PCs e NPCs em uma só tabela)
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1,
    race VARCHAR(50),
    class VARCHAR(50),
    hp INTEGER,
    ac INTEGER,
    background VARCHAR(50),
    attributes JSONB DEFAULT '{}'::jsonb,
    modifiers JSONB DEFAULT '{}'::jsonb,
    abilities JSONB DEFAULT '[]'::jsonb,
    spells JSONB DEFAULT '{}'::jsonb,
    equipment JSONB DEFAULT '[]'::jsonb,
    traits TEXT,
    character_type VARCHAR(10) CHECK (character_type IN ('pc', 'npc')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de encontros
CREATE TABLE encounters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    theme VARCHAR(50),
    total_xp INTEGER,
    difficulty VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de relacionamento para monstros em encontros
CREATE TABLE encounter_monsters (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER REFERENCES encounters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    xp INTEGER,
    cr DECIMAL(5,2),
    quantity INTEGER DEFAULT 1
);

-- Criar índices para melhorar a performance
CREATE INDEX idx_characters_character_type ON characters(character_type);
CREATE INDEX idx_encounter_monsters_encounter_id ON encounter_monsters(encounter_id);

-- Criar função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualizar os timestamps automaticamente
CREATE TRIGGER update_characters_timestamp
BEFORE UPDATE ON characters
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_encounters_timestamp
BEFORE UPDATE ON encounters
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Inserir alguns dados de exemplo para characters
INSERT INTO characters (name, description, level, race, class, hp, ac, background, attributes, modifiers, abilities, character_type)
VALUES 
('Goblin Scout', 'Um pequeno goblin espião', 2, 'Goblin', 'Ladino', 12, 14, 'Criminoso', 
 '{"Força": 8, "Destreza": 16, "Constituição": 10, "Inteligência": 12, "Sabedoria": 10, "Carisma": 8}'::jsonb,
 '{"Força": -1, "Destreza": 3, "Constituição": 0, "Inteligência": 1, "Sabedoria": 0, "Carisma": -1}'::jsonb,
 '["Ataque Furtivo", "Esquiva Ágil"]'::jsonb,
 'npc'),
 
('Gandalf', 'Um sábio mago humano', 10, 'Humano', 'Mago', 45, 12, 'Sábio',
 '{"Força": 10, "Destreza": 14, "Constituição": 12, "Inteligência": 18, "Sabedoria": 16, "Carisma": 14}'::jsonb,
 '{"Força": 0, "Destreza": 2, "Constituição": 1, "Inteligência": 4, "Sabedoria": 3, "Carisma": 2}'::jsonb,
 '["Conjuração de Magias", "Recuperação Arcana", "Tradição Arcana"]'::jsonb,
 'pc');

-- Inserir alguns dados de exemplo para encontros
INSERT INTO encounters (name, theme, total_xp, difficulty)
VALUES 
('Emboscada Goblin', 'Goblinóides', 500, 'médio'),
('Câmara dos Mortos', 'Mortos-Vivos', 1200, 'difícil');

-- Inserir monstros para os encontros
INSERT INTO encounter_monsters (encounter_id, name, xp, cr, quantity)
VALUES 
(1, 'Goblin', 50, 0.25, 6),
(1, 'Hobgoblin', 100, 0.5, 2),
(2, 'Esqueleto', 50, 0.25, 8),
(2, 'Zumbi', 50, 0.25, 6),
(2, 'Esqueleto Guerreiro', 450, 2, 1);
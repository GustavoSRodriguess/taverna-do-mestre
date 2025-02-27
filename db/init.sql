-- Conectar ao banco rpg_saas (importante!)
\c rpg_saas;

-- Criar tabela npcs
CREATE TABLE npcs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir alguns dados de exemplo
INSERT INTO npcs (name, description, level) VALUES 
('Goblin', 'Um pequeno goblin verde', 2),
('Orc', 'Um temível guerreiro orc', 5),
('Mago', 'Um poderoso mago humano', 8);
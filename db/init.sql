CREATE DATABASE rpg_saas;

\c rpg_saas;

CREATE TABLE npcs (
    id SERIAL PRIMARY KEY,
    attributes JSONB NOT NULL,
    description TEXT NOT NULL
);
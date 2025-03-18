package database

import (
    "database/sql"
    "fmt"
    
    _ "github.com/lib/pq"
    "rpg-saas-backend/pkg/config"
)

// Connect estabelece conexão com o banco PostgreSQL
func Connect(cfg *config.Config) (*sql.DB, error) {
    db, err := sql.Open("postgres", cfg.DatabaseURL)
    if err != nil {
        return nil, err
    }
    
    // Verifica se a conexão está funcionando
    if err := db.Ping(); err != nil {
        return nil, err
    }
    
    fmt.Println("Conectado ao banco de dados com sucesso!")
    return db, nil
}
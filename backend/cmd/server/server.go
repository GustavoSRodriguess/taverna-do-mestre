package server

import (
    "log"
    "os"
    
    "rpg-saas-backend/internal/api"
    "rpg-saas-backend/pkg/config"
    "rpg-saas-backend/pkg/database"
)

func Start() {
    // Carrega configurações
    cfg := config.Load()
    
    // Conecta ao banco
    db, err := database.Connect(cfg)
    if err != nil {
        log.Fatalf("Erro ao conectar ao banco: %v", err)
    }
    defer db.Close()
    
    // Inicia o servidor
    router := api.SetupRouter(db, cfg)
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    log.Printf("Servidor rodando na porta %s", port)
    router.Run(":" + port)
}
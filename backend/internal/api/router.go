package api

import (
    "database/sql"
    
    "github.com/gin-gonic/gin"
    "rpg-saas-backend/internal/api/handlers"
    "rpg-saas-backend/internal/api/middleware"
    "rpg-saas-backend/internal/repository"
    "rpg-saas-backend/internal/service"
    "rpg-saas-backend/pkg/config"
)

// SetupRouter configura todas as rotas da API
func SetupRouter(db *sql.DB, cfg *config.Config) *gin.Engine {
    router := gin.Default()
    
    // Middlewares
    router.Use(middleware.CORS())
    
    // Repositórios
    npcRepo := repository.NewNPCRepository(db)
    encounterRepo := repository.NewEncounterRepository(db)
    mapRepo := repository.NewMapRepository(db)
    
    // Cliente Python
    pythonClient := service.NewPythonClient(cfg.PythonAPIURL)
    
    // Serviços
    npcService := service.NewNPCService(npcRepo, pythonClient)
    encounterService := service.NewEncounterService(encounterRepo, pythonClient)
    mapService := service.NewMapService(mapRepo, pythonClient)
    
    // Handlers
    npcHandler := handlers.NewNPCHandler(npcService)
    encounterHandler := handlers.NewEncounterHandler(encounterService)
    mapHandler := handlers.NewMapHandler(mapService)
    
    // Rotas
    api := router.Group("/api")
    {
        // NPCs
        npcs := api.Group("/npcs")
        {
            npcs.GET("/", npcHandler.GetAll)
            npcs.GET("/:id", npcHandler.GetByID)
            npcs.POST("/", npcHandler.Create)
            npcs.PUT("/:id", npcHandler.Update)
            npcs.DELETE("/:id", npcHandler.Delete)
            npcs.POST("/generate", npcHandler.GenerateNPC)
        }
        
        // Adicione rotas para encontros e mapas de forma similar
    }
    
    return router
}
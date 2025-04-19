// internal/api/routes.go
package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"rpg-saas-backend/internal/api/handlers"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/python"
)

// SetupRoutes configura todas as rotas da API
func SetupRoutes(dbClient *db.PostgresDB, pythonClient *python.Client) *chi.Mux {
	router := chi.NewRouter()

	// Middlewares globais
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)

	// Rota de health check
	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"healthy","service":"rpg-generator-go"}`))
	})

	// Inicializa os handlers
	npcHandler := handlers.NewNPCHandler(dbClient, pythonClient)
	encounterHandler := handlers.NewEncounterHandler(dbClient, pythonClient)
	itemHandler := handlers.NewItemHandler(dbClient, pythonClient)

	// Rotas relacionadas a NPCs
	router.Route("/api/npcs", func(r chi.Router) {
		r.Get("/", npcHandler.GetNPCs)
		r.Post("/", npcHandler.CreateNPC)
		r.Get("/{id}", npcHandler.GetNPCByID)
		r.Put("/{id}", npcHandler.UpdateNPC)
		r.Delete("/{id}", npcHandler.DeleteNPC)
		r.Post("/generate", npcHandler.GenerateRandomNPC)
	})

	// Rotas relacionadas a encontros
	router.Route("/api/encounters", func(r chi.Router) {
		r.Get("/", encounterHandler.GetEncounters)
		r.Post("/", encounterHandler.CreateEncounter)
		r.Get("/{id}", encounterHandler.GetEncounterByID)
		r.Post("/generate", encounterHandler.GenerateRandomEncounter)
	})

	// Rotas relacionadas a tesouros e itens
	router.Route("/api/treasures", func(r chi.Router) {
		r.Get("/", itemHandler.GetTreasures)
		r.Post("/", itemHandler.CreateTreasure)
		r.Get("/{id}", itemHandler.GetTreasureByID)
		r.Delete("/{id}", itemHandler.DeleteTreasure)
		r.Post("/generate", itemHandler.GenerateRandomTreasure)
	})

	return router
}

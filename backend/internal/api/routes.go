// internal/api/routes.go
package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"rpg-saas-backend/internal/api/handlers"
	customMiddleware "rpg-saas-backend/internal/api/middleware" // Importando o middleware de autenticação
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/python"
)

// Simple CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from the frontend origin
		allowedOrigin := "http://localhost:5173"
		origin := r.Header.Get("Origin")

		// Check if the origin is allowed (simple check for this specific case)
		// For production, consider a more robust check or configuration
		if origin == allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Credentials", "true") // If you need cookies/auth headers
		}

		// Handle preflight requests (OPTIONS)
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization") // Add headers your frontend might send
			w.WriteHeader(http.StatusNoContent)                                                                                                  // Respond with 204 No Content for OPTIONS
			return
		}

		// Call the next handler in the chain
		next.ServeHTTP(w, r)
	})
}

// SetupRoutes configura todas as rotas da API
func SetupRoutes(dbClient *db.PostgresDB, pythonClient *python.Client) *chi.Mux {
	router := chi.NewRouter()

	// Middlewares globais
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)

	// Add the custom CORS middleware
	router.Use(corsMiddleware)

	// Rota de health check
	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"healthy","service":"rpg-generator-go"}`))
	})

	// Inicializa os handlers
	nphandler := handlers.NewNPCHandler(dbClient, pythonClient)
	encounterHandler := handlers.NewEncounterHandler(dbClient, pythonClient)
	itemHandler := handlers.NewItemHandler(dbClient, pythonClient)
	userHandler := handlers.NewUserHandler(dbClient)

	// Rotas relacionadas a NPCs (protegidas)
	router.Route("/api/npcs", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware) // Aplicando middleware de autenticação
		r.Get("/", nphandler.GetNPCs)
		r.Post("/", nphandler.CreateNPC)
		r.Get("/{id}", nphandler.GetNPCByID)
		r.Put("/{id}", nphandler.UpdateNPC)
		r.Delete("/{id}", nphandler.DeleteNPC)
		r.Post("/generate", nphandler.GenerateRandomNPC)
	})

	// Rotas relacionadas a encontros (protegidas)
	router.Route("/api/encounters", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware) // Aplicando middleware de autenticação
		r.Get("/", encounterHandler.GetEncounters)
		r.Post("/", encounterHandler.CreateEncounter)
		r.Get("/{id}", encounterHandler.GetEncounterByID)
		r.Post("/generate", encounterHandler.GenerateRandomEncounter)
	})

	// Rotas relacionadas a tesouros e itens (protegidas)
	router.Route("/api/treasures", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware) // Aplicando middleware de autenticação
		r.Get("/", itemHandler.GetTreasures)
		r.Post("/", itemHandler.CreateTreasure)
		r.Get("/{id}", itemHandler.GetTreasureByID)
		r.Delete("/{id}", itemHandler.DeleteTreasure)
		r.Post("/generate", itemHandler.GenerateRandomTreasure)
	})

	router.Route("/api/users", func(r chi.Router) {
		// Rotas públicas
		r.Post("/register", userHandler.CreateUser)
		r.Post("/login", userHandler.Login)

		// Rotas protegidas
		r.Group(func(r chi.Router) {
			r.Use(customMiddleware.AuthMiddleware)    // Aplicando middleware de autenticação
			r.Get("/me", userHandler.GetCurrentUser)  // Rota para obter o usuário logado
			r.Get("/", userHandler.GetUsers)          // Exemplo: Listar todos os usuários (geralmente admin)
			r.Get("/{id}", userHandler.GetUserByID)   // Exemplo: Obter usuário específico
			r.Put("/{id}", userHandler.UpdateUser)    // Exemplo: Atualizar usuário
			r.Delete("/{id}", userHandler.DeleteUser) // Exemplo: Deletar usuário
		})
	})

	return router
}

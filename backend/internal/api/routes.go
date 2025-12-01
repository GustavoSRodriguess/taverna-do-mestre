package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	chitrace "gopkg.in/DataDog/dd-trace-go.v1/contrib/go-chi/chi.v5"

	"rpg-saas-backend/internal/api/handlers"
	customMiddleware "rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/python"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Lista de origens permitidas
		allowedOrigins := map[string]bool{
			"http://localhost:5173":                                  true,
			"https://thankful-smoke-04fff0210.3.azurestaticapps.net": true,
		}

		// Se a origem for permitida, inclui cabeçalhos CORS
		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		// Preflight (OPTIONS)
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func SetupRoutes(dbClient *db.PostgresDB, pythonClient *python.Client) *chi.Mux {
	router := chi.NewRouter()

	router.Use(chitrace.Middleware(chitrace.WithServiceName("rpg-saas-backend")))
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)

	router.Use(corsMiddleware)

	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"healthy","service":"rpg-generator-go"}`))
	})

	npcHandler := handlers.NewNPCHandler(dbClient, pythonClient)
	pcHandler := handlers.NewPCHandler(dbClient, pythonClient)
	encounterHandler := handlers.NewEncounterHandler(dbClient, pythonClient)
	itemHandler := handlers.NewItemHandler(dbClient, pythonClient)
	userHandler := handlers.NewUserHandler(dbClient)
	campaignHandler := handlers.NewCampaignHandler(dbClient)
	dndHandler := handlers.NewDnDHandler(dbClient)
	homebrewHandler := handlers.NewHomebrewHandler(dbClient)
	diceHandler := handlers.NewDiceHandler()
	roomHandler := handlers.NewRoomHandler(dbClient)

	// Websocket para salas (usa token via query)
	router.Get("/api/rooms/{id}/ws", roomHandler.RoomWebsocket)

	router.Route("/api/npcs", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)
		r.Get("/", npcHandler.GetNPCs)
		r.Post("/", npcHandler.CreateNPC)
		r.Get("/{id}", npcHandler.GetNPCByID)
		r.Put("/{id}", npcHandler.UpdateNPC)
		r.Delete("/{id}", npcHandler.DeleteNPC)
		r.Post("/generate", npcHandler.GenerateRandomNPC)
	})

	router.Route("/api/pcs", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)

		r.Get("/", pcHandler.GetPCs)
		r.Post("/", pcHandler.CreatePC)
		r.Get("/{id}", pcHandler.GetPCByID)
		r.Put("/{id}", pcHandler.UpdatePC)
		r.Delete("/{id}", pcHandler.DeletePC)

		// r.Post("/generate", pcHandler.GenerateRandomPC)

		r.Get("/{id}/campaigns", pcHandler.GetPCCampaigns)
		r.Get("/{id}/check-availability", pcHandler.CheckUniquePCAvailability)
	})

	router.Route("/api/encounters", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)
		r.Get("/", encounterHandler.GetEncounters)
		r.Post("/", encounterHandler.CreateEncounter)
		r.Get("/{id}", encounterHandler.GetEncounterByID)
		r.Post("/generate", encounterHandler.GenerateRandomEncounter)
	})

	router.Route("/api/treasures", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)
		r.Get("/", itemHandler.GetTreasures)
		r.Post("/", itemHandler.CreateTreasure)
		r.Get("/{id}", itemHandler.GetTreasureByID)
		r.Delete("/{id}", itemHandler.DeleteTreasure)
		r.Post("/generate", itemHandler.GenerateRandomTreasure)
	})

	router.Route("/api/rooms", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)
		r.Post("/", roomHandler.CreateRoom)
		r.Get("/{id}", roomHandler.GetRoom)
		r.Post("/{id}/join", roomHandler.JoinRoom)
		r.Post("/{id}/scene", roomHandler.UpdateScene)
	})

	router.Route("/api/users", func(r chi.Router) {
		r.Post("/register", userHandler.CreateUser)
		r.Post("/login", userHandler.Login)

		r.Group(func(r chi.Router) {
			r.Use(customMiddleware.AuthMiddleware)
			r.Get("/me", userHandler.GetCurrentUser)
			r.Get("/", userHandler.GetUsers)
			r.Get("/{id}", userHandler.GetUserByID)
			r.Put("/{id}", userHandler.UpdateUser)
			r.Delete("/{id}", userHandler.DeleteUser)
		})
	})

	router.Route("/api/campaigns", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)

		r.Get("/", campaignHandler.GetCampaigns)
		r.Post("/", campaignHandler.CreateCampaign)
		r.Get("/{id}", campaignHandler.GetCampaignByID)
		r.Put("/{id}", campaignHandler.UpdateCampaign)
		r.Delete("/{id}", campaignHandler.DeleteCampaign)
		r.Get("/{id}/room", roomHandler.GetCampaignRoom)

		r.Get("/{id}/invite-code", campaignHandler.GetInviteCode)
		r.Post("/{id}/regenerate-code", campaignHandler.RegenerateInviteCode)

		r.Post("/join", campaignHandler.JoinCampaign)
		r.Delete("/{id}/leave", campaignHandler.LeaveCampaign)

		r.Get("/{id}/available-characters", campaignHandler.GetAvailableCharacters)

		r.Get("/{id}/characters", campaignHandler.GetCampaignCharacters)
		r.Post("/{id}/characters", campaignHandler.AddCharacterToCampaign)
		r.Get("/{id}/characters/{characterId}", campaignHandler.GetSingleCampaignCharacter)
		r.Put("/{id}/characters/{characterId}", campaignHandler.UpdateCampaignCharacter)
		r.Put("/{id}/characters/{characterId}/full", campaignHandler.UpdateCampaignCharacterFull)
		r.Post("/{id}/characters/{characterId}/sync", campaignHandler.SyncCampaignCharacter)
		r.Delete("/{id}/characters/{characterId}", campaignHandler.DeleteCampaignCharacter)
	})

	// ========================================
	// ROTAS D&D EXPANDIDAS
	// ========================================
	router.Route("/api/dnd", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)

		// Overview/Stats endpoint
		r.Get("/", dndHandler.GetDnDStats)

		// Races
		r.Get("/races", dndHandler.GetRaces)
		r.Get("/races/{index}", dndHandler.GetRaceByIndex)

		// Subraces (novo!)
		r.Get("/subraces", dndHandler.GetSubraces)

		// Classes
		r.Get("/classes", dndHandler.GetClasses)
		r.Get("/classes/{index}", dndHandler.GetClassByIndex)

		// Spells
		r.Get("/spells", dndHandler.GetSpells)
		r.Get("/spells/{index}", dndHandler.GetSpellByIndex)

		// Equipment
		r.Get("/equipment", dndHandler.GetEquipment)
		r.Get("/equipment/{index}", dndHandler.GetEquipmentByIndex)

		// Magic Items (novo!)
		r.Get("/magic-items", dndHandler.GetMagicItems)

		// Monsters
		r.Get("/monsters", dndHandler.GetMonsters)
		r.Get("/monsters/{index}", dndHandler.GetMonsterByIndex)

		// Backgrounds
		r.Get("/backgrounds", dndHandler.GetBackgrounds)
		r.Get("/backgrounds/{index}", dndHandler.GetBackgroundByIndex)

		// Skills
		r.Get("/skills", dndHandler.GetSkills)
		r.Get("/skills/{index}", dndHandler.GetSkillByIndex)

		// Features
		r.Get("/features", dndHandler.GetFeatures)
		r.Get("/features/{index}", dndHandler.GetFeatureByIndex)

		// Languages (novo!)
		r.Get("/languages", dndHandler.GetLanguages)

		// Conditions (novo!)
		r.Get("/conditions", dndHandler.GetConditions)
	})

	// ========================================
	// ROTAS HOMEBREW
	// ========================================
	router.Route("/api/homebrew", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)

		// Homebrew Races
		r.Route("/races", func(r chi.Router) {
			r.Get("/", homebrewHandler.GetHomebrewRaces)
			r.Post("/", homebrewHandler.CreateHomebrewRace)
			r.Get("/{id}", homebrewHandler.GetHomebrewRaceByID)
			r.Put("/{id}", homebrewHandler.UpdateHomebrewRace)
			r.Delete("/{id}", homebrewHandler.DeleteHomebrewRace)
		})

		// Homebrew Classes
		r.Route("/classes", func(r chi.Router) {
			r.Get("/", homebrewHandler.GetHomebrewClasses)
			r.Post("/", homebrewHandler.CreateHomebrewClass)
			r.Get("/{id}", homebrewHandler.GetHomebrewClassByID)
			r.Put("/{id}", homebrewHandler.UpdateHomebrewClass)
			r.Delete("/{id}", homebrewHandler.DeleteHomebrewClass)
		})

		// Homebrew Backgrounds
		r.Route("/backgrounds", func(r chi.Router) {
			r.Get("/", homebrewHandler.GetHomebrewBackgrounds)
			r.Post("/", homebrewHandler.CreateHomebrewBackground)
			r.Get("/{id}", homebrewHandler.GetHomebrewBackgroundByID)
			r.Put("/{id}", homebrewHandler.UpdateHomebrewBackground)
			r.Delete("/{id}", homebrewHandler.DeleteHomebrewBackground)
		})
	})

	// ========================================
	// ROTAS DE ROLAGEM DE DADOS
	// ========================================
	router.Route("/api/dice", func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)
		r.Post("/roll", diceHandler.RollDice)
		r.Post("/roll-multiple", diceHandler.RollMultiple)
	})

	return router
}

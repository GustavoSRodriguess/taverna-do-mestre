// cmd/server/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"rpg-saas-backend/internal/api"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/python"
)

func main() {
	// Carrega variáveis de ambiente do arquivo .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Configuração do banco de dados
	dbConfig := db.Config{
		Host:     getEnv("DB_HOST", "db"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "user"),
		Password: getEnv("DB_PASSWORD", "password"),
		DBName:   getEnv("DB_NAME", "rpg_saas"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}

	// Conecta ao banco de dados
	dbClient, err := db.NewPostgresDB(dbConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbClient.Close()

	// Configura cliente Python
	//pythonBaseURL := getEnv("PYTHON_SERVICE_URL", "http://127.0.0.1:5000")
	pythonTimeout := time.Duration(getEnvAsInt("PYTHON_TIMEOUT", 10)) * time.Second
	aiHost := os.Getenv("AI_SERVICE_URL")

	// Local fallback
	if aiHost == "" {
		aiHost = "http://host.docker.internal:5000"
	}

	// SE não tiver http, significa que estamos no Render
	if !strings.HasPrefix(aiHost, "http") {
		// Adiciona o domínio correto
		aiHost = fmt.Sprintf("https://%s.onrender.com", aiHost)
	}

	pythonClient := python.NewClient(aiHost, pythonTimeout)

	// Verifica se o serviço Python está ativo
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := pythonClient.HealthCheck(ctx); err != nil {
		log.Printf("Warning: Python service health check failed: %v", err)
		log.Printf("The API will start, but generation features may not work")
	} else {
		log.Println("Python service is healthy")
	}

	// Configura as rotas
	router := api.SetupRoutes(dbClient, pythonClient)

	// Configura o servidor HTTP
	port := getEnv("PORT", "8080")
	addr := fmt.Sprintf(":%s", port)

	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Inicia o servidor em uma goroutine
	go func() {
		log.Printf("Server starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Configura o canal para capturar sinais de término
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Bloqueia até receber um sinal
	<-quit
	log.Println("Shutting down server...")

	// Encerra o servidor graciosamente
	ctx, cancel = context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")
}

// getEnv retorna o valor da variável de ambiente ou um valor padrão
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// getEnvAsInt retorna o valor da variável de ambiente como int ou um valor padrão
func getEnvAsInt(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		if result, err := strconv.Atoi(value); err == nil {
			return result
		}
	}
	return defaultValue
}

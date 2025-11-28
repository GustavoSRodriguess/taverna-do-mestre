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
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"

	"rpg-saas-backend/internal/api"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/python"
)

func main() {
	tracer.Start(
		tracer.WithService(getEnv("DD_SERVICE", "rpg-saas-backend")),
		tracer.WithEnv(getEnv("DD_ENV", "dev")),
		tracer.WithServiceVersion(getEnv("DD_VERSION", "local")),
		tracer.WithRuntimeMetrics(),
	)
	defer tracer.Stop()

	// Configurar log com timestamp
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)

	log.Println("Starting RPG SaaS Backend...")

	// Carrega variáveis de ambiente do arquivo .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Log das variáveis de ambiente importantes (sem senhas)
	log.Printf("Environment check:")
	log.Printf("- PORT: %s", getEnv("PORT", "8080"))
	log.Printf("- DB_HOST: %s", getEnv("DB_HOST", "not set"))
	log.Printf("- DB_PORT: %s", getEnv("DB_PORT", "5432"))
	log.Printf("- DB_USER: %s", getEnv("DB_USER", "not set"))
	log.Printf("- DB_NAME: %s", getEnv("DB_NAME", "not set"))
	log.Printf("- DB_SSLMODE: %s", getEnv("DB_SSLMODE", "disable"))
	log.Printf("- AI_SERVICE_URL: %s", getEnv("AI_SERVICE_URL", "not set"))
	log.Printf("- DD_API_KEY configured: %v", os.Getenv("DD_API_KEY") != "")
	log.Printf("- DD_ENV configured: %v", os.Getenv("DD_ENV") != "")
	log.Printf("- DD_SITE configured: %v", os.Getenv("DD_SITE") != "")

	// Configuração do banco de dados
	dbConfig := db.Config{
		Host:     getEnv("DB_HOST", "db"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "user"),
		Password: getEnv("DB_PASSWORD", "password"),
		DBName:   getEnv("DB_NAME", "rpg_saas"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}

	log.Printf("Attempting to connect to database at %s:%s...", dbConfig.Host, dbConfig.Port)

	// Conecta ao banco de dados com retry
	var dbClient *db.PostgresDB
	var err error

	for i := 0; i < 5; i++ {
		dbClient, err = db.NewPostgresDB(dbConfig)
		if err == nil {
			log.Println("Successfully connected to PostgreSQL")
			break
		}
		log.Printf("Failed to connect to database (attempt %d/5): %v", i+1, err)
		if i < 4 {
			log.Printf("Retrying in 5 seconds...")
			time.Sleep(5 * time.Second)
		}
	}

	if err != nil {
		log.Fatalf("Failed to connect to database after 5 attempts: %v", err)
	}
	defer dbClient.Close()

	// Configura cliente Python
	pythonTimeout := time.Duration(getEnvAsInt("PYTHON_TIMEOUT", 10)) * time.Second
	aiHost := os.Getenv("AI_SERVICE_URL")

	// Local fallback
	if aiHost == "" {
		aiHost = "http://host.docker.internal:5000"
		log.Printf("AI_SERVICE_URL not set, using default: %s", aiHost)
	}

	// SE não tiver http, significa que estamos no Render
	if !strings.HasPrefix(aiHost, "http") {
		aiHost = fmt.Sprintf("https://%s.onrender.com", aiHost)
		log.Printf("Formatted AI service URL: %s", aiHost)
	}

	pythonClient := python.NewClient(aiHost, pythonTimeout)

	// Verifica se o serviço Python está ativo (não falhar se não estiver)
	log.Printf("Checking Python service at %s...", aiHost)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := pythonClient.HealthCheck(ctx); err != nil {
		log.Printf("Warning: Python service health check failed: %v", err)
		log.Printf("The API will start, but generation features may not work")
	} else {
		log.Println("Python service is healthy")
	}

	// Configura as rotas
	log.Println("Setting up routes...")
	router := api.SetupRoutes(dbClient, pythonClient)

	// Configura o servidor HTTP
	port := getEnv("PORT", "8080")

	// IMPORTANTE: Bind em 0.0.0.0 para Azure Container Instances
	addr := fmt.Sprintf("0.0.0.0:%s", port)

	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Inicia o servidor em uma goroutine
	go func() {
		log.Printf("🚀 Server starting on %s (binding to all interfaces)", addr)
		log.Printf("Health check available at: http://%s/health", addr)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Dar tempo para o servidor iniciar
	time.Sleep(2 * time.Second)
	log.Println("Server is running. Press Ctrl+C to stop.")

	// Configura o canal para capturar sinais de término
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Bloqueia até receber um sinal
	sig := <-quit
	log.Printf("Received signal: %v. Shutting down server...", sig)

	// Encerra o servidor graciosamente
	ctx, cancel = context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting gracefully")
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

package config

import (
    "os"
    
    "github.com/joho/godotenv"
)

// Config contém todas as configurações da aplicação
type Config struct {
    DatabaseURL  string
    PythonAPIURL string
    Port         string
    Environment  string
}

// Load carrega configurações de variáveis de ambiente ou .env
func Load() *Config {
    // Tenta carregar .env, ignora erro se não existir
    godotenv.Load()
    
    return &Config{
        DatabaseURL:  getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/rpg_saas?sslmode=disable"),
        PythonAPIURL: getEnv("PYTHON_API_URL", "http://localhost:5000"),
        Port:         getEnv("PORT", "8080"),
        Environment:  getEnv("ENVIRONMENT", "development"),
    }
}

// getEnv busca uma variável de ambiente com valor default
func getEnv(key, defaultValue string) string {
    value := os.Getenv(key)
    if value == "" {
        return defaultValue
    }
    return value
}
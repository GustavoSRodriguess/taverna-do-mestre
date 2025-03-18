package main

import "rpg-saas-backend/cmd/server"

// Estruturas de dados
type Character struct {
	ID            int                 `json:"id"`
	Name          string              `json:"name"`
	Description   string              `json:"description"`
	Level         int                 `json:"level"`
	Race          string              `json:"race"`
	Class         string              `json:"class"`
	HP            int                 `json:"hp"`
	AC            int                 `json:"ac"`
	Background    string              `json:"background"`
	Attributes    map[string]int      `json:"attributes"`
	Modifiers     map[string]int      `json:"modifiers"`
	Abilities     []string            `json:"abilities"`
	Spells        map[string][]string `json:"spells"`
	Equipment     []string            `json:"equipment"`
	Traits        string              `json:"traits"`
	CharacterType string              `json:"character_type"` // "npc" ou "pc"
}

type Encounter struct {
	ID         int       `json:"id"`
	Name       string    `json:"name"`
	Theme      string    `json:"theme"`
	TotalXP    int       `json:"total_xp"`
	Difficulty string    `json:"difficulty"`
	Monsters   []Monster `json:"monsters"`
}

type Monster struct {
	Name string  `json:"name"`
	XP   int     `json:"xp"`
	CR   float64 `json:"cr"`
}

type GenerateCharacterRequest struct {
	Level            int    `json:"level"`
	AttributesMethod string `json:"attributes_method"`
	Manual           bool   `json:"manual"`
}

type GenerateEncounterRequest struct {
	PlayerLevel     int    `json:"player_level"`
	NumberOfPlayers int    `json:"number_of_players"`
	Difficulty      string `json:"difficulty"`
}

// Configuração do banco de dados
func setupDB() (*sql.DB, error) {
	// Carrega variáveis de ambiente do arquivo .env
	godotenv.Load()

	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbPort == "" {
		dbPort = "5432"
	}
	if dbUser == "" {
		dbUser = "postgres"
	}
	if dbName == "" {
		dbName = "rpg_saas"
	}

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	return sql.Open("postgres", connStr)
}

// Serviço em Go
func main() {
    server.Start()
}

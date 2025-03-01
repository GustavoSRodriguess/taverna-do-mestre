package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

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
	r := gin.Default()

	// Configurar CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Conectar ao banco de dados
	db, err := setupDB()
	if err != nil {
		panic(err)
	}
	defer db.Close()

	// Verificar conexão com o banco
	err = db.Ping()
	if err != nil {
		panic(err)
	}

	// Endpoints para NPCs e PCs
	characterGroup := r.Group("/api/characters")
	{
		characterGroup.GET("", func(c *gin.Context) {
			// Obter filtro do tipo (NPC/PC)
			characterType := c.Query("type")

			var rows *sql.Rows
			var err error

			if characterType != "" {
				rows, err = db.Query("SELECT * FROM characters WHERE character_type = $1 ORDER BY id", characterType)
			} else {
				rows, err = db.Query("SELECT * FROM characters ORDER BY id")
			}

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var characters []Character
			for rows.Next() {
				var character Character
				var attributesJSON, modifiersJSON, abilitiesJSON, spellsJSON, equipmentJSON []byte

				err := rows.Scan(
					&character.ID,
					&character.Name,
					&character.Description,
					&character.Level,
					&character.Race,
					&character.Class,
					&character.HP,
					&character.AC,
					&character.Background,
					&attributesJSON,
					&modifiersJSON,
					&abilitiesJSON,
					&spellsJSON,
					&equipmentJSON,
					&character.Traits,
					&character.CharacterType,
				)

				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}

				// Deserializar os campos JSON
				json.Unmarshal(attributesJSON, &character.Attributes)
				json.Unmarshal(modifiersJSON, &character.Modifiers)
				json.Unmarshal(abilitiesJSON, &character.Abilities)
				json.Unmarshal(spellsJSON, &character.Spells)
				json.Unmarshal(equipmentJSON, &character.Equipment)

				characters = append(characters, character)
			}

			c.JSON(http.StatusOK, characters)
		})

		characterGroup.GET("/:id", func(c *gin.Context) {
			id := c.Param("id")
			var character Character
			var attributesJSON, modifiersJSON, abilitiesJSON, spellsJSON, equipmentJSON []byte

			err := db.QueryRow("SELECT * FROM characters WHERE id = $1", id).Scan(
				&character.ID,
				&character.Name,
				&character.Description,
				&character.Level,
				&character.Race,
				&character.Class,
				&character.HP,
				&character.AC,
				&character.Background,
				&attributesJSON,
				&modifiersJSON,
				&abilitiesJSON,
				&spellsJSON,
				&equipmentJSON,
				&character.Traits,
				&character.CharacterType,
			)

			if err != nil {
				if err == sql.ErrNoRows {
					c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Deserializar os campos JSON
			json.Unmarshal(attributesJSON, &character.Attributes)
			json.Unmarshal(modifiersJSON, &character.Modifiers)
			json.Unmarshal(abilitiesJSON, &character.Abilities)
			json.Unmarshal(spellsJSON, &character.Spells)
			json.Unmarshal(equipmentJSON, &character.Equipment)

			c.JSON(http.StatusOK, character)
		})

		characterGroup.POST("", func(c *gin.Context) {
			var character Character
			if err := c.ShouldBindJSON(&character); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Serializar os campos para JSON
			attributesJSON, _ := json.Marshal(character.Attributes)
			modifiersJSON, _ := json.Marshal(character.Modifiers)
			abilitiesJSON, _ := json.Marshal(character.Abilities)
			spellsJSON, _ := json.Marshal(character.Spells)
			equipmentJSON, _ := json.Marshal(character.Equipment)

			var id int
			err := db.QueryRow(`
				INSERT INTO characters(
					name, description, level, race, class, hp, ac, background, 
					attributes, modifiers, abilities, spells, equipment, traits, character_type
				) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
				RETURNING id
			`,
				character.Name, character.Description, character.Level, character.Race, character.Class,
				character.HP, character.AC, character.Background, attributesJSON, modifiersJSON,
				abilitiesJSON, spellsJSON, equipmentJSON, character.Traits, character.CharacterType,
			).Scan(&id)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			character.ID = id
			c.JSON(http.StatusCreated, character)
		})

		characterGroup.PUT("/:id", func(c *gin.Context) {
			id := c.Param("id")
			var character Character
			if err := c.ShouldBindJSON(&character); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Serializar os campos para JSON
			attributesJSON, _ := json.Marshal(character.Attributes)
			modifiersJSON, _ := json.Marshal(character.Modifiers)
			abilitiesJSON, _ := json.Marshal(character.Abilities)
			spellsJSON, _ := json.Marshal(character.Spells)
			equipmentJSON, _ := json.Marshal(character.Equipment)

			_, err := db.Exec(`
				UPDATE characters SET 
					name = $1, description = $2, level = $3, race = $4, class = $5, 
					hp = $6, ac = $7, background = $8, attributes = $9, modifiers = $10, 
					abilities = $11, spells = $12, equipment = $13, traits = $14, character_type = $15
				WHERE id = $16
			`,
				character.Name, character.Description, character.Level, character.Race, character.Class,
				character.HP, character.AC, character.Background, attributesJSON, modifiersJSON,
				abilitiesJSON, spellsJSON, equipmentJSON, character.Traits, character.CharacterType, id,
			)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "Character updated successfully"})
		})

		characterGroup.DELETE("/:id", func(c *gin.Context) {
			id := c.Param("id")

			_, err := db.Exec("DELETE FROM characters WHERE id = $1", id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "Character deleted successfully"})
		})
	}

	// Endpoints para encontros
	encounterGroup := r.Group("/api/encounters")
	{
		encounterGroup.GET("", func(c *gin.Context) {
			rows, err := db.Query("SELECT id, name, theme, total_xp, difficulty FROM encounters ORDER BY id")
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var encounters []Encounter
			for rows.Next() {
				var encounter Encounter
				err := rows.Scan(&encounter.ID, &encounter.Name, &encounter.Theme, &encounter.TotalXP, &encounter.Difficulty)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}

				// Buscar os monstros associados a este encontro
				monsterRows, err := db.Query("SELECT name, xp, cr FROM encounter_monsters WHERE encounter_id = $1", encounter.ID)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				defer monsterRows.Close()

				for monsterRows.Next() {
					var monster Monster
					err := monsterRows.Scan(&monster.Name, &monster.XP, &monster.CR)
					if err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
						return
					}
					encounter.Monsters = append(encounter.Monsters, monster)
				}

				encounters = append(encounters, encounter)
			}

			c.JSON(http.StatusOK, encounters)
		})

		encounterGroup.GET("/:id", func(c *gin.Context) {
			id := c.Param("id")
			var encounter Encounter

			err := db.QueryRow("SELECT id, name, theme, total_xp, difficulty FROM encounters WHERE id = $1", id).Scan(
				&encounter.ID, &encounter.Name, &encounter.Theme, &encounter.TotalXP, &encounter.Difficulty,
			)

			if err != nil {
				if err == sql.ErrNoRows {
					c.JSON(http.StatusNotFound, gin.H{"error": "Encounter not found"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Buscar os monstros associados a este encontro
			monsterRows, err := db.Query("SELECT name, xp, cr FROM encounter_monsters WHERE encounter_id = $1", encounter.ID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer monsterRows.Close()

			for monsterRows.Next() {
				var monster Monster
				err := monsterRows.Scan(&monster.Name, &monster.XP, &monster.CR)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				encounter.Monsters = append(encounter.Monsters, monster)
			}

			c.JSON(http.StatusOK, encounter)
		})

		encounterGroup.POST("", func(c *gin.Context) {
			var encounter Encounter
			if err := c.ShouldBindJSON(&encounter); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			tx, err := db.Begin()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			var id int
			err = tx.QueryRow(`
				INSERT INTO encounters (name, theme, total_xp, difficulty) 
				VALUES ($1, $2, $3, $4) 
				RETURNING id`,
				encounter.Name, encounter.Theme, encounter.TotalXP, encounter.Difficulty,
			).Scan(&id)

			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Inserir os monstros
			for _, monster := range encounter.Monsters {
				_, err := tx.Exec(`
					INSERT INTO encounter_monsters (encounter_id, name, xp, cr) 
					VALUES ($1, $2, $3, $4)`,
					id, monster.Name, monster.XP, monster.CR,
				)

				if err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
			}

			err = tx.Commit()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			encounter.ID = id
			c.JSON(http.StatusCreated, encounter)
		})

		encounterGroup.PUT("/:id", func(c *gin.Context) {
			id := c.Param("id")
			var encounter Encounter
			if err := c.ShouldBindJSON(&encounter); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			tx, err := db.Begin()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			_, err = tx.Exec(`
				UPDATE encounters SET name = $1, theme = $2, total_xp = $3, difficulty = $4
				WHERE id = $5`,
				encounter.Name, encounter.Theme, encounter.TotalXP, encounter.Difficulty, id,
			)

			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Remover monstros existentes
			_, err = tx.Exec("DELETE FROM encounter_monsters WHERE encounter_id = $1", id)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Inserir os novos monstros
			for _, monster := range encounter.Monsters {
				_, err := tx.Exec(`
					INSERT INTO encounter_monsters (encounter_id, name, xp, cr) 
					VALUES ($1, $2, $3, $4)`,
					id, monster.Name, monster.XP, monster.CR,
				)

				if err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
			}

			err = tx.Commit()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "Encounter updated successfully"})
		})

		encounterGroup.DELETE("/:id", func(c *gin.Context) {
			id := c.Param("id")

			tx, err := db.Begin()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Remover monstros primeiro (devido à chave estrangeira)
			_, err = tx.Exec("DELETE FROM encounter_monsters WHERE encounter_id = $1", id)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Remover o encontro
			_, err = tx.Exec("DELETE FROM encounters WHERE id = $1", id)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			err = tx.Commit()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "Encounter deleted successfully"})
		})
	}

	// Endpoints de geração usando o serviço Python
	generatorGroup := r.Group("/api/generate")
	{
		generatorGroup.POST("/character", func(c *gin.Context) {
			var req GenerateCharacterRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Chamar o serviço Python
			jsonData, err := json.Marshal(req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			resp, err := http.Post("http://python-service:5000/generate/character",
				"application/json", bytes.NewBuffer(jsonData))
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Python service unavailable: " + err.Error()})
				return
			}
			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			var character Character
			err = json.Unmarshal(body, &character)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, character)
		})

		generatorGroup.POST("/encounter", func(c *gin.Context) {
			var req GenerateEncounterRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Chamar o serviço Python
			jsonData, err := json.Marshal(req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			resp, err := http.Post("http://python-service:5000/generate/encounter",
				"application/json", bytes.NewBuffer(jsonData))
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Python service unavailable: " + err.Error()})
				return
			}
			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			var encounter Encounter
			err = json.Unmarshal(body, &encounter)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, encounter)
		})
	}

	// Iniciar o servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}

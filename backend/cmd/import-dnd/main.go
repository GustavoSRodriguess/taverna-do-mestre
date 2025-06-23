// cmd/import-dnd/main.go
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/lib/pq"

	"rpg-saas-backend/internal/db"
)

const DND_API_BASE = "https://www.dnd5eapi.co/api"

type DNDClient struct {
	client *http.Client
}

func NewDNDClient() *DNDClient {
	return &DNDClient{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *DNDClient) get(endpoint string, result interface{}) error {
	url := DND_API_BASE + endpoint
	log.Printf("Fetching: %s", url)

	resp, err := c.client.Get(url)
	if err != nil {
		return fmt.Errorf("failed to fetch %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API returned status %d for %s", resp.StatusCode, url)
	}

	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		return fmt.Errorf("failed to decode response from %s: %w", url, err)
	}

	return nil
}

// Estruturas para API responses
type APIList struct {
	Count   int `json:"count"`
	Results []struct {
		Index string `json:"index"`
		Name  string `json:"name"`
		URL   string `json:"url"`
	} `json:"results"`
}

// Speed pode ser map, bool ou string
type Speed struct {
	Map  map[string]string `json:"-"`
	Bool bool              `json:"-"`
}

// UnmarshalJSON lida com diferentes formatos de speed
func (s *Speed) UnmarshalJSON(data []byte) error {
	// Tenta primeiro como map
	var mapSpeed map[string]string
	if err := json.Unmarshal(data, &mapSpeed); err == nil {
		s.Map = mapSpeed
		return nil
	}

	// Tenta como bool
	var boolSpeed bool
	if err := json.Unmarshal(data, &boolSpeed); err == nil {
		s.Bool = boolSpeed
		if boolSpeed {
			s.Map = map[string]string{"walk": "30 ft"}
		} else {
			s.Map = map[string]string{"walk": "0 ft"}
		}
		return nil
	}

	// Fallback
	s.Map = map[string]string{"walk": "30 ft"}
	return nil
}

// ConditionImmunities pode ser array de strings ou array de objetos
type ConditionImmunities []string

// UnmarshalJSON lida com diferentes formatos de condition_immunities
func (ci *ConditionImmunities) UnmarshalJSON(data []byte) error {
	// Tenta primeiro como array de strings
	var strArray []string
	if err := json.Unmarshal(data, &strArray); err == nil {
		*ci = strArray
		return nil
	}

	// Tenta como array de objetos com campo "name"
	var objArray []struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(data, &objArray); err == nil {
		result := make([]string, len(objArray))
		for i, obj := range objArray {
			result[i] = obj.Name
		}
		*ci = result
		return nil
	}

	// Fallback
	*ci = []string{}
	return nil
}

// ArmorClass pode ser int ou array complexo
type ArmorClass struct {
	Simple  int // Para casos simples como 12
	Complex []struct {
		Type  string `json:"type"`
		Value int    `json:"value"`
	} // Para casos complexos
}

// UnmarshalJSON lida com ambos os formatos de armor_class
func (ac *ArmorClass) UnmarshalJSON(data []byte) error {
	// Tenta primeiro como int simples
	var simple int
	if err := json.Unmarshal(data, &simple); err == nil {
		ac.Simple = simple
		return nil
	}

	// Se falhar, tenta como array complexo
	var complex []struct {
		Type  string `json:"type"`
		Value int    `json:"value"`
	}
	if err := json.Unmarshal(data, &complex); err == nil {
		ac.Complex = complex
		if len(complex) > 0 {
			ac.Simple = complex[0].Value // Usa o primeiro valor como fallback
		}
		return nil
	}

	// Se ambos falharem, AC padrão
	ac.Simple = 10
	return nil
}

// Senses pode ser string, object ou array
type Senses struct {
	Map    map[string]string `json:"-"`
	String string            `json:"-"`
}

// UnmarshalJSON lida com diferentes formatos de senses
func (s *Senses) UnmarshalJSON(data []byte) error {
	// Tenta primeiro como object
	var mapSenses map[string]interface{}
	if err := json.Unmarshal(data, &mapSenses); err == nil {
		s.Map = make(map[string]string)
		for k, v := range mapSenses {
			s.Map[k] = fmt.Sprintf("%v", v)
		}
		return nil
	}

	// Tenta como string
	var strSenses string
	if err := json.Unmarshal(data, &strSenses); err == nil {
		s.String = strSenses
		return nil
	}

	// Tenta como number (converte para string)
	var numSenses float64
	if err := json.Unmarshal(data, &numSenses); err == nil {
		s.String = fmt.Sprintf("%.0f", numSenses)
		return nil
	}

	// Fallback
	s.String = ""
	return nil
}

type Monster struct {
	Index                 string              `json:"index"`
	Name                  string              `json:"name"`
	Size                  string              `json:"size"`
	Type                  string              `json:"type"`
	Subtype               string              `json:"subtype"`
	Alignment             string              `json:"alignment"`
	ArmorClass            ArmorClass          `json:"armor_class"`
	HitPoints             int                 `json:"hit_points"`
	HitDice               string              `json:"hit_dice"`
	Speed                 Speed               `json:"speed"`
	Strength              int                 `json:"strength"`
	Dexterity             int                 `json:"dexterity"`
	Constitution          int                 `json:"constitution"`
	Intelligence          int                 `json:"intelligence"`
	Wisdom                int                 `json:"wisdom"`
	Charisma              int                 `json:"charisma"`
	ChallengeRating       float64             `json:"challenge_rating"`
	XP                    int                 `json:"xp"`
	ProficiencyBonus      int                 `json:"proficiency_bonus"`
	DamageVulnerabilities []string            `json:"damage_vulnerabilities"`
	DamageResistances     []string            `json:"damage_resistances"`
	DamageImmunities      []string            `json:"damage_immunities"`
	ConditionImmunities   ConditionImmunities `json:"condition_immunities"`
	Senses                Senses              `json:"senses"`
	Languages             string              `json:"languages"`
	SpecialAbilities      json.RawMessage     `json:"special_abilities"`
	Actions               json.RawMessage     `json:"actions"`
	LegendaryActions      json.RawMessage     `json:"legendary_actions"`
}

type Spell struct {
	Index  string `json:"index"`
	Name   string `json:"name"`
	Level  int    `json:"level"`
	School struct {
		Name string `json:"name"`
	} `json:"school"`
	CastingTime   string   `json:"casting_time"`
	Range         string   `json:"range"`
	Components    []string `json:"components"`
	Duration      string   `json:"duration"`
	Concentration bool     `json:"concentration"`
	Ritual        bool     `json:"ritual"`
	Description   []string `json:"desc"`
	HigherLevel   []string `json:"higher_level"`
	Material      string   `json:"material"`
	Classes       []struct {
		Name string `json:"name"`
	} `json:"classes"`
}

type Class struct {
	Index         string          `json:"index"`
	Name          string          `json:"name"`
	HitDie        int             `json:"hit_die"`
	Proficiencies json.RawMessage `json:"proficiencies"`
	SavingThrows  []struct {
		Name string `json:"name"`
	} `json:"saving_throws"`
	Spellcasting        json.RawMessage `json:"spellcasting"`
	SpellcastingAbility struct {
		Name string `json:"name"`
	} `json:"spellcasting_ability"`
	ClassLevels json.RawMessage `json:"class_levels"`
}

type Race struct {
	Index           string          `json:"index"`
	Name            string          `json:"name"`
	Speed           int             `json:"speed"`
	Size            string          `json:"size"`
	SizeDescription string          `json:"size_description"`
	AbilityBonuses  json.RawMessage `json:"ability_bonuses"`
	Traits          json.RawMessage `json:"traits"`
	Languages       json.RawMessage `json:"languages"`
	Proficiencies   json.RawMessage `json:"proficiencies"`
	Subraces        []struct {
		Name string `json:"name"`
	} `json:"subraces"`
}

type Equipment struct {
	Index             string `json:"index"`
	Name              string `json:"name"`
	EquipmentCategory struct {
		Name string `json:"name"`
	} `json:"equipment_category"`
	Cost struct {
		Quantity int    `json:"quantity"`
		Unit     string `json:"unit"`
	} `json:"cost"`
	Weight         float64         `json:"weight"`
	WeaponCategory string          `json:"weapon_category"`
	WeaponRange    string          `json:"weapon_range"`
	Damage         json.RawMessage `json:"damage"`
	Properties     []struct {
		Name string `json:"name"`
	} `json:"properties"`
	ArmorCategory string          `json:"armor_category"`
	ArmorClass    json.RawMessage `json:"armor_class"`
	Description   []string        `json:"desc"`
	Special       []string        `json:"special"`
}

// EquipmentCategory pode ser string ou objeto
type EquipmentCategory struct {
	Name   string
	Object struct {
		Name string `json:"name"`
	}
}

// UnmarshalJSON lida com diferentes formatos de equipment_category
func (ec *EquipmentCategory) UnmarshalJSON(data []byte) error {
	// Tenta primeiro como string
	var str string
	if err := json.Unmarshal(data, &str); err == nil {
		ec.Name = str
		return nil
	}

	// Se falhar, tenta como objeto com campo "name"
	var obj struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(data, &obj); err == nil {
		ec.Name = obj.Name
		ec.Object = obj
		return nil
	}

	// Fallback
	ec.Name = "Unknown"
	return nil
}

// Rarity pode ser string ou objeto
type Rarity struct {
	Name string
}

// UnmarshalJSON lida com diferentes formatos de rarity
func (r *Rarity) UnmarshalJSON(data []byte) error {
	// Tenta primeiro como string
	var str string
	if err := json.Unmarshal(data, &str); err == nil {
		r.Name = str
		return nil
	}

	// Se falhar, tenta como objeto com campo "name"
	var obj struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(data, &obj); err == nil {
		r.Name = obj.Name
		return nil
	}

	// Fallback
	r.Name = "common"
	return nil
}

// NOVAS ESTRUTURAS
type Subrace struct {
	Index string `json:"index"`
	Name  string `json:"name"`
	Race  struct {
		Name string `json:"name"`
	} `json:"race"`
	Description    string          `json:"desc"`
	AbilityBonuses json.RawMessage `json:"ability_bonuses"`
	Traits         json.RawMessage `json:"racial_traits"`
	Proficiencies  json.RawMessage `json:"starting_proficiencies"`
}

type Background struct {
	Index                    string          `json:"index"`
	Name                     string          `json:"name"`
	StartingProficiencies    json.RawMessage `json:"starting_proficiencies"`
	LanguageOptions          json.RawMessage `json:"language_options"`
	StartingEquipment        json.RawMessage `json:"starting_equipment"`
	StartingEquipmentOptions json.RawMessage `json:"starting_equipment_options"`
	Feature                  json.RawMessage `json:"feature"`
	PersonalityTraits        json.RawMessage `json:"personality_traits"`
	Ideals                   json.RawMessage `json:"ideals"`
	Bonds                    json.RawMessage `json:"bonds"`
	Flaws                    json.RawMessage `json:"flaws"`
}

type MagicItem struct {
	Index       string            `json:"index"`
	Name        string            `json:"name"`
	Description []string          `json:"desc"`
	Category    EquipmentCategory `json:"equipment_category"`
	Rarity      Rarity            `json:"rarity"`
	Variants    json.RawMessage   `json:"variants"`
}

type Feature struct {
	Index string `json:"index"`
	Name  string `json:"name"`
	Level int    `json:"level"`
	Class struct {
		Name string `json:"name"`
	} `json:"class"`
	Subclass struct {
		Name string `json:"name"`
	} `json:"subclass"`
	Description   []string        `json:"desc"`
	Prerequisites json.RawMessage `json:"prerequisites"`
}

type Skill struct {
	Index        string   `json:"index"`
	Name         string   `json:"name"`
	Description  []string `json:"desc"`
	AbilityScore struct {
		Name string `json:"name"`
	} `json:"ability_score"`
}

type Language struct {
	Index       string   `json:"index"`
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	Description string   `json:"desc"`
	Script      string   `json:"script"`
	Speakers    []string `json:"typical_speakers"`
}

type Condition struct {
	Index       string   `json:"index"`
	Name        string   `json:"name"`
	Description []string `json:"desc"`
}

func main() {
	// Definir flags para importação seletiva
	var (
		all         = flag.Bool("all", false, "Import all data (default)")
		skills      = flag.Bool("skills", false, "Import skills only")
		languages   = flag.Bool("languages", false, "Import languages only")
		conditions  = flag.Bool("conditions", false, "Import conditions only")
		monsters    = flag.Bool("monsters", false, "Import monsters only")
		spells      = flag.Bool("spells", false, "Import spells only")
		classes     = flag.Bool("classes", false, "Import classes only")
		races       = flag.Bool("races", false, "Import races only")
		subraces    = flag.Bool("subraces", false, "Import subraces only")
		equipment   = flag.Bool("equipment", false, "Import equipment only")
		magicItems  = flag.Bool("magic-items", false, "Import magic items only")
		backgrounds = flag.Bool("backgrounds", false, "Import backgrounds only")
		features    = flag.Bool("features", false, "Import features only")
		basic       = flag.Bool("basic", false, "Import basic data (skills, languages, conditions)")
	)

	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "D&D 5e Data Importer\n\n")
		fmt.Fprintf(os.Stderr, "Usage: %s [flags]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "Examples:\n")
		fmt.Fprintf(os.Stderr, "  %s -all                 # Import everything\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s -magic-items         # Import only magic items\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s -monsters -spells    # Import monsters and spells\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s -basic               # Import skills, languages, conditions\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "\nFlags:\n")
		flag.PrintDefaults()
	}

	flag.Parse()

	// Se nenhuma flag específica for fornecida, importar tudo
	importAll := *all || (!*skills && !*languages && !*conditions && !*monsters &&
		!*spells && !*classes && !*races && !*subraces && !*equipment &&
		!*magicItems && !*backgrounds && !*features && !*basic)

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect to database
	dbConfig := db.Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "user"),
		Password: getEnv("DB_PASSWORD", "password"),
		DBName:   getEnv("DB_NAME", "rpg_saas"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}

	dbClient, err := db.NewPostgresDB(dbConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbClient.Close()

	client := NewDNDClient()
	ctx := context.Background()

	log.Println("Starting D&D 5e data import...")
	log.Println("💡 Dica: Pressione Ctrl+C para parar a importação a qualquer momento")

	// Import based on flags
	if importAll || *basic || *skills {
		if err := importSkills(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import skills: %v", err)
		}
	}

	if importAll || *basic || *languages {
		if err := importLanguages(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import languages: %v", err)
		}
	}

	if importAll || *basic || *conditions {
		if err := importConditions(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import conditions: %v", err)
		}
	}

	if importAll || *monsters {
		if err := importMonsters(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import monsters: %v", err)
		}
	}

	if importAll || *spells {
		if err := importSpells(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import spells: %v", err)
		}
	}

	if importAll || *classes {
		if err := importClasses(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import classes: %v", err)
		}
	}

	if importAll || *races {
		if err := importRaces(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import races: %v", err)
		}
	}

	if importAll || *subraces {
		if err := importSubraces(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import subraces: %v", err)
		}
	}

	if importAll || *equipment {
		if err := importEquipment(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import equipment: %v", err)
		}
	}

	if importAll || *magicItems {
		if err := importMagicItems(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import magic items: %v", err)
		}
	}

	if importAll || *backgrounds {
		if err := importBackgrounds(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import backgrounds: %v", err)
		}
	}

	if importAll || *features {
		if err := importFeatures(ctx, client, dbClient); err != nil {
			log.Fatalf("Failed to import features: %v", err)
		}
	}

	log.Println("✅ D&D 5e data import completed successfully!")
	log.Printf("🎯 Resumo da importação:")

	// Contar registros importados apenas das tabelas que foram processadas
	tables := []struct {
		name        string
		emoji       string
		display     string
		shouldCount bool
	}{
		{"dnd_skills", "🎯", "Skills", importAll || *basic || *skills},
		{"dnd_languages", "🗣️", "Languages", importAll || *basic || *languages},
		{"dnd_conditions", "⚡", "Conditions", importAll || *basic || *conditions},
		{"dnd_monsters", "👹", "Monsters", importAll || *monsters},
		{"dnd_spells", "✨", "Spells", importAll || *spells},
		{"dnd_classes", "🎭", "Classes", importAll || *classes},
		{"dnd_races", "🏃", "Races", importAll || *races},
		{"dnd_subraces", "🧝", "Subraces", importAll || *subraces},
		{"dnd_equipment", "⚔️", "Equipment", importAll || *equipment},
		{"dnd_magic_items", "🔮", "Magic Items", importAll || *magicItems},
		{"dnd_backgrounds", "📜", "Backgrounds", importAll || *backgrounds},
		{"dnd_features", "⭐", "Features", importAll || *features},
	}

	for _, table := range tables {
		if table.shouldCount {
			if count, err := countRecords(ctx, dbClient, table.name); err == nil {
				log.Printf("   %s %s: %d", table.emoji, table.display, count)
			}
		}
	}
}

// NOVA FUNÇÃO: Import skills
func importSkills(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing skills...")

	var list APIList
	if err := client.get("/skills", &list); err != nil {
		return err
	}

	for i, item := range list.Results {
		log.Printf("Importing skill %d/%d: %s", i+1, len(list.Results), item.Name)

		var skill Skill
		if err := client.get("/skills/"+item.Index, &skill); err != nil {
			log.Printf("⚠️ Failed to fetch skill %s: %v", item.Index, err)
			continue
		}

		if err := insertSkill(ctx, dbClient, &skill); err != nil {
			log.Printf("⚠️ Failed to insert skill %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d skills", len(list.Results))
	return nil
}

func insertSkill(ctx context.Context, dbClient *db.PostgresDB, skill *Skill) error {
	query := `
		INSERT INTO dnd_skills (
			api_index, name, description, ability_score
		) VALUES (
			$1, $2, $3, $4
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		skill.Index, skill.Name, strings.Join(skill.Description, "\n\n"), strings.ToLower(skill.AbilityScore.Name),
	)

	return err
}

// NOVA FUNÇÃO: Import languages
func importLanguages(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing languages...")

	var list APIList
	if err := client.get("/languages", &list); err != nil {
		return err
	}

	for i, item := range list.Results {
		log.Printf("Importing language %d/%d: %s", i+1, len(list.Results), item.Name)

		var language Language
		if err := client.get("/languages/"+item.Index, &language); err != nil {
			log.Printf("⚠️ Failed to fetch language %s: %v", item.Index, err)
			continue
		}

		if err := insertLanguage(ctx, dbClient, &language); err != nil {
			log.Printf("⚠️ Failed to insert language %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d languages", len(list.Results))
	return nil
}

func insertLanguage(ctx context.Context, dbClient *db.PostgresDB, language *Language) error {
	query := `
		INSERT INTO dnd_languages (
			api_index, name, type, description, script, typical_speakers
		) VALUES (
			$1, $2, $3, $4, $5, $6
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		language.Index, language.Name, language.Type, language.Description, language.Script, pq.Array(language.Speakers),
	)

	return err
}

// NOVA FUNÇÃO: Import conditions
func importConditions(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing conditions...")

	var list APIList
	if err := client.get("/conditions", &list); err != nil {
		return err
	}

	for i, item := range list.Results {
		log.Printf("Importing condition %d/%d: %s", i+1, len(list.Results), item.Name)

		var condition Condition
		if err := client.get("/conditions/"+item.Index, &condition); err != nil {
			log.Printf("⚠️ Failed to fetch condition %s: %v", item.Index, err)
			continue
		}

		if err := insertCondition(ctx, dbClient, &condition); err != nil {
			log.Printf("⚠️ Failed to insert condition %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d conditions", len(list.Results))
	return nil
}

func insertCondition(ctx context.Context, dbClient *db.PostgresDB, condition *Condition) error {
	query := `
		INSERT INTO dnd_conditions (
			api_index, name, description
		) VALUES (
			$1, $2, $3
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		condition.Index, condition.Name, strings.Join(condition.Description, "\n\n"),
	)

	return err
}

// NOVA FUNÇÃO: Import subraces
func importSubraces(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing subraces...")

	var list APIList
	if err := client.get("/subraces", &list); err != nil {
		return err
	}

	for i, item := range list.Results {
		log.Printf("Importing subrace %d/%d: %s", i+1, len(list.Results), item.Name)

		var subrace Subrace
		if err := client.get("/subraces/"+item.Index, &subrace); err != nil {
			log.Printf("⚠️ Failed to fetch subrace %s: %v", item.Index, err)
			continue
		}

		if err := insertSubrace(ctx, dbClient, &subrace); err != nil {
			log.Printf("⚠️ Failed to insert subrace %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d subraces", len(list.Results))
	return nil
}

func insertSubrace(ctx context.Context, dbClient *db.PostgresDB, subrace *Subrace) error {
	// Validar e sanitizar JSON fields
	abilityBonusesJSON := []byte("[]")
	if len(subrace.AbilityBonuses) > 0 {
		if json.Valid(subrace.AbilityBonuses) {
			abilityBonusesJSON = subrace.AbilityBonuses
		}
	}

	traitsJSON := []byte("[]")
	if len(subrace.Traits) > 0 {
		if json.Valid(subrace.Traits) {
			traitsJSON = subrace.Traits
		}
	}

	proficienciesJSON := []byte("[]")
	if len(subrace.Proficiencies) > 0 {
		if json.Valid(subrace.Proficiencies) {
			proficienciesJSON = subrace.Proficiencies
		}
	}

	query := `
		INSERT INTO dnd_subraces (
			api_index, name, race_name, description, ability_bonuses, traits, proficiencies
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		subrace.Index, subrace.Name, subrace.Race.Name, subrace.Description,
		abilityBonusesJSON, traitsJSON, proficienciesJSON,
	)

	return err
}

// NOVA FUNÇÃO: Import magic items
func importMagicItems(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing magic items...")

	var list APIList
	if err := client.get("/magic-items", &list); err != nil {
		return err
	}

	for i, item := range list.Results {
		log.Printf("Importing magic item %d/%d: %s", i+1, len(list.Results), item.Name)

		var magicItem MagicItem
		if err := client.get("/magic-items/"+item.Index, &magicItem); err != nil {
			log.Printf("⚠️ Failed to fetch magic item %s: %v", item.Index, err)
			continue
		}

		if err := insertMagicItem(ctx, dbClient, &magicItem); err != nil {
			log.Printf("⚠️ Failed to insert magic item %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d magic items", len(list.Results))
	return nil
}

func insertMagicItem(ctx context.Context, dbClient *db.PostgresDB, magicItem *MagicItem) error {
	// Validar e sanitizar JSON field
	variantsJSON := []byte("[]")
	if len(magicItem.Variants) > 0 {
		if json.Valid(magicItem.Variants) {
			variantsJSON = magicItem.Variants
		}
	}

	query := `
		INSERT INTO dnd_magic_items (
			api_index, name, description, category, rarity, variants
		) VALUES (
			$1, $2, $3, $4, $5, $6
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		magicItem.Index, magicItem.Name, strings.Join(magicItem.Description, "\n\n"),
		magicItem.Category.Name, magicItem.Rarity.Name, variantsJSON,
	)

	return err
}

// NOVA FUNÇÃO: Import backgrounds
func importBackgrounds(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing backgrounds...")

	var list APIList
	if err := client.get("/backgrounds", &list); err != nil {
		return err
	}

	for i, item := range list.Results {
		log.Printf("Importing background %d/%d: %s", i+1, len(list.Results), item.Name)

		var background Background
		if err := client.get("/backgrounds/"+item.Index, &background); err != nil {
			log.Printf("⚠️ Failed to fetch background %s: %v", item.Index, err)
			continue
		}

		if err := insertBackground(ctx, dbClient, &background); err != nil {
			log.Printf("⚠️ Failed to insert background %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d backgrounds", len(list.Results))
	return nil
}

func insertBackground(ctx context.Context, dbClient *db.PostgresDB, background *Background) error {
	// Validar e sanitizar JSON fields
	proficienciesJSON := sanitizeJSON(background.StartingProficiencies)
	languageOptionsJSON := sanitizeJSON(background.LanguageOptions)
	equipmentJSON := sanitizeJSON(background.StartingEquipment)
	equipmentOptionsJSON := sanitizeJSON(background.StartingEquipmentOptions)
	featureJSON := sanitizeJSON(background.Feature)
	traitsJSON := sanitizeJSON(background.PersonalityTraits)
	idealsJSON := sanitizeJSON(background.Ideals)
	bondsJSON := sanitizeJSON(background.Bonds)
	flawsJSON := sanitizeJSON(background.Flaws)

	query := `
		INSERT INTO dnd_backgrounds (
			api_index, name, starting_proficiencies, language_options, starting_equipment,
			starting_equipment_options, feature, personality_traits, ideals, bonds, flaws
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		background.Index, background.Name, proficienciesJSON, languageOptionsJSON, equipmentJSON,
		equipmentOptionsJSON, featureJSON, traitsJSON, idealsJSON, bondsJSON, flawsJSON,
	)

	return err
}

// NOVA FUNÇÃO: Import features
func importFeatures(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing features...")

	var list APIList
	if err := client.get("/features", &list); err != nil {
		return err
	}

	for i, item := range list.Results {
		log.Printf("Importing feature %d/%d: %s", i+1, len(list.Results), item.Name)

		var feature Feature
		if err := client.get("/features/"+item.Index, &feature); err != nil {
			log.Printf("⚠️ Failed to fetch feature %s: %v", item.Index, err)
			continue
		}

		if err := insertFeature(ctx, dbClient, &feature); err != nil {
			log.Printf("⚠️ Failed to insert feature %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d features", len(list.Results))
	return nil
}

func insertFeature(ctx context.Context, dbClient *db.PostgresDB, feature *Feature) error {
	// Validar e sanitizar JSON field
	prerequisitesJSON := sanitizeJSON(feature.Prerequisites)

	query := `
		INSERT INTO dnd_features (
			api_index, name, level, class_name, subclass_name, description, prerequisites
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		feature.Index, feature.Name, feature.Level, feature.Class.Name, feature.Subclass.Name,
		strings.Join(feature.Description, "\n\n"), prerequisitesJSON,
	)

	return err
}

// Função helper para sanitizar JSON
func sanitizeJSON(data json.RawMessage) []byte {
	if len(data) > 0 && json.Valid(data) {
		return data
	}
	return []byte("{}")
}

// FUNÇÕES EXISTENTES (mantidas iguais)
func importMonsters(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing monsters...")

	var list APIList
	if err := client.get("/monsters", &list); err != nil {
		return err
	}

	log.Printf("Found %d monsters to import", len(list.Results))

	for i, item := range list.Results {
		log.Printf("Importing monster %d/%d: %s", i+1, len(list.Results), item.Name)

		var monster Monster
		if err := client.get("/monsters/"+item.Index, &monster); err != nil {
			log.Printf("⚠️ Failed to fetch monster %s: %v", item.Index, err)
			continue
		}

		if err := insertMonster(ctx, dbClient, &monster); err != nil {
			log.Printf("⚠️ Failed to insert monster %s: %v", item.Index, err)
			continue
		}

		// Rate limiting
		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d monsters", len(list.Results))
	return nil
}

func insertMonster(ctx context.Context, dbClient *db.PostgresDB, monster *Monster) error {
	query := `
		INSERT INTO dnd_monsters (
			api_index, name, size, type, subtype, alignment, armor_class, hit_points, hit_dice, speed,
			strength, dexterity, constitution, intelligence, wisdom, charisma,
			challenge_rating, xp, proficiency_bonus,
			damage_vulnerabilities, damage_resistances, damage_immunities, condition_immunities,
			senses, languages, special_abilities, actions, legendary_actions
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16,
			$17, $18, $19,
			$20, $21, $22, $23,
			$24, $25, $26, $27, $28
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	// Processar speed
	speedJSON, _ := json.Marshal(monster.Speed.Map)

	// Processar senses de forma flexível
	var sensesJSON []byte
	if len(monster.Senses.Map) > 0 {
		sensesJSON, _ = json.Marshal(monster.Senses.Map)
	} else if monster.Senses.String != "" {
		// Criar um objeto simples se for string
		sensesMap := map[string]string{"passive_perception": monster.Senses.String}
		sensesJSON, _ = json.Marshal(sensesMap)
	} else {
		sensesJSON, _ = json.Marshal(map[string]string{})
	}

	// Tratamento de valores nil/zero
	armorClass := monster.ArmorClass.Simple
	if armorClass == 0 {
		armorClass = 10 // AC padrão
	}

	xp := monster.XP
	if xp == 0 && monster.ChallengeRating > 0 {
		// Calcular XP baseado no CR se não fornecido
		xpTable := map[float64]int{
			0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
			1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
			6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
			11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
			16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
		}
		if val, exists := xpTable[monster.ChallengeRating]; exists {
			xp = val
		}
	}

	_, err := dbClient.DB.ExecContext(ctx, query,
		monster.Index, monster.Name, monster.Size, monster.Type, monster.Subtype, monster.Alignment,
		armorClass, monster.HitPoints, monster.HitDice, speedJSON,
		monster.Strength, monster.Dexterity, monster.Constitution, monster.Intelligence, monster.Wisdom, monster.Charisma,
		monster.ChallengeRating, xp, monster.ProficiencyBonus,
		pq.Array(monster.DamageVulnerabilities), pq.Array(monster.DamageResistances),
		pq.Array(monster.DamageImmunities), pq.Array([]string(monster.ConditionImmunities)),
		sensesJSON, monster.Languages, monster.SpecialAbilities, monster.Actions, monster.LegendaryActions,
	)

	return err
}

func importSpells(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing spells...")

	var list APIList
	if err := client.get("/spells", &list); err != nil {
		return err
	}

	log.Printf("Found %d spells to import", len(list.Results))

	for i, item := range list.Results {
		log.Printf("Importing spell %d/%d: %s", i+1, len(list.Results), item.Name)

		var spell Spell
		if err := client.get("/spells/"+item.Index, &spell); err != nil {
			log.Printf("⚠️ Failed to fetch spell %s: %v", item.Index, err)
			continue
		}

		if err := insertSpell(ctx, dbClient, &spell); err != nil {
			log.Printf("⚠️ Failed to insert spell %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d spells", len(list.Results))
	return nil
}

func insertSpell(ctx context.Context, dbClient *db.PostgresDB, spell *Spell) error {
	var classes []string
	for _, class := range spell.Classes {
		classes = append(classes, strings.ToLower(class.Name))
	}

	query := `
		INSERT INTO dnd_spells (
			api_index, name, level, school, casting_time, range, components, duration,
			concentration, ritual, description, higher_level, material, classes
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		spell.Index, spell.Name, spell.Level, strings.ToLower(spell.School.Name),
		spell.CastingTime, spell.Range, strings.Join(spell.Components, ","), spell.Duration,
		spell.Concentration, spell.Ritual, strings.Join(spell.Description, "\n\n"),
		strings.Join(spell.HigherLevel, "\n\n"), spell.Material, pq.Array(classes),
	)

	return err
}

func importClasses(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing classes...")

	var list APIList
	if err := client.get("/classes", &list); err != nil {
		return err
	}

	for i, item := range list.Results {
		log.Printf("Importing class %d/%d: %s", i+1, len(list.Results), item.Name)

		var class Class
		if err := client.get("/classes/"+item.Index, &class); err != nil {
			log.Printf("⚠️ Failed to fetch class %s: %v", item.Index, err)
			continue
		}

		if err := insertClass(ctx, dbClient, &class); err != nil {
			log.Printf("⚠️ Failed to insert class %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d classes", len(list.Results))
	return nil
}

func insertClass(ctx context.Context, dbClient *db.PostgresDB, class *Class) error {
	var savingThrows []string
	for _, st := range class.SavingThrows {
		savingThrows = append(savingThrows, strings.ToLower(st.Name))
	}

	// Validar e sanitizar JSON fields
	proficienciesJSON := []byte("{}")
	if len(class.Proficiencies) > 0 {
		if json.Valid(class.Proficiencies) {
			proficienciesJSON = class.Proficiencies
		}
	}

	spellcastingJSON := []byte("{}")
	if len(class.Spellcasting) > 0 {
		if json.Valid(class.Spellcasting) {
			spellcastingJSON = class.Spellcasting
		}
	}

	classLevelsJSON := []byte("{}")
	if len(class.ClassLevels) > 0 {
		if json.Valid(class.ClassLevels) {
			classLevelsJSON = class.ClassLevels
		}
	}

	query := `
		INSERT INTO dnd_classes (
			api_index, name, hit_die, proficiencies, saving_throws, spellcasting, spellcasting_ability, class_levels
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		class.Index, class.Name, class.HitDie, proficienciesJSON, pq.Array(savingThrows),
		spellcastingJSON, class.SpellcastingAbility.Name, classLevelsJSON,
	)

	return err
}

func importRaces(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing races...")

	var list APIList
	if err := client.get("/races", &list); err != nil {
		return err
	}

	for i, item := range list.Results {
		log.Printf("Importing race %d/%d: %s", i+1, len(list.Results), item.Name)

		var race Race
		if err := client.get("/races/"+item.Index, &race); err != nil {
			log.Printf("⚠️ Failed to fetch race %s: %v", item.Index, err)
			continue
		}

		if err := insertRace(ctx, dbClient, &race); err != nil {
			log.Printf("⚠️ Failed to insert race %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d races", len(list.Results))
	return nil
}

func insertRace(ctx context.Context, dbClient *db.PostgresDB, race *Race) error {
	var subraces []string
	for _, sr := range race.Subraces {
		subraces = append(subraces, sr.Name)
	}

	// Validar e sanitizar JSON fields
	abilityBonusesJSON := []byte("[]")
	if len(race.AbilityBonuses) > 0 {
		if json.Valid(race.AbilityBonuses) {
			abilityBonusesJSON = race.AbilityBonuses
		}
	}

	traitsJSON := []byte("[]")
	if len(race.Traits) > 0 {
		if json.Valid(race.Traits) {
			traitsJSON = race.Traits
		}
	}

	languagesJSON := []byte("[]")
	if len(race.Languages) > 0 {
		if json.Valid(race.Languages) {
			languagesJSON = race.Languages
		}
	}

	proficienciesJSON := []byte("[]")
	if len(race.Proficiencies) > 0 {
		if json.Valid(race.Proficiencies) {
			proficienciesJSON = race.Proficiencies
		}
	}

	query := `
		INSERT INTO dnd_races (
			api_index, name, speed, size, size_description, ability_bonuses, traits, languages, proficiencies, subraces
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		race.Index, race.Name, race.Speed, race.Size, race.SizeDescription,
		abilityBonusesJSON, traitsJSON, languagesJSON, proficienciesJSON, pq.Array(subraces),
	)

	return err
}

func importEquipment(ctx context.Context, client *DNDClient, dbClient *db.PostgresDB) error {
	log.Println("Importing equipment...")

	var list APIList
	if err := client.get("/equipment", &list); err != nil {
		return err
	}

	for i, item := range list.Results {
		log.Printf("Importing equipment %d/%d: %s", i+1, len(list.Results), item.Name)

		var equipment Equipment
		if err := client.get("/equipment/"+item.Index, &equipment); err != nil {
			log.Printf("⚠️ Failed to fetch equipment %s: %v", item.Index, err)
			continue
		}

		if err := insertEquipment(ctx, dbClient, &equipment); err != nil {
			log.Printf("⚠️ Failed to insert equipment %s: %v", item.Index, err)
			continue
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Imported %d equipment items", len(list.Results))
	return nil
}

func insertEquipment(ctx context.Context, dbClient *db.PostgresDB, equipment *Equipment) error {
	var properties []string
	for _, prop := range equipment.Properties {
		properties = append(properties, prop.Name)
	}

	// Validar e sanitizar JSON fields
	damageJSON := []byte("{}")
	if len(equipment.Damage) > 0 {
		if json.Valid(equipment.Damage) {
			damageJSON = equipment.Damage
		}
	}

	armorClassJSON := []byte("{}")
	if len(equipment.ArmorClass) > 0 {
		if json.Valid(equipment.ArmorClass) {
			armorClassJSON = equipment.ArmorClass
		}
	}

	query := `
		INSERT INTO dnd_equipment (
			api_index, name, equipment_category, cost_quantity, cost_unit, weight,
			weapon_category, weapon_range, damage, properties, armor_category, armor_class,
			description, special
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
		) ON CONFLICT (api_index) DO UPDATE SET
			name = EXCLUDED.name,
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := dbClient.DB.ExecContext(ctx, query,
		equipment.Index, equipment.Name, equipment.EquipmentCategory.Name,
		equipment.Cost.Quantity, equipment.Cost.Unit, equipment.Weight,
		equipment.WeaponCategory, equipment.WeaponRange, damageJSON, pq.Array(properties),
		equipment.ArmorCategory, armorClassJSON, strings.Join(equipment.Description, "\n\n"), pq.Array(equipment.Special),
	)

	return err
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func countRecords(ctx context.Context, dbClient *db.PostgresDB, tableName string) (int, error) {
	var count int
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)
	err := dbClient.DB.GetContext(ctx, &count, query)
	return count, err
}

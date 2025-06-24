package db

import (
	"context"
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"

	"rpg-saas-backend/internal/models"
)

type PostgresDB struct {
	DB *sqlx.DB
}

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

func NewPostgresDB(cfg Config) (*PostgresDB, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	db, err := sqlx.Connect("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping PostgreSQL: %w", err)
	}

	log.Println("Successfully connected to PostgreSQL")
	return &PostgresDB{DB: db}, nil
}

func (p *PostgresDB) Close() error {
	return p.DB.Close()
}

// ========================================
// NPC OPERATIONS
// ========================================

func (p *PostgresDB) GetNPCs(ctx context.Context, limit, offset int) ([]models.NPC, error) {
	npcs := []models.NPC{}
	query := `SELECT * FROM npcs ORDER BY id LIMIT $1 OFFSET $2`

	err := p.DB.SelectContext(ctx, &npcs, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch NPCs: %w", err)
	}

	return npcs, nil
}

func (p *PostgresDB) GetNPCByID(ctx context.Context, id int) (*models.NPC, error) {
	var npc models.NPC
	query := `SELECT * FROM npcs WHERE id = $1`

	err := p.DB.GetContext(ctx, &npc, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch NPC with ID %d: %w", id, err)
	}

	return &npc, nil
}

func (p *PostgresDB) CreateNPC(ctx context.Context, npc *models.NPC) error {
	query := `
		INSERT INTO npcs 
		(name, description, level, race, class, attributes, abilities, equipment, hp, ca, campaign_id) 
		VALUES 
		($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at
	`

	row := p.DB.QueryRowContext(ctx, query,
		npc.Name, npc.Description, npc.Level, npc.Race, npc.Class,
		npc.Attributes, npc.Abilities, npc.Equipment, npc.HP, npc.CA, nil, // campaign_id pode ser nil
	)

	return row.Scan(&npc.ID, &npc.CreatedAt)
}

func (p *PostgresDB) UpdateNPC(ctx context.Context, npc *models.NPC) error {
	query := `
		UPDATE npcs SET
		name = $1, description = $2, level = $3, race = $4, class = $5,
		attributes = $6, abilities = $7, equipment = $8, hp = $9, ca = $10
		WHERE id = $11
	`

	_, err := p.DB.ExecContext(ctx, query,
		npc.Name, npc.Description, npc.Level, npc.Race, npc.Class,
		npc.Attributes, npc.Abilities, npc.Equipment, npc.HP, npc.CA, npc.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update NPC with ID %d: %w", npc.ID, err)
	}

	return nil
}

func (p *PostgresDB) DeleteNPC(ctx context.Context, id int) error {
	query := `DELETE FROM npcs WHERE id = $1`

	_, err := p.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete NPC with ID %d: %w", id, err)
	}

	return nil
}

// ========================================
// ENCOUNTER OPERATIONS
// ========================================

func (p *PostgresDB) GetEncounters(ctx context.Context, limit, offset int) ([]models.Encounter, error) {
	encounters := []models.Encounter{}
	query := `SELECT * FROM encounters ORDER BY id LIMIT $1 OFFSET $2`

	err := p.DB.SelectContext(ctx, &encounters, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch encounters: %w", err)
	}

	for i := range encounters {
		monsters, err := p.GetMonstersByEncounterID(ctx, encounters[i].ID)
		if err != nil {
			return nil, err
		}
		encounters[i].Monsters = monsters
	}

	return encounters, nil
}

func (p *PostgresDB) GetEncounterByID(ctx context.Context, id int) (*models.Encounter, error) {
	var encounter models.Encounter
	query := `SELECT * FROM encounters WHERE id = $1`

	err := p.DB.GetContext(ctx, &encounter, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch encounter with ID %d: %w", id, err)
	}

	monsters, err := p.GetMonstersByEncounterID(ctx, id)
	if err != nil {
		return nil, err
	}
	encounter.Monsters = monsters

	return &encounter, nil
}

func (p *PostgresDB) GetMonstersByEncounterID(ctx context.Context, encounterID int) ([]models.Monster, error) {
	monsters := []models.Monster{}
	query := `SELECT * FROM encounter_monsters WHERE encounter_id = $1`

	err := p.DB.SelectContext(ctx, &monsters, query, encounterID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch monsters for encounter ID %d: %w", encounterID, err)
	}

	return monsters, nil
}

func (p *PostgresDB) CreateEncounter(ctx context.Context, encounter *models.Encounter) error {
	tx, err := p.DB.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO encounters 
		(theme, difficulty, total_xp, player_level, player_count, campaign_id) 
		VALUES 
		($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`

	row := tx.QueryRowContext(ctx, query,
		encounter.Theme, encounter.Difficulty, encounter.TotalXP,
		encounter.PlayerLevel, encounter.PlayerCount, nil, // campaign_id pode ser nil
	)

	err = row.Scan(&encounter.ID, &encounter.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert encounter: %w", err)
	}

	for i := range encounter.Monsters {
		encounter.Monsters[i].EncounterID = encounter.ID
		err = p.createMonsterTx(ctx, tx, &encounter.Monsters[i])
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (p *PostgresDB) createMonsterTx(ctx context.Context, tx *sqlx.Tx, monster *models.Monster) error {
	query := `
		INSERT INTO encounter_monsters 
		(encounter_id, name, xp, cr) 
		VALUES 
		($1, $2, $3, $4)
		RETURNING id, created_at
	`

	row := tx.QueryRowContext(ctx, query,
		monster.EncounterID, monster.Name, monster.XP, monster.CR,
	)

	return row.Scan(&monster.ID, &monster.CreatedAt)
}

// ========================================
// PC METHODS (LEGACY) - KEPT FOR CAMPAIGN INTEGRATION
// ========================================

// GetPCByID - método mantido para compatibilidade com campanhas
// func (p *PostgresDB) GetPCByID(ctx context.Context, id int) (*models.PC, error) {
// 	var pc models.PC
// 	query := `
// 		SELECT id, name, description, level, race, class, background, alignment,
// 		       attributes, abilities, equipment, hp, ca, player_name, player_id, created_at
// 		FROM pcs
// 		WHERE id = $1
// 	`

// 	err := p.DB.GetContext(ctx, &pc, query, id)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to fetch PC with ID %d: %w", id, err)
// 	}

// 	return &pc, nil
// }

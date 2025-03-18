package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"rpg-saas-backend/internal/models"
)

// NPCRepository gerencia o acesso ao banco para NPCs
type NPCRepository struct {
	db *sql.DB
}

// NewNPCRepository cria um novo repositório para NPCs
func NewNPCRepository(db *sql.DB) *NPCRepository {
	return &NPCRepository{db: db}
}

// GetAll retorna todos os NPCs do banco de dados
func (r *NPCRepository) GetAll() ([]models.NPC, error) {
	npcs := []models.NPC{}

	// Consulta básica dos dados principais
	query := `
        SELECT id, name, description, level, race, class, hp, ca, created_at
        FROM npcs
        ORDER BY id DESC
    `
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("erro ao consultar NPCs: %w", err)
	}
	defer rows.Close()

	// Processa os resultados
	for rows.Next() {
		var npc models.NPC
		var createdAt sql.NullTime

		err := rows.Scan(
			&npc.ID,
			&npc.Name,
			&npc.Description,
			&npc.Level,
			&npc.Race,
			&npc.Class,
			&npc.HP,
			&npc.CA,
			&createdAt,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao processar registro de NPC: %w", err)
		}

		if createdAt.Valid {
			npc.CreatedAt = createdAt.Time
		}

		// Busca dados JSON complementares
		if err := r.loadNPCDetails(&npc); err != nil {
			return nil, err
		}

		npcs = append(npcs, npc)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("erro ao iterar NPCs: %w", err)
	}

	return npcs, nil
}

// GetByID busca um NPC específico pelo ID
func (r *NPCRepository) GetByID(id int) (models.NPC, error) {
	var npc models.NPC
	var createdAt sql.NullTime

	query := `
        SELECT id, name, description, level, race, class, hp, ca, created_at
        FROM npcs
        WHERE id = $1
    `
	err := r.db.QueryRow(query, id).Scan(
		&npc.ID,
		&npc.Name,
		&npc.Description,
		&npc.Level,
		&npc.Race,
		&npc.Class,
		&npc.HP,
		&npc.CA,
		&createdAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return models.NPC{}, fmt.Errorf("NPC com ID %d não encontrado", id)
		}
		return models.NPC{}, fmt.Errorf("erro ao buscar NPC: %w", err)
	}

	if createdAt.Valid {
		npc.CreatedAt = createdAt.Time
	}

	// Busca dados JSON complementares
	if err := r.loadNPCDetails(&npc); err != nil {
		return models.NPC{}, err
	}

	return npc, nil
}

// Create adiciona um novo NPC no banco de dados
func (r *NPCRepository) Create(npc models.NPC) (int, error) {
	// Converte campos complexos para JSON
	attributesJSON, err := json.Marshal(npc.Attributes)
	if err != nil {
		return 0, fmt.Errorf("erro ao serializar atributos: %w", err)
	}

	abilitiesJSON, err := json.Marshal(npc.Abilities)
	if err != nil {
		return 0, fmt.Errorf("erro ao serializar habilidades: %w", err)
	}

	equipmentJSON, err := json.Marshal(npc.Equipment)
	if err != nil {
		return 0, fmt.Errorf("erro ao serializar equipamentos: %w", err)
	}

	// Inicia uma transação
	tx, err := r.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("erro ao iniciar transação: %w", err)
	}

	// Tenta inserir o NPC
	var id int
	query := `
        INSERT INTO npcs (name, description, level, race, class, attributes, abilities, equipment, hp, ca, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
    `

	err = tx.QueryRow(
		query,
		npc.Name,
		npc.Description,
		npc.Level,
		npc.Race,
		npc.Class,
		attributesJSON,
		abilitiesJSON,
		equipmentJSON,
		npc.HP,
		npc.CA,
		time.Now(),
	).Scan(&id)

	if err != nil {
		tx.Rollback()
		return 0, fmt.Errorf("erro ao inserir NPC: %w", err)
	}

	// Confirma a transação
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("erro ao confirmar transação: %w", err)
	}

	return id, nil
}

// Update atualiza um NPC existente
func (r *NPCRepository) Update(id int, npc models.NPC) error {
	// Verifica se o NPC existe
	exists, err := r.npcExists(id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("NPC com ID %d não encontrado", id)
	}

	// Converte campos complexos para JSON
	attributesJSON, err := json.Marshal(npc.Attributes)
	if err != nil {
		return fmt.Errorf("erro ao serializar atributos: %w", err)
	}

	abilitiesJSON, err := json.Marshal(npc.Abilities)
	if err != nil {
		return fmt.Errorf("erro ao serializar habilidades: %w", err)
	}

	equipmentJSON, err := json.Marshal(npc.Equipment)
	if err != nil {
		return fmt.Errorf("erro ao serializar equipamentos: %w", err)
	}

	// Inicia uma transação
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("erro ao iniciar transação: %w", err)
	}

	// Atualiza o NPC
	query := `
        UPDATE npcs
        SET name = $1, description = $2, level = $3, race = $4, class = $5,
            attributes = $6, abilities = $7, equipment = $8, hp = $9, ca = $10
        WHERE id = $11
    `

	_, err = tx.Exec(
		query,
		npc.Name,
		npc.Description,
		npc.Level,
		npc.Race,
		npc.Class,
		attributesJSON,
		abilitiesJSON,
		equipmentJSON,
		npc.HP,
		npc.CA,
		id,
	)

	if err != nil {
		tx.Rollback()
		return fmt.Errorf("erro ao atualizar NPC: %w", err)
	}

	// Confirma a transação
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("erro ao confirmar transação: %w", err)
	}

	return nil
}

// Delete remove um NPC do banco de dados
func (r *NPCRepository) Delete(id int) error {
	// Verifica se o NPC existe
	exists, err := r.npcExists(id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("NPC com ID %d não encontrado", id)
	}

	// Executa a deleção
	_, err = r.db.Exec("DELETE FROM npcs WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("erro ao excluir NPC: %w", err)
	}

	return nil
}

// Métodos auxiliares

// npcExists verifica se um NPC com o ID especificado existe
func (r *NPCRepository) npcExists(id int) (bool, error) {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM npcs WHERE id = $1)"
	err := r.db.QueryRow(query, id).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("erro ao verificar existência do NPC: %w", err)
	}
	return exists, nil
}

// loadNPCDetails carrega os campos JSON de um NPC
func (r *NPCRepository) loadNPCDetails(npc *models.NPC) error {
	var attributesJSON, abilitiesJSON, equipmentJSON []byte

	query := "SELECT attributes, abilities, equipment FROM npcs WHERE id = $1"
	err := r.db.QueryRow(query, npc.ID).Scan(&attributesJSON, &abilitiesJSON, &equipmentJSON)
	if err != nil {
		return fmt.Errorf("erro ao carregar detalhes do NPC: %w", err)
	}

	// Desserializa os atributos
	if len(attributesJSON) > 0 {
		if err := json.Unmarshal(attributesJSON, &npc.Attributes); err != nil {
			return fmt.Errorf("erro ao desserializar atributos: %w", err)
		}
	} else {
		npc.Attributes = make(map[string]int)
	}

	// Desserializa as habilidades
	if len(abilitiesJSON) > 0 {
		if err := json.Unmarshal(abilitiesJSON, &npc.Abilities); err != nil {
			return fmt.Errorf("erro ao desserializar habilidades: %w", err)
		}
	} else {
		npc.Abilities = []string{}
	}

	// Desserializa os equipamentos
	if len(equipmentJSON) > 0 {
		if err := json.Unmarshal(equipmentJSON, &npc.Equipment); err != nil {
			return fmt.Errorf("erro ao desserializar equipamentos: %w", err)
		}
	} else {
		npc.Equipment = []string{}
	}

	return nil
}
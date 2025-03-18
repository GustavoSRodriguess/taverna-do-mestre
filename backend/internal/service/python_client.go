package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"rpg-saas-backend/internal/models"
)

// PythonClient gerencia a comunicação com a API Python
type PythonClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewPythonClient cria um novo cliente para a API Python
func NewPythonClient(baseURL string) *PythonClient {
	return &PythonClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: time.Second * 10,
		},
	}
}

// GenerateNPC solicita a geração de um NPC à API Python
func (c *PythonClient) GenerateNPC(level int, attributesMethod string, manual bool) (models.NPC, error) {
	// Preparar requisição para o serviço Python
	reqBody := map[string]interface{}{
		"level":             level,
		"attributes_method": attributesMethod,
		"manual":            manual,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return models.NPC{}, fmt.Errorf("erro ao serializar requisição: %w", err)
	}

	resp, err := c.httpClient.Post(c.baseURL+"/generate-npc", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return models.NPC{}, fmt.Errorf("falha ao comunicar com API Python: %w", err)
	}
	defer resp.Body.Close()

	// Verificar status da resposta
	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return models.NPC{}, fmt.Errorf("API Python retornou erro (código %d): %s", resp.StatusCode, string(body))
	}

	// Decodificar resposta
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return models.NPC{}, fmt.Errorf("falha ao ler resposta: %w", err)
	}

	var npc models.NPC
	if err := json.Unmarshal(body, &npc); err != nil {
		return models.NPC{}, fmt.Errorf("falha ao processar resposta: %w", err)
	}

	return npc, nil
}

// GenerateEncounter solicita a geração de um encontro à API Python
func (c *PythonClient) GenerateEncounter(playerLevel int, playerCount int, difficulty string) (models.Encounter, error) {
    // Implementação similar ao GenerateNPC
    // ...
    return models.Encounter{}, nil
}

// GenerateMap solicita a geração de um mapa à API Python
func (c *PythonClient) GenerateMap(width int, height int, scale float64) (map[string]interface{}, error) {
    // Implementação similar aos outros métodos
    // ...
    return nil, nil
}
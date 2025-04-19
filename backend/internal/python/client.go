package python

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client gerencia a comunicação com o serviço Python
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewClient cria um novo cliente para o serviço Python
func NewClient(baseURL string, timeout time.Duration) *Client {
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// makeRequest é um método auxiliar para fazer requisições HTTP
func (c *Client) makeRequest(ctx context.Context, method, endpoint string, body interface{}, response interface{}) error {
	// Prepara o corpo da requisição, se houver
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewReader(jsonData)
	}

	// Cria a requisição HTTP
	url := fmt.Sprintf("%s%s", c.BaseURL, endpoint)
	req, err := http.NewRequestWithContext(ctx, method, url, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Define os cabeçalhos
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	// Executa a requisição
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// Verifica o código de status
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		fmt.Printf("Erro da API (%s): %s\n", url, string(bodyBytes))
		return fmt.Errorf("API returned non-200 status: %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	// Decodifica a resposta
	if response != nil {
		if err := json.NewDecoder(resp.Body).Decode(response); err != nil {
			return fmt.Errorf("failed to decode response: %w", err)
		}
	}

	return nil
}

// HealthCheck verifica se o serviço Python está ativo
func (c *Client) HealthCheck(ctx context.Context) error {
	var response map[string]string
	err := c.makeRequest(ctx, http.MethodGet, "/health", nil, &response)
	if err != nil {
		return err
	}

	if status, ok := response["status"]; !ok || status != "healthy" {
		return fmt.Errorf("unhealthy service status: %s", status)
	}

	return nil
}

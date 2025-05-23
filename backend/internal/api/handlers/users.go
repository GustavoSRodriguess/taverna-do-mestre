package handlers

import (
	"encoding/json"
	"log" // Adicionado import para log
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"

	"rpg-saas-backend/internal/api/middleware" // Adicionado import para o middleware
	"rpg-saas-backend/internal/auth"           // Adicionado import para o pacote auth
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
)

type userHandler struct {
	DB *db.PostgresDB
}

func NewUserHandler(db *db.PostgresDB) *userHandler {
	return &userHandler{DB: db}
}

func (h *userHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.DB.GetAllUsers(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(users)
}

func (h *userHandler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid user ID", http.StatusBadRequest)
		return
	}

	user, err := h.DB.GetUserByID(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(user)
}

// GetCurrentUser retorna os dados do usuário autenticado
func (h *userHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	// Obter o ID do usuário do contexto (inserido pelo AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "ID do usuário não encontrado no contexto", http.StatusInternalServerError)
		return
	}

	// Buscar o usuário no banco de dados
	user, err := h.DB.GetUserByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "Usuário não encontrado", http.StatusNotFound)
		return
	}

	// Retornar os dados do usuário
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *userHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	} // Fechamento da struct req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { // Correção: 'if' em vez de 'f'

		http.Error(w, "requisição inválida", http.StatusBadRequest)
		return
	}

	log.Printf("Tentando login com email: [%s]", req.Email) // Adicionando log do email recebido
	user, err := h.DB.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "usuário não encontrado", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		http.Error(w, "senha inválida", http.StatusUnauthorized)
		return
	}

	// Gerar token JWT
	tokenString, err := auth.GenerateToken(user)
	if err != nil {
		log.Printf("Erro ao gerar token JWT para o usuário %s: %v", user.Email, err)
		http.Error(w, "erro ao gerar token de autenticação", http.StatusInternalServerError)
		return
	}

	// Retornar usuário e token
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user":  user,
		"token": tokenString,
	})
}

func (h *userHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "invalid request payload", http.StatusBadRequest)
		return
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	user.Password = string(hashedPwd)
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	if err := h.DB.CreateUser(r.Context(), &user); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Gerar token JWT para o novo usuário
	// É importante buscar o usuário recém-criado para obter o ID populado pelo banco
	createdUser, err := h.DB.GetUserByEmail(r.Context(), user.Email)
	if err != nil {
		log.Printf("Erro ao buscar usuário recém-criado %s para gerar token: %v", user.Email, err)
		// Decide-se por retornar sucesso no registro mesmo que o token não seja gerado aqui,
		// o usuário pode logar para obter um token.
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(user) // Retorna o usuário sem token neste caso de erro
		return
	}

	tokenString, err := auth.GenerateToken(createdUser)
	if err != nil {
		log.Printf("Erro ao gerar token JWT para o novo usuário %s: %v", createdUser.Email, err)
		// Decide-se por retornar sucesso no registro mesmo que o token não seja gerado aqui.
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(createdUser) // Retorna o usuário sem token neste caso de erro
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user":  createdUser,
		"token": tokenString,
	})
}

func (h *userHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid user ID", http.StatusBadRequest)
		return
	}

	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "invalid request payload", http.StatusBadRequest)
		return
	}
	user.ID = id
	user.UpdatedAt = time.Now()

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}
	user.Password = string(hashedPwd)

	if err := h.DB.UpdateUser(r.Context(), &user); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(user)
}

func (h *userHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid user ID", http.StatusBadRequest)
		return
	}

	if err := h.DB.DeleteUser(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copiar apenas go.mod e go.sum primeiro
COPY go.mod go.sum* ./

# Adicionar as dependências faltantes
RUN go get github.com/go-chi/chi/v5 && \
    go get github.com/go-chi/chi/v5/middleware && \
    go get github.com/jmoiron/sqlx

# Baixar todas as dependências
RUN go mod download

# Copiar o código fonte
COPY . .

# Corrigir os caminhos de importação
RUN find . -name "*.go" -type f -exec sed -i 's|github.com/seu-usuario/rpg-saas-go|rpg-saas-backend|g' {} \; && \
    find . -name "*.go" -type f -exec sed -i 's|github.com/GustavoSRodrigues/taverna-do-mestre|rpg-saas-backend|g' {} \;

# Compilar
RUN go build -o rpg-saas-backend ./cmd/server

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/rpg-saas-backend .

EXPOSE 8080
CMD ["./rpg-saas-backend"]
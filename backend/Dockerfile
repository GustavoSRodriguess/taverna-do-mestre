# Dockerfile.prod
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache git

# Copiar go mod files
COPY go.mod go.sum* ./
RUN go mod download

# Copiar código fonte
COPY . .

# Build com flags de produção
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o rpg-saas-backend ./cmd/server

# Imagem final minimalista
FROM alpine:3.18

# Instalar certificados SSL e timezone
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copiar binário compilado
COPY --from=builder /app/rpg-saas-backend .

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Executar
CMD ["./rpg-saas-backend"]
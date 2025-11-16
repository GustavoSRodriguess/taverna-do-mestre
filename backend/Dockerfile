FROM golang:1.23 AS builder

WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download

COPY . .

# Corrige os imports se necessário
RUN find . -name "*.go" -type f -exec sed -i 's|github.com/seu-usuario/rpg-saas-go|rpg-saas-backend|g' {} \; && \
    find . -name "*.go" -type f -exec sed -i 's|github.com/GustavoSRodrigues/taverna-do-mestre|rpg-saas-backend|g' {} \;

# Compilar binário estático compatível com Alpine
RUN CGO_ENABLED=0 GOOS=linux go build -o rpg-saas-backend ./cmd/server

# Imagem final
FROM debian:bookworm-slim

WORKDIR /app
COPY --from=builder /app/rpg-saas-backend .

EXPOSE 8080
CMD ["./rpg-saas-backend"]


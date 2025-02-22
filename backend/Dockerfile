FROM golang:1.20-alpine

WORKDIR /app

COPY . .

RUN go mod download

RUN go build -o rpg-saas-backend .

EXPOSE 8080

CMD ["./rpg-saas-backend"]
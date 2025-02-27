FROM golang:1.20-alpine

WORKDIR /app

COPY go.mod .
COPY go.sum .

# Initialize the module and download dependencies
RUN go mod download && go mod tidy

# Copy the rest of the application code
COPY . .

# Build the application
RUN go build -o rpg-saas-backend .

EXPOSE 8080

CMD ["./rpg-saas-backend"]
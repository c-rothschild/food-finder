FROM golang:1.24.3-alpine

WORKDIR /app

# Install air for live reloading
RUN go install github.com/air-verse/air@latest

# Copy go.mod and go.sum first, then download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of your code
COPY . .

EXPOSE 8000
CMD ["air"]

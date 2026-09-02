# Multi-stage Dockerfile for ProctorGuard API Gateway
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
COPY main.go ./
RUN go build -o api-gateway main.go

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/api-gateway .
EXPOSE 8080
CMD ["./api-gateway"]

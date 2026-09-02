# Multi-stage Dockerfile for ProctorGuard Fusion Engine
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
COPY main.go ./
RUN go build -o fusion-engine main.go

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/fusion-engine .
EXPOSE 8081
CMD ["./fusion-engine"]

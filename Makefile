.PHONY: dev dev-obs up infra infra-obs down clean logs ps

COMPOSE_BASE := docker-compose.yml
COMPOSE_DEV  := docker-compose.dev.yml
COMPOSE_OBS  := compose.observability.yml

# Full dev mode: local builds with hot reload (no observability stack)
dev:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) up --watch

# Dev mode with observability (Prometheus, Grafana, Loki, Tempo, OTel)
dev-obs:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) -f $(COMPOSE_OBS) up --watch

# Production mode: pre-built images, detached (includes observability)
up:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_OBS) up -d

# Infrastructure only (DBs, Kafka, gateway — no app services, no observability)
infra:
	docker compose -f $(COMPOSE_BASE) up -d \
		mongodb mongo-setup \
		kafka kafka-init kafka-connect kafka-connect-init \
		influxdb \
		traefik

# Infrastructure with observability
infra-obs:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_OBS) up -d \
		mongodb mongo-setup \
		kafka kafka-init kafka-connect kafka-connect-init \
		influxdb \
		loki prometheus grafana otel-collector \
		traefik

# Tear down containers, keep volumes
down:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) -f $(COMPOSE_OBS) down

# Tear down and wipe all data
clean:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) -f $(COMPOSE_OBS) down -v

# Follow logs from all services
logs:
	docker compose -f $(COMPOSE_BASE) logs -f

# Show service status
ps:
	docker compose -f $(COMPOSE_BASE) ps

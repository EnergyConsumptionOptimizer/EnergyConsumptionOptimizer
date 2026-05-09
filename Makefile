.PHONY: dev up infra down clean logs ps

COMPOSE_BASE := docker-compose.yml
COMPOSE_DEV  := docker-compose.dev.yml

# Full dev mode: local builds with hot reload
dev:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) up --watch

# Production mode: pre-built images, detached
up:
	docker compose -f $(COMPOSE_BASE) up -d

# Infrastructure only (DBs, Kafka, monitoring, gateway)
infra:
	docker compose -f $(COMPOSE_BASE) up -d \
		mongodb mongo-setup \
		kafka kafka-init kafka-connect \
		influxdb \
		loki prometheus grafana otel-collector \
		traefik

# Tear down containers, keep volumes
down:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) down

# Tear down and wipe all data
clean:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) down -v

# Follow logs from all services
logs:
	docker compose -f $(COMPOSE_BASE) logs -f

# Show service status
ps:
	docker compose -f $(COMPOSE_BASE) ps

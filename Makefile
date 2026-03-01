# =============================================================================
# SafeDetect — Developer Makefile
#
# Requirements: GNU Make, Docker, Docker Compose, Python 3.11+, Node.js 20+
# Windows users: run via WSL2 or Git Bash.
#
# Quick-start (Docker):
#   make setup && make up
#
# Quick-start (native dev):
#   make setup && make kafka
#   # then in separate terminals:
#   make dev-cv
#   make dev-bridge
#   make dev-dashboard
# =============================================================================

.PHONY: help setup up down logs kafka dev-cv dev-bridge dev-dashboard dev \
        build test lint clean

# Default target
help:
	@echo ""
	@echo "SafeDetect — Available targets"
	@echo "────────────────────────────────────────────────────────────"
	@echo "  make setup          Copy .env.example → .env (first-time setup)"
	@echo ""
	@echo "  Docker workflow:"
	@echo "  make up             Build and start all 5 services via Docker Compose"
	@echo "  make down           Stop and remove all containers"
	@echo "  make logs           Tail logs from all containers"
	@echo "  make build          Build Docker images without starting"
	@echo ""
	@echo "  Native dev workflow (Kafka in Docker, app services native):"
	@echo "  make kafka          Start only Kafka + Zookeeper in Docker"
	@echo "  make dev-cv         Run Python CV service (creates venv if needed)"
	@echo "  make dev-bridge     Run Node.js WS bridge"
	@echo "  make dev-dashboard  Run React webpack dev server"
	@echo ""
	@echo "  Quality:"
	@echo "  make test           Run Python tests (pytest) + JS tests (jest)"
	@echo "  make lint           Run flake8 (Python) + eslint (JS)"
	@echo ""
	@echo "  make clean          Remove containers, volumes, and venv"
	@echo "────────────────────────────────────────────────────────────"

# ---------------------------------------------------------------------------
# First-time setup
# ---------------------------------------------------------------------------
setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅  Created .env from .env.example — edit it before running."; \
	else \
		echo "ℹ️   .env already exists, skipping copy."; \
	fi

# ---------------------------------------------------------------------------
# Docker Compose — full stack
# ---------------------------------------------------------------------------
up: setup
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build

# ---------------------------------------------------------------------------
# Native dev — Kafka + Zookeeper only in Docker
# ---------------------------------------------------------------------------
kafka:
	docker compose up zookeeper kafka

# ---------------------------------------------------------------------------
# Native dev — Python CV service
# ---------------------------------------------------------------------------
VENV_DIR := backend_Python/.venv

dev-cv: $(VENV_DIR)
	@echo "▶  Starting CV service (native)..."
	@( \
		cd backend_Python && \
		KAFKA_HOST=localhost KAFKA_PORT=29092 \
		../.venv_cv/bin/python -m computer_vision.multi_camera_detector 2>/dev/null || \
		$(VENV_DIR)/bin/python -m computer_vision.multi_camera_detector \
	)

$(VENV_DIR):
	@echo "▶  Creating Python virtual environment at $(VENV_DIR)..."
	python3 -m venv $(VENV_DIR)
	$(VENV_DIR)/bin/pip install --upgrade pip
	$(VENV_DIR)/bin/pip install -r backend_Python/requirements.txt
	@echo "✅  Python venv ready at $(VENV_DIR)"

# ---------------------------------------------------------------------------
# Native dev — Node.js WS bridge
# ---------------------------------------------------------------------------
dev-bridge:
	@echo "▶  Starting WS bridge (native)..."
	cd Dashboard_Service/backend_Kafka && \
		npm install && \
		KAFKA_BROKER=localhost:29092 KAFKA_TOPIC=detections PORT=8082 node server.js

# ---------------------------------------------------------------------------
# Native dev — React dashboard (webpack dev server)
# ---------------------------------------------------------------------------
dev-dashboard:
	@echo "▶  Starting React dashboard dev server on :8080..."
	cd Dashboard_Service && npm install && npm run start

# ---------------------------------------------------------------------------
# Testing
# ---------------------------------------------------------------------------
test: test-python test-js

test-python: $(VENV_DIR)
	@echo "▶  Running Python tests..."
	$(VENV_DIR)/bin/pytest backend_Python/tests/ -v

test-js:
	@echo "▶  Running JS tests..."
	cd Dashboard_Service && npm test -- --watchAll=false

# ---------------------------------------------------------------------------
# Linting
# ---------------------------------------------------------------------------
lint: lint-python lint-js

lint-python: $(VENV_DIR)
	@echo "▶  Linting Python..."
	$(VENV_DIR)/bin/flake8 backend_Python/ shared/ --max-line-length=120 \
		--exclude=backend_Python/.venv,backend_Python/archive

lint-js:
	@echo "▶  Linting JS..."
	cd Dashboard_Service && npx eslint src/ backend_Kafka/ || true

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
clean:
	docker compose down --volumes --remove-orphans
	rm -rf $(VENV_DIR)
	rm -rf Dashboard_Service/node_modules
	rm -rf Dashboard_Service/backend_Kafka/node_modules
	rm -rf Dashboard_Service/dist
	@echo "✅  Cleaned containers, volumes, node_modules, venv, and dist."

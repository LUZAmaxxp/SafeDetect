# SafeDetect — Real-Time Blind Spot Detection System

SafeDetect is a vehicle safety system that detects objects in truck blind spots using YOLOv8, streams detections through Apache Kafka, and visualises them in real time on an interactive 3D dashboard.

---

## Architecture

```
USB / RTSP Cameras
        │
        ▼
 cv-service (Python + YOLOv8)
        │  kafka-python producer
        ▼
 Kafka  topic: detections
        │
        ▼
 ws-bridge (Node.js kafkajs consumer)
        │  WebSocket broadcast  :8081
        ▼
 dashboard (React + Three.js)  :80  (Docker) / :8080  (native dev)
```

### Services

| Service | Language | Location | Port(s) |
|---|---|---|---|
| `cv-service` | Python 3.11 / YOLOv8 | `backend_Python/` | — |
| `kafka` | Apache Kafka 7.4 | Docker image | 9092 (internal), 29092 (host) |
| `zookeeper` | Confluent Zookeeper 7.4 | Docker image | 2181 |
| `ws-bridge` | Node.js 20 | `Dashboard_Service/backend_Kafka/` | 8081 (WS), 8082 (HTTP) |
| `dashboard` | React 18 + Three.js | `Dashboard_Service/` | 80 (Docker), 8080 (dev) |

---

## Quick Start — Docker (recommended)

> **Requirements:** Docker Desktop, `make` (WSL2 or Git Bash on Windows)

```bash
# 1. Copy and configure environment variables
make setup          # copies .env.example → .env
# Edit .env if you need non-default values (camera IDs, secrets, etc.)

# 2. Build and start all five services
make up

# 3. Open the dashboard
#    http://localhost
```

Health-check: `curl http://localhost/health`

---

## Quick Start — Native Dev (Kafka in Docker, app services local)

> **Requirements:** Python 3.11+, Node.js 20+, Docker Desktop

```bash
make setup                # create .env

# Terminal 1 — start Kafka + Zookeeper in Docker
make kafka

# Terminal 2 — start Python CV service
make dev-cv

# Terminal 3 — start Node.js WS bridge
make dev-bridge

# Terminal 4 — start React webpack dev server
make dev-dashboard        # opens http://localhost:8080
```

---

## Environment Variables

Copy `.env.example` to `.env` and edit. The full reference is inside `.env.example`.
The most important variables:

| Variable | Docker default | Native dev value |
|---|---|---|
| `KAFKA_HOST` | `kafka` | `localhost` |
| `KAFKA_PORT` | `9092` | `29092` |
| `KAFKA_BROKER` (Node.js) | `kafka:9092` | `localhost:29092` |
| `LEFT_CAMERA_ID` | `0` | `0` |
| `DETECTION_SECRET_KEY` | *(set a strong value!)* | *(set a strong value!)* |

---

## Repository Layout

```
SafeDetect/
├── .env.example                 # canonical env-var reference — copy to .env
├── docker-compose.yml           # root: all 5 services in one command
├── Makefile                     # developer shortcuts (up/down/dev/test/lint)
├── shared/
│   └── config.py                # shared Python configuration
├── backend_Python/              # cv-service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── docker-compose.yml       # dev-only: Kafka + Zookeeper only
│   └── computer_vision/
│       ├── multi_camera_detector.py   # entry point
│       ├── kafka_producer.py
│       ├── detection.py
│       ├── blind_spot.py              # legacy — see archive/
│       └── archive/
│           ├── websocket_server.py
│           └── ...
└── Dashboard_Service/
    ├── Dockerfile               # two-stage: webpack build → nginx
    ├── nginx.conf               # serves SPA + proxies /ws → ws-bridge
    ├── webpack.config.js
    ├── package.json
    ├── src/
    │   ├── App.js
    │   ├── components/
    │   │   ├── Truck3D.js
    │   │   └── DetectionOverlay.js
    │   └── services/
    │       └── WebSocketService.js
    └── backend_Kafka/           # ws-bridge
        ├── Dockerfile
        ├── server.js
        ├── kafka_config.js
        └── package.json
```

---

## Make Targets

```
make help           # show all targets
make setup          # cp .env.example .env (safe, won't overwrite)
make up             # docker compose up --build
make down           # docker compose down
make logs           # tail all container logs
make build          # docker compose build (no start)
make kafka          # start only Kafka + Zookeeper (native dev)
make dev-cv         # run cv-service natively (creates venv automatically)
make dev-bridge     # run ws-bridge natively
make dev-dashboard  # run React webpack dev server
make test           # pytest + jest
make lint           # flake8 + eslint
make clean          # remove containers, volumes, venv, node_modules, dist
```

---

## Camera Configuration

Three camera zones are supported: `left`, `right`, and `rear`.

Each zone can use a USB webcam, RTSP stream, or video file (for testing):

```dotenv
# USB webcam (integer index)
LEFT_CAMERA_ID=0

# RTSP stream (overrides _ID when set)
LEFT_CAMERA_SRC=rtsp://admin:pass@192.168.1.10:554/stream

# Video file (useful for development without hardware)
LEFT_CAMERA_SRC=/app/videos/left.mp4
```

---

## Deployment Notes

- **GPU acceleration:** uncomment the `deploy.resources.reservations` block in `docker-compose.yml` and install `nvidia-container-toolkit`.
- **Camera devices in Docker:** the compose file mounts `/dev/video0`, `/dev/video1`, `/dev/video2`. Comment out any that don't exist on your host.
- **Production secret:** set a strong, random `DETECTION_SECRET_KEY` in `.env` — the default value triggers a warning at startup.
- **Remote Dashboard:** the WebSocket server IP defaults to `window.location.hostname` in the browser (works automatically in Docker). Use the ⚙️ Settings button to change it at runtime for remote deployments.

---

## CI/CD

GitHub Actions (`.github/workflows/ci-cd.yml`) runs on every push:
1. `lint-python` — flake8
2. `lint-js` — eslint
3. `test-python` — pytest
4. `build-docker` — build all Docker images
5. `push-docker` (main branch only) — push to container registry
6. `deploy` (main branch only) — Vercel deploy hook for the dashboard

Required repository secrets: `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `VERCEL_TOKEN`.

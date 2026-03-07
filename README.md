# SafeDetect — Real-Time Blind Spot Detection System

SafeDetect is a vehicle safety system that detects objects in truck blind spots using YOLOv8, streams detections through Apache Kafka, and visualises them in real time on an interactive 3D dashboard.

---

## Architecture

```
USB / RTSP Cameras
        │
        ▼
 cv-service (Python + YOLOv8)
        │  kafka-python producer → Kafka topic: detections
        ▼
 ws-bridge (Node.js kafkajs consumer)
        │  WebSocket broadcast  :8081
        ▼
 dashboard (React + Three.js)  :80 (Docker) / :8080 (native dev)
```

### Services

| Service | Language | Location | Port(s) |
|---|---|---|---|
| `cv-service` | Python 3.11 / YOLOv8 | `backend_Python/` | — |
| `kafka` | Apache Kafka 7.4 | Docker image | **9092** (internal Docker) / **29092** (host machine) |
| `zookeeper` | Confluent Zookeeper 7.4 | Docker image | 2181 |
| `ws-bridge` | Node.js 20 | `Dashboard_Service/backend_Kafka/` | 8081 (WS), 8082 (HTTP) |
| `dashboard` | React 18 + Three.js | `Dashboard_Service/` | 80 (Docker), 8080 (dev) |

> **Kafka port note:** Port 9092 is Kafka's internal Docker listener — it advertises `kafka:9092`, unreachable from the host OS. Always use port **29092** for any service running natively outside Docker.

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
# shared/config.py defaults to localhost:29092 — no env vars needed
make dev-cv
# Or manually:
# cd backend_Python && KAFKA_HOST=localhost KAFKA_PORT=29092 python -m computer_vision.multi_camera_detector

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

> `shared/config.py` defaults `KAFKA_HOST=localhost` and `KAFKA_PORT=29092`, so native dev works with no environment variables set at all.

---

## Repository Layout

```
SafeDetect/
├── .env.example                 # canonical env-var reference — copy to .env
├── docker-compose.yml           # root: all 5 services in one command
├── Makefile                     # developer shortcuts (up/down/dev/test/lint)
├── shared/
│   └── config.py                # shared Python config
│                                # KAFKA_HOST default: 'localhost'
│                                # KAFKA_PORT default: 29092
├── backend_Python/              # cv-service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── docker-compose.yml       # dev-only: Kafka + Zookeeper
│   └── computer_vision/
│       ├── multi_camera_detector.py   # entry point
│       ├── kafka_producer.py
│       └── detection.py
└── Dashboard_Service/
    ├── Dockerfile               # two-stage: webpack build → nginx
    ├── nginx.conf
    ├── webpack.config.js
    ├── package.json
    └── src/
        ├── App.js               # root: state, WebSocket, layout
        ├── App.css              # root layout (.app, .app__body, .app__scene)
        ├── hooks/
        │   ├── useWebSocket.js  # native WS — auto-reconnect, FPS counter
        │   └── useThreeScene.js # Three.js scene — manual orbit, zones, blips
        ├── components/
        │   ├── Header/          # white navbar
        │   ├── StatusDashboard/ # dark status strip
        │   ├── DetectionPanel/  # white side panel + detection cards
        │   ├── Settings/        # SettingsModal
        │   └── ui/              # Button, Badge, Card, Modal, StatusIndicator, StatWidget
        ├── styles/
        │   └── variables.css    # design tokens (--bg-0…--bg-4, --red, --fc, --fm, --fu)
        └── backend_Kafka/       # ws-bridge
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

## Dashboard UI

The React dashboard is fully custom — **no UI component library** used.

| Area | Appearance |
|---|---|
| Header (navbar) | White `#ffffff` — logo, camera preset buttons, connection pill |
| Status strip | Dark `#0f0f0f` — compact single-line metrics |
| 3D scene | Light gray `#f0f0f0` — dark truck model, high contrast |
| Side panel | Off-white `#f5f5f5` — tabs + detection cards |
| Detection cards | White `#ffffff` with light border |
| Blind-spot accent | `#cc2222` red — the only color in the entire UI |

The Three.js scene uses **manual orbit** (mouse drag / touch / scroll wheel) — no `OrbitControls` import needed. The renderer is hooked into a plain `<canvas>` ref via `useThreeScene`.

---

## Deployment Notes

- **GPU acceleration:** uncomment the `deploy.resources.reservations` block in `docker-compose.yml` and install `nvidia-container-toolkit`.
- **Camera devices in Docker:** the compose file mounts `/dev/video0`, `/dev/video1`, `/dev/video2`. Comment out any that don't exist on your host.
- **Production secret:** set a strong, random `DETECTION_SECRET_KEY` in `.env` — the default value triggers a warning at startup.
- **Remote Dashboard:** the WebSocket server IP defaults to `window.location.hostname` in the browser (works automatically in Docker). Use the ⚙ Settings button to change it at runtime for remote deployments.

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

 --KAFKA_HOST=localhost KAFKA_PORT=29092 python -m computer_vision.multi_camera_detector

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
# Pi Config

## 1. Install the drei helper library
npm install @react-three/drei

## 2. Install gltf-pipeline for Draco compression (one-time tool)
npm install -g gltf-pipeline

## 3. Create the draco folder in public/
mkdir -p public/draco

## 4. Copy the decoder files from node_modules into public/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.wasm public/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_wasm_wrapper.js public/draco/

## 5. Compress each of your downloaded models (run once per model)
gltf-pipeline -i public/models/person.glb      -o public/models/person.glb      --draco.compressionLevel=7
gltf-pipeline -i public/models/car.glb         -o public/models/car.glb         --draco.compressionLevel=7
gltf-pipeline -i public/models/motorcycle.glb  -o public/models/motorcycle.glb  --draco.compressionLevel=7
```

---

**What happens at runtime?**

When your dashboard loads in the browser on the Pi, this is the sequence:

1. React renders a detection → `useGLTF('/models/car.glb')` is called
2. The browser fetches `car.glb` from your nginx server
3. Three.js sees it's Draco-compressed → fetches `/draco/draco_decoder.wasm` to unzip it
4. The decoded 3D mesh appears in the scene

If the `draco/` folder is missing, step 3 crashes with a `DRACOLoader: decoder path not set` error. That's the only reason you need to copy those two files — they're the unzipper the browser uses.

---

**Folder structure after you're done:**
```
Dashboard_Service/
└── public/
    ├── draco/
    │   ├── draco_decoder.wasm      ← the actual decompressor (binary)
    │   └── draco_wasm_wrapper.js   ← JS glue that loads the .wasm
    └── models/
        ├── person.glb              ← Draco-compressed, ~500 KB
        ├── car.glb                 ← Draco-compressed, ~300 KB
        └── motorcycle.glb          ← Draco-compressed, ~200 KB

## CI/CD

GitHub Actions (`.github/workflows/ci-cd.yml`) runs on every push:
1. `lint-python` — flake8
2. `lint-js` — eslint
3. `test-python` — pytest
4. `build-docker` — build all Docker images
5. `push-docker` (main branch only) — push to container registry
6. `deploy` (main branch only) — Vercel deploy hook for the dashboard

Required repository secrets: `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `VERCEL_TOKEN`.

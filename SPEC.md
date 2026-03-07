# SafeDetect — Technical Specification

**Version:** 1.0  
**Date:** March 7, 2026  
**Status:** Active

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Services](#3-services)
4. [Data Model](#4-data-model)
5. [Message Protocols](#5-message-protocols)
6. [API Reference](#6-api-reference)
7. [Configuration Reference](#7-configuration-reference)
8. [Detection Algorithms](#8-detection-algorithms)
9. [Security Model](#9-security-model)
10. [Performance Targets](#10-performance-targets)
11. [Infrastructure](#11-infrastructure)
12. [Constraints & Assumptions](#12-constraints--assumptions)

---

## 1. Overview

SafeDetect is a real-time blind spot detection system for heavy vehicles (trucks). Three cameras monitor the left, right, and rear blind spot zones. Frames are processed by a YOLOv8 model; detections are streamed through Apache Kafka to a Node.js WebSocket bridge and rendered on a React + Three.js dashboard as a live 3D truck model.

### Goals

| Goal | Description |
|---|---|
| **Safety** | Alert the driver within 250 ms of an object entering a blind spot zone |
| **Reliability** | Maintain detection pipeline uptime ≥ 99% per driving session |
| **Developer ergonomics** | Full stack starts with a single command (`make up`) |
| **Portability** | Runs on x86-64 workstations (dev) and ARM64 (Raspberry Pi 4/5 in production) |

### Out of Scope (v1)

- Driver authentication / access control
- Cloud telemetry / data persistence beyond the running session
- Cross-vehicle fleet management
- Lane departure or object tracking over time

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Vehicle hardware                                               │
│                                                                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐                    │
│  │ Left cam │  │ Right cam │  │ Rear cam │  USB / RTSP        │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘                    │
│       └───────────────┼─────────────┘                          │
│                       │                                         │
│          ┌────────────▼────────────┐                           │
│          │   cv-service (Python)   │  YOLOv8n · COCO           │
│          │   multi_camera_detector │  GPU or CPU inference     │
│          └────────────┬────────────┘                           │
│                       │  kafka-python producer                  │
└───────────────────────┼─────────────────────────────────────────┘
                        │
            ┌───────────▼───────────┐
            │   Apache Kafka        │  topic: detections
            │   + Zookeeper         │  partitions: 1 (default)
            └───────────┬───────────┘
                        │  kafkajs consumer
            ┌───────────▼───────────┐
            │   ws-bridge (Node.js) │  port 8081 (WS)
            │   server.js           │  port 8082 (HTTP)
            └───────────┬───────────┘
                        │  WebSocket broadcast
            ┌───────────▼───────────┐
            │   dashboard (React)   │  port 80 (Docker)
            │   Three.js / R3F      │  port 8080 (native dev)
            └───────────────────────┘
```

### Communication Summary

| Hop | Protocol | Format | Direction |
|---|---|---|---|
| Camera → cv-service | OpenCV (USB) or RTSP (network) | raw video frames | pull |
| cv-service → Kafka | `kafka-python` | JSON over PLAINTEXT | push |
| Kafka → ws-bridge | `kafkajs` | JSON | pull |
| ws-bridge → dashboard | WebSocket (`ws`) | JSON | push/broadcast |
| dashboard → ws-bridge | WebSocket | JSON (ping only) | push |

---

## 3. Services

### 3.1 cv-service

| Property | Value |
|---|---|
| Language | Python 3.11 |
| Entry point | `python -m computer_vision.multi_camera_detector` |
| Docker context | `backend_Python/` |
| Base image | `python:3.11-slim` |
| Required env vars | `KAFKA_HOST`, `KAFKA_PORT` |
| Restart policy | `unless-stopped` |

**Responsibilities:**
- Open up to three camera feeds (USB index, RTSP URL, or video file)
- Run YOLOv8n inference on each unique frame (shared across zones that use the same camera source)
- Filter results to COCO classes `0` (person), `2` (car), `3` (motorcycle)
- Classify each detection into a blind spot zone: `left`, `right`, or `rear`
- Attach frame hash (MD5) and per-detection HMAC (SHA-256) for integrity
- Publish detection messages to Kafka topic `detections`
- Play audio alert (pygame) when a detection is present; degrades gracefully to silent if no audio device

### 3.2 Kafka

| Property | Value |
|---|---|
| Image | `confluentinc/cp-kafka:7.4.0` |
| Coordination | Zookeeper (`confluentinc/cp-zookeeper:7.4.0`) |
| Topic | `detections` |
| Replication factor | 1 |
| Partitions | 1 (default) |
| Listener: Docker-internal | `PLAINTEXT://kafka:9092` |
| Listener: host-facing | `PLAINTEXT_HOST://localhost:29092` |
| Retention | default (7 days) |

### 3.3 ws-bridge

| Property | Value |
|---|---|
| Language | Node.js 20 |
| Entry point | `node server.js` |
| Docker context | `Dashboard_Service/backend_Kafka/` |
| Base image | `node:20-slim` |
| WebSocket port | `8081` |
| HTTP port | `8082` |
| Required env vars | `KAFKA_BROKER` |
| Restart policy | `unless-stopped` |

**Responsibilities:**
- Consume messages from Kafka topic `detections`, consumer group `safedetect-web-consumers`
- Normalise both Python (`{"type":"detections",...}`) and C++ (raw array) Kafka message formats into a uniform WebSocket envelope
- Broadcast normalised messages to all connected WebSocket clients
- Respond to client `ping` frames with `pong`
- Expose `GET /health` endpoint

### 3.4 dashboard

| Property | Value |
|---|---|
| Language | React 18 / JavaScript |
| Build tool | webpack 5 |
| 3D rendering | Three.js 0.159 via `@react-three/fiber` 8 |
| Docker context | `Dashboard_Service/` |
| Production server | nginx alpine |
| Production port | `80` |
| Dev server port | `8080` |

**Responsibilities:**
- Connect to ws-bridge WebSocket (`ws://<host>:8081`) with auto-reconnect (5 attempts, 3 s interval)
- Render a procedural 3D truck model with coloured detection spheres in real time
- Display detection list panel with object type, confidence, zone, and timestamp
- Trigger alert overlay and browser vibration when any detection with a recognised `camera_zone` is received
- Show real FPS computed from a rolling 1-second message timestamp window
- Allow the user to configure WebSocket server IP at runtime via a settings panel

---

## 4. Data Model

### 4.1 Detection Object

Emitted by `cv-service` per detected object, assembled into the Kafka message `detections` array.

```json
{
  "object": "car",
  "confidence": 0.87,
  "bbox": [120.5, 88.3, 410.2, 360.1],
  "class_id": 2,
  "camera_zone": "left",
  "position": {
    "x": 0.415,
    "y": 0.483,
    "z": 0.449
  },
  "timestamp": 1741392000.123,
  "frame_hash": "a3f2c1d4e5b6f7e8",
  "integrity_hmac": "9a8b7c6d5e4f3a2b"
}
```

| Field | Type | Description |
|---|---|---|
| `object` | `string` | Human-readable class name: `"car"`, `"motorcycle"`, `"person"` |
| `confidence` | `float` [0–1] | YOLOv8 detection confidence |
| `bbox` | `[x1, y1, x2, y2]` floats | Bounding box in pixel coordinates (top-left, bottom-right) |
| `class_id` | `int` | COCO class index: `0`=person, `2`=car, `3`=motorcycle |
| `camera_zone` | `string` | Zone the detection occurred in: `"left"`, `"right"`, `"rear"` |
| `position.x` | `float` | World X coordinate (metres, scaled from normalised x-centre) |
| `position.y` | `float` | World Y coordinate (metres, scaled from normalised y-centre) |
| `position.z` | `float` | Proxy depth (metres, derived from bounding box width ratio) |
| `timestamp` | `float` | Unix epoch seconds (Python `time.time()`) at detection |
| `frame_hash` | `string` | First 16 hex chars of MD5 of the subsampled frame (every 8th pixel) |
| `integrity_hmac` | `string` | First 16 hex chars of HMAC-SHA256 of `object+confidence+zone+timestamp` |

### 4.2 Kafka Message Envelope

```json
{
  "type": "detections",
  "timestamp": 1741392000.123,
  "detections": [ /* array of Detection Objects */ ]
}
```

A `status` message type is also supported:

```json
{
  "type": "status",
  "timestamp": 1741392000.456,
  "status": {
    "cameras": { "left": "in_use", "right": "not_connected", "rear": "in_use" },
    "fps": 14.3,
    "inference_device": "cpu"
  }
}
```

### 4.3 WebSocket Messages

**Server → Client:**

| `type` | Description |
|---|---|
| `connection` | Sent once on first connect; includes welcome `message` string |
| `detections` | Normalised detection envelope forwarded from Kafka |
| `status` | System status forwarded from Kafka |
| `pong` | Response to client `ping`; includes server `timestamp` (ms) |

**Client → Server:**

| `type` | Description |
|---|---|
| `ping` | Heartbeat; triggers a `pong` response |

### 4.4 Position Coordinate System

Camera-space coordinates (fraction of frame width/height) are converted to world coordinates using linear scaling:

```
world_x = (bbox_cx / frame_width)  × POSITION_SCALE_X   (default 1.5 m)
world_y = (bbox_cy / frame_height) × POSITION_SCALE_Y   (default 1.0 m)
world_z = (bbox_w  / frame_width)  × POSITION_SCALE_Z   (default 1.0 m, proxy for depth)
```

The 3D truck model origin is `(0, 0, 0)`. Negative X is driver-left, positive X is driver-right, negative Z is forward.

---

## 5. Message Protocols

### 5.1 Kafka Producer (cv-service)

| Setting | Value |
|---|---|
| `acks` | `all` |
| `retries` | `3` |
| `linger_ms` | `5` |
| `value_serializer` | `json.dumps(...).encode('utf-8')` |
| `key_serializer` | `str.encode` or `None` |
| Delivery mode | Synchronous per batch (`future.get(timeout=10)`) |

### 5.2 Kafka Consumer (ws-bridge)

| Setting | Value |
|---|---|
| `groupId` | `safedetect-web-consumers` |
| `fromBeginning` | `false` |
| Processing | `eachMessage` callback; async |

### 5.3 WebSocket (ws-bridge)

| Setting | Value |
|---|---|
| Library | `ws` 8.x |
| Port | `8081` (hardcoded) |
| Message encoding | JSON over UTF-8 text frames |
| Broadcast | One-to-all; dead clients removed on send error |

### 5.4 WebSocket (dashboard client)

| Setting | Value |
|---|---|
| Reconnect attempts | 5 |
| Reconnect interval | 3 000 ms |
| Heartbeat | ping every reconnect-interval ms |
| URL default | `ws://${window.location.hostname}:8081` |

---

## 6. API Reference

### 6.1 `GET /health` — ws-bridge health check

**URL:** `http://<host>:8082/health`

**Response `200 OK`:**
```json
{
  "status": "OK",
  "message": "SafeDetect Web Backend is running",
  "connectedClients": 2,
  "kafkaTopic": "detections"
}
```

---

## 7. Configuration Reference

All values are read from environment variables. Copy `.env.example` to `.env`.

### 7.1 Required

| Variable | Service | Description |
|---|---|---|
| `KAFKA_HOST` | cv-service | Kafka broker hostname (`kafka` in Docker, `localhost` native) |
| `KAFKA_PORT` | cv-service | Kafka broker port (`9092` Docker, `29092` native) |

### 7.2 Optional — cv-service

| Variable | Default | Description |
|---|---|---|
| `KAFKA_TOPIC` | `detections` | Kafka topic name |
| `MODEL_PATH` | `yolov8n.pt` | Path to YOLOv8 weights file |
| `MODEL_CONFIDENCE` | `0.5` | Minimum detection confidence threshold [0–1] |
| `INFERENCE_SIZE` | `640` (GPU) / `416` (CPU) | YOLOv8 input resolution (pixels) |
| `CAMERA_WIDTH` | `640` | Camera capture width |
| `CAMERA_HEIGHT` | `480` | Camera capture height |
| `FPS_TARGET` | `15` | Target camera capture FPS |
| `LEFT_CAMERA_ID` | `0` | Left camera USB index |
| `RIGHT_CAMERA_ID` | `1` | Right camera USB index |
| `REAR_CAMERA_ID` | `2` | Rear camera USB index |
| `LEFT_CAMERA_SRC` | _(unset)_ | RTSP URL or file path for left camera (overrides `_ID`) |
| `RIGHT_CAMERA_SRC` | _(unset)_ | RTSP URL or file path for right camera |
| `REAR_CAMERA_SRC` | _(unset)_ | RTSP URL or file path for rear camera |
| `ALERT_BEEP_FREQUENCY` | `800` | Alert beep frequency in Hz |
| `ALERT_DURATION` | `0.5` | Alert beep duration in seconds |
| `DETECTION_SECRET_KEY` | *(must set)* | HMAC key for detection integrity signing — no secure default |
| `KAFKA_SECURITY_PROTOCOL` | `PLAINTEXT` | Kafka security: `PLAINTEXT`, `SSL`, `SASL_PLAINTEXT`, `SASL_SSL` |
| `KAFKA_SASL_MECHANISM` | `PLAIN` | SASL mechanism (when using SASL) |
| `KAFKA_SASL_USERNAME` | _(unset)_ | SASL username |
| `KAFKA_SASL_PASSWORD` | _(unset)_ | SASL password |
| `KAFKA_SSL_CAFILE` | _(unset)_ | Path to CA certificate file |
| `KAFKA_SSL_CERTFILE` | _(unset)_ | Path to client certificate file |
| `KAFKA_SSL_KEYFILE` | _(unset)_ | Path to client key file |

### 7.3 Optional — ws-bridge

| Variable | Default | Description |
|---|---|---|
| `KAFKA_BROKER` | `localhost:29092` | Full `host:port` Kafka broker address |
| `KAFKA_TOPIC` | `detections` | Kafka topic to consume |
| `PORT` | `8082` | Express HTTP port |

### 7.4 Blind Spot Zone Boundaries

Defined in `shared/config.py`. Coordinates are fractions of frame dimensions [0–1].

| Zone | x_min | x_max | y_min | y_max |
|---|---|---|---|---|
| `left` | 0.00 | 0.30 | 0.20 | 0.80 |
| `right` | 0.70 | 1.00 | 0.20 | 0.80 |
| `rear` | 0.30 | 0.70 | 0.70 | 1.00 |

### 7.5 COCO Class Mapping

| COCO ID | Label | Dashboard colour |
|---|---|---|
| `0` | person | yellow |
| `2` | car | green |
| `3` | motorcycle | orange |

---

## 8. Detection Algorithms

### 8.1 Model

- **Model:** YOLOv8n (nano) — smallest/fastest variant of YOLOv8
- **Weights file:** `yolov8n.pt` (Ultralytics format)
- **ONNX export:** `yolov8n.onnx` available for non-Ultralytics runtimes
- **Classes used:** subset of COCO 80-class dataset (IDs 0, 2, 3)
- **Device selection:** CUDA if available, else CPU (automatic, logged at startup)

### 8.2 Frame Deduplication

When two or more camera zones are configured to use the same physical camera source (same integer index or same URL), inference is run **once** per unique source per detection cycle:

1. A `frame_cache` dict maps `camera_id → (frame, frame_hash, results)` within each cycle.
2. Before running inference, the detector checks whether `camera_id` is already in `frame_cache`.
3. If cached, the same results are reused for the additional zone — no duplicate GPU call.

### 8.3 Frame Integrity Hash

```
frame_hash = MD5( frame[::8, ::8].tobytes() ).hexdigest()[:16]
```

Every 8th pixel row and column is sampled to reduce CPU cost while still detecting frame-level changes. The first 16 hex characters are sent in the detection payload (informational, not security-grade).

### 8.4 Per-Detection HMAC

```
message  = f"{object_type}{confidence}{zone}{timestamp}"
hmac_val = HMAC-SHA256(key=DETECTION_SECRET_KEY, msg=message).hexdigest()[:16]
```

The first 16 hex characters are attached to each detection as `integrity_hmac`. The ws-bridge and dashboard currently forward this value without verification — downstream verification logic is a future enhancement.

### 8.5 Position Calculation

```python
x_centre_norm = (x1 + x2) / 2 / frame_width
y_centre_norm = (y1 + y2) / 2 / frame_height
z_proxy       = (x2 - x1) / frame_width        # relative box width = approx inverse distance

world_x = x_centre_norm × POSITION_SCALE_X
world_y = y_centre_norm × POSITION_SCALE_Y
world_z = z_proxy       × POSITION_SCALE_Z
```

---

## 9. Security Model

### 9.1 Transport

- Default Kafka transport: `PLAINTEXT`. For production deployments outside a trusted network, set `KAFKA_SECURITY_PROTOCOL=SASL_SSL` and supply `KAFKA_SASL_*` / `KAFKA_SSL_*` env vars.
- WebSocket: currently unencrypted (`ws://`). For HTTPS deployments, terminate TLS at the nginx reverse proxy and proxy-forward as `wss://`.

### 9.2 HMAC Integrity

- Each detection carries a truncated HMAC-SHA256 computed from `DETECTION_SECRET_KEY`.
- **The key must be set to a strong random value in production.** A startup warning is emitted if the default value `change_me_in_production` is detected.
- Current limitation: the ws-bridge and dashboard do not validate the HMAC before display. Verification should be added in a future version.

### 9.3 Input Validation

- Kafka message parsing in the ws-bridge is wrapped in try/catch; malformed JSON is logged and discarded.
- Camera source env vars are sanitised: if `*_CAMERA_SRC` contains only digits it is treated as an integer index, preventing RTSP injection from resulting in unexpected integer coercion only.
- WebSocket client messages are parsed in a try/catch; only `ping` type is acted upon.

### 9.4 Secrets Management

| Secret | Storage | Notes |
|---|---|---|
| `DETECTION_SECRET_KEY` | `.env` file | Never commit `.env` — protected by `.gitignore` |
| `KAFKA_SASL_PASSWORD` | `.env` file | Only needed for SASL deployments |
| Docker registry credentials | GitHub Actions secrets | `GITHUB_TOKEN` (GHCR) |
| Vercel deploy hook | GitHub Actions secret `VERCEL_DEPLOY_HOOK_URL` | URL-based trigger, no bearer token |

---

## 10. Performance Targets

| Metric | Target | Notes |
|---|---|---|
| End-to-end latency (camera → dashboard) | ≤ 250 ms | At 15 FPS on CPU hardware |
| cv-service FPS (CPU, 3 cameras, 416px) | ≥ 10 FPS | YOLOv8n on Raspberry Pi 4 class hardware |
| cv-service FPS (GPU, 3 cameras, 640px) | ≥ 25 FPS | On NVIDIA GTX 1060+ class |
| Kafka producer `send()` timeout | 10 s | Detection dropped if broker unreachable > 10 s |
| WebSocket reconnect window | 15 s | 5 attempts × 3 s = max 15 s before giving up |
| Dashboard detection render lag | ≤ 1 frame | React state update on each WebSocket message |

---

## 11. Infrastructure

### 11.1 Docker Compose Services

| Service | Image / Build | CPU | Memory | Ports |
|---|---|---|---|---|
| `zookeeper` | `confluentinc/cp-zookeeper:7.4.0` | low | ~256 MB | 2181 |
| `kafka` | `confluentinc/cp-kafka:7.4.0` | medium | ~512 MB | 9092, 29092 |
| `cv-service` | `./backend_Python` | high | ~1–4 GB (model + torch) | — |
| `ws-bridge` | `./Dashboard_Service/backend_Kafka` | low | ~128 MB | 8081, 8082 |
| `dashboard` | `./Dashboard_Service` (nginx) | low | ~32 MB | 80 |

### 11.2 Dependency Order

```
zookeeper
    └── kafka (health-checked)
            ├── cv-service (waits for kafka: service_healthy)
            └── ws-bridge  (waits for kafka: service_healthy)
                    └── dashboard (waits for ws-bridge)
```

### 11.3 Volume Mounts

| Service | Host path | Container path | Purpose |
|---|---|---|---|
| `cv-service` | `./shared` | `/app/backend/shared` | Live config edits without rebuild |
| `cv-service` | `/dev/video0` | `/dev/video0` | Left USB camera |
| `cv-service` | `/dev/video1` | `/dev/video1` | Right USB camera |
| `cv-service` | `/dev/video2` | `/dev/video2` | Rear USB camera |

### 11.4 CI/CD Pipeline (GitHub Actions)

| Job | Trigger | Outcome |
|---|---|---|
| `lint-python` | every push / PR | `flake8` on `backend_Python/` and `shared/` |
| `lint-js` | every push / PR | `eslint` on `Dashboard_Service/src/` |
| `test-python` | every push / PR (after lint) | `pytest backend_Python/tests/` |
| `build-docker` | every push / PR (after lint) | Build all 3 Docker images (no push) |
| `push-docker` | push to `main` only | Push images to GHCR |
| `deploy` | push to `main` only | Trigger Vercel deploy hook |

**Required repository secrets:**

| Secret | Used by job |
|---|---|
| `GITHUB_TOKEN` | `push-docker` (automatic) |
| `VERCEL_DEPLOY_HOOK_URL` | `deploy` |

---

## 12. Constraints & Assumptions

1. **Camera availability:** The system starts and runs with 0–3 cameras. Zones whose camera cannot be opened are marked `not_connected` and skipped silently.
2. **Single Kafka partition:** The current configuration uses 1 partition. Multi-partition setups require updating `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR` and consumer group offset handling.
3. **No authentication on WebSocket:** The WebSocket endpoint `:8081` is open to any client on the same network. Deployment behind a firewall or VPN is assumed.
4. **Audio requires a host audio device:** `pygame.mixer` is initialised at startup; failure is non-fatal and alerts become silent. Audio does not function inside Docker without PulseAudio socket passthrough.
5. **GPU passthrough in Docker is opt-in:** The `deploy.resources.reservations` block in `docker-compose.yml` is commented out. The host must have `nvidia-container-toolkit` installed to enable it.
6. **Raspberry Pi ARM support:** The Python stack and YOLOv8n are compatible with ARM64. The `Dashboard_Service` and `ws-bridge` are not expected to run on-device; they are designed for a connected display or remote laptop.
7. **No frame buffering or interpolation:** Each Kafka message is a snapshot of detections from a single processing cycle. There is no temporal smoothing, tracking, or kalman filtering in v1.
8. **HMAC verification is unimplemented on the consumer side:** The `integrity_hmac` field is generated by the cv-service but is not validated by the ws-bridge or dashboard. This is a known gap.

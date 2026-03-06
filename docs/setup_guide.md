# SafeDetect Setup Guide

Complete installation and setup instructions for the SafeDetect blind spot detection system.

## Overview

SafeDetect is a real-time blind spot detection system for vehicles that uses computer vision to detect objects in blind spots and provides real-time alerts through a web interface. The system consists of:

- **Python CV Service** (`backend_Python/`): YOLOv8 object detection via cameras, publishes detections to Kafka
- **Kafka Message Queue** (Docker): Async communication between cv-service and ws-bridge
- **Node.js WS Bridge** (`Dashboard_Service/backend_Kafka/`): Consumes Kafka, broadcasts over WebSocket on port 8081
- **React Dashboard** (`Dashboard_Service/src/`): Live 3D truck scene + alert UI

## Prerequisites

### System Requirements
- **Operating System**: macOS Monterey+, Ubuntu 20.04+, or Windows 10+ (WSL2 recommended)
- **Python**: 3.11 or higher
- **Node.js**: 18.0 or higher
- **Docker Desktop**: Required for Kafka
- **Hardware**: USB cameras (3 recommended) or video files for testing

## Project Structure

```
SafeDetect/
├── .env.example                 # copy to .env
├── docker-compose.yml           # all 5 services
├── Makefile
├── shared/
│   └── config.py               # shared Python config (KAFKA defaults)
├── backend_Python/              # cv-service
│   ├── docker-compose.yml       # Kafka + Zookeeper (native dev)
│   ├── requirements.txt
│   └── computer_vision/
├── Dashboard_Service/
│   ├── backend_Kafka/           # Node.js WS bridge
│   └── src/                    # React app (hooks/, components/, styles/)
└── docs/
```

## Step-by-Step Setup

### Step 1: Clone and Configure

```bash
git clone <repository-url>
cd SafeDetect
cp .env.example .env
```

### Step 2: Setup Kafka

> **Port clarification:**
> - Port **9092** — Kafka's *internal* Docker listener. Advertises `kafka:9092`. **Only reachable inside Docker containers.**
> - Port **29092** — Kafka's *host* listener. Advertises `localhost:29092`. **Use this for all native (non-Docker) services.**

```bash
cd backend_Python
docker-compose up -d kafka zookeeper

# Wait until healthy (takes ~20–30s)
docker-compose ps kafka   # STATUS should show "healthy"
```

Verify the host-side listener:
```bash
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:29092
```

### Step 3: Setup Python CV Service

```bash
cd backend_Python
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Key dependencies:**
- `opencv-python` — camera/video processing
- `ultralytics` — YOLOv8 inference
- `kafka-python` — Kafka producer
- `pygame` — audio alerts
- `numpy` — numerical computations

### Step 4: Setup Node.js WS Bridge

```bash
cd Dashboard_Service/backend_Kafka
npm install
```

**Key dependencies:**
- `kafkajs` — Kafka consumer
- `ws` — WebSocket server
- `express` — HTTP server

### Step 5: Setup React Dashboard

```bash
cd Dashboard_Service
npm install
```

**Key dependencies:**
- `react` 18 — UI framework
- `three` — 3D graphics (**plain import** — no `@react-three/fiber` or `@react-three/drei`)
- `webpack` 5 — bundler

## Configuration

### Kafka — Native Dev vs Docker

| Service location | `KAFKA_HOST` | `KAFKA_PORT` |
|---|---|---|
| Inside Docker container | `kafka` | `9092` |
| Native on host machine | `localhost` | `29092` |

`shared/config.py` ships with `KAFKA_HOST=localhost` and `KAFKA_PORT=29092` as defaults — **native dev works with no env vars set**.

For Docker deployment (`.env`):
```dotenv
KAFKA_HOST=kafka
KAFKA_PORT=9092
```

### Camera Configuration

```dotenv
# USB webcam (integer index)
LEFT_CAMERA_ID=0
RIGHT_CAMERA_ID=1
REAR_CAMERA_ID=2

# RTSP stream (takes priority over *_CAMERA_ID when both set)
# LEFT_CAMERA_SRC=rtsp://user:pass@192.168.1.10:554/stream

# Video file (dev/test without hardware)
# LEFT_CAMERA_SRC=/path/to/left.mp4
```



## Running the System

Open **4 terminals**:

**Terminal 1 — Kafka** (already up from Step 2)
```bash
cd backend_Python
docker-compose logs -f kafka   # watch for errors
```

**Terminal 2 — Node.js WS Bridge**
```bash
cd Dashboard_Service/backend_Kafka
node server.js
```
Expected: `WebSocket server started on port 8081` and `Connected to Kafka`

**Terminal 3 — Python CV Service**
```bash
cd backend_Python
source venv/bin/activate   # Windows: venv\Scripts\activate
python -m computer_vision.multi_camera_detector
```
> Use `python -m computer_vision.multi_camera_detector` (module syntax, **not** the file path `computer_vision/multi_camera_detector.py`) to ensure the package imports resolve correctly.
>
> No env vars needed for native dev — `shared/config.py` defaults to `localhost:29092`.

**Terminal 4 — React Dashboard**
```bash
cd Dashboard_Service
npm start
```
Opens at `http://localhost:8080`. The dashboard connects to `ws://localhost:8081`.

### Testing Without Cameras

Pass a video file path as the camera source via env or edit `shared/config.py`:
```dotenv
LEFT_CAMERA_SRC=/path/to/left.mp4
RIGHT_CAMERA_SRC=/path/to/right.mp4
REAR_CAMERA_SRC=/path/to/rear.mp4
```

## Verification

### 1. Kafka topic exists
```bash
cd backend_Python
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:29092
# should include: detections
```

### 2. Live Kafka messages
```bash
docker-compose exec kafka kafka-console-consumer \
  --topic detections \
  --bootstrap-server localhost:29092 \
  --from-beginning
```
JSON messages appear each time an object is detected.

### 3. WebSocket connection
Open browser DevTools (F12) → **Network → WS**. Confirm an open connection to `ws://localhost:8081`.

### 4. Dashboard live
- 3D truck scene renders (white/light-gray background)
- Side panel shows detected objects with confidence badges
- Blind-spot detections flash a red alert banner

## Troubleshooting

### Kafka connection refused
```
Error: connect ECONNREFUSED localhost:29092
```
- Containers not yet healthy — wait 30 s after `docker-compose up -d`
- Confirm listener: `docker-compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:29092`
- **Never use port 9092 from the host** — that is the internal Docker listener (advertises `kafka:9092`, unreachable outside containers)

### "No cameras found"
- Linux/macOS: `ls /dev/video*` — check device nodes
- Try bumping camera IDs (0→1, 1→2, …)
- Fall back to video files using `*_CAMERA_SRC` env vars

### WebSocket connection failed in browser
- Confirm Node.js bridge is running on port 8081
- Check firewall / Windows Defender rules for port 8081
- Console should show `WebSocket: connecting…` then `connected`

### No detections appearing
- Watch Terminal 3 for `[LEFT] car 0.87` style log lines
- Watch Terminal 2 for Kafka consumer messages
- Verify both services point to the same Kafka topic (`detections`)

### Performance (slow inference)
- YOLOv8n runs on CPU by default — GPU: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121`
- Lower camera resolution in `computer_vision/multi_camera_detector.py` (`cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)`)

## Full Docker Deployment

```bash
# root of repo
cp .env.example .env
# edit .env: KAFKA_HOST=kafka  KAFKA_PORT=9092
docker-compose up --build
```
- Dashboard: `http://localhost:8080`
- WS bridge: `ws://localhost:8081`
- Kafka: accessible at `kafka:9092` inside Docker network

## Next Steps

- Architecture deep-dive → `docs/integration_guide.md`
- Test suite → `docs/testing_guide.md`
- Customise detection zones → `shared/config.py`


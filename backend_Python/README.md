# SafeDetect Backend - Computer Vision & Detection System

SafeDetect is a real-time blind spot detection system for vehicles using computer vision. The backend processes video feeds from multiple cameras, detects objects using YOLOv8, and streams results via Kafka for reliable communication to the frontend.

## Architecture Overview

1. **Computer Vision Backend (Python)**:
   - Uses YOLOv8 for object detection (cars, motorcycles, persons).
   - Supports multi-camera setup (left, right, rear) for comprehensive blind spot monitoring.
   - Produces detection results to Kafka topic 'detections'.

2. **Message Queue (Kafka)**:
   - Handles reliable, scalable communication between Python backend and Node.js proxy.
   - Topic: 'detections' (JSON messages with timestamp, detections array).

3. **Node.js Proxy Backend**:
   - Consumes from Kafka.
   - Serves WebSocket connections to the React frontend for real-time updates.

4. **React Frontend (web/)**:
   - 3D visualization using Three.js.
   - Displays truck model with detected objects in blind spots.
   - Real-time alerts and stats.

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for Kafka)
- Virtual cameras or physical USB cameras for testing
- macOS/Linux (tested on macOS Monterey)

## Setup Instructions

### 1. Clone and Navigate
```
git clone <repo-url>
cd SafeDetect
```

### 2. Start Kafka (via Docker)
The backend includes a `docker-compose.yml` for Zookeeper + Kafka.

```
cd backend
docker-compose up -d
```

Verify:
```
docker ps  # Should show zookeeper and kafka containers
```

Create topic (if not auto-created):
```
docker-compose exec kafka kafka-topics --create --topic detections --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

### 3. Setup Python Backend
Create virtual environment:
```
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:
```
pip install -r requirements.txt
```

### 4. Setup Node.js Backend (for web/)
```
cd web/backend
npm install
```

### 5. Setup React Frontend
```
cd web
npm install
```

### 6. Run the System

Open multiple terminals:

**Terminal 1 - Kafka (already running from step 2)**

**Terminal 2 - Node.js Backend**:
```
cd web/backend
node server.js
```
- Starts WebSocket server on ws://localhost:8081
- Consumes from Kafka 'detections' topic

**Terminal 3 - Python Detection**:
```
cd backend
source venv/bin/activate
python computer_vision/multi_camera_detector.py
```
- Starts multi-camera processing (left: ID 0, right: ID 1, rear: ID 2)
- Connects cameras, runs YOLOv8 detection
- Sends detections to Kafka continuously (Ctrl+C to stop)

**Terminal 4 - React Frontend**:
```
cd web
npm start
```
- Opens http://localhost:3000
- Connects to WebSocket at ws://localhost:8081
- Displays 3D truck with real-time detections and alerts

## How It Works

1. **Camera Input**: OpenCV captures frames from USB cameras (or use dummy video for testing).

2. **Object Detection**: YOLOv8 processes each frame to detect objects (cars, motorcycles, persons) with confidence > 0.5.

3. **Blind Spot Analysis**: Calculates object positions relative to truck zones (left, right, rear) using config in `shared/config.py`.

4. **Kafka Production**: Detection results (JSON: type='detections', timestamp, detections array with position, confidence, zone) sent to Kafka topic.

5. **Kafka Consumption**: Node.js backend subscribes to topic, receives messages.

6. **WebSocket Broadcasting**: Node.js forwards detections via WebSocket to connected frontend clients.

7. **Frontend Visualization**:
   - 3D truck model (Three.js) shows detected objects as colored spheres (green=car, orange=motorcycle, yellow=person).
   - Positions mapped from camera coordinates to 3D world space.
   - Alerts: Audio beep + visual warning for blind spot objects.
   - Stats panel: FPS, camera status, detection count.

## Configuration

- `shared/config.py`: Blind spot zones, object classes, camera IDs, Kafka settings (localhost:9092, topic='detections').
- Adjust `CAMERA_CONFIG` for different camera IDs.
- For dummy testing: Modify `multi_camera_detector.py` to use video files instead of live cameras.

## Troubleshooting

- **No Cameras Detected**: Check USB connections, try `ls /dev/video*`. Use dummy video: replace `cv2.VideoCapture(camera_id)` with `cv2.VideoCapture('test_video.mp4')`.
- **Kafka Issues**: Check `docker logs kafka`. Ensure topic exists.
- **No Detections in Frontend**: Verify Node.js logs for Kafka consumption, browser console for WebSocket connection.
- **Performance**: YOLOv8 on CPU; for better FPS, use GPU (install torch with CUDA).
- **Alerts Not Playing**: Ensure pygame audio works (test with simple script).

## Files Structure

- `backend/computer_vision/multi_camera_detector.py`: Main multi-camera logic.
- `backend/computer_vision/kafka_producer.py`: Kafka producer class.
- `backend/computer_vision/detection.py`: Single-camera fallback.
- `backend/computer_vision/archive/`: Legacy WebSocket files.
- `web/backend/server.js`: Kafka consumer + WebSocket server.
- `web/src/services/WebSocketService.js`: Frontend WebSocket client.

## Testing

- Run `python backend/computer_vision/test_multi_camera.py` to check camera connections.
- Use dummy objects in view for detection testing.
- Monitor Kafka: `docker exec -it kafka kafka-console-consumer --topic detections --bootstrap-server localhost:9092 --from-beginning`.

For more details, see `backend/computer_vision/README_MULTI_CAMERA.md` and `web/README.md`.

# SafeDetect Setup Guide

Complete installation and setup instructions for the SafeDetect blind spot detection system with Kafka integration.

## Overview

SafeDetect is a real-time blind spot detection system for vehicles that uses computer vision to detect objects in blind spots and provides real-time alerts through a web interface. The system consists of:

- **Python Backend**: Computer vision processing with YOLOv8 for object detection
- **Kafka Message Queue**: Reliable communication between backend components
- **Node.js Backend**: WebSocket server that consumes Kafka messages
- **React Frontend**: 3D visualization and real-time alerts

## Prerequisites

### System Requirements
- **Operating System**: macOS Monterey+, Ubuntu 20.04+, or Windows 10+
- **Python**: 3.11 or higher
- **Node.js**: 18.0 or higher
- **Docker**: For Kafka setup
- **Hardware**: USB cameras (3 recommended for multi-camera setup) or video files for testing

### Hardware Setup
- Connect USB cameras to your computer (typically `/dev/video0`, `/dev/video1`, `/dev/video2` on Linux/macOS)
- For testing without cameras, the system can use video files

## Project Structure

```
SafeDetect/
├── backend/                    # Python computer vision backend
│   ├── computer_vision/        # Core detection logic
│   ├── docker-compose.yml      # Kafka setup
│   ├── requirements.txt        # Python dependencies
│   └── README.md              # Backend-specific docs
├── web/                       # React frontend
│   ├── backend/               # Node.js WebSocket server
│   ├── src/                   # React application
│   ├── package.json
│   └── README.md
├── shared/                    # Shared configuration
├── docs/                      # Documentation
└── README.md                  # Main project README
```

## Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd SafeDetect
```

### Step 2: Setup Kafka Message Queue

Kafka handles communication between the Python backend and Node.js server.

```bash
# Navigate to backend directory
cd backend

# Start Kafka and Zookeeper using Docker
docker-compose up -d

# Verify containers are running
docker-compose ps
```

You should see:
```
NAME                  IMAGE                             COMMAND                  SERVICE     STATUS
backend-kafka-1       confluentinc/cp-kafka:7.4.0       "/etc/confluent/dock…"   kafka       Up
backend-zookeeper-1   confluentinc/cp-zookeeper:7.4.0   "/etc/confluent/dock…"   zookeeper   Up
```

**Note**: The 'detections' topic is auto-created when the system first runs. If needed manually:

```bash
docker-compose exec kafka kafka-topics --create --topic detections --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

### Step 3: Setup Python Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

**Dependencies include:**
- `opencv-python`: Camera/video processing
- `ultralytics`: YOLOv8 object detection
- `kafka-python`: Kafka producer
- `pygame`: Audio alerts
- `numpy`: Numerical computations

### Step 4: Setup Node.js Backend

```bash
# Navigate to web backend directory
cd web/backend

# Install Node.js dependencies
npm install
```

**Dependencies include:**
- `kafkajs`: Kafka consumer
- `ws`: WebSocket server
- `express`: HTTP server framework

### Step 5: Setup React Frontend

```bash
# Navigate to web directory
cd web

# Install React dependencies
npm install
```

**Dependencies include:**
- `react`: Frontend framework
- `three`: 3D graphics
- `@react-three/fiber`: React Three.js renderer
- `@react-three/drei`: Three.js helpers

## Configuration

### Camera Configuration

Edit `shared/config.py` to configure camera IDs:

```python
CAMERA_CONFIG = {
    'left': 0,    # Camera ID for left blind spot
    'right': 1,   # Camera ID for right blind spot
    'rear': 2     # Camera ID for rear blind spot
}
```

### Kafka Configuration

The Kafka settings are configured in `shared/config.py`:

```python
KAFKA_CONFIG = {
    'bootstrap_servers': ['localhost:9092'],
    'topic': 'detections'
}
```

## Running the System

### Development Mode (Recommended for Setup)

Open **4 terminals** and run each component:

**Terminal 1 - Kafka** (Already running from setup)
```bash
cd backend
docker-compose logs -f  # Monitor Kafka logs
```

**Terminal 2 - Node.js Backend**
```bash
cd web/backend
node server.js
```
- Starts WebSocket server on `ws://localhost:8081`
- Consumes messages from Kafka 'detections' topic
- Logs: "WebSocket server started on port 8081", "Connected to Kafka"

**Terminal 3 - Python Detection Backend**
```bash
cd backend
source venv/bin/activate
python computer_vision/multi_camera_detector.py
```
- Initializes cameras and YOLOv8 model
- Starts detection loop
- Sends detections to Kafka
- Press Ctrl+C to stop

**Terminal 4 - React Frontend**
```bash
cd web
npm start
```
- Opens browser at `http://localhost:3000`
- Connects to WebSocket server
- Displays 3D truck visualization

### Testing Without Cameras

If you don't have cameras, modify `backend/computer_vision/multi_camera_detector.py`:

```python
# Replace camera initialization with video files
self.cap = cv2.VideoCapture('path/to/test_video.mp4')
```

## Verification Steps

### 1. Check Kafka Topic
```bash
cd backend
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```
Should show: `detections`

### 2. Monitor Kafka Messages
```bash
cd backend
docker-compose exec kafka kafka-console-consumer --topic detections --bootstrap-server localhost:9092 --from-beginning
```
You should see JSON messages when detections occur.

### 3. Check WebSocket Connection
Open browser dev tools (F12) → Network → WS tab. Should show WebSocket connection to `localhost:8081`.

### 4. Test Detection
Point cameras at objects or use test video. Frontend should show:
- Colored spheres for detected objects
- Real-time FPS counter
- Audio alerts for blind spot objects

## Troubleshooting

### Common Issues

**"No cameras found"**
- Check USB connections: `ls /dev/video*` (Linux/macOS)
- Try different camera IDs in `shared/config.py`
- Use video files for testing

**"Kafka connection failed"**
- Ensure Docker containers are running: `docker-compose ps`
- Check Kafka logs: `docker-compose logs kafka`
- Verify topic exists

**"WebSocket connection failed"**
- Ensure Node.js server is running on port 8081
- Check firewall settings
- Verify WebSocket URL in frontend

**"No detections in frontend"**
- Check Python backend logs for detection output
- Monitor Kafka messages
- Verify Node.js server is consuming messages

**Performance Issues**
- YOLOv8 runs on CPU by default
- For better performance, install PyTorch with CUDA support
- Reduce camera resolution in code if needed

### Logs and Debugging

**Python Backend Logs:**
- Run with verbose output
- Check for camera initialization errors
- Monitor detection confidence scores

**Node.js Backend Logs:**
- Shows Kafka connection status
- WebSocket client connections
- Message consumption rate

**React Frontend:**
- Browser console for WebSocket errors
- Network tab for connection status

## Production Deployment

For production deployment:

1. **Use environment variables** for configuration instead of hardcoded values
2. **Set up proper logging** with log rotation
3. **Configure camera streams** for your specific hardware
4. **Set up monitoring** for system health
5. **Use Docker Compose** for the entire stack

## Next Steps

After setup is complete:
- Read `docs/integration_guide.md` for detailed architecture
- Run tests with `docs/testing_guide.md`
- Customize detection zones in `shared/config.py`
- Add more camera angles or improve detection accuracy

## Support

For issues:
1. Check this guide and troubleshooting section
2. Review component-specific READMEs
3. Check GitHub issues for similar problems
4. Provide logs and system information when reporting issues


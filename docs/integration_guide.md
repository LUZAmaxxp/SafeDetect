# SafeDetect Integration Guide

How to integrate the SafeDetect blind spot detection system components and customize for specific use cases.

## 🔗 Component Integration

### Overview

SafeDetect consists of three main components:
1. **Computer Vision Backend** (Python)
2. **WebSocket Server** (Python)
3. **Mobile Application** (React Native)

### Data Flow

```
Camera Input → YOLOv8 Detection → Blind Spot Analysis → WebSocket Broadcast → Mobile App Display
```

## 🛠️ Backend Integration

### Custom Detection Classes

To add new object types for detection:

1. **Update Configuration** (`shared/config.py`):

```python
# Add new object class
OBJECT_CLASSES = {
    2: "car",
    3: "motorcycle",
    0: "person",
    5: "bus",        # New class
    7: "truck"       # New class
}

# Add colors for new objects
OBJECT_COLORS = {
    "car": "green",
    "motorcycle": "orange",
    "person": "yellow",
    "bus": "blue",      # New color
    "truck": "purple"   # New color
}
```

2. **Update Detection Script** (`backend/computer_vision/detection.py`):

```python
# In the detection loop
if class_id in OBJECT_CLASSES:
    object_type = OBJECT_CLASSES[class_id]
    # ... rest of detection logic
```

### Custom Blind Spot Zones

Define custom blind spot regions:

```python
# In shared/config.py
BLIND_SPOT_ZONES = {
    "driver_side": {"x_min": 0, "x_max": 0.2, "y_min": 0.1, "y_max": 0.9},
    "passenger_side": {"x_min": 0.8, "x_max": 1.0, "y_min": 0.1, "y_max": 0.9},
    "rear": {"x_min": 0.2, "x_max": 0.8, "y_min": 0.8, "y_max": 1.0},
    "front": {"x_min": 0.2, "x_max": 0.8, "y_min": 0, "y_max": 0.2}
}
```

### Multiple Camera Integration

For multi-camera setups:

```python
# backend/computer_vision/multi_camera_detection.py
class MultiCameraDetector:
    def __init__(self, camera_ids=[0, 1, 2]):
        self.detectors = []
        for cam_id in camera_ids:
            detector = BlindSpotDetector()
            detector.start_camera(cam_id)
            self.detectors.append(detector)

    async def process_all_cameras(self):
        all_detections = []
        for detector in self.detectors:
            detections = await detector.process_frame()
            all_detections.extend(detections)
        return all_detections
```

## 📱 Mobile App Integration

### Custom Alert System

Extend the alert system in `mobile/App.js`:

```javascript
const triggerCustomAlert = async (detection) => {
    // Custom alert logic based on detection type
    if (detection.object === 'person') {
        // Special alert for pedestrians
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
        // Standard alert for vehicles
        await triggerAlert();
    }
};
```

### Custom 3D Models

Replace the basic truck model with custom 3D models:

```javascript
// mobile/components/CustomTruck.js
import { useGLTF } from '@react-three/drei';

export default function CustomTruck() {
    const { nodes, materials } = useGLTF('/models/truck.glb');

    return (
        <group>
            <primitive object={nodes.TruckBody} material={materials.Body} />
            <primitive object={nodes.Wheels} material={materials.Wheel} />
            {/* Add blind spot zones */}
            <BlindSpotZones />
        </group>
    );
}
```

### WebSocket Message Handling

Add custom message types:

```javascript
// In WebSocketService.js
handleMessage(data) {
    switch (data.type) {
        case 'detections':
            this.emit('detections', data);
            break;
        case 'system_status':
            this.emit('systemStatus', data);
            break;
        case 'custom_event':
            this.emit('customEvent', data);
            break;
        // ... existing cases
    }
}
```

## 🌐 Network Integration

### Local Network Setup

For deployment across multiple devices:

1. **Configure Backend**:
```python
# shared/config.py
WEBSOCKET_HOST = "0.0.0.0"  # Bind to all interfaces
WEBSOCKET_PORT = 8765
```

2. **Update Mobile App**:
```javascript
// Use actual IP address instead of localhost
const wsService = new WebSocketService('ws://192.168.1.100:8765');
```

### Cloud Deployment

For cloud-based deployment:

1. **WebSocket Server**:
```python
# Use cloud WebSocket service or deploy to cloud platform
WEBSOCKET_HOST = "your-cloud-server.com"
WEBSOCKET_PORT = 8765
```

2. **Mobile App**:
```javascript
// Connect to cloud WebSocket
const wsService = new WebSocketService('wss://your-cloud-server.com/ws');
```

## 🔧 Hardware Integration

### Raspberry Pi Setup

```bash
# Install system dependencies
sudo apt update
sudo apt install python3-pip python3-venv libatlas-base-dev

# Enable camera
sudo raspi-config
# Navigate to: Interfacing Options > Camera > Enable

# Setup Python environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Test camera
python -c "import cv2; cap = cv2.VideoCapture(0); print('Camera working:', cap.isOpened())"
```

### External Display Integration

Connect external display for driver monitoring:

```python
# backend/computer_vision/display_output.py
class DisplayOutput:
    def __init__(self):
        self.display = cv2.namedWindow("SafeDetect", cv2.WINDOW_NORMAL)
        cv2.setWindowProperty("SafeDetect", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    def show_frame(self, frame, detections):
        # Draw detections on frame
        frame_with_detections = self.detector.draw_detections(frame, detections)
        cv2.imshow("SafeDetect", frame_with_detections)
        return cv2.waitKey(1) & 0xFF
```

### GPIO Integration

For hardware alerts (LEDs, buzzers):

```python
# backend/computer_vision/gpio_alerts.py
import RPi.GPIO as GPIO

class GPIOAlerts:
    def __init__(self):
        GPIO.setmode(GPIO.BCM)
        # Setup GPIO pins for alerts
        self.alert_pins = {
            'left': 17,
            'right': 18,
            'rear': 27
        }
        for pin in self.alert_pins.values():
            GPIO.setup(pin, GPIO.OUT)

    def trigger_alert(self, zone):
        if zone in self.alert_pins:
            GPIO.output(self.alert_pins[zone], GPIO.HIGH)
            time.sleep(0.5)
            GPIO.output(self.alert_pins[zone], GPIO.LOW)
```

## 📊 Data Integration

### Database Storage

Add detection data storage:

```python
# backend/computer_vision/data_storage.py
import sqlite3
from datetime import datetime

class DetectionStorage:
    def __init__(self, db_path="detections.db"):
        self.conn = sqlite3.connect(db_path)
        self.setup_database()

    def setup_database(self):
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS detections (
                id INTEGER PRIMARY KEY,
                timestamp TEXT,
                object_type TEXT,
                confidence REAL,
                position_x REAL,
                position_y REAL,
                in_blind_spot INTEGER
            )
        ''')
        self.conn.commit()

    def store_detection(self, detection):
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO detections (timestamp, object_type, confidence, position_x, position_y, in_blind_spot)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            detection['object'],
            detection['confidence'],
            detection['position']['x'],
            detection['position']['y'],
            1 if self.is_in_blind_spot(detection) else 0
        ))
        self.conn.commit()
```

### Analytics Integration

Generate detection analytics:

```python
# backend/computer_vision/analytics.py
class DetectionAnalytics:
    def __init__(self):
        self.detection_counts = {}
        self.blind_spot_alerts = 0

    def analyze_detections(self, detections):
        # Count detections by type
        for detection in detections:
            obj_type = detection['object']
            self.detection_counts[obj_type] = self.detection_counts.get(obj_type, 0) + 1

            # Check for blind spot alerts
            if self.is_in_blind_spot(detection):
                self.blind_spot_alerts += 1

    def get_statistics(self):
        return {
            'total_detections': sum(self.detection_counts.values()),
            'detections_by_type': self.detection_counts,
            'blind_spot_alerts': self.blind_spot_alerts,
            'alert_rate': self.blind_spot_alerts / max(sum(self.detection_counts.values()), 1)
        }
```

## 🔒 Security Integration

### Authentication

Add WebSocket authentication:

```python
# backend/computer_vision/auth_server.py
class AuthenticatedWebSocketServer:
    def __init__(self):
        self.auth_tokens = {}  # Store valid tokens

    async def authenticate_client(self, websocket, token):
        if token in self.auth_tokens:
            return True
        return False

    async def handle_client(self, websocket, path):
        # Extract token from path or headers
        token = self.extract_token(path)
        if await self.authenticate_client(websocket, token):
            await self.register_client(websocket)
        else:
            await websocket.close(code=4001, reason="Authentication failed")
```

### Encrypted Communication

Enable WSS (WebSocket Secure):

```python
# Use wss:// instead of ws://
WEBSOCKET_HOST = "0.0.0.0"
WEBSOCKET_PORT = 8765
USE_SSL = True

# SSL configuration
SSL_CERT_FILE = "/path/to/cert.pem"
SSL_KEY_FILE = "/path/to/key.pem"
```

## 🧪 Testing Integration

### Unit Tests

```python
# backend/tests/test_detection.py
import unittest
from backend.computer_vision.detection import BlindSpotDetector

class TestBlindSpotDetector(unittest.TestCase):
    def setUp(self):
        self.detector = BlindSpotDetector()

    def test_blind_spot_detection(self):
        # Test blind spot zone detection
        self.assertTrue(self.detector.is_in_blind_spot(0.1, 0.5, "left"))
        self.assertFalse(self.detector.is_in_blind_spot(0.5, 0.5, "left"))

    def test_position_calculation(self):
        # Test position calculation
        bbox = [100, 100, 200, 200]
        position = self.detector.calculate_position(bbox, 640, 480)
        self.assertIsInstance(position, dict)
        self.assertIn('x', position)
        self.assertIn('y', position)
```

### Integration Tests

```python
# backend/tests/test_integration.py
import asyncio
import unittest
from backend.computer_vision.blind_spot import BlindSpotSystem
from mobile.services.WebSocketService import WebSocketService

class TestSystemIntegration(unittest.TestCase):
    async def test_full_system(self):
        # Start backend system
        system = BlindSpotSystem()
        await system.start(use_camera=False)

        # Connect mobile client
        ws_client = WebSocketService('ws://localhost:8765')
        connected = await ws_client.connect()

        self.assertTrue(connected)
        self.assertTrue(system.is_running)

        # Cleanup
        await system.stop()
        ws_client.disconnect()
```

## 📈 Performance Integration

### Monitoring

Add performance monitoring:

```python
# backend/computer_vision/performance_monitor.py
class PerformanceMonitor:
    def __init__(self):
        self.metrics = {
            'fps': [],
            'latency': [],
            'memory_usage': [],
            'cpu_usage': []
        }

    def record_metrics(self, fps, latency):
        self.metrics['fps'].append(fps)
        self.metrics['latency'].append(latency)

        # Keep only last 100 measurements
        for key in self.metrics:
            self.metrics[key] = self.metrics[key][-100:]

    def get_average_metrics(self):
        return {
            key: sum(values) / len(values) if values else 0
            for key, values in self.metrics.items()
        }
```

### Optimization

Performance optimization techniques:

```python
# backend/computer_vision/optimized_detection.py
class OptimizedDetector:
    def __init__(self):
        # Use smaller model for faster inference
        self.model = YOLO('yolov8n.pt')  # nano model

        # Reduce input resolution
        self.input_size = (416, 416)  # Smaller than default 640x640

        # Enable GPU acceleration if available
        if torch.cuda.is_available():
            self.model.cuda()

    def preprocess_frame(self, frame):
        # Resize frame for faster processing
        return cv2.resize(frame, self.input_size)
```

## 🚀 Deployment Integration

### Docker Integration

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY shared/ ./shared/

# Expose WebSocket port
EXPOSE 8765

# Run application
CMD ["python", "backend/computer_vision/blind_spot.py"]
```

### Kubernetes Integration

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: safedetect-backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: safedetect
  template:
    metadata:
      labels:
        app: safedetect
    spec:
      containers:
      - name: backend
        image: safedetect-backend:latest
        ports:
        - containerPort: 8765
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

## 📝 Best Practices

1. **Error Handling**: Always include try-catch blocks for hardware operations
2. **Resource Management**: Properly release camera resources and close connections
3. **Logging**: Implement comprehensive logging for debugging and monitoring
4. **Configuration**: Use configuration files instead of hardcoding values
5. **Testing**: Test all integrations thoroughly before deployment
6. **Documentation**: Keep integration documentation up to date
7. **Security**: Implement authentication and encryption for production use

## 🔍 Troubleshooting Integration Issues

### Common Integration Problems

1. **WebSocket Connection Issues**:
   - Verify network connectivity
   - Check firewall settings
   - Ensure correct IP addresses

2. **Performance Issues**:
   - Monitor system resources
   - Optimize detection parameters
   - Consider hardware limitations

3. **Hardware Compatibility**:
   - Test with target hardware
   - Verify camera compatibility
   - Check mobile device capabilities

### Debug Integration

Enable debug logging:

```python
# Enable all debug logging
logging.basicConfig(level=logging.DEBUG)
```

```javascript
// Enable React Native debug logging
console.log('Integration debug info:', data);
```

---

This integration guide provides comprehensive instructions for customizing and extending the SafeDetect system for various use cases and deployment scenarios.

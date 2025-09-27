# 🔍 SafeDetect Multi-Camera Blind Spot Detection System

## Overview
The Multi-Camera Blind Spot Detection System supports simultaneous monitoring from multiple camera feeds, providing comprehensive blind spot coverage for vehicles. Now integrated with Kafka for reliable, scalable backend communication.

## 🚀 Features

### Multi-Camera Support
- **3 Dedicated Camera Zones**: Left, Right, and Rear blind spots
- **Simultaneous Processing**: All cameras processed in parallel
- **Zone-Specific Detection**: Each camera assigned to specific blind spot zone
- **Real-time Monitoring**: Live detection across all camera feeds

### Smart Detection
- **YOLOv8 Integration**: Advanced object detection
- **Zone-Aware Alerts**: Camera-specific blind spot warnings
- **Performance Monitoring**: Real-time FPS and detection tracking
- **Kafka Streaming**: Reliable message queue communication to Node.js backend
- **WebSocket Broadcasting**: Real-time data to web/mobile interfaces via Node.js proxy

## 📹 Camera Configuration

### Default Setup
```python
CAMERA_CONFIG = {
    "left": {
        "camera_id": 0,
        "zone": "left",
        "name": "Left Side Camera",
        "description": "Monitors left side blind spot"
    },
    "right": {
        "camera_id": 1,
        "zone": "right",
        "name": "Right Side Camera",
        "description": "Monitors right side blind spot"
    },
    "rear": {
        "camera_id": 2,
        "zone": "rear",
        "name": "Rear Camera",
        "description": "Monitors rear blind spot"
    }
}
```

### Camera Status Indicators
- 🟢 **Available**: Camera connected and working
- 🟡 **In Use**: Camera being accessed by another application
- 🔴 **Error**: Camera connection failed
- ⚫ **Not Connected**: No camera detected

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
cd backend
source venv/bin/activate  # If using virtual environment
pip install -r requirements.txt
```

### 2. Connect Cameras
- **USB Cameras**: Connect USB cameras to your computer
- **Built-in Camera**: Use your MacBook's built-in camera (camera_id: 0)
- **Multiple Cameras**: Connect additional USB cameras for full coverage

### 3. Test Camera Setup
```bash
cd backend/computer_vision
python test_multi_camera.py
```

This will:
- Test all camera connections
- Show camera status and availability
- Provide troubleshooting tips

## 🚀 Usage

### Complete System Startup

1. **Start Kafka** (required for communication):
```bash
cd backend
docker-compose up -d
```

2. **Start Node.js Backend** (Kafka consumer + WebSocket server):
```bash
cd web/backend
node server.js
```

3. **Start Multi-Camera Detection**:
```bash
cd backend/computer_vision
python multi_camera_detector.py
```

### Testing with Dummy Video
The system automatically falls back to dummy video if no cameras are available. For testing:
- Ensure `test_MJPG.avi` or similar video file exists in the backend directory
- The system will use video playback instead of live cameras

### Monitor System Status
The system provides real-time status information:
- Camera connection status for each zone
- Detection performance (FPS)
- Active object detections
- Blind spot alerts
- Kafka producer status

## 📊 System Architecture

### Components
1. **MultiCameraDetector**: Core detection engine with YOLOv8
2. **DetectionKafkaProducer**: Kafka producer for reliable messaging
3. **Node.js Backend**: Kafka consumer + WebSocket server
4. **React Frontend**: 3D visualization and user interface
5. **Configuration**: Camera, zone, and Kafka settings

### Data Flow
```
Cameras → MultiCameraDetector → YOLOv8 Detection → Zone Analysis → Kafka Producer → Kafka Topic → Node.js Consumer → WebSocket → React Frontend
```

## 🔧 Troubleshooting

### Camera Not Detected
1. **Check Connections**: Ensure cameras are properly connected
2. **USB Permissions**: Some USB cameras need additional permissions
3. **Camera Index**: Try different camera_id values (0, 1, 2, etc.)
4. **System Settings**: Check macOS camera permissions

### Kafka Connection Issues
1. **Start Kafka**: Ensure `docker-compose up -d` is running
2. **Check Topic**: Verify 'detections' topic exists
3. **Network**: Ensure localhost:9092 is accessible
4. **Logs**: Check producer/consumer logs for connection errors

### Performance Issues
1. **Reduce Resolution**: Lower CAMERA_WIDTH/HEIGHT in config
2. **Adjust FPS**: Reduce FPS_TARGET for better performance
3. **Close Other Apps**: Free up system resources

### No Detections
1. **Lighting**: Ensure good lighting conditions
2. **Object Distance**: Objects should be within camera range
3. **Model Training**: YOLOv8 model may need fine-tuning for specific objects
4. **Kafka Flow**: Verify messages are being produced/consumed

## 📱 Integration

### Web Interface
- Access via web browser at `http://localhost:3000`
- Real-time camera feeds and detection overlays
- 3D truck visualization with blind spot zones
- Connects to WebSocket at `ws://localhost:8081`

### Mobile/Web Apps
- Connect to WebSocket server at `ws://localhost:8081`
- Receive real-time detection alerts via Kafka
- Mobile-optimized interface

## 🔧 Configuration Options

### Camera Settings
```python
CAMERA_WIDTH = 640          # Camera resolution width
CAMERA_HEIGHT = 480         # Camera resolution height
FPS_TARGET = 15            # Target processing FPS
MODEL_CONFIDENCE = 0.5     # Detection confidence threshold
```

### Blind Spot Zones
```python
BLIND_SPOT_ZONES = {
    "left": {"x_min": 0, "x_max": 0.3, "y_min": 0.2, "y_max": 0.8},
    "right": {"x_min": 0.7, "x_max": 1.0, "y_min": 0.2, "y_max": 0.8},
    "rear": {"x_min": 0.3, "x_max": 0.7, "y_min": 0.7, "y_max": 1.0}
}
```

## 📈 Performance Tips

1. **Optimal Lighting**: Ensure well-lit environment
2. **Camera Positioning**: Position cameras for optimal blind spot coverage
3. **System Resources**: Close unnecessary applications
4. **Network**: Use local network for best WebSocket performance

## 🆘 Support

For issues or questions:
1. Run the test script: `python test_multi_camera.py`
2. Check the logs for detailed error information
3. Verify camera permissions in System Settings
4. Ensure all dependencies are properly installed

---

**SafeDetect Multi-Camera System** - Advanced blind spot detection for enhanced vehicle safety.

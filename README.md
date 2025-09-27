# 🚛 SafeDetect - Real-Time Blind Spot Detection System

SafeDetect is a comprehensive vehicle safety system that uses computer vision and machine learning to detect objects in blind spots, providing real-time alerts to prevent accidents. The system integrates multiple cameras, advanced AI detection, and modern web technologies for a complete safety solution.

## 🏗️ Architecture Overview

SafeDetect consists of four main components working together:

1. **Python Backend** (Computer Vision): Multi-camera object detection using YOLOv8
2. **Kafka Message Queue**: Reliable communication between backend services
3. **Node.js Backend**: Kafka consumer and WebSocket server for real-time web communication
4. **React Frontend**: 3D visualization and user interface

### Data Flow
```
Cameras → Python Backend → Kafka → Node.js Backend → WebSocket → React Frontend
```

## ✨ Key Features

- **🔍 Multi-Camera Detection**: Simultaneous monitoring of left, right, and rear blind spots
- **🤖 AI-Powered**: YOLOv8 object detection for cars, motorcycles, and pedestrians
- **📡 Real-Time Communication**: Kafka for reliable backend messaging, WebSocket for web updates
- **🎨 3D Visualization**: Interactive truck model with live detection overlays
- **📱 Responsive Web App**: Works on desktop and mobile browsers
- **🔊 Audio Alerts**: Sound notifications for blind spot objects
- **📊 Performance Monitoring**: Real-time FPS and detection statistics

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (for Kafka)
- USB cameras or video files for testing

### 1. Clone and Setup
```bash
git clone <repo-url>
cd SafeDetect
```

### 2. Start Kafka
```bash
cd backend
docker-compose up -d
```

### 3. Setup Python Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Setup Node.js Backend
```bash
cd web/backend
npm install
```

### 5. Setup React Frontend
```bash
cd web
npm install
```

### 6. Run the System

**Terminal 1 - Node.js Backend:**
```bash
cd web/backend
node server.js
```

**Terminal 2 - Python Detection:**
```bash
cd backend
source venv/bin/activate
python computer_vision/multi_camera_detector.py
```

**Terminal 3 - React App:**
```bash
cd web
npm start
```

Open `http://localhost:3000` in your browser!

## 📁 Project Structure

```
SafeDetect/
├── backend/                    # Python computer vision backend
│   ├── computer_vision/       # Detection algorithms
│   │   ├── multi_camera_detector.py    # Main multi-camera system
│   │   ├── kafka_producer.py          # Kafka messaging
│   │   ├── detection.py               # Single camera detection
│   │   ├── archive/                   # Legacy WebSocket files
│   │   └── README_MULTI_CAMERA.md     # Multi-camera docs
│   ├── docker-compose.yml     # Kafka setup
│   ├── requirements.txt       # Python dependencies
│   └── README.md             # Backend documentation
├── web/                       # React frontend + Node.js backend
│   ├── backend/              # Node.js Kafka consumer/WebSocket server
│   │   ├── server.js         # WebSocket server
│   │   ├── kafka_config.js   # Kafka settings
│   │   └── package.json      # Node.js dependencies
│   ├── src/                  # React application
│   │   ├── components/       # React components
│   │   ├── services/         # WebSocket service
│   │   └── App.js           # Main React app
│   ├── package.json         # React dependencies
│   └── README.md            # Frontend documentation
├── shared/                   # Shared configuration
│   └── config.py            # System configuration
├── docs/                    # Additional documentation
└── README.md               # This file
```

## 🔧 Configuration

### Camera Setup
Edit `shared/config.py` to configure camera IDs and blind spot zones:

```python
CAMERA_CONFIG = {
    "left": {"camera_id": 0, "zone": "left"},
    "right": {"camera_id": 1, "zone": "right"},
    "rear": {"camera_id": 2, "zone": "rear"}
}
```

### Kafka Settings
Kafka runs on `localhost:9092` with topic `detections`. Configure in:
- `shared/config.py` (Python producer)
- `web/backend/kafka_config.js` (Node.js consumer)

## 🧪 Testing

### With Real Cameras
1. Connect USB cameras to your computer
2. Run the system as described above
3. Objects in camera view will be detected and displayed

### With Dummy Video
The system automatically falls back to video files if no cameras are available:
- Place test video files in the `backend/` directory
- System will use `test_MJPG.avi` or similar for testing

### Test Camera Connections
```bash
cd backend/computer_vision
python test_multi_camera.py
```

## 🐛 Troubleshooting

### Common Issues

**Cameras not detected:**
- Check USB connections and permissions
- Try different camera IDs in config
- Use dummy video for testing

**No detections in web app:**
- Ensure all services are running (Kafka, Node.js, Python, React)
- Check browser console for WebSocket connection errors
- Verify Kafka topic has messages

**Performance issues:**
- Reduce camera resolution in `shared/config.py`
- Close other applications
- Use GPU for YOLOv8 if available

**Kafka connection errors:**
- Ensure Docker containers are running: `docker ps`
- Check Kafka logs: `docker logs kafka`
- Verify topic exists

### Logs and Debugging
- **Python Backend**: Check terminal output for detection logs
- **Node.js Backend**: Check terminal for Kafka consumption logs
- **React Frontend**: Open browser dev tools for WebSocket/connection logs
- **Kafka**: `docker logs kafka` and `docker logs zookeeper`

## 📚 Documentation

- **[Backend README](backend/README.md)**: Python computer vision system
- **[Web README](web/README.md)**: React frontend and Node.js backend
- **[Multi-Camera Guide](backend/computer_vision/README_MULTI_CAMERA.md)**: Detailed camera setup
- **[Setup Guide](docs/setup_guide.md)**: Detailed installation instructions
- **[Integration Guide](docs/integration_guide.md)**: API and integration details
- **[Testing Guide](docs/testing_guide.md)**: Testing procedures and scenarios

## 🛠️ Development

### Adding New Features
1. **Backend**: Modify Python files in `backend/computer_vision/`
2. **Frontend**: Update React components in `web/src/`
3. **Communication**: Update message formats in Kafka/WebSocket protocols

### Code Style
- **Python**: Follow PEP 8, use type hints
- **JavaScript**: Use modern ES6+, consistent formatting
- **Documentation**: Keep READMEs updated with changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Update documentation
5. Test thoroughly
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **YOLOv8** by Ultralytics for object detection
- **React Three Fiber** for 3D web graphics
- **Apache Kafka** for reliable messaging
- **Three.js** for 3D rendering

---

**SafeDetect** - Making roads safer through AI-powered blind spot detection.

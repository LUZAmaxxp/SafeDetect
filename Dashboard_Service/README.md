# SafeDetect Web App

A React.js web application for real-time object detection and blind spot monitoring using Kafka for backend communication.

## Architecture

The web app consists of two parts:

1. **React Frontend**: 3D visualization and user interface
2. **Node.js Backend**: Kafka consumer + WebSocket server for real-time communication

## Features

- **Real-time 3D Visualization**: Interactive 3D truck model with object detection overlays
- **Kafka Integration**: Reliable backend communication via Kafka message queue
- **WebSocket Streaming**: Real-time updates from Node.js backend to React frontend
- **Blind Spot Monitoring**: Visual and audio alerts for objects in blind spots
- **Responsive Design**: Works on desktop and mobile browsers
- **Modern UI/UX**: Clean dark theme with intuitive user experience

## Technology Stack

- **React 18**: Modern React with hooks
- **React Three Fiber**: 3D graphics rendering
- **Three.js**: 3D graphics library
- **Node.js**: Backend server with Kafka consumer
- **Kafka.js**: Kafka client for Node.js
- **ws**: WebSocket library for Node.js
- **Webpack**: Module bundler

## Installation

### Frontend (React)
1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Backend (Node.js)
1. Navigate to the web backend directory:
   ```bash
   cd web/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Complete System Startup

1. **Start Kafka** (see main backend README):
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Start Node.js Backend** (Kafka consumer + WebSocket server):
   ```bash
   cd web/backend
   node server.js
   ```
   - Consumes from Kafka topic 'detections'
   - Serves WebSocket on ws://localhost:8081

3. **Start Python Detection Backend**:
   ```bash
   cd backend
   source venv/bin/activate
   python computer_vision/multi_camera_detector.py
   ```
   - Processes camera feeds
   - Sends detections to Kafka

4. **Start React Frontend**:
   ```bash
   cd web
   npm start
   ```
   - Opens http://localhost:3000
   - Connects to WebSocket at ws://localhost:8081

### View Detections
Objects will appear as colored spheres around the 3D truck model:
- 🟢 Green spheres: Cars
- 🟠 Orange spheres: Motorcycles
- 🟡 Yellow spheres: Pedestrians

### Blind Spot Alerts
Objects in blind spots will trigger:
- Visual alerts on screen
- Browser notifications (if permitted)
- Audio alerts (if enabled)

## Controls

- **Mouse/Touch**: Rotate, zoom, and pan the 3D scene
- **Reconnect Button**: Manually reconnect to the WebSocket server
- **Responsive**: Works on both desktop and mobile devices

## Development

### Available Scripts (Frontend)

- `npm start`: Start development server
- `npm run build`: Build for production
- `npm run dev`: Start development server and open browser

### Project Structure

```
web/
├── backend/                # Node.js backend
│   ├── server.js          # Kafka consumer + WebSocket server
│   ├── kafka_config.js    # Kafka configuration
│   └── package.json       # Node.js dependencies
├── public/
│   └── index.html         # HTML entry point
├── src/
│   ├── components/
│   │   ├── Truck3D.js     # 3D truck model component
│   │   └── DetectionOverlay.js # 3D detection spheres
│   ├── services/
│   │   └── WebSocketService.js # WebSocket communication
│   ├── App.js             # Main application component
│   ├── App.css            # Application styles
│   └── index.js           # React entry point
├── package.json           # React dependencies and scripts
├── webpack.config.js      # Webpack configuration
└── README.md             # This file
```

## How It Works

1. **Python Backend** processes camera feeds and detects objects using YOLOv8
2. **Detections** are sent to Kafka topic 'detections' as JSON messages
3. **Node.js Backend** consumes from Kafka and broadcasts via WebSocket
4. **React Frontend** receives real-time updates and renders 3D visualization

### Message Flow
```
Python Backend → Kafka Topic → Node.js Backend → WebSocket → React Frontend
```

### Detection Data Format
```json
{
  "type": "detections",
  "timestamp": 1234567890.123,
  "detections": [
    {
      "id": "car_1",
      "class": "car",
      "confidence": 0.85,
      "position": {"x": 2.5, "y": 1.0, "z": 3.2},
      "zone": "left",
      "bbox": [100, 200, 150, 250]
    }
  ]
}
```

## Web-Specific Features

### 3D Graphics:
- Built with React Three Fiber for optimal web performance
- Interactive 3D truck model with real-time detection overlays
- WebGL-accelerated rendering for smooth 60 FPS experience

### Responsive Design:
- CSS-based styling with modern web standards
- Responsive layout that works on all screen sizes
- Clean dark theme optimized for visibility

### Browser Integration:
- Native WebSocket support for real-time communication
- Browser notifications for alerts
- Web Vibration API for haptic feedback on supported devices

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Responsive design works on mobile

## Troubleshooting

### Connection Issues
- Ensure Node.js backend is running on port 8081
- Check Kafka is running and topic 'detections' exists
- Verify WebSocket URL in browser console
- Check firewall settings

### No Detections Showing
- Verify Python backend is sending to Kafka
- Check Node.js backend logs for Kafka consumption
- Ensure cameras are connected/working

### 3D Rendering Issues
- Ensure WebGL is enabled in your browser
- Try a different browser if 3D doesn't load
- Check browser console for errors

### Performance
- Close other browser tabs for better performance
- Use a modern browser for optimal 3D rendering
- Reduce browser zoom if experiencing lag

## Configuration

- **WebSocket URL**: Configured in `src/services/WebSocketService.js`
- **Kafka Settings**: Configured in `backend/kafka_config.js`
- **Detection Zones**: Configured in `shared/config.py`

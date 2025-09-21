# SafeDetect Backend - Blind Spot Detection System

This directory contains the Python backend for the SafeDetect blind spot detection system, including computer vision, WebSocket server, and integration components.

## Components

### 1. Computer Vision (`computer_vision/`)
- **`detection.py`**: YOLOv8-based object detection with blind spot zone analysis
- **`websocket_server.py`**: WebSocket server for real-time detection streaming
- **`blind_spot.py`**: Main integration system combining detection and WebSocket

### 2. Configuration (`shared/`)
- **`config.py`**: Shared configuration for detection parameters, WebSocket settings, and 3D visualization

### 3. Dependencies (`requirements.txt`)
- All Python dependencies required for the system

## Installation

1. **Create Python Virtual Environment** (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Download YOLOv8 Model**:
   The system will automatically download the YOLOv8 nano model on first run, or you can manually download:
   ```bash
   # The model will be downloaded automatically when needed
   ```

## Usage

### Running the Complete System

1. **With Dummy Video** (for testing):
   ```bash
   python backend/computer_vision/blind_spot.py
   ```

2. **With Real Camera**:
   ```bash
   python -c "
   import asyncio
   from backend.computer_vision.blind_spot import BlindSpotSystem

   async def main():
       system = BlindSpotSystem()
       await system.start(use_camera=True, camera_id=0)

   asyncio.run(main())
   "
   ```

### Running Individual Components

1. **Detection Only**:
   ```bash
   python backend/computer_vision/detection.py
   ```

2. **WebSocket Server Only**:
   ```bash
   python backend/computer_vision/websocket_server.py
   ```

## Configuration

Edit `shared/config.py` to modify:
- WebSocket host/port
- Blind spot zone coordinates
- Detection confidence thresholds
- Camera settings
- Alert parameters

## WebSocket API

### Connection
- **URL**: `ws://localhost:8765`
- **Protocol**: JSON over WebSocket

### Message Format
```json
{
  "type": "detections",
  "timestamp": 1234567890.123,
  "detections": [
    {
      "object": "car",
      "position": { "x": 2.5, "y": -1.0 },
      "confidence": 0.85,
      "bbox": [100, 200, 300, 400],
      "class_id": 2,
      "timestamp": 1234567890.123
    }
  ]
}
```

### Client Commands
- **Ping**: `{"type": "ping"}`
- **Status**: `{"type": "status"}`
- **Get Config**: `{"type": "command", "command": "get_config"}`

## Hardware Requirements

### Minimum Requirements
- **CPU**: 2-core processor (Intel i3 or equivalent)
- **RAM**: 4GB
- **Storage**: 2GB free space
- **Camera**: USB webcam or Raspberry Pi camera module

### Recommended Requirements
- **CPU**: 4-core processor (Intel i5 or equivalent)
- **RAM**: 8GB
- **GPU**: NVIDIA GPU with CUDA support (for faster YOLOv8 inference)
- **Camera**: Multiple wide-angle cameras for comprehensive coverage

## Performance

- **Target FPS**: 15 FPS
- **Resolution**: 640x480 (configurable)
- **Latency**: <100ms from detection to mobile app
- **Concurrent Clients**: Up to 10 mobile devices

## Troubleshooting

### Common Issues

1. **Camera Not Found**:
   - Check camera connection
   - Verify camera permissions
   - Try different camera ID (0, 1, 2, etc.)

2. **Low FPS**:
   - Reduce camera resolution in config
   - Use GPU acceleration if available
   - Close other applications

3. **WebSocket Connection Failed**:
   - Check if port 8765 is available
   - Verify firewall settings
   - Ensure mobile app is on same network

4. **YOLOv8 Model Download Issues**:
   - Check internet connection
   - Try manual download of model file
   - Verify disk space

### Debug Mode

Enable debug logging by modifying the logging level in the scripts:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Testing

1. **Unit Tests**: Run individual components
2. **Integration Tests**: Test complete system with dummy video
3. **Performance Tests**: Monitor FPS and latency
4. **Network Tests**: Verify WebSocket communication

## Deployment

### Raspberry Pi Setup
1. Install Raspberry Pi OS
2. Enable camera interface in raspi-config
3. Install Python dependencies
4. Run as service for continuous operation

### Production Deployment
1. Use production WSGI server (Gunicorn)
2. Set up proper logging
3. Configure auto-restart on failure
4. Monitor system resources

## API Reference

### BlindSpotDetector Class
- `start_camera(camera_id)`: Start real camera
- `start_dummy_video(video_path)`: Start dummy video
- `process_frame(websocket_server)`: Process single frame
- `is_in_blind_spot(x, y, zone)`: Check blind spot zones
- `play_alert_sound()`: Play audio alert

### DetectionWebSocketServer Class
- `start_server()`: Start WebSocket server
- `stop_server()`: Stop WebSocket server
- `broadcast_detections(detections)`: Send detections to clients
- `get_status()`: Get server status

### BlindSpotSystem Class
- `start(use_camera, camera_id)`: Start complete system
- `stop()`: Stop complete system
- `get_status()`: Get system status

## Contributing

1. Follow PEP 8 style guidelines
2. Add docstrings to all functions
3. Include type hints
4. Test changes thoroughly
5. Update documentation for API changes

## License

This project is licensed under the MIT License - see the main README for details.

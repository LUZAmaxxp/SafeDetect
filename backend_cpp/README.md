# SafeDetect C++ - Multi-Camera Blind Spot Detection System

This is a C++ implementation of the SafeDetect multi-camera blind spot detection system, converted from the original Python version. It maintains all the same features while providing better performance and easier deployment.

## Features

- **Multi-Camera Support**: Handles multiple camera feeds (left, right, rear) for comprehensive blind spot monitoring
- **Object Detection**: Uses YOLOv8 model via OpenCV DNN for real-time object detection
- **Blind Spot Detection**: Intelligent zone-based detection for blind spots
- **3D Position Calculation**: Maps camera coordinates to 3D world coordinates
- **Kafka Integration**: Sends detection data to Kafka for further processing
- **Audio Alerts**: Plays beep sounds when objects are detected in blind spots
- **Camera Status Monitoring**: Tracks camera connection and operational status
- **Cross-Platform**: Supports Windows, Linux, and macOS
- **Raspberry Pi Optimized**: Can be optimized for Raspberry Pi deployment

## Dependencies

- OpenCV 4.x (with DNN module)
- cppkafka (Kafka client)
- SDL2 (for audio)
- nlohmann/json (JSON handling)
- spdlog (logging)

## Quick Start

### 1. Install vcpkg (Dependency Manager)

```bash
# Clone vcpkg
git clone https://github.com/Microsoft/vcpkg.git
cd vcpkg

# Bootstrap vcpkg
./bootstrap-vcpkg.sh  # Linux/macOS
# or
.\bootstrap-vcpkg.bat  # Windows

# Install dependencies
./vcpkg install opencv cppkafka sdl2 nlohmann-json spdlog
```

### 2. Build the Project

```bash

# Create build directory
mkdir build
cd build
cd C:\Users\pc\Desktop\SafeDetect\backend_cpp\build

# Configure with CMake
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:/vcpkg/scripts/buildsystems/vcpkg.cmake -G "Visual Studio 17 2022" -A x64


# Build


cmake --build . --config Release
```

### 3. Download YOLO Model

Download the YOLOv8 ONNX model and place it in the `models/` directory:

```bash
mkdir models
# Download yolov8n.onnx from https://github.com/ultralytics/ultralytics
# or use any compatible YOLO model
```

### 4. Run

```bash
./safedetect
```

## Configuration

The system can be configured via environment variables:

- `KAFKA_HOST`: Kafka broker host (default: localhost)
- `KAFKA_PORT`: Kafka broker port (default: 9092)

## Camera Setup

The system expects cameras to be connected with the following IDs:
- Left camera: ID 0
- Right camera: ID 1
- Rear camera: ID 2

## Architecture

### Core Components

- **MultiCameraDetector**: Main detection class handling camera management and processing
- **DetectionKafkaProducer**: Sends detection data to Kafka
- **AudioAlert**: Handles audio alert generation
- **Config**: Centralized configuration management

### Detection Pipeline

1. Camera frame capture
2. Object detection using YOLO
3. Blind spot zone checking
4. Position calculation
5. Kafka message sending
6. Audio alert triggering

## Performance

- Target FPS: 15
- Optimized for real-time processing
- Memory efficient for embedded systems

## Troubleshooting

### Common Issues

1. **Camera not found**: Check camera IDs and connections
2. **Model not loading**: Ensure YOLO ONNX model is in `models/` directory
3. **Kafka connection failed**: Check Kafka broker settings
4. **Audio not working**: Ensure SDL2 is properly installed

### Build Issues

If you encounter build issues:

1. Ensure all dependencies are installed via vcpkg
2. Check CMake version (3.16+ required)
3. Verify compiler supports C++17

## Development

### Project Structure

```
backend_cpp/
├── CMakeLists.txt          # Build configuration
├── vcpkg.json             # Dependencies
├── src/
│   ├── main.cpp           # Entry point
│   ├── config.hpp/.cpp    # Configuration
│   ├── kafka_producer.hpp/.cpp  # Kafka integration
│   ├── audio_alert.hpp/.cpp     # Audio alerts
│   └── multi_camera_detector.hpp/.cpp  # Main detector
├── models/                # YOLO models
└── README.md              # This file
```

### Adding New Features

1. Update the config header with new constants
2. Implement new classes in separate header/cpp pairs
3. Update CMakeLists.txt to include new sources
4. Update this README with new features

## License

Same as the original Python project.

# SafeDetect C++ Implementation

## Overview
This is the C++ implementation of the SafeDetect multi-camera blind spot detection system. The system uses multiple cameras to detect objects in vehicle blind spots and provides real-time alerts through Kafka messaging.

## Features
- Multi-camera support with asynchronous frame processing
- YOLOv8 integration for object detection
- Kafka integration for real-time alerts
- Thread-safe design
- Modern C++ (C++20) implementation
- Efficient memory management with smart pointers

## Dependencies
- OpenCV 4.x
- librdkafka
- nlohmann_json
- spdlog
- CMake 3.15+
- C++20 compatible compiler

## Building

### Prerequisites
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y \
    build-essential \
    cmake \
    libopencv-dev \
    librdkafka-dev \
    nlohmann-json3-dev \
    libspdlog-dev

# Windows with vcpkg
vcpkg install opencv4:x64-windows
vcpkg install librdkafka:x64-windows
vcpkg install nlohmann-json:x64-windows
vcpkg install spdlog:x64-windows
```

### Build Steps
```bash
# Clone the repository
git clone https://github.com/LUZAmaxxp/SafeDetect.git
cd SafeDetect/cpp_implementation

# Create build directory and build
./build.sh
```

## Usage
```bash
# Run the detection system
./build/safe_detect
```

## Configuration
Edit `src/utils/Config.hpp` to modify:
- Camera settings
- Kafka configuration
- Detection parameters
- Blind spot zones

## Architecture

### Core Components
- `MultiCameraDetector`: Main class handling camera feeds and detection
- `YOLO`: YOLOv8 integration for object detection
- `KafkaProducer`: Handles message publishing
- `Detection`: Detection result data structure

### Design Features
- Asynchronous camera processing
- Thread-safe Kafka message publishing
- RAII-based resource management
- Exception-safe design
- Modern C++ practices

## Performance Optimizations
- Asynchronous frame processing
- CUDA support when available
- Efficient memory management
- Minimal copying of frame data
- Thread pool for parallel processing

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the same terms as the main SafeDetect repository.
# Switch from WebSockets to Kafka for Backend Communication

## 1. Install and Setup Kafka

- [x] Install Kafka via Docker (Homebrew failed due to macOS version)
- [x] Start Zookeeper and Kafka servers
- [x] Create 'detections' topic

## 2. Update Python Backend
- [x] Add kafka-python to backend/requirements.txt
- [x] Create backend/computer_vision/kafka_producer.py
- [x] Modify backend/computer_vision/detection.py to use Kafka producer instead of WebSocket
- [x] Update shared/config.py with Kafka settings
- [x] Deprecate websocket_server.py

## 3. Create Node.js Backend for Web App

- [x] Create web/backend/ directory
- [x] Create web/backend/package.json with dependencies
- [x] Create web/backend/server.js (Kafka consumer + WebSocket server)
- [x] Create web/backend/kafka_config.js

## 4. Update Web Frontend

- [x] Update web/src/App.js WebSocket URL to localhost:8081

## 5. Testing and Integration

- [x] Install Python dependencies
- [x] Test Python producer
- [x] Test Node.js consumer/WebSocket server
- [x] Test full integration with web app

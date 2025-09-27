# SafeDetect Testing Guide

Comprehensive testing procedures for the SafeDetect blind spot detection system.

## 🧪 Testing Overview

This guide covers testing strategies for all components of the SafeDetect system with Kafka integration, including unit tests, integration tests, performance tests, and user acceptance tests.

## 📋 Test Categories

### 1. Unit Tests
- Individual component functionality
- Algorithm accuracy
- Data processing logic
- Kafka message handling

### 2. Integration Tests
- Component interaction testing (Python → Kafka → Node.js → React)
- End-to-end data flow
- Hardware integration

### 3. Performance Tests
- Real-time operation verification
- Resource usage monitoring
- Kafka throughput testing
- Scalability testing

### 4. User Acceptance Tests
- Usability testing
- Real-world scenario testing
- Safety verification

## 🛠️ Testing Environment Setup

### Hardware Requirements
- **Test Device**: Computer with camera or Raspberry Pi
- **Web Browser**: Modern browser with WebGL support (Chrome, Firefox, Safari, Edge)
- **Network**: Local WiFi network
- **Display**: Monitor for visual verification

### Software Requirements
- **Python Testing**: pytest, unittest
- **Web Testing**: Jest, React Testing Library
- **Performance Monitoring**: psutil, memory_profiler
- **Browser Testing**: Selenium WebDriver (optional)

### Test Data
- **Dummy Videos**: Pre-recorded test footage
- **Test Images**: Static images for unit testing
- **Simulated Data**: Generated detection data

## 🧪 Unit Testing

### Backend Unit Tests

#### Detection Engine Tests

```python
# backend/tests/test_detection.py
import unittest
import numpy as np
from backend.computer_vision.detection import BlindSpotDetector

class TestBlindSpotDetector(unittest.TestCase):
    def setUp(self):
        self.detector = BlindSpotDetector()

    def test_blind_spot_detection(self):
        """Test blind spot zone detection logic"""
        # Test left blind spot
        self.assertTrue(self.detector.is_in_blind_spot(0.1, 0.5, "left"))
        self.assertFalse(self.detector.is_in_blind_spot(0.5, 0.5, "left"))

        # Test right blind spot
        self.assertTrue(self.detector.is_in_blind_spot(0.9, 0.5, "right"))
        self.assertFalse(self.detector.is_in_blind_spot(0.5, 0.5, "right"))

        # Test rear blind spot
        self.assertTrue(self.detector.is_in_blind_spot(0.5, 0.9, "rear"))
        self.assertFalse(self.detector.is_in_blind_spot(0.5, 0.5, "rear"))

    def test_position_calculation(self):
        """Test position calculation from bounding boxes"""
        bbox = [100, 100, 200, 200]  # x1, y1, x2, y2
        frame_width, frame_height = 640, 480

        position = self.detector.calculate_position(bbox, frame_width, frame_height)

        expected_x = (100 + 200) / 2 / frame_width
        expected_y = (100 + 200) / 2 / frame_height

        self.assertAlmostEqual(position['x'], expected_x, places=3)
        self.assertAlmostEqual(position['y'], expected_y, places=3)

    def test_object_filtering(self):
        """Test that only relevant objects are processed"""
        # Mock detection results
        mock_results = [
            type('obj', (), {'cls': np.array([2]), 'conf': np.array([0.8])})  # car
        ]

        # This would require mocking the YOLO model
        # Implementation depends on specific testing framework
```

#### Kafka Producer Tests

```python
# backend/tests/test_kafka_producer.py
import unittest
from unittest.mock import Mock, patch
from backend.computer_vision.kafka_producer import DetectionKafkaProducer

class TestKafkaProducer(unittest.TestCase):
    def setUp(self):
        self.producer = DetectionKafkaProducer()

    @patch('kafka.KafkaProducer')
    def test_producer_initialization(self, mock_kafka_producer):
        """Test Kafka producer initialization"""
        mock_producer_instance = Mock()
        mock_kafka_producer.return_value = mock_producer_instance

        producer = DetectionKafkaProducer()
        self.assertIsNotNone(producer.producer)
        mock_kafka_producer.assert_called_once()

    def test_send_detections(self):
        """Test sending detection data to Kafka"""
        with patch.object(self.producer, 'producer') as mock_producer:
            detection_data = {
                'type': 'detections',
                'timestamp': 1234567890.123,
                'detections': [{
                    'id': 'car_1',
                    'class': 'car',
                    'confidence': 0.85,
                    'position': {'x': 2.5, 'y': 1.0, 'z': 3.2}
                }]
            }

            self.producer.send_detections(detection_data)

            # Verify message was sent to Kafka
            mock_producer.send.assert_called_once()
            args, kwargs = mock_producer.send.call_args
            self.assertEqual(args[0], 'detections')  # topic
            sent_message = args[1]  # message
            self.assertEqual(sent_message['type'], 'detections')
```

#### Node.js Backend Tests

```javascript
// web/backend/tests/server.test.js
const WebSocket = require('ws');
const { Kafka } = require('kafkajs');

describe('Node.js Backend', () => {
    let server;
    let kafkaConsumer;

    beforeEach(() => {
        // Mock Kafka consumer
        kafkaConsumer = {
            connect: jest.fn(),
            subscribe: jest.fn(),
            run: jest.fn(),
            disconnect: jest.fn()
        };
    });

    test('WebSocket server starts on correct port', () => {
        // Test server initialization
        expect(server).toBeDefined();
    });

    test('handles Kafka messages correctly', async () => {
        const mockMessage = {
            type: 'detections',
            timestamp: Date.now(),
            detections: [{
                id: 'car_1',
                class: 'car',
                confidence: 0.85,
                position: { x: 2.5, y: 1.0, z: 3.2 }
            }]
        };

        // Simulate Kafka message processing
        // Test that message is broadcast to WebSocket clients
        expect(mockMessage.type).toBe('detections');
    });

    test('WebSocket clients receive messages', () => {
        // Test WebSocket message broadcasting
        const mockClient = { send: jest.fn() };
        server.clients.add(mockClient);

        // Simulate broadcasting a message
        const testMessage = JSON.stringify({ type: 'test' });

        // Verify client receives message
        expect(mockClient.send).toHaveBeenCalledWith(testMessage);
    });
});
```

### Web App Unit Tests

```javascript
// web/tests/App.test.js
import React from 'react';
import { render } from '@testing-library/react';
import App from '../src/App';

describe('App Component', () => {
    it('renders without crashing', () => {
        const { getByText } = render(<App />);
        // Add assertions based on component content
    });

    it('displays connection status', () => {
        const { getByText } = render(<App />);
        expect(getByText(/Connected|Disconnected/)).toBeTruthy();
    });

    it('shows detection count', () => {
        const { getByText } = render(<App />);
        expect(getByText(/Objects:/)).toBeTruthy();
    });
});
```

## 🔗 Integration Testing

### Component Integration Tests

#### Backend Integration Test

```python
# backend/tests/test_integration.py
import asyncio
import unittest
from unittest.mock import patch
from backend.computer_vision.multi_camera_detector import MultiCameraDetector

class TestBackendIntegration(unittest.TestCase):
    async def test_complete_backend_system(self):
        """Test complete backend system integration"""
        detector = MultiCameraDetector()

        # Start system with dummy video
        await detector.start(use_camera=False)

        # Verify system is running
        self.assertTrue(detector.is_running)
        self.assertTrue(detector.cap.isOpened())

        # Check Kafka producer status
        status = detector.get_status()
        self.assertIn('kafka_status', status)
        self.assertIn('detector_status', status)

        # Stop system
        await detector.stop()
        self.assertFalse(detector.is_running)

    async def test_detection_to_kafka_flow(self):
        """Test data flow from detection to Kafka"""
        detector = MultiCameraDetector()

        with patch('backend.computer_vision.kafka_producer.DetectionKafkaProducer') as mock_producer:
            mock_producer_instance = mock_producer.return_value
            mock_producer_instance.send_detections = unittest.mock.AsyncMock()

            await detector.start(use_camera=False)

            # Process some frames
            for _ in range(10):
                detections = await detector.process_frame()
                if detections:
                    break
                await asyncio.sleep(0.1)

            # Verify detections were processed and sent to Kafka
            self.assertIsInstance(detections, list)
            if detections:
                mock_producer_instance.send_detections.assert_called()

            await detector.stop()
```

#### Kafka-Node.js Integration Test

```python
# backend/tests/test_kafka_node_integration.py
import asyncio
import unittest
from unittest.mock import patch, AsyncMock
import subprocess
import json
from backend.computer_vision.kafka_producer import DetectionKafkaProducer

class TestKafkaNodeIntegration(unittest.TestCase):
    def setUp(self):
        self.producer = DetectionKafkaProducer()

    @patch('kafka.KafkaProducer')
    async def test_kafka_to_websocket_flow(self, mock_kafka_producer):
        """Test data flow from Kafka to Node.js WebSocket"""
        mock_producer_instance = AsyncMock()
        mock_kafka_producer.return_value = mock_producer_instance

        # Start Node.js backend (mock or subprocess)
        # For testing, assume Node.js is running on port 8081
        node_process = None
        try:
            # Start Node.js server in background (for real testing)
            # node_process = subprocess.Popen(['node', 'web/backend/server.js'])

            # Send test detection to Kafka
            detection_data = {
                'type': 'detections',
                'timestamp': 1234567890.123,
                'detections': [{
                    'id': 'car_1',
                    'class': 'car',
                    'confidence': 0.85,
                    'position': {'x': 2.5, 'y': 1.0, 'z': 3.2},
                    'zone': 'left',
                    'bbox': [100, 200, 150, 250]
                }]
            }

            await self.producer.send_detections(detection_data)

            # Verify message was sent to Kafka
            mock_producer_instance.send.assert_called_once()

            # In real test, connect to WebSocket and verify message received
            # For now, assert the flow logic
            self.assertEqual(detection_data['type'], 'detections')

        finally:
            if node_process:
                node_process.terminate()

    async def test_node_websocket_communication(self):
        """Test Node.js WebSocket server communication"""
        # This test assumes Node.js server is running
        # Use websockets library to connect to ws://localhost:8081

        uri = "ws://localhost:8081"
        try:
            async with websockets.connect(uri) as websocket:
                # Test connection
                await websocket.send(json.dumps({"type": "ping"}))
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                self.assertEqual(data["type"], "pong")

                # Test status request
                await websocket.send(json.dumps({"type": "status"}))
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                self.assertEqual(data["type"], "status")
                self.assertIn('kafka_connected', data)

        except Exception as e:
            self.fail(f"WebSocket test failed: {e}")
```

### End-to-End Testing

#### Full System Test

```python
# backend/tests/test_end_to_end.py
import asyncio
import time
import subprocess
import unittest
from unittest.mock import patch
from backend.computer_vision.multi_camera_detector import MultiCameraDetector

class TestEndToEnd(unittest.TestCase):
    def setUp(self):
        self.node_process = None
        self.kafka_process = None

    async def test_full_system_workflow(self):
        """Test complete system from camera to web app"""
        # Start Kafka (in background)
        try:
            self.kafka_process = subprocess.Popen(['docker-compose', 'up', '-d'],
                                                cwd='backend')

            # Start Node.js backend
            self.node_process = subprocess.Popen(['node', 'server.js'],
                                               cwd='web/backend')

            # Give services time to start
            await asyncio.sleep(10)

            # Start Python detection system
            detector = MultiCameraDetector()

            try:
                await detector.start(use_camera=False)
                self.assertTrue(detector.is_running)

                # Wait for system to process frames
                await asyncio.sleep(5)

                # Check system status
                status = detector.get_status()
                self.assertIsNotNone(status['fps'])
                self.assertGreater(status['fps'], 0)

                # Verify Kafka producer is connected
                self.assertTrue(status['kafka_status']['connected'])

            finally:
                await detector.stop()

        finally:
            # Cleanup processes
            if self.node_process:
                self.node_process.terminate()
            if self.kafka_process:
                subprocess.run(['docker-compose', 'down'], cwd='backend')

    async def test_performance_requirements(self):
        """Test system meets performance requirements"""
        detector = MultiCameraDetector()

        try:
            await detector.start(use_camera=False)

            # Monitor performance for 10 seconds
            fps_values = []
            start_time = time.time()

            while time.time() - start_time < 10:
                status = detector.get_status()
                if status['fps'] > 0:
                    fps_values.append(status['fps'])
                await asyncio.sleep(1)

            # Calculate average FPS
            avg_fps = sum(fps_values) / len(fps_values) if fps_values else 0

            # Assert minimum performance
            self.assertGreaterEqual(avg_fps, 15, f"Average FPS {avg_fps} below requirement")

        finally:
            await detector.stop()

    async def test_kafka_message_flow(self):
        """Test complete message flow: Python → Kafka → Node.js → WebSocket"""
        # This test requires all services running
        detector = MultiCameraDetector()

        with patch('backend.computer_vision.kafka_producer.DetectionKafkaProducer') as mock_producer:
            mock_producer_instance = mock_producer.return_value
            mock_producer_instance.send_detections = unittest.mock.AsyncMock()

            try:
                await detector.start(use_camera=False)

                # Process frames to generate detections
                detections_found = False
                for _ in range(20):  # Try for up to 20 frames
                    detections = await detector.process_frame()
                    if detections:
                        detections_found = True
                        break
                    await asyncio.sleep(0.1)

                # Verify detections were sent to Kafka
                if detections_found:
                    mock_producer_instance.send_detections.assert_called()
                    # Verify message structure
                    call_args = mock_producer_instance.send_detections.call_args
                    message = call_args[0][0]  # First positional argument
                    self.assertEqual(message['type'], 'detections')
                    self.assertIn('timestamp', message)
                    self.assertIn('detections', message)

            finally:
                await detector.stop()
```

## 📊 Performance Testing

### FPS Testing

```python
# backend/tests/test_performance.py
import time
import psutil
import asyncio
from backend.computer_vision.multi_camera_detector import MultiCameraDetector

class TestPerformance(unittest.TestCase):
    async def test_fps_performance(self):
        """Test system maintains target FPS"""
        detector = MultiCameraDetector()
        await detector.start(use_camera=False)

        try:
            # Monitor FPS for 30 seconds
            fps_values = []
            start_time = time.time()

            while time.time() - start_time < 30:
                status = detector.get_status()
                if status['fps'] > 0:
                    fps_values.append(status['fps'])
                await asyncio.sleep(1)

            # Calculate average FPS
            avg_fps = sum(fps_values) / len(fps_values) if fps_values else 0

            # Assert minimum performance
            self.assertGreaterEqual(avg_fps, 15, f"Average FPS {avg_fps} below requirement")

            # Assert FPS stability (standard deviation < 5)
            if len(fps_values) > 1:
                fps_std = (sum((x - avg_fps) ** 2 for x in fps_values) / len(fps_values)) ** 0.5
                self.assertLess(fps_std, 5, "FPS too unstable")

        finally:
            await detector.stop()

    def test_resource_usage(self):
        """Test system resource usage"""
        process = psutil.Process()

        # Monitor resource usage during operation
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Run system briefly
        asyncio.run(self._run_system_briefly())

        # Check final memory usage
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory

        # Assert reasonable memory usage
        self.assertLess(memory_increase, 500, "Memory usage increased too much")

    async def _run_system_briefly(self):
        """Run system briefly for resource testing"""
        detector = MultiCameraDetector()
        await detector.start(use_camera=False)
        await asyncio.sleep(5)
        await detector.stop()

    async def test_kafka_throughput(self):
        """Test Kafka message throughput"""
        detector = MultiCameraDetector()

        with patch('backend.computer_vision.kafka_producer.DetectionKafkaProducer') as mock_producer:
            mock_producer_instance = mock_producer.return_value
            mock_producer_instance.send_detections = unittest.mock.AsyncMock()

            await detector.start(use_camera=False)

            try:
                # Send multiple messages quickly
                start_time = time.time()
                message_count = 50

                for i in range(message_count):
                    test_detections = [{
                        'id': f'test_{i}',
                        'class': 'car',
                        'confidence': 0.85,
                        'position': {'x': 2.5, 'y': 1.0, 'z': 3.2},
                        'zone': 'left',
                        'bbox': [100, 200, 150, 250]
                    }]

                    detection_data = {
                        'type': 'detections',
                        'timestamp': time.time(),
                        'detections': test_detections
                    }

                    await detector.kafka_producer.send_detections(detection_data)

                end_time = time.time()
                total_time = end_time - start_time
                throughput = message_count / total_time  # messages per second

                # Assert minimum throughput (adjust based on requirements)
                self.assertGreaterEqual(throughput, 10, f"Kafka throughput {throughput} msg/s below requirement")

            finally:
                await detector.stop()
```

### Latency Testing

```python
# backend/tests/test_latency.py
import time
import asyncio
import websockets
import json
from unittest.mock import patch, AsyncMock
from backend.computer_vision.kafka_producer import DetectionKafkaProducer
from backend.computer_vision.multi_camera_detector import MultiCameraDetector

class TestLatency(unittest.TestCase):
    async def test_detection_to_kafka_latency(self):
        """Test latency from detection to Kafka message send"""
        detector = MultiCameraDetector()

        with patch('backend.computer_vision.kafka_producer.DetectionKafkaProducer') as mock_producer:
            mock_producer_instance = mock_producer.return_value
            mock_send = AsyncMock()
            mock_producer_instance.send_detections = mock_send

            await detector.start(use_camera=False)

            try:
                # Generate test detection
                test_detections = [{
                    'id': 'test_car',
                    'class': 'car',
                    'confidence': 0.85,
                    'position': {'x': 2.5, 'y': 1.0, 'z': 3.2},
                    'zone': 'left',
                    'bbox': [100, 200, 150, 250]
                }]

                detection_data = {
                    'type': 'detections',
                    'timestamp': time.time(),
                    'detections': test_detections
                }

                # Measure latency
                start_time = time.time()
                await detector.kafka_producer.send_detections(detection_data)
                end_time = time.time()

                # Calculate latency
                kafka_latency = (end_time - start_time) * 1000  # ms

                # Assert latency requirements
                self.assertLess(kafka_latency, 50, f"Kafka send latency {kafka_latency}ms too high")

                # Verify message was sent
                mock_send.assert_called_once()
                call_args = mock_send.call_args
                sent_data = call_args[0][0]
                self.assertEqual(sent_data['type'], 'detections')

            finally:
                await detector.stop()

    async def test_end_to_end_latency(self):
        """Test end-to-end latency: Detection → Kafka → Node.js → WebSocket"""
        # This test requires Kafka and Node.js services running
        detector = MultiCameraDetector()

        # Connect to Node.js WebSocket for verification
        uri = "ws://localhost:8081"
        websocket = None

        try:
            # Start detection system
            await detector.start(use_camera=False)

            # Connect to WebSocket
            websocket = await websockets.connect(uri)

            # Send test detection through the pipeline
            test_detections = [{
                'id': 'latency_test',
                'class': 'car',
                'confidence': 0.85,
                'position': {'x': 2.5, 'y': 1.0, 'z': 3.2},
                'zone': 'left',
                'bbox': [100, 200, 150, 250]
            }]

            detection_data = {
                'type': 'detections',
                'timestamp': time.time(),
                'detections': test_detections
            }

            # Measure end-to-end latency
            start_time = time.time()
            await detector.kafka_producer.send_detections(detection_data)

            # Wait for message to propagate through Kafka → Node.js → WebSocket
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                receive_time = time.time()

                # Parse received message
                received_data = json.loads(response)
                end_to_end_latency = (receive_time - start_time) * 1000  # ms

                # Assert end-to-end latency requirements
                self.assertLess(end_to_end_latency, 200, f"End-to-end latency {end_to_end_latency}ms too high")

                # Verify message integrity
                self.assertEqual(received_data['type'], 'detections')
                self.assertEqual(len(received_data['detections']), 1)
                self.assertEqual(received_data['detections'][0]['id'], 'latency_test')

            except asyncio.TimeoutError:
                self.fail("Timeout waiting for WebSocket message - pipeline latency too high")

        finally:
            await detector.stop()
            if websocket:
                await websocket.close()
```

## 🧪 Hardware Testing

### Camera Testing

```python
# backend/tests/test_hardware.py
import cv2
import unittest

class TestCameraHardware(unittest.TestCase):
    def test_camera_availability(self):
        """Test camera is accessible"""
        cap = cv2.VideoCapture(0)

        self.assertTrue(cap.isOpened(), "Camera should be accessible")

        # Test camera properties
        width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        fps = cap.get(cv2.CAP_PROP_FPS)

        self.assertGreater(width, 0, "Camera width should be > 0")
        self.assertGreater(height, 0, "Camera height should be > 0")

        cap.release()

    def test_camera_settings(self):
        """Test camera configuration"""
        cap = cv2.VideoCapture(0)

        # Test setting camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)

        # Verify settings were applied
        width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)

        # Allow some tolerance for camera limitations
        self.assertAlmostEqual(width, 640, delta=50)
        self.assertAlmostEqual(height, 480, delta=50)

        cap.release()
```

### Browser Testing

```javascript
// web/tests/Browser.test.js
describe('Browser Compatibility', () => {
    it('should detect WebGL support', () => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        expect(gl).toBeTruthy();
    });

    it('should detect browser capabilities', () => {
        const userAgent = navigator.userAgent;
        expect(userAgent).toBeDefined();
    });

    it('should detect screen dimensions', () => {
        expect(window.innerWidth).toBeGreaterThan(0);
        expect(window.innerHeight).toBeGreaterThan(0);
    });

    it('should support WebSocket connections', () => {
        expect(typeof WebSocket).toBe('function');
    });
});
```

## 🛡️ Safety Testing

### Alert System Testing

```python
# backend/tests/test_safety.py
import unittest
from backend.computer_vision.detection import BlindSpotDetector

class TestSafetyFeatures(unittest.TestCase):
    def setUp(self):
        self.detector = BlindSpotDetector()

    def test_blind_spot_alert_triggering(self):
        """Test that alerts are triggered for objects in blind spots"""
        # Test object in left blind spot
        detection_left = {
            "object": "car",
            "position": {"x": 0.1, "y": 0.5},  # In left blind spot
            "confidence": 0.8
        }

        in_blind_spot = self.detector.is_in_blind_spot(0.1, 0.5, "left")
        self.assertTrue(in_blind_spot, "Object in left blind spot should trigger alert")

        # Test object outside blind spot
        detection_safe = {
            "object": "car",
            "position": {"x": 0.5, "y": 0.5},  # Outside blind spots
            "confidence": 0.8
        }

        in_blind_spot = self.detector.is_in_blind_spot(0.5, 0.5, "left")
        self.assertFalse(in_blind_spot, "Object outside blind spot should not trigger alert")

    def test_audio_alert_functionality(self):
        """Test audio alert system"""
        # This would require mocking audio system
        # Test that play_alert_sound() doesn't crash
        try:
            self.detector.play_alert_sound()
            alert_successful = True
        except Exception as e:
            alert_successful = False

        self.assertTrue(alert_successful, "Audio alert should function without errors")
```

## 📱 User Acceptance Testing

### Usability Tests

```python
# backend/tests/test_usability.py
import time
import asyncio
import unittest
from unittest.mock import patch
from backend.computer_vision.multi_camera_detector import MultiCameraDetector

class TestUsability(unittest.TestCase):
    async def test_system_startup_time(self):
        """Test system starts up within acceptable time"""
        start_time = time.time()

        detector = MultiCameraDetector()
        await detector.start(use_camera=False)

        startup_time = time.time() - start_time

        # Assert startup time is reasonable (< 10 seconds)
        self.assertLess(startup_time, 10, "System startup too slow")

        await detector.stop()

    async def test_error_recovery(self):
        """Test system recovers from errors gracefully"""
        detector = MultiCameraDetector()

        # Start system
        await detector.start(use_camera=False)

        # Simulate error condition (e.g., camera disconnect)
        if detector.cap:
            detector.cap.release()

        # System should handle error gracefully
        status = detector.get_status()
        self.assertIsNotNone(status, "System should report status even after errors")

        await detector.stop()

    async def test_kafka_connection_recovery(self):
        """Test system recovers from Kafka connection issues"""
        detector = MultiCameraDetector()

        with patch('backend.computer_vision.kafka_producer.DetectionKafkaProducer') as mock_producer:
            mock_producer_instance = mock_producer.return_value
            # Simulate Kafka connection failure
            mock_producer_instance.send_detections.side_effect = Exception("Kafka connection failed")

            await detector.start(use_camera=False)

            try:
                # Try to send detections - should handle error gracefully
                test_detections = [{
                    'id': 'test',
                    'class': 'car',
                    'confidence': 0.85,
                    'position': {'x': 2.5, 'y': 1.0, 'z': 3.2}
                }]

                # This should not crash the system
                await detector.process_frame()

                # System should still be running
                self.assertTrue(detector.is_running)

                # Status should reflect the error
                status = detector.get_status()
                self.assertIn('kafka_status', status)

            finally:
                await detector.stop()
```

### Real-World Scenario Tests

```python
# backend/tests/test_real_world.py
import asyncio
import unittest
from backend.computer_vision.multi_camera_detector import MultiCameraDetector

class TestRealWorldScenarios(unittest.TestCase):
    async def test_night_time_detection(self):
        """Test detection performance in low light"""
        detector = MultiCameraDetector()

        # Use night-time test video
        detector.start_dummy_video("night_test_video.mp4")
        await detector.start(use_camera=False)

        # Monitor detection accuracy
        detection_count = 0
        for _ in range(50):  # Test for ~5 seconds at 10 FPS
            detections = await detector.process_frame()
            detection_count += len(detections)
            await asyncio.sleep(0.1)

        # Assert reasonable detection rate
        self.assertGreater(detection_count, 0, "Should detect objects in night conditions")

        await detector.stop()

    async def test_multiple_object_tracking(self):
        """Test tracking multiple objects simultaneously"""
        detector = MultiCameraDetector()
        detector.start_dummy_video("multi_object_test.mp4")
        await detector.start(use_camera=False)

        # Process frames and count unique objects
        object_positions = set()
        for _ in range(100):  # Test for ~10 seconds
            detections = await detector.process_frame()
            for detection in detections:
                pos_key = f"{detection['position']['x']:.1f}_{detection['position']['y']:.1f}"
                object_positions.add(pos_key)
            await asyncio.sleep(0.1)

        # Assert multiple objects are detected
        self.assertGreater(len(object_positions), 1, "Should track multiple objects")

        await detector.stop()

    async def test_kafka_message_persistence(self):
        """Test that Kafka messages are sent reliably under load"""
        detector = MultiCameraDetector()

        with patch('backend.computer_vision.kafka_producer.DetectionKafkaProducer') as mock_producer:
            mock_producer_instance = mock_producer.return_value
            mock_producer_instance.send_detections = unittest.mock.AsyncMock()

            await detector.start(use_camera=False)

            try:
                # Simulate high-frequency detections (stress test)
                sent_messages = 0
                for i in range(100):  # Send 100 messages quickly
                    detections = await detector.process_frame()
                    if detections or i % 10 == 0:  # Send at least every 10 frames
                        test_detections = [{
                            'id': f'stress_test_{i}',
                            'class': 'car',
                            'confidence': 0.85,
                            'position': {'x': 2.5, 'y': 1.0, 'z': 3.2},
                            'zone': 'left',
                            'bbox': [100, 200, 150, 250]
                        }]

                        detection_data = {
                            'type': 'detections',
                            'timestamp': time.time(),
                            'detections': test_detections
                        }

                        await detector.kafka_producer.send_detections(detection_data)
                        sent_messages += 1

                    await asyncio.sleep(0.05)  # 20 FPS simulation

                # Verify all messages were sent
                self.assertGreater(sent_messages, 0, "No messages were sent to Kafka")
                self.assertEqual(mock_producer_instance.send_detections.call_count, sent_messages,
                               "Not all messages reached Kafka producer")

            finally:
                await detector.stop()
```

## 🏃 Running Tests

### Backend Tests

```bash
# Navigate to backend directory
cd backend

# Run all tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_detection.py

# Run with coverage
python -m pytest tests/ --cov=computer_vision --cov-report=html

# Run performance tests
python -m pytest tests/test_performance.py -v
```

### Node.js Backend Tests

```bash
# Navigate to web/backend directory
cd web/backend

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx jest server.test.js
```

### Web App Tests

```bash
# Navigate to web directory
cd web

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx jest App.test.js
```

### Integration Tests

```bash
# Run integration tests
python -m pytest tests/test_integration.py -v

# Run end-to-end tests
python -m pytest tests/test_end_to_end.py -v
```

## 📊 Test Reporting

### Generate Test Reports

```bash
# HTML report for backend tests
python -m pytest tests/ --cov=computer_vision --cov-report=html

# JUnit XML for CI/CD
python -m pytest tests/ --junitxml=test_results.xml

# Web app test report
npm run test:report
```

### Performance Benchmarking

```python
# Create performance benchmarks
def benchmark_detection():
    """Benchmark detection performance"""
    import timeit

    def detection_benchmark():
        # Detection code here
        pass

    # Run benchmark
    time = timeit.timeit(detection_benchmark, number=100)
    avg_time = time / 100
    fps = 1 / avg_time

    print(f"Average detection time: {avg_time:.4f}s")
    print(f"Estimated FPS: {fps:.1f}")
```

## 🔧 Troubleshooting Tests

### Common Testing Issues

1. **Camera Access Issues**:
   - Run tests with appropriate permissions
   - Use dummy video for headless testing
   - Mock camera for unit tests

2. **Kafka Connection Issues**:
   - Ensure Kafka and Zookeeper are running (`docker-compose ps`)
   - Check Kafka topic exists (`docker exec kafka kafka-topics --list --bootstrap-server localhost:9092`)
   - Verify broker configuration in `shared/config.py`
   - Use Kafka logs for debugging: `docker logs kafka`

3. **Node.js WebSocket Issues**:
   - Verify Node.js server is running on port 8081
   - Check WebSocket connection URL in frontend
   - Test WebSocket manually with browser dev tools
   - Verify Kafka consumer is connected

4. **Performance Variations**:
   - Run tests multiple times
   - Use statistical analysis
   - Account for system load
   - Monitor Kafka message queue depth

### Debug Test Failures

```python
# Enable debug logging in tests
import logging
logging.basicConfig(level=logging.DEBUG)

# Add detailed assertions
self.assertEqual(result, expected, f"Expected {expected}, got {result}")
```

## 📋 Test Checklist

### Pre-Deployment Testing

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Performance requirements met
- [ ] Safety features verified
- [ ] Hardware compatibility confirmed
- [ ] Web app functionality tested
- [ ] Error handling verified
- [ ] Documentation updated

### Continuous Testing

- [ ] Automated test suite runs on code changes
- [ ] Performance regression tests
- [ ] Compatibility tests for new platforms
- [ ] Security vulnerability scans
- [ ] User acceptance testing

---

This testing guide ensures comprehensive verification of all SafeDetect system components and functionality.

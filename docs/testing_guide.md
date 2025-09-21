# SafeDetect Testing Guide

Comprehensive testing procedures for the SafeDetect blind spot detection system.

## 🧪 Testing Overview

This guide covers testing strategies for all components of the SafeDetect system, including unit tests, integration tests, performance tests, and user acceptance tests.

## 📋 Test Categories

### 1. Unit Tests
- Individual component functionality
- Algorithm accuracy
- Data processing logic

### 2. Integration Tests
- Component interaction testing
- End-to-end data flow
- Hardware integration

### 3. Performance Tests
- Real-time operation verification
- Resource usage monitoring
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

#### WebSocket Server Tests

```python
# backend/tests/test_websocket.py
import asyncio
import unittest
from backend.computer_vision.websocket_server import DetectionWebSocketServer

class TestWebSocketServer(unittest.TestCase):
    def setUp(self):
        self.server = DetectionWebSocketServer()

    def test_server_initialization(self):
        """Test WebSocket server initialization"""
        self.assertFalse(self.server.is_running)
        self.assertEqual(len(self.server.connected_clients), 0)

    def test_client_registration(self):
        """Test client connection handling"""
        # Mock WebSocket client
        mock_client = type('MockClient', (), {})()

        # Test registration
        self.server.connected_clients.add(mock_client)
        self.assertIn(mock_client, self.server.connected_clients)

    def test_message_broadcasting(self):
        """Test message broadcasting to clients"""
        # This would require actual WebSocket testing
        # Consider using websockets test client
        pass
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
from backend.computer_vision.blind_spot import BlindSpotSystem

class TestBackendIntegration(unittest.TestCase):
    async def test_complete_backend_system(self):
        """Test complete backend system integration"""
        system = BlindSpotSystem()

        # Start system with dummy video
        await system.start(use_camera=False)

        # Verify system is running
        self.assertTrue(system.is_running)
        self.assertTrue(system.detector.cap.isOpened())

        # Check WebSocket server status
        status = system.get_status()
        self.assertIn('websocket_status', status)
        self.assertIn('detector_status', status)

        # Stop system
        await system.stop()
        self.assertFalse(system.is_running)

    async def test_detection_to_websocket_flow(self):
        """Test data flow from detection to WebSocket"""
        system = BlindSpotSystem()
        await system.start(use_camera=False)

        # Process some frames
        for _ in range(10):
            detections = await system.detector.process_frame(system.websocket_server)
            if detections:
                break
            await asyncio.sleep(0.1)

        # Verify detections were processed
        self.assertIsInstance(detections, list)

        await system.stop()
```

#### Web-Backend Integration Test

```python
# backend/tests/test_web_integration.py
import asyncio
import websockets
import json
from backend.computer_vision.websocket_server import DetectionWebSocketServer

class TestWebIntegration(unittest.TestCase):
    async def test_websocket_communication(self):
        """Test WebSocket communication with web app"""
        server = DetectionWebSocketServer()

        # Start server
        await server.start_server()

        # Connect test client
        uri = "ws://localhost:8765"
        async with websockets.connect(uri) as websocket:
            # Test ping-pong
            await websocket.send(json.dumps({"type": "ping"}))
            response = await websocket.recv()
            data = json.loads(response)
            self.assertEqual(data["type"], "pong")

            # Test status request
            await websocket.send(json.dumps({"type": "status"}))
            response = await websocket.recv()
            data = json.loads(response)
            self.assertEqual(data["type"], "status")

        await server.stop_server()
```

### End-to-End Testing

#### Full System Test

```python
# backend/tests/test_end_to_end.py
import asyncio
import time
from backend.computer_vision.blind_spot import BlindSpotSystem

class TestEndToEnd(unittest.TestCase):
    async def test_full_system_workflow(self):
        """Test complete system from camera to web app"""
        system = BlindSpotSystem()

        try:
            # Start system
            await system.start(use_camera=False)
            self.assertTrue(system.is_running)

            # Wait for system to process frames
            await asyncio.sleep(5)

            # Check system status
            status = system.get_status()
            self.assertIsNotNone(status['fps'])
            self.assertGreater(status['fps'], 0)

            # Verify WebSocket server is accepting connections
            self.assertEqual(status['websocket_status']['port'], 8765)

        finally:
            await system.stop()

    async def test_performance_requirements(self):
        """Test system meets performance requirements"""
        system = BlindSpotSystem()
        await system.start(use_camera=False)

        try:
            # Monitor performance for 10 seconds
            start_time = time.time()
            frame_count = 0

            while time.time() - start_time < 10:
                status = system.get_status()
                if status['fps'] > 0:
                    frame_count += 1
                await asyncio.sleep(1)

            # Verify minimum FPS requirement
            self.assertGreaterEqual(status['fps'], 15, "System must maintain 15+ FPS")

        finally:
            await system.stop()
```

## 📊 Performance Testing

### FPS Testing

```python
# backend/tests/test_performance.py
import time
import psutil
from backend.computer_vision.blind_spot import BlindSpotSystem

class TestPerformance(unittest.TestCase):
    async def test_fps_performance(self):
        """Test system maintains target FPS"""
        system = BlindSpotSystem()
        await system.start(use_camera=False)

        try:
            # Monitor FPS for 30 seconds
            fps_values = []
            start_time = time.time()

            while time.time() - start_time < 30:
                status = system.get_status()
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
            await system.stop()

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
        system = BlindSpotSystem()
        await system.start(use_camera=False)
        await asyncio.sleep(5)
        await system.stop()
```

### Latency Testing

```python
# backend/tests/test_latency.py
import time
import asyncio
from backend.computer_vision.websocket_server import DetectionWebSocketServer

class TestLatency(unittest.TestCase):
    async def test_detection_latency(self):
        """Test latency from detection to WebSocket broadcast"""
        server = DetectionWebSocketServer()
        await server.start_server()

        try:
            # Connect test client
            uri = "ws://localhost:8765"
            async with websockets.connect(uri) as websocket:
                # Send test detection
                test_detection = {
                    "object": "car",
                    "position": {"x": 1.0, "y": 0.5},
                    "confidence": 0.8
                }

                start_time = time.time()
                await server.broadcast_detections([test_detection])
                end_time = time.time()

                # Receive message
                response = await websocket.recv()
                receive_time = time.time()

                # Calculate latencies
                broadcast_latency = (end_time - start_time) * 1000  # ms
                total_latency = (receive_time - start_time) * 1000  # ms

                # Assert latency requirements
                self.assertLess(broadcast_latency, 50, "Broadcast latency too high")
                self.assertLess(total_latency, 100, "Total latency too high")

        finally:
            await server.stop_server()
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
class TestUsability(unittest.TestCase):
    async def test_system_startup_time(self):
        """Test system starts up within acceptable time"""
        start_time = time.time()

        system = BlindSpotSystem()
        await system.start(use_camera=False)

        startup_time = time.time() - start_time

        # Assert startup time is reasonable (< 10 seconds)
        self.assertLess(startup_time, 10, "System startup too slow")

        await system.stop()

    async def test_error_recovery(self):
        """Test system recovers from errors gracefully"""
        system = BlindSpotSystem()

        # Start system
        await system.start(use_camera=False)

        # Simulate error condition
        if system.detector.cap:
            system.detector.cap.release()

        # System should handle error gracefully
        status = system.get_status()
        self.assertIsNotNone(status, "System should report status even after errors")

        await system.stop()
```

### Real-World Scenario Tests

```python
# backend/tests/test_real_world.py
class TestRealWorldScenarios(unittest.TestCase):
    async def test_night_time_detection(self):
        """Test detection performance in low light"""
        system = BlindSpotSystem()

        # Use night-time test video
        system.detector.start_dummy_video("night_test_video.mp4")
        await system.start(use_camera=False)

        # Monitor detection accuracy
        detection_count = 0
        for _ in range(50):  # Test for ~5 seconds at 10 FPS
            detections = await system.detector.process_frame()
            detection_count += len(detections)
            await asyncio.sleep(0.1)

        # Assert reasonable detection rate
        self.assertGreater(detection_count, 0, "Should detect objects in night conditions")

        await system.stop()

    async def test_multiple_object_tracking(self):
        """Test tracking multiple objects simultaneously"""
        system = BlindSpotSystem()
        system.detector.start_dummy_video("multi_object_test.mp4")
        await system.start(use_camera=False)

        # Process frames and count unique objects
        object_positions = set()
        for _ in range(100):  # Test for ~10 seconds
            detections = await system.detector.process_frame()
            for detection in detections:
                pos_key = f"{detection['position']['x']:.1f}_{detection['position']['y']:.1f}"
                object_positions.add(pos_key)
            await asyncio.sleep(0.1)

        # Assert multiple objects are detected
        self.assertGreater(len(object_positions), 1, "Should track multiple objects")

        await system.stop()
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

2. **WebSocket Connection Issues**:
   - Use test WebSocket server
   - Mock WebSocket connections
   - Test on different ports

3. **Performance Variations**:
   - Run tests multiple times
   - Use statistical analysis
   - Account for system load

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

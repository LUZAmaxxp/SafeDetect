"""
Multi-Camera Blind Spot Detection System
Supports multiple camera feeds for comprehensive blind spot monitoring
"""

import cv2
import numpy as np
from ultralytics import YOLO
import time
import asyncio
import json
import sys
import os
import hashlib
import hmac
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from shared.config import *
import pygame
from typing import List, Dict, Tuple, Optional
import logging
from .kafka_producer import DetectionKafkaProducer

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MultiCameraDetector:
    def __init__(self, model_path: str = "yolov8n.pt"):
        """Initialize the multi-camera blind spot detection system"""
        self.model = YOLO(model_path)
        self.cameras = {}  # Dictionary to store multiple camera feeds
        self.is_running = False
        self.frame_count = 0
        self.fps = 0
        self.last_time = time.time()

        # Initialize pygame for audio alerts
        self.audio_enabled = False
        try:
            pygame.mixer.init()
            self.alert_sound = self._create_beep_sound()
            self.audio_enabled = True
        except Exception as e:
            logger.warning(f"Audio device not available, alerts will be silent: {e}")
            self.alert_sound = None

        # Detection history for smoothing
        self.detection_history = []

        # Camera status tracking
        self.camera_status = {
            "left": {"status": "not_connected", "cap": None},
            "right": {"status": "not_connected", "cap": None},
            "rear": {"status": "not_connected", "cap": None}
        }

        # Initialize Kafka producer
        self.kafka_producer = DetectionKafkaProducer()
        self.kafka_producer.start_producer()

    def _create_beep_sound(self) -> pygame.mixer.Sound:
        """Create a beep sound for alerts"""
        sample_rate = 44100
        duration = ALERT_DURATION
        frequency = ALERT_BEEP_FREQUENCY

        # Generate sine wave
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        wave = 0.3 * np.sin(2 * np.pi * frequency * t)

        # Convert to 16-bit PCM
        wave = (wave * 32767).astype(np.int16)

        # Create pygame sound object
        return pygame.mixer.Sound(wave.tobytes())

    def is_in_blind_spot(self, x_center: float, y_center: float, zone: str) -> bool:
        """Check if an object is in a blind spot zone"""
        zone_coords = BLIND_SPOT_ZONES[zone]
        return (zone_coords["x_min"] <= x_center <= zone_coords["x_max"] and
                zone_coords["y_min"] <= y_center <= zone_coords["y_max"])

    def calculate_position(self, bbox: List[float], frame_width: int, frame_height: int, zone: str) -> Dict[str, float]:
        """Calculate relative position of detected object"""
        x1, y1, x2, y2 = bbox
        x_center = (x1 + x2) / 2 / frame_width
        y_center = (y1 + y2) / 2 / frame_height

        # Convert to world coordinates (meters)
        world_x = x_center * POSITION_SCALE["x"]
        world_y = y_center * POSITION_SCALE["y"]

        # Set Z coordinate based on camera zone for better 3D positioning
        if zone == "left":
            world_z = 4.0  # Behind truck (negative Z)
        elif zone == "right":
            world_z = -5.0  # Behind truck (negative Z)
        elif zone == "rear":
            world_z = 0  # Further behind truck
        else:
            world_z = 0  # Default

        return {"x": world_x, "y": world_y, "z": world_z, "zone": zone}

    def start_cameras(self) -> Dict[str, bool]:
        """Start all configured cameras"""
        logger.info("🔄 Starting multi-camera system...")
        success_count = 0
        results = {}

        for zone, config in CAMERA_CONFIG.items():
            camera_id = config["camera_id"]
            try:
                logger.info(f"📹 Starting {config['name']} (Camera ID: {camera_id})...")

                cap = cv2.VideoCapture(camera_id)
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
                cap.set(cv2.CAP_PROP_FPS, FPS_TARGET)

                if cap.isOpened():
                    self.cameras[zone] = cap
                    self.camera_status[zone] = {
                        "status": "available",
                        "cap": cap,
                        "config": config
                    }
                    logger.info(f"✅ {config['name']}: Connected successfully")
                    success_count += 1
                    results[zone] = True
                else:
                    logger.warning(f"❌ {config['name']}: Failed to open camera {camera_id}")
                    self.camera_status[zone] = {
                        "status": "error",
                        "cap": None,
                        "config": config
                    }
                    results[zone] = False

            except Exception as e:
                logger.error(f"❌ {config['name']}: Error - {e}")
                self.camera_status[zone] = {
                    "status": "error",
                    "cap": None,
                    "config": config
                }
                results[zone] = False

        logger.info(f"📊 Camera startup complete: {success_count}/{len(CAMERA_CONFIG)} cameras connected")
        return results

    def get_camera_status(self) -> Dict:
        """Get status of all cameras"""
        status = {}
        for zone, info in self.camera_status.items():
            config = info["config"]
            status[zone] = {
                "name": config["name"],
                "camera_id": config["camera_id"],
                "zone": config["zone"],
                "status": info["status"],
                "description": config["description"]
            }
        return status

    async def process_all_cameras(self) -> List[Dict]:
        """Process frames from all active cameras"""
        all_detections = []

        for zone, cap in self.cameras.items():
            try:
                ret, frame = cap.read()
                if not ret:
                    logger.warning(f"⚠️  Failed to read frame from {zone} camera")
                    continue

                # Data integrity check - compute hash of frame data
                frame_hash = hashlib.sha256(frame.tobytes()).hexdigest()

                # Run YOLOv8 inference on this camera's frame
                results = self.model(frame, conf=MODEL_CONFIDENCE, verbose=False)
                detections = []

                # Process results for this camera
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        bbox = box.xyxy[0].tolist()

                        # Only process relevant classes
                        if class_id in OBJECT_CLASSES:
                            object_type = OBJECT_CLASSES[class_id]
                            position = self.calculate_position(bbox, frame.shape[1], frame.shape[0], zone)

                            # Create detection with integrity data
                            detection_data = {
                                "object": object_type,
                                "position": position,
                                "confidence": confidence,
                                "bbox": bbox,
                                "class_id": class_id,
                                "camera_zone": zone,
                                "timestamp": time.time(),
                                "frame_hash": frame_hash[:16]  # Short hash for integrity
                            }

                            # Add HMAC for detection integrity (using a simple key for demo)
                            secret_key = os.environ.get('DETECTION_SECRET_KEY', 'default_key')
                            message = f"{object_type}{confidence}{zone}{time.time()}"
                            hmac_digest = hmac.new(secret_key.encode(), message.encode(), hashlib.sha256).hexdigest()
                            detection_data["integrity_hmac"] = hmac_digest[:16]

                            detections.append(detection_data)

                all_detections.extend(detections)

                # Send detections via Kafka with integrity checks
                if detections:
                    self.kafka_producer.send_detections(detections)

            except Exception as e:
                logger.error(f"❌ Error processing {zone} camera: {e}")

        return all_detections

    def draw_camera_status(self, frame: np.ndarray, camera_status: Dict) -> np.ndarray:
        """Draw camera status information on frame"""
        # Add camera status overlay
        status_text = "Camera Status: "
        for zone, info in camera_status.items():
            status_text += f"{zone}: {CAMERA_STATUS.get(info['status'], info['status'])} | "

        cv2.putText(frame, status_text[:-3], (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        return frame

    def play_alert_sound(self):
        """Play alert sound for blind spot detection"""
        try:
            self.alert_sound.play()
        except:
            pass  # Ignore audio errors

    def stop(self):
        """Stop all cameras and cleanup"""
        logger.info("🛑 Stopping multi-camera detection system...")
        self.is_running = False

        # Release all camera resources
        for zone, cap in self.cameras.items():
            if cap:
                cap.release()
                logger.info(f"📹 Released {zone} camera")

        self.cameras.clear()

        # Update status
        for zone in self.camera_status:
            self.camera_status[zone]["status"] = "not_connected"
            self.camera_status[zone]["cap"] = None

        # Close Kafka producer
        if self.kafka_producer:
            self.kafka_producer.stop_producer()
            logger.info("Kafka producer closed")

        cv2.destroyAllWindows()
        logger.info("✅ Multi-camera system stopped")


async def test_multi_camera_system():
    """Test function for the multi-camera system"""
    detector = MultiCameraDetector()

    try:
        # Start all cameras
        logger.info("🚀 Starting multi-camera test...")
        camera_results = detector.start_cameras()

        # Print camera status
        status = detector.get_camera_status()
        logger.info("📊 Camera Status:")
        for zone, info in status.items():
            logger.info(f"  {zone}: {info['name']} (ID: {info['camera_id']}) - {CAMERA_STATUS.get(info['status'], info['status'])}")

        # Process frames for a few seconds
        logger.info("🎥 Starting detection loop... (Press Ctrl+C to stop)")

        try:
            while True:  # Run continuously
                detections = await detector.process_all_cameras()

                # Calculate FPS
                detector.frame_count += 1
                current_time = time.time()
                if current_time - detector.last_time >= 1.0:
                    detector.fps = detector.frame_count / (current_time - detector.last_time)
                    detector.frame_count = 0
                    detector.last_time = current_time

                    # Log performance
                    logger.info(f"FPS: {detector.fps:.1f} | Active detections: {len(detections)}")

                # Play alert sound if objects in blind spots
                blind_spot_detections = []
                for detection in detections:
                    zone = detection["camera_zone"]
                    x_pos = detection["position"]["x"] / POSITION_SCALE["x"]
                    y_pos = detection["position"]["y"] / POSITION_SCALE["y"]

                    if detector.is_in_blind_spot(x_pos, y_pos, zone):
                        blind_spot_detections.append(detection)

                if blind_spot_detections:
                    detector.play_alert_sound()
                    logger.warning(f"🚨 BLIND SPOT ALERT! Objects detected: {len(blind_spot_detections)}")

                # Small delay to maintain target FPS
                await asyncio.sleep(1/FPS_TARGET)

        except KeyboardInterrupt:
            logger.info("⏹️  Test interrupted by user")
    except Exception as e:
        logger.error(f"❌ Test error: {e}")
    finally:
        detector.stop()


if __name__ == "__main__":
    asyncio.run(test_multi_camera_system())

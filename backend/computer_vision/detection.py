"""
YOLOv8 Object Detection for Blind Spot Monitoring
"""

import cv2
import numpy as np
from ultralytics import YOLO
import time
import asyncio
import json
from shared.config import *
import pygame
from typing import List, Dict, Tuple


class BlindSpotDetector:
    def __init__(self, model_path: str = "yolov8n.pt"):
        """Initialize the blind spot detection system"""
        self.model = YOLO(model_path)
        self.cap = None
        self.is_running = False
        self.frame_count = 0
        self.fps = 0
        self.last_time = time.time()

        # Initialize pygame for audio alerts
        pygame.mixer.init()
        self.alert_sound = self._create_beep_sound()

        # Detection history for smoothing
        self.detection_history = []

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

    def calculate_position(self, bbox: List[float], frame_width: int, frame_height: int) -> Dict[str, float]:
        """Calculate relative position of detected object"""
        x1, y1, x2, y2 = bbox
        x_center = (x1 + x2) / 2 / frame_width
        y_center = (y1 + y2) / 2 / frame_height

        # Convert to world coordinates (meters)
        world_x = x_center * POSITION_SCALE["x"]
        world_y = y_center * POSITION_SCALE["y"]

        return {"x": world_x, "y": world_y}

    def draw_detections(self, frame: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """Draw bounding boxes and blind spot zones on frame"""
        # Draw blind spot zones
        height, width = frame.shape[:2]

        # Left blind spot
        cv2.rectangle(frame,
                     (int(BLIND_SPOT_ZONES["left"]["x_min"] * width),
                      int(BLIND_SPOT_ZONES["left"]["y_min"] * height)),
                     (int(BLIND_SPOT_ZONES["left"]["x_max"] * width),
                      int(BLIND_SPOT_ZONES["left"]["y_max"] * height)),
                     (0, 0, 255), 2)

        # Right blind spot
        cv2.rectangle(frame,
                     (int(BLIND_SPOT_ZONES["right"]["x_min"] * width),
                      int(BLIND_SPOT_ZONES["right"]["y_min"] * height)),
                     (int(BLIND_SPOT_ZONES["right"]["x_max"] * width),
                      int(BLIND_SPOT_ZONES["right"]["y_max"] * height)),
                     (0, 0, 255), 2)

        # Rear blind spot
        cv2.rectangle(frame,
                     (int(BLIND_SPOT_ZONES["rear"]["x_min"] * width),
                      int(BLIND_SPOT_ZONES["rear"]["y_min"] * height)),
                     (int(BLIND_SPOT_ZONES["rear"]["x_max"] * width),
                      int(BLIND_SPOT_ZONES["rear"]["y_max"] * height)),
                     (0, 0, 255), 2)

        # Draw detections
        for detection in detections:
            x1, y1, x2, y2 = detection["bbox"]
            confidence = detection["confidence"]
            class_id = detection["class_id"]
            object_type = OBJECT_CLASSES.get(class_id, "unknown")

            # Choose color based on object type
            if object_type == "car":
                color = (0, 255, 0)  # Green
            elif object_type == "motorcycle":
                color = (0, 165, 255)  # Orange
            else:  # person
                color = (0, 255, 255)  # Yellow

            # Draw bounding box
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)

            # Draw label
            label = f"{object_type}: {confidence:.2f}"
            cv2.putText(frame, label, (int(x1), int(y1) - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # Check if in blind spot and add alert indicator
            x_center = (x1 + x2) / 2 / width
            y_center = (y1 + y2) / 2 / height

            if (self.is_in_blind_spot(x_center, y_center, "left") or
                self.is_in_blind_spot(x_center, y_center, "right") or
                self.is_in_blind_spot(x_center, y_center, "rear")):
                cv2.putText(frame, "BLIND SPOT ALERT!", (50, 50),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

        # Add FPS counter
        cv2.putText(frame, f"FPS: {self.fps:.1f}", (width - 100, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return frame

    def play_alert_sound(self):
        """Play alert sound for blind spot detection"""
        try:
            self.alert_sound.play()
        except:
            pass  # Ignore audio errors

    async def process_frame(self, websocket_server=None) -> List[Dict]:
        """Process a single frame and return detections"""
        ret, frame = self.cap.read()
        if not ret:
            return []

        # Run YOLOv8 inference
        results = self.model(frame, conf=MODEL_CONFIDENCE, verbose=False)
        detections = []

        # Process results
        for result in results:
            boxes = result.boxes
            for box in boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                bbox = box.xyxy[0].tolist()

                # Only process relevant classes
                if class_id in OBJECT_CLASSES:
                    object_type = OBJECT_CLASSES[class_id]
                    position = self.calculate_position(bbox, frame.shape[1], frame.shape[0])

                    detection = {
                        "object": object_type,
                        "position": position,
                        "confidence": confidence,
                        "bbox": bbox,
                        "class_id": class_id,
                        "timestamp": time.time()
                    }
                    detections.append(detection)

        # Send detections via WebSocket if server is provided
        if websocket_server and detections:
            await websocket_server.broadcast_detections(detections)

        return detections

    def start_camera(self, camera_id: int = 0):
        """Start video capture from camera"""
        self.cap = cv2.VideoCapture(camera_id)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
        self.cap.set(cv2.CAP_PROP_FPS, FPS_TARGET)

    def start_dummy_video(self, video_path: str = "test_objects.avi"):
        """Start video capture from dummy video file"""
        self.cap = cv2.VideoCapture(video_path)

    def stop(self):
        """Stop the detection system"""
        self.is_running = False
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()


async def main():
    """Main function for testing the detection system"""
    detector = BlindSpotDetector()

    # Start with dummy video for testing
    detector.start_dummy_video("test_MJPG.avi")

    try:
        while True:
            detections = await detector.process_frame()

            # Calculate FPS
            detector.frame_count += 1
            current_time = time.time()
            if current_time - detector.last_time >= 1.0:
                detector.fps = detector.frame_count / (current_time - detector.last_time)
                detector.frame_count = 0
                detector.last_time = current_time

            # Play alert sound if objects in blind spots
            if any(d for d in detections if
                   detector.is_in_blind_spot(d["position"]["x"]/POSITION_SCALE["x"],
                                          d["position"]["y"]/POSITION_SCALE["y"], "left") or
                   detector.is_in_blind_spot(d["position"]["x"]/POSITION_SCALE["x"],
                                          d["position"]["y"]/POSITION_SCALE["y"], "right") or
                   detector.is_in_blind_spot(d["position"]["x"]/POSITION_SCALE["x"],
                                          d["position"]["y"]/POSITION_SCALE["y"], "rear")):
                detector.play_alert_sound()

            # Small delay to maintain target FPS
            await asyncio.sleep(1/FPS_TARGET)

    except KeyboardInterrupt:
        print("Stopping detection...")
    finally:
        detector.stop()


if __name__ == "__main__":
    asyncio.run(main())

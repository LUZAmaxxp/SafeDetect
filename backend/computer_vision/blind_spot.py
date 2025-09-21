"""
Main Blind Spot Detection System
Integrates YOLOv8 detection with WebSocket streaming
"""

import asyncio
import cv2
import numpy as np
from detection import BlindSpotDetector
from websocket_server import DetectionWebSocketServer
from shared.config import *
import logging
import signal
import sys
from typing import Dict

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BlindSpotSystem:
    def __init__(self):
        """Initialize the complete blind spot detection system"""
        self.detector = BlindSpotDetector()
        self.websocket_server = DetectionWebSocketServer()
        self.is_running = False

        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}. Shutting down...")
        self.stop()

    async def start(self, use_camera: bool = False, camera_id: int = 0):
        """Start the complete blind spot detection system"""
        if self.is_running:
            logger.warning("System is already running")
            return

        logger.info("Starting SafeDetect Blind Spot Detection System...")

        try:
            # Start WebSocket server
            logger.info("Starting WebSocket server...")
            asyncio.create_task(self.websocket_server.start_server())

            # Wait a moment for server to start
            await asyncio.sleep(1)

            # Start detection system
            if use_camera:
                logger.info(f"Starting camera detection (camera {camera_id})...")
                self.detector.start_camera(camera_id)
            else:
                logger.info("Starting dummy video detection...")
                self.detector.start_dummy_video("test_objects.avi")

            self.is_running = True
            logger.info("System started successfully!")

            # Main detection loop
            await self._detection_loop()

        except Exception as e:
            logger.error(f"Error starting system: {e}")
            await self.stop()
            raise

    async def _detection_loop(self):
        """Main detection processing loop"""
        logger.info("Starting detection loop...")

        try:
            while self.is_running:
                # Process frame and get detections
                detections = await self.detector.process_frame(self.websocket_server)

                # Calculate FPS
                self.detector.frame_count += 1
                current_time = asyncio.get_event_loop().time()
                if current_time - self.detector.last_time >= 1.0:
                    self.detector.fps = self.detector.frame_count / (current_time - self.detector.last_time)
                    self.detector.frame_count = 0
                    self.detector.last_time = current_time

                    # Log performance
                    logger.info(f"FPS: {self.detector.fps:.1f} | Active detections: {len(detections)}")

                # Play alert sound if objects in blind spots
                blind_spot_detections = []
                for detection in detections:
                    x_pos = detection["position"]["x"] / POSITION_SCALE["x"]
                    y_pos = detection["position"]["y"] / POSITION_SCALE["y"]

                    if (self.detector.is_in_blind_spot(x_pos, y_pos, "left") or
                        self.detector.is_in_blind_spot(x_pos, y_pos, "right") or
                        self.detector.is_in_blind_spot(x_pos, y_pos, "rear")):
                        blind_spot_detections.append(detection)

                if blind_spot_detections:
                    self.detector.play_alert_sound()
                    logger.warning(f"BLIND SPOT ALERT! Objects detected: {len(blind_spot_detections)}")

                # Maintain target FPS
                await asyncio.sleep(1/FPS_TARGET)

        except Exception as e:
            logger.error(f"Error in detection loop: {e}")
            raise

    async def stop(self):
        """Stop the complete system"""
        if not self.is_running:
            return

        logger.info("Stopping SafeDetect Blind Spot Detection System...")
        self.is_running = False

        # Stop detector
        self.detector.stop()

        # Stop WebSocket server
        await self.websocket_server.stop_server()

        logger.info("System stopped successfully")

    def get_status(self) -> Dict:
        """Get system status"""
        return {
            "is_running": self.is_running,
            "detector_status": "running" if self.detector.cap and self.detector.cap.isOpened() else "stopped",
            "websocket_status": self.websocket_server.get_status(),
            "fps": self.detector.fps,
            "connected_clients": len(self.websocket_server.connected_clients)
        }


async def main():
    """Main function for running the complete system"""
    system = BlindSpotSystem()

    try:
        # Start with dummy video for testing (set use_camera=True for real camera)
        await system.start(use_camera=False)

    except KeyboardInterrupt:
        logger.info("Shutdown requested by user")
    except Exception as e:
        logger.error(f"System error: {e}")
    finally:
        await system.stop()


if __name__ == "__main__":
    # Run the complete system
    asyncio.run(main())

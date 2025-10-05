"""
Main Blind Spot Detection System
Integrates YOLOv8 detection with WebSocket streaming
"""

import asyncio
import cv2
import numpy as np
from multi_camera_detector import MultiCameraDetector
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
        """Initialize the complete multi-camera blind spot detection system"""
        self.detector = MultiCameraDetector()
        self.websocket_server = DetectionWebSocketServer()
        self.is_running = False

        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}. Shutting down...")
        self.stop()

    async def start(self):
        """Start the complete multi-camera blind spot detection system"""
        if self.is_running:
            logger.warning("System is already running")
            return

        logger.info("🚀 Starting SafeDetect Multi-Camera Blind Spot Detection System...")

        try:
            # Start WebSocket server
            logger.info("🌐 Starting WebSocket server...")
            asyncio.create_task(self.websocket_server.start_server())

            # Wait a moment for server to start
            await asyncio.sleep(1)

            # Start multi-camera detection system
            logger.info("📹 Starting multi-camera detection...")
            camera_results = self.detector.start_cameras()

            # Log camera status
            status = self.detector.get_camera_status()
            connected_count = sum(1 for info in status.values() if info['status'] == 'available')

            logger.info(f"📊 Camera Status: {connected_count}/{len(status)} cameras connected")
            for zone, info in status.items():
                logger.info(f"  {zone}: {info['name']} - {CAMERA_STATUS.get(info['status'], info['status'])}")

            # Check if at least one camera is working
            if connected_count == 0:
                logger.warning("⚠️  No cameras connected! System will not detect real objects.")
                logger.info("💡 Tip: Connect USB cameras or use dummy video mode")

            self.is_running = True
            logger.info("✅ Multi-camera system started successfully!")

            # Main detection loop
            await self._detection_loop()

        except Exception as e:
            logger.error(f"❌ Error starting system: {e}")
            await self.stop()
            raise

    async def _detection_loop(self):
        """Main multi-camera detection processing loop"""
        logger.info("🎥 Starting multi-camera detection loop...")

        try:
            while self.is_running:
                # Process frames from all cameras and get detections
                detections = await self.detector.process_all_cameras(self.websocket_server)

                # Calculate FPS
                self.detector.frame_count += 1
                current_time = asyncio.get_event_loop().time()
                if current_time - self.detector.last_time >= 1.0:
                    self.detector.fps = self.detector.frame_count / (current_time - self.detector.last_time)
                    self.detector.frame_count = 0
                    self.detector.last_time = current_time

                    # Log performance
                    logger.info(f"🎯 FPS: {self.detector.fps:.1f} | Active detections: {len(detections)}")

                # Play alert sound if objects in blind spots
                blind_spot_detections = []
                for detection in detections:
                    zone = detection["camera_zone"]
                    x_pos = detection["position"]["x"] / POSITION_SCALE["x"]
                    y_pos = detection["position"]["y"] / POSITION_SCALE["y"]

                    if self.detector.is_in_blind_spot(x_pos, y_pos, zone):
                        blind_spot_detections.append(detection)

                if blind_spot_detections:
                    self.detector.play_alert_sound()
                    logger.warning(f"🚨 BLIND SPOT ALERT! Objects detected: {len(blind_spot_detections)}")

                # Maintain target FPS
                await asyncio.sleep(1/FPS_TARGET)

        except Exception as e:
            logger.error(f"❌ Error in detection loop: {e}")
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
        """Get multi-camera system status"""
        camera_status = self.detector.get_camera_status()
        connected_cameras = sum(1 for info in camera_status.values() if info['status'] == 'available')

        return {
            "is_running": self.is_running,
            "detector_status": "running" if connected_cameras > 0 else "no_cameras",
            "websocket_status": self.websocket_server.get_status(),
            "fps": self.detector.fps,
            "connected_clients": len(self.websocket_server.connected_clients),
            "camera_status": camera_status,
            "connected_cameras": connected_cameras,
            "total_cameras": len(camera_status)
        }


async def main():
    """Main function for running the multi-camera system"""
    system = BlindSpotSystem()

    try:
        # Start multi-camera detection system
        logger.info("🚀 Starting SafeDetect Multi-Camera System...")
        await system.start()

    except KeyboardInterrupt:
        logger.info("⏹️  Shutdown requested by user")
    except Exception as e:
        logger.error(f"💥 System error: {e}")
    finally:
        await system.stop()


if __name__ == "__main__":
    # Run the complete system
    asyncio.run(main())

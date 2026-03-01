"""
Shared configuration for SafeDetect Blind Spot Detection System
"""
import os
import logging

logger = logging.getLogger(__name__)


def validate_env_vars():
    """
    Validate that all required environment variables are set.

    Call this explicitly from the application entry point — NOT at import time —
    so that tests, scripts, and tooling can import this module without a live
    Kafka broker configured.

    Example (in multi_camera_detector.py)::

        from shared.config import validate_env_vars
        validate_env_vars()
    """
    required_vars = ['KAFKA_HOST', 'KAFKA_PORT']
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    if missing_vars:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing_vars)}. "
            "Copy .env.example to .env and fill in the values."
        )

    # Warn about insecure default secret key
    if os.environ.get('DETECTION_SECRET_KEY', 'change_me_in_production') in (
        'change_me_in_production', 'default_key'
    ):
        logger.warning(
            "DETECTION_SECRET_KEY is set to an insecure default. "
            "Set a strong random key in your .env file before deploying."
        )

# WebSocket Configuration
WEBSOCKET_HOST = os.environ.get("WEBSOCKET_HOST", "localhost")
WEBSOCKET_PORT = int(os.environ.get("WEBSOCKET_PORT", 8765))

# Kafka Configuration
KAFKA_HOST = os.environ.get("KAFKA_HOST")
KAFKA_PORT = int(os.environ.get("KAFKA_PORT"))
KAFKA_TOPIC = os.environ.get("KAFKA_TOPIC", "detections")

# Detection Configuration
MODEL_CONFIDENCE = float(os.environ.get("MODEL_CONFIDENCE", 0.5))
BLIND_SPOT_ZONES = {
    "left": {"x_min": 0, "x_max": 0.3, "y_min": 0.2, "y_max": 0.8},
    "right": {"x_min": 0.7, "x_max": 1.0, "y_min": 0.2, "y_max": 0.8},
    "rear": {"x_min": 0.3, "x_max": 0.7, "y_min": 0.7, "y_max": 1.0}
}

# Object Classes (COCO dataset classes)
OBJECT_CLASSES = {
    2: "car",        # Green sphere
    3: "motorcycle", # Orange sphere
    0: "person"      # Yellow sphere
}

# Colors for different object types
OBJECT_COLORS = {
    "car": "green",
    "motorcycle": "orange",
    "person": "yellow"
}

# Alert Configuration
ALERT_BEEP_FREQUENCY = int(os.environ.get("ALERT_BEEP_FREQUENCY", 800))  # Hz
ALERT_DURATION = float(os.environ.get("ALERT_DURATION", 0.5))        # seconds

# Camera Configuration
CAMERA_WIDTH = int(os.environ.get("CAMERA_WIDTH", 640))
CAMERA_HEIGHT = int(os.environ.get("CAMERA_HEIGHT", 480))
FPS_TARGET = int(os.environ.get("FPS_TARGET", 15))

# Multi-Camera Configuration
# Each camera is assigned to a specific blind spot zone.
# Camera source can be:
#   - An integer (webcam index, e.g. 0) — set LEFT_CAMERA_ID=0
#   - An RTSP URL (e.g. rtsp://192.168.1.10:554/stream) — set LEFT_CAMERA_SRC=rtsp://...
#   - A video file path (e.g. /app/videos/left.mp4) — set LEFT_CAMERA_SRC=/path/to/file
# LEFT_CAMERA_SRC / RIGHT_CAMERA_SRC / REAR_CAMERA_SRC take priority over *_CAMERA_ID.
def _parse_camera_source(src_env: str, id_env: str, default_id: int):
    """Return an RTSP/file string or an integer camera index."""
    src = os.environ.get(src_env)
    if src:
        # If it looks like a number, treat it as an index anyway
        return int(src) if src.isdigit() else src
    return int(os.environ.get(id_env, default_id))

CAMERA_CONFIG = {
    "left": {
        "camera_id": _parse_camera_source("LEFT_CAMERA_SRC", "LEFT_CAMERA_ID", 0),
        "zone": "left",
        "name": "Left Side Camera",
        "description": "Monitors left side blind spot"
    },
    "right": {
        "camera_id": _parse_camera_source("RIGHT_CAMERA_SRC", "RIGHT_CAMERA_ID", 1),
        "zone": "right",
        "name": "Right Side Camera",
        "description": "Monitors right side blind spot"
    },
    "rear": {
        "camera_id": _parse_camera_source("REAR_CAMERA_SRC", "REAR_CAMERA_ID", 2),
        "zone": "rear",
        "name": "Rear Camera",
        "description": "Monitors rear blind spot"
    }
}

# Camera Status Configuration
CAMERA_STATUS = {
    "available": "🟢 Available",
    "in_use": "🟡 In Use",
    "error": "🔴 Error",
    "not_connected": "⚫ Not Connected"
}

# 3D Visualization Configuration
TRUCK_DIMENSIONS = {
    "length": 10,  # meters
    "width": 2.5,  # meters
    "height": 3    # meters
}

# Position mapping (camera coordinates to 3D world coordinates)
POSITION_SCALE = {
    "x": 1.5,  # meters per camera width unit (adjusted for web interface)
    "y": 1,
    "z": 1.0   # meters per camera depth unit (adjusted for web interface)
}

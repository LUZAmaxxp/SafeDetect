"""
Shared configuration for SafeDetect Blind Spot Detection System
"""
import os

# Validate required environment variables
def validate_env_vars():
    """Validate that all required environment variables are set"""
    required_vars = ['KAFKA_HOST', 'KAFKA_PORT']
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    if missing_vars:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Call validation on import
validate_env_vars()

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
# Each camera is assigned to a specific blind spot zone
CAMERA_CONFIG = {
    "left": {
        "camera_id": int(os.environ.get("LEFT_CAMERA_ID", 0)),
        "zone": "left",
        "name": "Left Side Camera",
        "description": "Monitors left side blind spot"
    },
    "right": {
        "camera_id": int(os.environ.get("RIGHT_CAMERA_ID", 1)),
        "zone": "right",
        "name": "Right Side Camera",
        "description": "Monitors right side blind spot"
    },
    "rear": {
        "camera_id": int(os.environ.get("REAR_CAMERA_ID", 2)),
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

"""
Shared configuration for SafeDetect Blind Spot Detection System
"""

# WebSocket Configuration
WEBSOCKET_HOST = "localhost"
WEBSOCKET_PORT = 8765

# Detection Configuration
MODEL_CONFIDENCE = 0.5
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
ALERT_BEEP_FREQUENCY = 800  # Hz
ALERT_DURATION = 0.5        # seconds

# Camera Configuration
CAMERA_WIDTH = 640
CAMERA_HEIGHT = 480
FPS_TARGET = 15

# 3D Visualization Configuration
TRUCK_DIMENSIONS = {
    "length": 10,  # meters
    "width": 2.5,  # meters
    "height": 3    # meters
}

# Position mapping (camera coordinates to 3D world coordinates)
POSITION_SCALE = {
    "x": 5.0,  # meters per camera width unit
    "y": 3.0   # meters per camera height unit
}

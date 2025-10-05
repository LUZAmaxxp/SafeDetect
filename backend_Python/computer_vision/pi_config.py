"""
Raspberry Pi specific configuration for SafeDetect
"""

# Camera configuration for Raspberry Pi
PI_CAMERA_CONFIG = {
    "left": {
        "camera_id": 0,  # First USB camera
        "name": "Left Side Camera",
        "zone": "left",
        "description": "Left blind spot monitoring"
    },
    "right": {
        "camera_id": 1,  # Second USB camera
        "name": "Right Side Camera",
        "zone": "right",
        "description": "Right blind spot monitoring"
    },
    "rear": {
        "camera_id": -1,  # Pi Camera Module (if using CSI camera)
        "name": "Rear Camera",
        "zone": "rear",
        "description": "Rear blind spot monitoring"
    }
}

# Performance optimization settings
RESOLUTION = (640, 480)  # Lower resolution for better performance
FPS_TARGET = 30
BATCH_PROCESSING = True  # Process multiple frames together
USE_THREADING = True  # Use threading for better performance

# Hardware-specific settings
ENABLE_GPU = False  # Most Pi models don't have GPU support for deep learning
USE_EDGE_TPU = False  # Set to True if using Coral USB Accelerator
ENABLE_THERMAL_THROTTLING = True  # Monitor Pi's temperature

# Model optimization
MODEL_CONFIDENCE = 0.4  # Slightly lower confidence threshold for better performance
SKIP_FRAMES = 2  # Process every nth frame to reduce load
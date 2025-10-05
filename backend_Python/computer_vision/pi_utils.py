"""
Raspberry Pi specific utilities for camera handling and optimization
"""
import cv2
import numpy as np
from typing import Tuple, Optional

def init_picamera(camera_id: int) -> Tuple[bool, Optional[cv2.VideoCapture]]:
    """
    Initialize camera with Pi-specific settings
    """
    try:
        # For Pi Camera Module (CSI)
        if camera_id == -1:  # Special ID for Pi Camera
            gst_str = ('libcamerasrc ! video/x-raw, width=(int)640, height=(int)480, '
                      'framerate=(fraction)30/1 ! videoconvert ! appsink')
            cap = cv2.VideoCapture(gst_str, cv2.CAP_GSTREAMER)
        else:
            # For USB cameras
            cap = cv2.VideoCapture(camera_id)
            if cap.isOpened():
                # Lower resolution for better performance
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                cap.set(cv2.CAP_PROP_FPS, 30)
                
        return cap.isOpened(), cap
    except Exception as e:
        print(f"Error initializing camera {camera_id}: {e}")
        return False, None

def optimize_frame(frame: np.ndarray) -> np.ndarray:
    """
    Optimize frame for processing on Pi
    """
    # Resize frame to smaller size for faster processing
    frame = cv2.resize(frame, (640, 480))
    return frame
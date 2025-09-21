#!/usr/bin/env python3
"""
Create a test video for SafeDetect blind spot detection testing
"""

import cv2
import numpy as np
import os

def create_test_video():
    """Create a test video with moving objects for detection testing"""
    
    # Video parameters
    width, height = 640, 480
    fps = 15
    duration = 10  # seconds
    total_frames = fps * duration
    
    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter('dummy_video.avi', fourcc, fps, (width, height))
    
    print(f"Creating test video: {width}x{height}, {fps} FPS, {duration} seconds")
    
    for frame_num in range(total_frames):
        # Create black background
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Add some background texture
        frame[::20, ::20] = [50, 50, 50]  # Grid pattern
        
        # Add moving objects (simulated cars, motorcycles, pedestrians)
        
        # Car 1 - moving from left to right
        car1_x = int((frame_num / total_frames) * width * 0.8)
        car1_y = height // 3
        cv2.rectangle(frame, (car1_x, car1_y), (car1_x + 60, car1_y + 30), (0, 255, 0), -1)
        cv2.putText(frame, "CAR", (car1_x + 5, car1_y + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        
        # Motorcycle - moving from right to left
        moto_x = int(width - (frame_num / total_frames) * width * 0.6)
        moto_y = height // 2
        cv2.rectangle(frame, (moto_x, moto_y), (moto_x + 40, moto_y + 20), (0, 165, 255), -1)
        cv2.putText(frame, "MOTO", (moto_x + 2, moto_y + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)
        
        # Person - moving diagonally
        person_x = int((frame_num / total_frames) * width * 0.5)
        person_y = int(height * 0.7 - (frame_num / total_frames) * height * 0.3)
        cv2.circle(frame, (person_x, person_y), 15, (0, 255, 255), -1)
        cv2.putText(frame, "PERSON", (person_x - 20, person_y - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        
        # Add blind spot zones (red rectangles)
        # Left blind spot
        cv2.rectangle(frame, (0, int(height * 0.2)), (int(width * 0.3), int(height * 0.8)), (0, 0, 255), 2)
        cv2.putText(frame, "LEFT BLIND SPOT", (5, int(height * 0.15)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        
        # Right blind spot
        cv2.rectangle(frame, (int(width * 0.7), int(height * 0.2)), (width, int(height * 0.8)), (0, 0, 255), 2)
        cv2.putText(frame, "RIGHT BLIND SPOT", (int(width * 0.7), int(height * 0.15)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        
        # Rear blind spot
        cv2.rectangle(frame, (int(width * 0.3), int(height * 0.7)), (int(width * 0.7), height), (0, 0, 255), 2)
        cv2.putText(frame, "REAR BLIND SPOT", (int(width * 0.3), int(height * 0.65)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        
        # Add frame counter
        cv2.putText(frame, f"Frame: {frame_num}/{total_frames}", (10, height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Write frame
        out.write(frame)
        
        # Progress indicator
        if frame_num % (total_frames // 10) == 0:
            progress = (frame_num / total_frames) * 100
            print(f"Progress: {progress:.0f}%")
    
    # Release everything
    out.release()
    cv2.destroyAllWindows()
    
    print("Test video created successfully: dummy_video.avi")
    
    # Verify file was created
    if os.path.exists('dummy_video.avi'):
        file_size = os.path.getsize('dummy_video.avi')
        print(f"File size: {file_size / 1024:.1f} KB")
        return True
    else:
        print("Error: Video file was not created")
        return False

if __name__ == "__main__":
    create_test_video()

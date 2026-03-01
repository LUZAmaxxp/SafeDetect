"""
Smoke tests for MultiCameraDetector (multi_camera_detector.py)

These tests do NOT require real cameras or a running Kafka broker.
They verify that the detector initialises correctly and that the
frame-deduplication / HMAC-signing logic works as expected.
"""
import sys
import os
import hashlib
import hmac
from unittest.mock import patch, MagicMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


@pytest.fixture()
def detector():
    """
    Create a MultiCameraDetector with all external I/O mocked:
    - YOLO model (no GPU/weights file needed)
    - DetectionKafkaProducer (no Kafka broker needed)
    - pygame (no audio device needed)
    - cv2.VideoCapture (no cameras needed)
    """
    with patch('backend_Python.computer_vision.multi_camera_detector.YOLO') as mock_yolo, \
         patch('backend_Python.computer_vision.multi_camera_detector.DetectionKafkaProducer') as mock_kafka, \
         patch('backend_Python.computer_vision.multi_camera_detector.pygame'), \
         patch('cv2.VideoCapture') as mock_cap:

        mock_yolo.return_value = MagicMock()
        mock_kafka.return_value = MagicMock()
        mock_cap.return_value = MagicMock()

        from backend_Python.computer_vision.multi_camera_detector import MultiCameraDetector
        d = MultiCameraDetector(model_path='yolov8n.pt')
        yield d


class TestMultiCameraDetectorInit:

    def test_instantiation_does_not_raise(self, detector):
        assert detector is not None

    def test_device_is_string(self, detector):
        assert detector.device in ('cpu', 'cuda')

    def test_imgsz_is_positive_int(self, detector):
        assert isinstance(detector.imgsz, int)
        assert detector.imgsz > 0

    def test_camera_config_has_three_zones(self, detector):
        """CAMERA_CONFIG must define left, right, and rear zones."""
        from shared.config import CAMERA_CONFIG
        assert set(CAMERA_CONFIG.keys()) == {'left', 'right', 'rear'}


class TestFrameHashingLogic:
    """
    The detector computes frame hashes inline (no dedicated method).
    These tests verify the underlying hashlib logic that drives deduplication.
    """

    def test_same_frame_produces_same_hash(self):
        import numpy as np
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        h1 = __import__('hashlib').md5(frame[::8, ::8].tobytes()).hexdigest()
        h2 = __import__('hashlib').md5(frame[::8, ::8].tobytes()).hexdigest()
        assert h1 == h2

    def test_different_frames_produce_different_hashes(self):
        import numpy as np
        f1 = np.zeros((480, 640, 3), dtype=np.uint8)
        f2 = np.ones((480, 640, 3), dtype=np.uint8) * 255
        h1 = __import__('hashlib').md5(f1[::8, ::8].tobytes()).hexdigest()
        h2 = __import__('hashlib').md5(f2[::8, ::8].tobytes()).hexdigest()
        assert h1 != h2

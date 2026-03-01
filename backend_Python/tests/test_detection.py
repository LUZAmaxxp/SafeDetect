"""
Unit tests for BlindSpotDetector (detection.py)
"""
import sys
import os

import numpy as np
import pytest

# Ensure the package root is importable when running pytest directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestCalculatePosition:
    """Tests for the bbox → world-coordinate position conversion."""

    def _get_detector(self):
        """Import and instantiate with a mocked YOLO model."""
        from unittest.mock import patch, MagicMock

        with patch('backend_Python.computer_vision.detection.YOLO') as mock_yolo, \
             patch('backend_Python.computer_vision.detection.pygame'), \
             patch('backend_Python.computer_vision.detection.DetectionKafkaProducer'):
            mock_yolo.return_value = MagicMock()
            from backend_Python.computer_vision.detection import BlindSpotDetector
            return BlindSpotDetector.__new__(BlindSpotDetector)

    def test_bbox_unpacking_four_values(self):
        """calculate_position must accept a 4-element bbox without raising."""
        from unittest.mock import patch, MagicMock
        with patch('ultralytics.YOLO'), \
             patch('backend_Python.computer_vision.detection.pygame'), \
             patch('backend_Python.computer_vision.detection.DetectionKafkaProducer'):
            from backend_Python.computer_vision.detection import BlindSpotDetector
            detector = BlindSpotDetector.__new__(BlindSpotDetector)
            # These are frame-space pixel coordinates; expect no exception
            result = detector.calculate_position([100, 50, 200, 150], 640, 480)
            assert 'x' in result and 'y' in result and 'z' in result

    def test_position_centre_of_frame(self):
        """An object at the exact centre should map to x=0.5*scale, y=0.5*scale."""
        from unittest.mock import patch
        with patch('ultralytics.YOLO'), \
             patch('backend_Python.computer_vision.detection.pygame'), \
             patch('backend_Python.computer_vision.detection.DetectionKafkaProducer'):
            from backend_Python.computer_vision.detection import BlindSpotDetector
            from shared.config import POSITION_SCALE
            detector = BlindSpotDetector.__new__(BlindSpotDetector)
            frame_w, frame_h = 640, 480
            # Box centred exactly on the frame
            bbox = [270, 215, 370, 265]  # centre ≈ (320, 240)
            pos = detector.calculate_position(bbox, frame_w, frame_h)
            expected_x = 0.5 * POSITION_SCALE['x']
            assert abs(pos['x'] - expected_x) < 0.05


class TestBlindSpotZone:
    """Tests for is_in_blind_spot zone logic."""

    def _make_detector(self):
        from unittest.mock import patch
        with patch('ultralytics.YOLO'), \
             patch('backend_Python.computer_vision.detection.pygame'), \
             patch('backend_Python.computer_vision.detection.DetectionKafkaProducer'):
            from backend_Python.computer_vision.detection import BlindSpotDetector
            return BlindSpotDetector.__new__(BlindSpotDetector)

    def test_left_zone(self):
        detector = self._make_detector()
        # x=0.15 is within left zone (0.0–0.3), y=0.5 is within (0.2–0.8)
        assert detector.is_in_blind_spot(0.15, 0.5, 'left') is True

    def test_outside_left_zone(self):
        detector = self._make_detector()
        assert detector.is_in_blind_spot(0.9, 0.5, 'left') is False

    def test_right_zone(self):
        detector = self._make_detector()
        assert detector.is_in_blind_spot(0.85, 0.5, 'right') is True

    def test_rear_zone(self):
        detector = self._make_detector()
        assert detector.is_in_blind_spot(0.5, 0.85, 'rear') is True

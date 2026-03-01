"""
Unit tests for DetectionKafkaProducer (kafka_producer.py)
"""
import json
import sys
import os
import time
from unittest.mock import patch, MagicMock, call

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


@pytest.fixture()
def mock_producer():
    """Return a DetectionKafkaProducer with the underlying KafkaProducer mocked."""
    with patch('backend_Python.computer_vision.kafka_producer.KafkaProducer') as mock_kp:
        mock_instance = MagicMock()
        mock_kp.return_value = mock_instance
        from backend_Python.computer_vision.kafka_producer import DetectionKafkaProducer
        producer = DetectionKafkaProducer()
        producer.start_producer()
        yield producer, mock_instance


class TestDetectionKafkaProducer:

    def test_start_producer_creates_kafka_producer(self, mock_producer):
        producer, mock_kp = mock_producer
        assert producer.producer is not None

    def test_send_detections_publishes_message(self, mock_producer):
        producer, mock_kp = mock_producer
        detections = [
            {
                'object': 'car',
                'confidence': 0.92,
                'camera_zone': 'left',
                'position': {'x': 0.3, 'y': 0.5, 'z': 0.1},
                'timestamp': time.time(),
            }
        ]
        producer.send_detections(detections)
        assert mock_kp.send.called, "KafkaProducer.send() should have been called"

    def test_message_schema(self, mock_producer):
        """The published payload must include type, timestamp, and detections fields."""
        producer, mock_kp = mock_producer
        sent_payloads = []

        def capture_send(topic, value):
            sent_payloads.append(json.loads(value.decode('utf-8')))
            fut = MagicMock()
            fut.get.return_value = None
            return fut

        mock_kp.send.side_effect = capture_send

        detections = [{'object': 'person', 'confidence': 0.75, 'camera_zone': 'rear',
                        'position': {'x': 0.5, 'y': 0.8, 'z': 0.0}, 'timestamp': time.time()}]
        producer.send_detections(detections)

        assert len(sent_payloads) == 1
        payload = sent_payloads[0]
        assert payload.get('type') == 'detections'
        assert 'timestamp' in payload
        assert 'detections' in payload
        assert len(payload['detections']) == 1

    def test_stop_producer_calls_flush_and_close(self, mock_producer):
        producer, mock_kp = mock_producer
        producer.stop_producer()
        mock_kp.flush.assert_called_once()
        mock_kp.close.assert_called_once()

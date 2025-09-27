"""
Kafka Producer for Blind Spot Detection System
Sends detection results to Kafka topic in real-time
"""

import json
import time
from kafka import KafkaProducer
from typing import List, Dict
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from shared.config import KAFKA_HOST, KAFKA_PORT, KAFKA_TOPIC
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DetectionKafkaProducer:
    def __init__(self, host: str = KAFKA_HOST, port: int = KAFKA_PORT, topic: str = KAFKA_TOPIC):
        """Initialize the Kafka producer"""
        self.host = host
        self.port = port
        self.topic = topic
        self.producer = None
        self.is_running = False

    def start_producer(self):
        """Start the Kafka producer"""
        if self.is_running:
            logger.warning("Producer is already running")
            return

        try:
            self.producer = KafkaProducer(
                bootstrap_servers=[f"{self.host}:{self.port}"],
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                acks='all',
                retries=3,
                linger_ms=5
            )
            self.is_running = True
            logger.info(f"Kafka producer started on {self.host}:{self.port}, topic: {self.topic}")
        except Exception as e:
            logger.error(f"Error starting Kafka producer: {e}")
            raise

    def send_detections(self, detections: List[Dict], key: str = None):
        """Send detection results to Kafka topic"""
        if not self.is_running or not self.producer:
            logger.warning("Producer not running, cannot send detections")
            return

        if not detections:
            return

        try:
           
            message = {
                "type": "detections",
                "timestamp": time.time(),
                "detections": detections
            }

          
            future = self.producer.send(self.topic, value=message, key=key)

            
            record_metadata = future.get(timeout=10)
            logger.debug(f"Message sent to {record_metadata.topic} partition {record_metadata.partition} offset {record_metadata.offset}")

        except Exception as e:
            logger.error(f"Error sending detections to Kafka: {e}")

    def send_status(self, status: Dict, key: str = "status"):
        """Send system status to Kafka topic"""
        if not self.is_running or not self.producer:
            logger.warning("Producer not running, cannot send status")
            return

        try:
            message = {
                "type": "status",
                "timestamp": time.time(),
                "status": status
            }

            future = self.producer.send(self.topic, value=message, key=key)
            record_metadata = future.get(timeout=10)
            logger.debug(f"Status sent to {record_metadata.topic} partition {record_metadata.partition} offset {record_metadata.offset}")

        except Exception as e:
            logger.error(f"Error sending status to Kafka: {e}")

    def stop_producer(self):
        """Stop the Kafka producer"""
        if not self.is_running:
            return

        logger.info("Stopping Kafka producer...")
        self.is_running = False

        if self.producer:
            self.producer.close()
            self.producer = None

        logger.info("Kafka producer stopped")

    def get_status(self) -> Dict:
        """Get producer status information"""
        return {
            "is_running": self.is_running,
            "host": self.host,
            "port": self.port,
            "topic": self.topic
        }


def main():
    """Main function for testing the Kafka producer"""
    producer = DetectionKafkaProducer()

    try:
        producer.start_producer()

        # Send a test message
        test_detections = [
            {
                "object": "car",
                "position": {"x": 1.0, "y": 0.5, "z": 0.8},
                "confidence": 0.85,
                "bbox": [100, 150, 200, 250],
                "class_id": 2,
                "timestamp": time.time()
            }
        ]

        producer.send_detections(test_detections)
        logger.info("Test message sent")

        # Keep running for a bit
        time.sleep(5)

    except KeyboardInterrupt:
        logger.info("Shutting down producer...")
    except Exception as e:
        logger.error(f"Producer error: {e}")
    finally:
        producer.stop_producer()


if __name__ == "__main__":
    main()

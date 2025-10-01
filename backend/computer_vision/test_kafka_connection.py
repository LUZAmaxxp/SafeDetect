"""
Test Kafka Connection
Simple script to verify Kafka connectivity
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from shared.config import KAFKA_HOST, KAFKA_PORT, KAFKA_TOPIC

def test_kafka_connection():
    print(f"Testing Kafka connection...")
    print(f"Host: {KAFKA_HOST}")
    print(f"Port: {KAFKA_PORT}")
    print(f"Topic: {KAFKA_TOPIC}")
    print("-" * 50)

    try:
        from kafka import KafkaProducer, KafkaAdminClient
        from kafka.admin import NewTopic
        import json

        print("\n1. Testing Kafka Admin Client...")
        admin_client = KafkaAdminClient(
            bootstrap_servers=[f"{KAFKA_HOST}:{KAFKA_PORT}"],
            client_id='test-admin'
        )
        print("✓ Admin client connected successfully")

        print("\n2. Checking/Creating topic...")
        try:
            existing_topics = admin_client.list_topics()
            if KAFKA_TOPIC in existing_topics:
                print(f"✓ Topic '{KAFKA_TOPIC}' already exists")
            else:
                print(f"Creating topic '{KAFKA_TOPIC}'...")
                topic = NewTopic(name=KAFKA_TOPIC, num_partitions=1, replication_factor=1)
                admin_client.create_topics([topic])
                print(f"✓ Topic '{KAFKA_TOPIC}' created successfully")
        except Exception as e:
            print(f"✗ Topic check/creation failed: {e}")

        admin_client.close()

        print("\n3. Testing Kafka Producer...")
        producer = KafkaProducer(
            bootstrap_servers=[f"{KAFKA_HOST}:{KAFKA_PORT}"],
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks='all',
            retries=3,
            request_timeout_ms=5000
        )
        print("✓ Producer connected successfully")

        print("\n4. Sending test message...")
        test_message = {
            "type": "test",
            "message": "Kafka connection test"
        }

        future = producer.send(KAFKA_TOPIC, value=test_message)
        record_metadata = future.get(timeout=10)

        print(f"✓ Test message sent successfully!")
        print(f"  Topic: {record_metadata.topic}")
        print(f"  Partition: {record_metadata.partition}")
        print(f"  Offset: {record_metadata.offset}")

        producer.close()

        print("\n" + "=" * 50)
        print("SUCCESS: Kafka connection is working!")
        print("=" * 50)
        return True

    except Exception as e:
        print("\n" + "=" * 50)
        print(f"ERROR: Kafka connection failed!")
        print(f"Error: {e}")
        print("=" * 50)
        print("\nPossible solutions:")
        print("1. Make sure Kafka is running: cd backend && docker-compose up -d kafka zookeeper")
        print("2. Check KAFKA_HOST and KAFKA_PORT in your environment")
        print("3. Verify firewall/network settings")
        return False

if __name__ == "__main__":
    test_kafka_connection()

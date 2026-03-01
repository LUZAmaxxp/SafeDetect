// Kafka configuration for SafeDetect Web Backend

const kafkaConfig = {
  clientId: 'safedetect-web-backend',
  // Use localhost:29092 when running natively on Windows (host-facing Kafka listener).
  // Change to kafka:9092 if running inside Docker.
  brokers: [process.env.KAFKA_BROKER || 'localhost:29092'],
  topic: process.env.KAFKA_TOPIC || 'detections',
  groupId: 'safedetect-web-consumers'
};

module.exports = kafkaConfig;

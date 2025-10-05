// Kafka configuration for SafeDetect Web Backend

const kafkaConfig = {
  clientId: 'safedetect-web-backend',
  brokers: ['localhost:9092'],
  topic: 'detections',
  groupId: 'safedetect-web-consumers'
};

module.exports = kafkaConfig;

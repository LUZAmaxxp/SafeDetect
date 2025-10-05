/**
 * Node.js Backend for SafeDetect Web App
 * Kafka consumer that forwards detections to WebSocket clients
 */

const express = require('express');
const WebSocket = require('ws');
const { Kafka } = require('kafkajs');
const kafkaConfig = require('./kafka_config');

const app = express();
const PORT = process.env.PORT || 8082

// WebSocket server
const wss = new WebSocket.Server({ port: 8081 });

// Connected WebSocket clients
let connectedClients = new Set();

// Kafka setup
const kafka = new Kafka({
  clientId: kafkaConfig.clientId,
  brokers: kafkaConfig.brokers
});

const consumer = kafka.consumer({ groupId: kafkaConfig.groupId });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  connectedClients.add(ws);

  // Send welcome message
  const welcomeMsg = {
    type: 'connection',
    status: 'connected',
    message: 'Connected to SafeDetect Web Backend'
  };
  ws.send(JSON.stringify(welcomeMsg));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received from client:', data);

      // Handle client messages if needed
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    connectedClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    connectedClients.delete(ws);
  });
});

// Broadcast message to all connected WebSocket clients
function broadcastToClients(message) {
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending to client:', error);
        connectedClients.delete(client);
      }
    }
  });
}

// Kafka consumer setup
async function startKafkaConsumer() {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected');

    await consumer.subscribe({ topic: kafkaConfig.topic, fromBeginning: false });
    console.log(`Subscribed to topic: ${kafkaConfig.topic}`);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          console.log('Raw message:', message.value.toString());
          const value = JSON.parse(message.value.toString());
          console.log('Parsed message:', JSON.stringify(value, null, 2));

          // Handle different message formats
          if (Array.isArray(value)) {
            // C++ detections - array of detection objects
            console.log('Broadcasting C++ detections to', connectedClients.size, 'clients');
            const detectionsMessage = {
              type: 'detections',
              detections: value,
              source: 'cpp',
              timestamp: Date.now()
            };
            broadcastToClients(detectionsMessage);
          } else if (value.type === 'detections') {
            // Python detections - structured message
            console.log('Broadcasting Python detections to', connectedClients.size, 'clients');
            broadcastToClients(value);
          } else if (value.type === 'status') {
            // Handle status messages if needed
            console.log('Received status:', value.status);
          } else {
            console.log('Unknown message type:', value.type || 'undefined');
          }
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      },
    });
  } catch (error) {
    console.error('Error starting Kafka consumer:', error);
  }
}

// Express routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SafeDetect Web Backend is running',
    connectedClients: connectedClients.size,
    kafkaTopic: kafkaConfig.topic
  });
});

// Start servers
async function startServers() {
  try {
    // Start Kafka consumer
    await startKafkaConsumer();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Express server running on port ${PORT}`);
      console.log(`WebSocket server running on port 8081`);
    });

  } catch (error) {
    console.error('Error starting servers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');

  try {
    await consumer.disconnect();
    wss.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the application
startServers();

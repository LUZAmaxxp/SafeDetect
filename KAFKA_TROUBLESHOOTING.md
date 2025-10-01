# Kafka Connection Troubleshooting Guide

## Problem
Your detection .exe sends data to Kafka, but the web backend doesn't receive it.

## Root Cause
When running the .exe outside of Docker, it tries to connect to `localhost:9092`, but Kafka might not be running or accessible.

## Solution Steps

### Step 1: Start Kafka
Navigate to the backend directory and start Kafka:

```bash
cd backend
docker-compose up -d zookeeper kafka
```

Wait 30 seconds for Kafka to fully start, then verify it's running:

```bash
docker-compose ps
```

You should see both `zookeeper` and `kafka` services running.

### Step 2: Test Kafka Connection
Run the diagnostic script:

```bash
cd backend/computer_vision
python test_kafka_connection.py
```

This will verify:
- Kafka connectivity
- Topic creation
- Message sending

### Step 3: Start the Web Backend
Make sure the web backend server is running:

```bash
cd web/backend
npm install  # if not already installed
node server.js
```

You should see:
```
Kafka consumer connected
Subscribed to topic: detections
Express server running on port 8080
WebSocket server running on port 8081
```

### Step 4: Run Your Detection .exe
Now run your detection executable. It should connect to Kafka and send detections.

### Step 5: Monitor Messages
Check the web backend logs. When detections occur, you should see:
```
Received Kafka message: detections
```

## Verification Checklist

- [ ] Kafka is running (`docker-compose ps` shows kafka as healthy)
- [ ] test_kafka_connection.py runs successfully
- [ ] Web backend is running and shows "Kafka consumer connected"
- [ ] Detection .exe starts without errors
- [ ] Web backend receives messages when objects are detected

## Common Issues

### Issue 1: Connection Refused
**Symptom:** `Connection refused` or `NoBrokersAvailable`

**Solution:**
```bash
# Stop all containers
cd backend
docker-compose down

# Start fresh
docker-compose up -d zookeeper kafka

# Wait 30 seconds
sleep 30

# Verify
docker-compose logs kafka
```

### Issue 2: Topic Not Found
**Symptom:** `UnknownTopicOrPartitionError`

**Solution:**
The topic will be auto-created, but you can create it manually:

```bash
docker exec -it backend-kafka-1 kafka-topics --create \
  --topic detections \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1
```

### Issue 3: Messages Sent But Not Received
**Symptom:** Producer shows success, but consumer doesn't receive

**Solution:**
1. Check consumer group:
```bash
docker exec -it backend-kafka-1 kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe \
  --group safedetect-web-consumers
```

2. Restart the web backend:
```bash
cd web/backend
# Stop the server (Ctrl+C)
node server.js
```

### Issue 4: Wrong Kafka Host in .exe
**Symptom:** .exe can't connect to Kafka

**Solution:**
Set environment variables before running .exe:

**Windows:**
```cmd
set KAFKA_HOST=localhost
set KAFKA_PORT=9092
your_detection.exe
```

**Linux/Mac:**
```bash
export KAFKA_HOST=localhost
export KAFKA_PORT=9092
./your_detection
```

## Testing the Full Pipeline

1. **Start Kafka:**
   ```bash
   cd backend
   docker-compose up -d zookeeper kafka
   sleep 30
   ```

2. **Test connection:**
   ```bash
   cd computer_vision
   python test_kafka_connection.py
   ```

3. **Start web backend:**
   ```bash
   cd ../../web/backend
   node server.js
   ```
   (Keep this running in a terminal)

4. **Run detection:**
   In a new terminal, run your .exe

5. **Monitor logs:**
   Watch the web backend terminal for "Received Kafka message" logs

## Advanced Debugging

### View Kafka Messages Directly
```bash
docker exec -it backend-kafka-1 kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic detections \
  --from-beginning
```

### Check Producer Logs
Add this to your Python detection script:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Consumer Logs
The Node.js backend already logs received messages. Watch for:
```
Received Kafka message: detections
```

## Network Diagram

```
Detection .exe (Python)
    |
    | Kafka Producer
    | localhost:9092
    v
Kafka Broker (Docker)
    |
    | Topic: "detections"
    v
Web Backend (Node.js)
    |
    | Kafka Consumer
    | WebSocket
    v
Web Frontend (Browser)
```

## Still Not Working?

1. Check firewall settings
2. Verify Docker network: `docker network ls`
3. Check port conflicts: `netstat -an | grep 9092`
4. Review Kafka logs: `docker-compose logs kafka`
5. Ensure .exe and backend use same KAFKA_HOST and KAFKA_PORT

## Contact Information
If issues persist, gather:
- Output from `test_kafka_connection.py`
- Web backend logs
- Detection .exe logs
- `docker-compose ps` output

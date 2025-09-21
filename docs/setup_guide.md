# SafeDetect Setup Guide

Complete installation and setup instructions for the SafeDetect blind spot detection system.

## 📋 Prerequisites

### Hardware Requirements
- **Computer/Raspberry Pi**: 2+ core CPU, 4GB+ RAM
- **Camera**: USB webcam or Raspberry Pi camera module
- **Mobile Device**: iOS or Android smartphone/tablet
- **Network**: Local WiFi network

### Software Requirements
- **Python**: 3.8 or higher
- **Node.js**: 16 or higher
- **Expo CLI**: Latest version
- **Git**: For cloning repository

## 🛠️ Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/safedetect.git
cd safedetect
```

### Step 2: Backend Setup

#### Python Environment Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

#### Verify Installation

```bash
# Test YOLOv8 installation
python -c "from ultralytics import YOLO; print('YOLOv8 installed successfully')"

# Test OpenCV installation
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
```

### Step 3: Mobile App Setup

#### Install Node.js Dependencies

```bash
# Navigate to mobile directory
cd ../mobile

# Install dependencies
npm install
```

#### Install Expo CLI (if not already installed)

```bash
npm install -g @expo/cli
```

### Step 4: Configuration

#### Backend Configuration

Edit `shared/config.py` to customize:

```python
# WebSocket Configuration
WEBSOCKET_HOST = "0.0.0.0"  # Use 0.0.0.0 for network access
WEBSOCKET_PORT = 8765

# Detection Configuration
MODEL_CONFIDENCE = 0.5
CAMERA_WIDTH = 640
CAMERA_HEIGHT = 480
FPS_TARGET = 15
```

#### Mobile App Configuration

Edit `mobile/App.js` to set the correct IP address:

```javascript
// Replace 'localhost' with your computer's IP address
const wsService = new WebSocketService('ws://YOUR_IP_ADDRESS:8765');
```

**IP Address Configuration:**
- **Android Emulator**: Use `ws://10.0.2.2:8765`
- **iOS Simulator**: Use `ws://localhost:8765`
- **Physical Device**: Use your computer's local IP address

## 🚀 Running the System

### Method 1: Development Mode (Recommended)

#### Terminal 1 - Backend

```bash
cd backend
source venv/bin/activate
python computer_vision/blind_spot.py
```

#### Terminal 2 - Mobile App

```bash
cd mobile
npm start
```

### Method 2: Individual Components

#### Backend Only

```bash
# Detection system only
python backend/computer_vision/detection.py

# WebSocket server only
python backend/computer_vision/websocket_server.py

# Complete system
python backend/computer_vision/blind_spot.py
```

#### Mobile App Only

```bash
cd mobile
npm start
```

## 📱 Mobile App Deployment

### Option 1: Expo Go (Development)

1. Install **Expo Go** app on your mobile device
2. Scan QR code from terminal after running `npm start`
3. App will load and connect to backend

### Option 2: Development Build

```bash
cd mobile

# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build for development
eas build --platform android --profile development
eas build --platform ios --profile development
```

### Option 3: Production Build

```bash
# Build for production
eas build --platform android
eas build --platform ios
```

## 🖥️ Hardware Setup

### Camera Configuration

#### Single Camera Setup
```python
# Use default camera (ID 0)
python backend/computer_vision/blind_spot.py
```

#### Multiple Camera Setup
```python
# Modify blind_spot.py for multiple cameras
cameras = [0, 1, 2]  # Camera IDs
```

#### Raspberry Pi Camera Setup

```bash
# Enable camera interface
sudo raspi-config

# Install camera dependencies
pip install picamera2
```

### Network Configuration

#### Find Your IP Address

```bash
# Linux/macOS
ifconfig | grep inet

# Windows
ipconfig
```

#### Firewall Configuration

```bash
# Allow WebSocket port (8765)
sudo ufw allow 8765

# Or using iptables
sudo iptables -A INPUT -p tcp --dport 8765 -j ACCEPT
```

## 🧪 Testing

### Test with Dummy Video

1. Place a test video file named `dummy_video.mp4` in the backend directory
2. Run the system - it will automatically use the dummy video
3. Verify detections appear in mobile app

### Test with Real Camera

```bash
# Start system with real camera
python -c "
import asyncio
from backend.computer_vision.blind_spot import BlindSpotSystem

async def main():
    system = BlindSpotSystem()
    await system.start(use_camera=True, camera_id=0)

asyncio.run(main())
"
```

### Performance Testing

```bash
# Monitor system performance
python -c "
import time
import psutil

# Monitor CPU and memory usage
while True:
    print(f'CPU: {psutil.cpu_percent()}% Memory: {psutil.virtual_memory().percent}%')
    time.sleep(1)
"
```

## 🔧 Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed

**Symptoms**: Mobile app shows "Disconnected" or "Connection Error"

**Solutions**:
- Verify backend is running on correct port
- Check IP address configuration
- Ensure firewall allows port 8765
- Try different IP addresses (localhost, 127.0.0.1, 0.0.0.0)

#### 2. Camera Not Detected

**Symptoms**: No camera feed, errors in detection script

**Solutions**:
- Check camera connection
- Verify camera permissions
- Try different camera IDs (0, 1, 2)
- Install camera drivers if needed

#### 3. Low FPS Performance

**Symptoms**: Choppy video, delayed detections

**Solutions**:
- Reduce camera resolution in config
- Close other applications
- Use GPU acceleration if available
- Reduce detection confidence threshold

#### 4. Mobile App Not Loading

**Symptoms**: QR code not scanning, app not starting

**Solutions**:
- Clear Expo cache: `expo start -c`
- Restart development server
- Check Node.js version compatibility
- Verify all dependencies installed

### Debug Mode

Enable debug logging:

```python
# In Python scripts
import logging
logging.basicConfig(level=logging.DEBUG)
```

```javascript
// In React Native
console.log('Debug information')
```

## 📊 System Status

### Check Backend Status

```bash
# Check if processes are running
ps aux | grep python

# Check network connections
netstat -tlnp | grep 8765

# Check system resources
htop
```

### Check Mobile App Status

```bash
# Check Expo development server
curl http://localhost:19006

# Check WebSocket connection
# Use browser developer tools to inspect WebSocket connections
```

## 🚀 Production Deployment

### Raspberry Pi Setup

```bash
# Install system dependencies
sudo apt update
sudo apt install python3-pip python3-venv

# Create dedicated user
sudo useradd -m -s /bin/bash safedetect
sudo su safedetect

# Clone and setup
git clone https://github.com/your-username/safedetect.git
cd safedetect

# Setup Python environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup as service
sudo nano /etc/systemd/system/safedetect.service
```

**Service Configuration** (`/etc/systemd/system/safedetect.service`):

```ini
[Unit]
Description=SafeDetect Blind Spot Detection System
After=network.target

[Service]
Type=simple
User=safedetect
WorkingDirectory=/home/safedetect/safedetect/backend
ExecStart=/home/safedetect/safedetect/backend/venv/bin/python computer_vision/blind_spot.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable safedetect
sudo systemctl start safedetect
sudo systemctl status safedetect
```

### Docker Deployment

```dockerfile
# Dockerfile for backend
FROM python:3.9-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .
COPY shared/ ../shared/

CMD ["python", "computer_vision/blind_spot.py"]
```

```bash
# Build and run
docker build -t safedetect-backend .
docker run -p 8765:8765 safedetect-backend
```

## 📈 Monitoring and Maintenance

### System Monitoring

```bash
# Monitor logs
tail -f /var/log/safedetect.log

# Check system health
python -c "
from backend.computer_vision.blind_spot import BlindSpotSystem
system = BlindSpotSystem()
print(system.get_status())
"
```

### Regular Maintenance

1. **Update Dependencies**:
   ```bash
   pip install --upgrade -r requirements.txt
   npm update
   ```

2. **Clean Up Logs**:
   ```bash
   # Rotate log files
   logrotate /etc/logrotate.d/safedetect
   ```

3. **System Updates**:
   ```bash
   sudo apt update && sudo apt upgrade
   ```

## 📞 Support

For additional help:
- Check the troubleshooting section above
- Review the integration guide
- Open an issue on GitHub
- Check the community discussions

## ✅ Verification Checklist

- [ ] Backend dependencies installed
- [ ] Mobile app dependencies installed
- [ ] Configuration files updated
- [ ] Network connectivity verified
- [ ] Camera access confirmed
- [ ] WebSocket connection tested
- [ ] Mobile app connects successfully
- [ ] Detections appear in mobile app
- [ ] Alerts trigger correctly

---

**Congratulations!** 🎉 Your SafeDetect system should now be fully operational. If you encounter any issues, refer to the troubleshooting section or reach out for support.

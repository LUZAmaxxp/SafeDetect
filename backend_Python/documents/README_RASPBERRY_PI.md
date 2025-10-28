# SafeDetect - Raspberry Pi Setup Guide

## Hardware Requirements

### Minimum Requirements
- Raspberry Pi 4 (4GB RAM minimum, 8GB recommended)
- 32GB Class 10 SD card or USB SSD (recommended)
- Power supply: 5V/3A USB-C
- Three cameras:
  - 2x USB cameras for left and right blind spots
  - 1x Raspberry Pi Camera Module v2 or USB camera for rear view
- Active cooling solution (heatsinks + fan)

### Optional Hardware
- Coral USB Accelerator (for faster inference)
- M.2 SSD with USB enclosure (better performance)
- GPIO-connected LED indicators or buzzers

## Initial Setup

### 1. Operating System Installation
```bash
# Download and install Raspberry Pi OS (64-bit) with desktop
# Using Raspberry Pi Imager is recommended
# Select "Raspberry Pi OS (64-bit)"
```

### 2. Basic Configuration
```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Enable required interfaces
sudo raspi-config
# Navigate to:
# - Interface Options > Camera > Enable
# - Interface Options > I2C > Enable (for optional sensors)
```

### 3. Install System Dependencies
```bash
# Install required system packages
sudo apt install -y \
    python3-pip \
    python3-opencv \
    libopencv-dev \
    libgstreamer1.0-0 \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    python3-picamera2 \
    python3-venv

# Install system utilities
sudo apt install -y \
    v4l-utils \
    i2c-tools \
    git
```

### 4. SafeDetect Installation

```bash
# Clone the repository
git clone https://github.com/LUZAmaxxp/SafeDetect.git
cd SafeDetect/backend/computer_vision

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python requirements
pip install -r requirements_pi.txt
```

## Camera Setup

### 1. Verify Camera Detection
```bash
# List video devices
v4l2-ctl --list-devices

# Test USB cameras
v4l2-ctl -d /dev/video0 --all  # First USB camera
v4l2-ctl -d /dev/video1 --all  # Second USB camera

# Test Pi Camera Module (if using)
libcamera-hello
```

### 2. Camera Configuration
Edit `pi_config.py` to match your camera setup:
```python
PI_CAMERA_CONFIG = {
    "left": {
        "camera_id": 0,  # Adjust based on your USB camera order
        "name": "Left Side Camera",
        "zone": "left"
    },
    "right": {
        "camera_id": 1,  # Adjust based on your USB camera order
        "name": "Right Side Camera",
        "zone": "right"
    },
    "rear": {
        "camera_id": -1,  # Use -1 for Pi Camera Module or 2 for USB
        "name": "Rear Camera",
        "zone": "rear"
    }
}
```

## Performance Optimization

### 1. Memory Configuration
Edit `/boot/config.txt`:
```bash
sudo nano /boot/config.txt

# Add/modify these lines:
gpu_mem=128
dtoverlay=vc4-fkms-v3d
```

### 2. System Optimization
```bash
# Create swap file (if needed)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### 3. Temperature Monitoring
```bash
# Install temperature monitoring tool
sudo apt install -y lm-sensors

# Monitor CPU temperature
watch -n 1 vcgencmd measure_temp
```

## Running the System

### 1. Basic Operation
```bash
# Activate virtual environment
source venv/bin/activate

# Run the detection system
python multi_camera_detector.py
```

### 2. Running as a Service
Create a systemd service for automatic startup:

```bash
sudo nano /etc/systemd/system/safedetect.service
```

Add the following content:
```ini
[Unit]
Description=SafeDetect Multi-Camera Detection System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/SafeDetect/backend/computer_vision
Environment=PYTHONPATH=/home/pi/SafeDetect/backend
ExecStart=/home/pi/SafeDetect/backend/computer_vision/venv/bin/python multi_camera_detector.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl enable safedetect
sudo systemctl start safedetect
```

## Troubleshooting

### 1. Camera Issues
```bash
# Check camera permissions
sudo usermod -a -G video $USER
sudo reboot

# Test camera access
python3 -c "import cv2; cap = cv2.VideoCapture(0); print(cap.isOpened())"
```

### 2. Performance Issues
- Monitor system resources:
```bash
top
htop  # Install with: sudo apt install htop
```

- Check temperature:
```bash
vcgencmd measure_temp
```

### 3. Common Problems

1. Camera Not Detected:
   - Check USB connections
   - Try different USB ports
   - Verify camera with `v4l2-ctl --list-devices`

2. System Running Slow:
   - Monitor temperature
   - Check CPU usage
   - Consider reducing resolution or FPS in `pi_config.py`

3. Kafka Connection Issues:
   - Verify network connectivity
   - Check Kafka broker address
   - Test with `kafka-console-producer` tool

## Maintenance

### 1. Regular Updates
```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Update Python packages
pip install --upgrade -r requirements_pi.txt
```

### 2. Log Management
```bash
# View system logs
journalctl -u safedetect -f

# Clear old logs
sudo journalctl --vacuum-time=7d
```

### 3. Backup
```bash
# Backup configuration
cp pi_config.py pi_config.backup.py
```

## Support

For issues and support:
- Check the main repository: https://github.com/LUZAmaxxp/SafeDetect
- Submit issues through GitHub
- Consult the main documentation for additional information

## License
This project is licensed under the terms specified in the main SafeDetect repository.
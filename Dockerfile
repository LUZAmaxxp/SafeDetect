FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Add the current directory to PYTHONPATH
ENV PYTHONPATH=/app

# Create data directory for YOLOv8
RUN mkdir -p /app/data

WORKDIR /app/backend

CMD ["python", "-m", "computer_vision.multi_camera_detector"]

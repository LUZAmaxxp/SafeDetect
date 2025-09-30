FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libpulse0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application files
COPY . /app/backend/

# Add the backend directory to PYTHONPATH
ENV PYTHONPATH=/app/backend
ENV PYTHONPATH="${PYTHONPATH}:/app:/app/backend:/"

# Create data directory for YOLOv8
RUN mkdir -p /app/data

CMD ["python", "-m", "computer_vision.multi_camera_detector"]

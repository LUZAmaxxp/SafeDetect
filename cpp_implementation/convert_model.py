from ultralytics import YOLO

# Load the model
model = YOLO('yolov8n.pt')

# Export the model
model.export(format='onnx', imgsz=640)
#pragma once

#include <string>
#include <unordered_map>
#include <vector>
#include <nlohmann/json.hpp>

namespace safedetect {

// -----------------------------
// WebSocket Configuration
// -----------------------------
const std::string WEBSOCKET_HOST = "localhost";
const int WEBSOCKET_PORT = 8765;

// -----------------------------
// Kafka Configuration
// -----------------------------
const std::string KAFKA_HOST = "localhost";
const int KAFKA_PORT = 9092;
const std::string KAFKA_TOPIC = "detections";

// -----------------------------
// Detection Configuration
// -----------------------------
const float MODEL_CONFIDENCE = 0.25f;  // Lowered for YOLOv8 default

struct BlindSpotZone {
    float x_min, x_max, y_min, y_max;
};

const std::unordered_map<std::string, BlindSpotZone> BLIND_SPOT_ZONES = {
    {"left",  {0.0f, 0.3f, 0.2f, 0.8f}},
    {"right", {0.7f, 1.0f, 0.2f, 0.8f}},
    {"rear",  {0.3f, 0.7f, 0.7f, 1.0f}}
};

// -----------------------------
// Object Classes (COCO dataset subset)
// -----------------------------
const std::unordered_map<int, std::string> OBJECT_CLASSES = {
    {0, "person"},
    {2, "car"},
    {3, "motorcycle"}
};

// Colors for visualization (optional)
const std::unordered_map<std::string, std::string> OBJECT_COLORS = {
    {"person", "yellow"},
    {"car", "green"},
    {"motorcycle", "orange"}
};

// -----------------------------
// Alert Configuration
// -----------------------------
const int ALERT_BEEP_FREQUENCY = 800;  // Hz
const float ALERT_DURATION = 0.5f;     // seconds

// -----------------------------
// Camera Configuration
// -----------------------------
const int CAMERA_WIDTH = 640;
const int CAMERA_HEIGHT = 480;
const int FPS_TARGET = 15;

struct CameraConfig {
    int camera_id;
    std::string zone;
    std::string name;
    std::string description;
};

const std::unordered_map<std::string, CameraConfig> CAMERA_CONFIG = {
    {"left",  {0, "left",  "Left Side Camera",  "Monitors left side blind spot"}},
    {"right", {1, "right", "Right Side Camera", "Monitors right side blind spot"}},
    {"rear",  {2, "rear",  "Rear Camera",       "Monitors rear blind spot"}}
};

// Camera Status (ASCII-safe)
const std::unordered_map<std::string, std::string> CAMERA_STATUS = {
    {"available", "Available"},
    {"in_use", "In Use"},
    {"error", "Error"},
    {"not_connected", "Not Connected"}
};

// -----------------------------
// 3D Visualization / Truck mapping
// -----------------------------
struct TruckDimensions {
    float length, width, height;
};

const TruckDimensions TRUCK_DIMENSIONS = {10.0f, 2.5f, 3.0f};

struct PositionScale {
    float x, y, z;
};

const PositionScale POSITION_SCALE = {1.5f, 1.0f, 1.0f};

// -----------------------------
// Detection structure
// -----------------------------
struct Detection {
    std::string object;
    struct Position {
        float x, y, z;
        std::string zone;
    } position;
    float confidence;
    std::vector<float> bbox;
    int class_id;
    std::string camera_zone;
    double timestamp;

    nlohmann::json to_json() const {
        return {
            {"object", object},
            {"position", {
                {"x", position.x},
                {"y", position.y},
                {"z", position.z},
                {"zone", position.zone}
            }},
            {"confidence", confidence},
            {"bbox", bbox},
            {"class_id", class_id},
            {"camera_zone", camera_zone},
            {"timestamp", timestamp}
        };
    }
};

} // namespace safedetect

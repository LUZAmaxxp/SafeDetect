#pragma once

#include <string>
#include <map>

namespace SafeDetect {

// Camera settings
constexpr int CAMERA_WIDTH = 640;
constexpr int CAMERA_HEIGHT = 480;
constexpr int FPS_TARGET = 30;

// Kafka settings
const std::string KAFKA_BROKER = "localhost:9092";
const std::string KAFKA_TOPIC = "detections";

// Detection settings
constexpr float MODEL_CONFIDENCE = 0.1f;

// Position scaling
constexpr float POSITION_SCALE_X = 10.0f;
constexpr float POSITION_SCALE_Y = 10.0f;

// Camera configuration
struct CameraConfig {
    int cameraId;
    std::string name;
    std::string zone;
};

// Blind spot zone configuration
struct ZoneConfig {
    float xMin;
    float xMax;
    float yMin;
    float yMax;
};

const std::map<std::string, CameraConfig> CAMERA_CONFIG = {
    {"left",  {0, "Left Side Camera",  "left"}},
    {"right", {1, "Right Side Camera", "right"}},
    {"rear",  {2, "Rear Camera",       "rear"}}
};

const std::map<std::string, ZoneConfig> BLIND_SPOT_ZONES = {
    {"left",  {0.0f, 0.3f, 0.2f, 0.8f}},
    {"right", {0.7f, 1.0f, 0.2f, 0.8f}},
    {"rear",  {0.3f, 0.7f, 0.7f, 1.0f}}
};

} // namespace SafeDetect
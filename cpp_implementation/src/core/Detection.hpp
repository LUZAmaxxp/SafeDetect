#pragma once

#include <opencv2/opencv.hpp>
#include <string>
#include <nlohmann/json.hpp>

namespace SafeDetect {

struct Position3D {
    float x;
    float y;
    float z;
    
    nlohmann::json toJson() const {
        return {
            {"x", x},
            {"y", y},
            {"z", z}
        };
    }
};

class Detection {
public:
    Detection(const cv::Rect& bbox, float conf, const std::string& objClass, 
             const Position3D& pos, const std::string& zone);

    // Getters
    const cv::Rect& getBoundingBox() const { return boundingBox; }
    float getConfidence() const { return confidence; }
    const std::string& getObjectClass() const { return objectClass; }
    const Position3D& getPosition() const { return position; }
    const std::string& getZone() const { return cameraZone; }

    // Convert to JSON for Kafka
    nlohmann::json toJson() const;

private:
    cv::Rect boundingBox;
    float confidence;
    std::string objectClass;
    Position3D position;
    std::string cameraZone;
    double timestamp;
};

} // namespace SafeDetect
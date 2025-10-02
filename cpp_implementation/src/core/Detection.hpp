#pragma once

#include <opencv2/opencv.hpp>
#include <string>
#include <nlohmann/json.hpp>

namespace SafeDetect {

struct Position3D {
    float x;
    float y;
    float z;
    std::string zone;

    nlohmann::json toJson() const {
        return {
            {"x", x},
            {"y", y},
            {"z", z},
            {"zone", zone}
        };
    }
};

class Detection {
public:
    Detection(const std::vector<float>& bbox, float conf, const std::string& objClass, int classId,
             const Position3D& pos, const std::string& zone);

    // Getters
    const std::vector<float>& getBbox() const { return bbox; }
    float getConfidence() const { return confidence; }
    const std::string& getObjectClass() const { return objectClass; }
    int getClassId() const { return classId; }
    const Position3D& getPosition() const { return position; }
    const std::string& getZone() const { return cameraZone; }

    // Convert to JSON for Kafka
    nlohmann::json toJson() const;

private:
    std::vector<float> bbox;
    float confidence;
    std::string objectClass;
    int classId;
    Position3D position;
    std::string cameraZone;
    double timestamp;
};

} // namespace SafeDetect
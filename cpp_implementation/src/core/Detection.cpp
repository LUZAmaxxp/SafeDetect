#include "Detection.hpp"
#include <chrono>

namespace SafeDetect {

Detection::Detection(const cv::Rect& bbox, float conf, const std::string& objClass,
                   const Position3D& pos, const std::string& zone)
    : boundingBox(bbox),
      confidence(conf),
      objectClass(objClass),
      position(pos),
      cameraZone(zone),
      timestamp(std::chrono::system_clock::now().time_since_epoch().count()) {}

nlohmann::json Detection::toJson() const {
    return {
        {"bounding_box", {
            {"x", boundingBox.x},
            {"y", boundingBox.y},
            {"width", boundingBox.width},
            {"height", boundingBox.height}
        }},
        {"confidence", confidence},
        {"object", objectClass},  // Changed from object_class to object to match frontend
        {"position", position.toJson()},
        {"camera_zone", cameraZone},
        {"timestamp", timestamp}
    };
}

} // namespace SafeDetect
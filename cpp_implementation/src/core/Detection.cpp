#include "Detection.hpp"
#include <chrono>

namespace SafeDetect {

Detection::Detection(const std::vector<float>& bbox, float conf, const std::string& objClass, int classId,
                   const Position3D& pos, const std::string& zone)
    : bbox(bbox),
      confidence(conf),
      objectClass(objClass),
      classId(classId),
      position(pos),
      cameraZone(zone),
      timestamp(std::chrono::system_clock::now().time_since_epoch().count()) {}

nlohmann::json Detection::toJson() const {
    return {
        {"bbox", bbox},
        {"confidence", confidence},
        {"object", objectClass},
        {"class_id", classId},
        {"position", position.toJson()},
        {"camera_zone", cameraZone},
        {"timestamp", timestamp / 1000000000.0}  // Convert nanoseconds to seconds
    };
}

} // namespace SafeDetect
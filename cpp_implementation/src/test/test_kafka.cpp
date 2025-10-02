#include "../core/KafkaProducer.hpp"
#include "../core/Detection.hpp"
#include <spdlog/spdlog.h>
#include <thread>
#include <chrono>

using namespace SafeDetect;

int main() {
    // Initialize Kafka producer
    KafkaProducer producer("localhost:9092", "detections");
    
    if (!producer.initialize()) {
        spdlog::error("Failed to initialize Kafka producer");
        return 1;
    }

    // Create sample detection data
    std::vector<float> bbox = {100.0f, 100.0f, 300.0f, 300.0f}; // x1,y1,x2,y2
    float confidence = 0.95f;
    std::string objectClass = "truck";
    int classId = 7; // truck class id
    Position3D position{10.0f, 20.0f, 30.0f, "left"};
    std::string zone = "left";

    // Create detection object
    Detection detection(bbox, confidence, objectClass, classId, position, zone);

    // Try to send the detection
    if (producer.sendDetection(detection)) {
        spdlog::info("Successfully sent detection: {}", detection.toJson().dump());
    } else {
        spdlog::error("Failed to send detection");
        return 1;
    }

    // Give some time for the message to be delivered
    std::this_thread::sleep_for(std::chrono::seconds(2));

    return 0;
}

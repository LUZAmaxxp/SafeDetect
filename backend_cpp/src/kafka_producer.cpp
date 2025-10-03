#include "kafka_producer.hpp"
#include <nlohmann/json.hpp>

namespace safedetect {

DetectionKafkaProducer::DetectionKafkaProducer()
    : is_running_(false) {
    config_ = {
        {"metadata.broker.list", KAFKA_HOST + ":" + std::to_string(KAFKA_PORT)},
        {"acks", "1"}
    };
}

DetectionKafkaProducer::~DetectionKafkaProducer() {
    stop_producer();
}

void DetectionKafkaProducer::start_producer() {
    if (is_running_) return;

    try {
        producer_ = std::make_unique<cppkafka::Producer>(config_);
        is_running_ = true;
        spdlog::info("Kafka producer started");
    } catch (const std::exception& e) {
        spdlog::error("Failed to start Kafka producer: {}", e.what());
    }
}

void DetectionKafkaProducer::stop_producer() {
    if (!is_running_) return;

    if (producer_) {
        producer_->flush();
        producer_.reset();
    }
    is_running_ = false;
    spdlog::info("Kafka producer stopped");
}

void DetectionKafkaProducer::send_detections(const std::vector<Detection>& detections) {
    if (!is_running_ || !producer_) {
        spdlog::warn("Kafka producer not running, skipping detection send");
        return;
    }

    try {
        nlohmann::json json_detections = nlohmann::json::array();
        for (const auto& detection : detections) {
            json_detections.push_back(detection.to_json());
        }

        std::string message = json_detections.dump();
        producer_->produce(cppkafka::MessageBuilder(KAFKA_TOPIC).payload(message));
        producer_->flush();

        spdlog::info("Sent {} detections to Kafka", detections.size());
    } catch (const std::exception& e) {
        spdlog::error("Failed to send detections to Kafka: {}", e.what());
    }
}

} // namespace safedetect

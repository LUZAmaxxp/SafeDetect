#include "kafka_producer.hpp"
#include <nlohmann/json.hpp>

namespace safedetect {

DetectionKafkaProducer::DetectionKafkaProducer()
    : is_running_(false) {
    // Load security configuration from environment
    security_protocol_ = std::getenv("KAFKA_SECURITY_PROTOCOL") ? std::getenv("KAFKA_SECURITY_PROTOCOL") : "PLAINTEXT";
    sasl_mechanism_ = std::getenv("KAFKA_SASL_MECHANISM") ? std::getenv("KAFKA_SASL_MECHANISM") : "PLAIN";
    sasl_username_ = std::getenv("KAFKA_SASL_USERNAME") ? std::getenv("KAFKA_SASL_USERNAME") : "";
    sasl_password_ = std::getenv("KAFKA_SASL_PASSWORD") ? std::getenv("KAFKA_SASL_PASSWORD") : "";
    ssl_cafile_ = std::getenv("KAFKA_SSL_CAFILE") ? std::getenv("KAFKA_SSL_CAFILE") : "";
    ssl_certfile_ = std::getenv("KAFKA_SSL_CERTFILE") ? std::getenv("KAFKA_SSL_CERTFILE") : "";
    ssl_keyfile_ = std::getenv("KAFKA_SSL_KEYFILE") ? std::getenv("KAFKA_SSL_KEYFILE") : "";

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
        // Build security configuration
        cppkafka::Configuration security_config = config_;

        if (security_protocol_ != "PLAINTEXT") {
            security_config.set("security.protocol", security_protocol_);

            if (!sasl_username_.empty() && !sasl_password_.empty()) {
                security_config.set("sasl.mechanism", sasl_mechanism_);
                security_config.set("sasl.username", sasl_username_);
                security_config.set("sasl.password", sasl_password_);
            }

            // SSL configuration
            if (!ssl_cafile_.empty()) {
                security_config.set("ssl.ca.location", ssl_cafile_);
            }
            if (!ssl_certfile_.empty()) {
                security_config.set("ssl.certificate.location", ssl_certfile_);
            }
            if (!ssl_keyfile_.empty()) {
                security_config.set("ssl.key.location", ssl_keyfile_);
            }
        }

        producer_ = std::make_unique<cppkafka::Producer>(security_config);
        is_running_ = true;
        spdlog::info("Kafka producer started with security configuration");
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

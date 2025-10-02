#pragma once

#include <memory>
#include <string>
#include <librdkafka/rdkafkacpp.h>
#include <nlohmann/json.hpp>
#include <spdlog/spdlog.h>

using json = nlohmann::json;
#include "Detection.hpp"

namespace SafeDetect {

// Delivery report callback class
class DeliveryReportCbImpl : public RdKafka::DeliveryReportCb {
public:
    void dr_cb(RdKafka::Message &message) override {
        if (message.err()) {
            spdlog::error("Message delivery failed: {}", message.errstr());
        } else {
            spdlog::debug("Message delivered to topic {} [{}] at offset {}",
                         message.topic_name(), message.partition(), message.offset());
        }
    }
};

class KafkaProducer {
public:
    KafkaProducer(const std::string& brokerList, const std::string& topic);
    ~KafkaProducer();

    // Initialize the Kafka producer
    bool initialize();

    // Send detection to Kafka
    bool sendDetection(const Detection& detection);

    // Send multiple detections to Kafka
    bool sendDetections(const std::vector<Detection>& detections);

private:
    std::unique_ptr<RdKafka::Producer> producer;
    std::unique_ptr<RdKafka::Topic> topic;
    std::unique_ptr<DeliveryReportCbImpl> deliveryReportCb;
    std::string brokerList;
    std::string topicName;

    bool createProducer();
    bool createTopic();
};

} // namespace SafeDetect

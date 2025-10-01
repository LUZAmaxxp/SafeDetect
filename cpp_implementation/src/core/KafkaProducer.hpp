#pragma once

#include <memory>
#include <string>
#include <librdkafka/rdkafkacpp.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;
#include "Detection.hpp"

namespace SafeDetect {

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
    std::string brokerList;
    std::string topicName;
    
    bool createProducer();
    bool createTopic();
};

} // namespace SafeDetect
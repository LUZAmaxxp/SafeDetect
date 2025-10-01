#include "KafkaProducer.hpp"
#include <spdlog/spdlog.h>

namespace SafeDetect {

KafkaProducer::KafkaProducer(const std::string& broker, const std::string& topic)
    : brokerList(broker), topicName(topic) {}

KafkaProducer::~KafkaProducer() {
    if (producer) {
        producer->flush(1000);
    }
}

bool KafkaProducer::initialize() {
    if (!createProducer()) {
        return false;
    }
    if (!createTopic()) {
        return false;
    }
    return true;
}

bool KafkaProducer::createProducer() {
    std::string errstr;
    
    // Configure producer
    RdKafka::Conf* conf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    
    if (conf->set("bootstrap.servers", brokerList, errstr) != RdKafka::Conf::CONF_OK) {
        spdlog::error("Failed to set bootstrap.servers: {}", errstr);
        delete conf;
        return false;
    }

    // Create producer instance
    producer.reset(RdKafka::Producer::create(conf, errstr));
    delete conf;

    if (!producer) {
        spdlog::error("Failed to create producer: {}", errstr);
        return false;
    }

    spdlog::info("Created Kafka producer {} {}", producer->name(),
                 RdKafka::version_str());
    return true;
}

bool KafkaProducer::createTopic() {
    std::string errstr;
    
    // Configure topic
    RdKafka::Conf* tconf = RdKafka::Conf::create(RdKafka::Conf::CONF_TOPIC);
    
    // Create topic handle
    topic.reset(RdKafka::Topic::create(producer.get(), topicName, tconf, errstr));
    delete tconf;

    if (!topic) {
        spdlog::error("Failed to create topic: {}", errstr);
        return false;
    }

    return true;
}

bool KafkaProducer::sendDetection(const Detection& detection) {
    std::vector<Detection> detections{detection};
    return sendDetections(detections);
}

bool KafkaProducer::sendDetections(const std::vector<Detection>& detections) {
    try {
        // Create message with type and array of detections
        nlohmann::json message;
        message["type"] = "detections";
        message["timestamp"] = std::time(nullptr);
        message["detections"] = nlohmann::json::array();
        
        // Add each detection to the array
        for (const auto& detection : detections) {
            message["detections"].push_back(detection.toJson());
        }
        
        // Convert to JSON string
        std::string payload = message.dump();
        
        // Send message
        RdKafka::ErrorCode err = producer->produce(
            topic.get(),
            RdKafka::Topic::PARTITION_UA,
            RdKafka::Producer::RK_MSG_COPY,
            const_cast<char*>(payload.c_str()),
            payload.size(),
            nullptr,    // Optional key
            nullptr    // Message opaque
        );

        if (err != RdKafka::ERR_NO_ERROR) {
            spdlog::error("Failed to produce message: {}", 
                         RdKafka::err2str(err));
            return false;
        }

        // Poll to handle delivery reports
        producer->poll(0);
        return true;

    } catch (const std::exception& e) {
        spdlog::error("Error sending detection: {}", e.what());
        return false;
    }
}

} // namespace SafeDetect
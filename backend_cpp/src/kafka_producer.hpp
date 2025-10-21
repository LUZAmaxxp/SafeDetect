#pragma once

#include <cppkafka/cppkafka.h>
#include <vector>
#include <string>
#include <spdlog/spdlog.h>
#include <cstdlib>
#include "config.hpp"

namespace safedetect {

class DetectionKafkaProducer {
public:
    DetectionKafkaProducer();
    ~DetectionKafkaProducer();

    void start_producer();
    void stop_producer();
    void send_detections(const std::vector<Detection>& detections);

private:
    cppkafka::Configuration config_;
    std::unique_ptr<cppkafka::Producer> producer_;
    bool is_running_;

    // Security configuration
    std::string security_protocol_;
    std::string sasl_mechanism_;
    std::string sasl_username_;
    std::string sasl_password_;
    std::string ssl_cafile_;
    std::string ssl_certfile_;
    std::string ssl_keyfile_;
};

} // namespace safedetect

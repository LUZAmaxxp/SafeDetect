#pragma once

#include <cppkafka/cppkafka.h>
#include <vector>
#include <string>
#include <spdlog/spdlog.h>
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
};

} // namespace safedetect

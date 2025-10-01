#include <iostream>
#include <csignal>
#include <spdlog/spdlog.h>
#include "core/MultiCameraDetector.hpp"

using namespace SafeDetect;

// Global detector instance for signal handling
std::unique_ptr<MultiCameraDetector> detector;

void signalHandler(int signum) {
    spdlog::info("Interrupt signal received. Shutting down...");
    if (detector) {
        detector->stop();
    }
    exit(signum);
}

int main() {
    try {
        // Set up logging
        spdlog::set_pattern("[%H:%M:%S.%e] [%^%l%$] %v");
        spdlog::set_level(spdlog::level::info);

        // Set up signal handling
        signal(SIGINT, signalHandler);
        signal(SIGTERM, signalHandler);

        // Initialize detector
        detector = std::make_unique<MultiCameraDetector>();
        
        if (!detector->initialize()) {
            spdlog::error("Failed to initialize detector");
            return 1;
        }

        spdlog::info("Starting detection system...");
        detector->startProcessing();

    } catch (const std::exception& e) {
        spdlog::error("Fatal error: {}", e.what());
        return 1;
    }

    return 0;
}
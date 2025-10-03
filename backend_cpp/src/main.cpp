#ifdef HAS_SDL2
#define SDL_MAIN_HANDLED
#include <SDL.h>
#endif
#include <iostream>
#include <thread>
#include <chrono>
#include <csignal>
#include "multi_camera_detector.hpp"
#include <spdlog/spdlog.h>

// Enable debug logging
void setup_logging() {
    spdlog::set_level(spdlog::level::debug);
    spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] %v");
}

namespace safedetect {

volatile std::sig_atomic_t g_signal_status = 0;

void signal_handler(int signal) {
    g_signal_status = signal;
}

void test_multi_camera_system() {
    spdlog::set_level(spdlog::level::info);

    MultiCameraDetector detector("yolov8n.onnx");

    // Register signal handler for graceful shutdown
    std::signal(SIGINT, signal_handler);

    try {
        spdlog::info("Starting multi-camera test...");

        // Start all cameras
        if (!detector.start_cameras()) {
            spdlog::error("Failed to start any cameras. Exiting.");
            return;
        }

        // Print camera status
        auto status = detector.get_camera_status();
        spdlog::info("Camera Status:");
        for (const auto& [zone, info] : status) {
            spdlog::info("  {}", info);
        }

        // Process frames continuously
        spdlog::info("Starting detection loop... (Press Ctrl+C to stop)");

        while (g_signal_status != SIGINT) {
            auto detections = detector.process_all_cameras();

            // Small delay to maintain target FPS
            std::this_thread::sleep_for(std::chrono::milliseconds(1000 / FPS_TARGET));
        }

        spdlog::info("Test interrupted by user");
    } catch (const std::exception& e) {
        spdlog::error("Test error: {}", e.what());
    }

    detector.stop();
}

} // namespace safedetect

int main() {
    setup_logging();
    safedetect::test_multi_camera_system();
    return 0;
}

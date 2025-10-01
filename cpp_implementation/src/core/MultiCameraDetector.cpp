#include "MultiCameraDetector.hpp"
#include <spdlog/spdlog.h>
#include <csignal>
#include "../utils/Config.hpp"

namespace SafeDetect {

bool MultiCameraDetector::shouldExit = false;

void MultiCameraDetector::signalHandler(int signum) {
    spdlog::info("Interrupt signal ({}) received. Shutting down...", signum);
    shouldExit = true;
}

MultiCameraDetector::MultiCameraDetector() : isRunning(false) {
    detector = std::make_unique<YOLO>("yolov8n.pt");
    producer = std::make_unique<KafkaProducer>(KAFKA_BROKER, KAFKA_TOPIC);
}

MultiCameraDetector::~MultiCameraDetector() {
    stop();
}

bool MultiCameraDetector::initialize() {
    // Set log level to debug for detailed logging
    spdlog::set_level(spdlog::level::debug);

    if (!producer->initialize()) {
        spdlog::error("Failed to initialize Kafka producer");
        return false;
    }

    if (!initializeCameras()) {
        spdlog::error("Failed to initialize cameras");
        return false;
    }

    spdlog::info("MultiCameraDetector initialized successfully");
    return true;
}

bool MultiCameraDetector::initializeCameras() {
    int successCount = 0;
    
    // Initialize each camera based on configuration
    for (const auto& [zone, config] : CAMERA_CONFIG) {
        Camera camera;
        camera.zone = zone;
        camera.id = config.cameraId;
        
        spdlog::info("Initializing {} camera (ID: {})", config.name, camera.id);
        
        // Try different backends in order of preference
        std::vector<int> backends = {
            cv::CAP_DSHOW,      // DirectShow (Windows)
            cv::CAP_MSMF,       // Microsoft Media Foundation
            cv::CAP_ANY         // Auto-detect
        };
        
        bool opened = false;
        for (auto backend : backends) {
            camera.capture.open(camera.id, backend);
            if (camera.capture.isOpened()) {
                opened = true;
                spdlog::info("Successfully opened camera {} with backend {}", config.name, backend);
                break;
            }
        }
        
        if (opened) {
            // Set camera properties with verification
            camera.capture.set(cv::CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH);
            camera.capture.set(cv::CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT);
            camera.capture.set(cv::CAP_PROP_FPS, FPS_TARGET);
            camera.capture.set(cv::CAP_PROP_FOURCC, cv::VideoWriter::fourcc('M','J','P','G'));
            
            // Verify settings
            double actualWidth = camera.capture.get(cv::CAP_PROP_FRAME_WIDTH);
            double actualHeight = camera.capture.get(cv::CAP_PROP_FRAME_HEIGHT);
            double actualFPS = camera.capture.get(cv::CAP_PROP_FPS);
            
            spdlog::info("Camera {} settings - Width: {}, Height: {}, FPS: {}",
                         config.name, actualWidth, actualHeight, actualFPS);
            }

            if (camera.capture.isOpened()) {
                camera.isActive = true;
                cameras.push_back(camera);
                successCount++;
                spdlog::info("{} camera initialized successfully", config.name);
            } else {
                spdlog::error("Failed to initialize {} camera", config.name);
            }
        }

    spdlog::info("Camera initialization complete: {}/{} cameras connected", 
                 successCount, CAMERA_CONFIG.size());
    
    return successCount > 0;
}

void MultiCameraDetector::startProcessing() {
    // Set up signal handler
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);
    
    isRunning = true;
    shouldExit = false;
    spdlog::info("Starting detection system...");
    processCameraFeeds();
}

void MultiCameraDetector::stop() {
    isRunning = false;
    for (auto& camera : cameras) {
        if (camera.capture.isOpened()) {
            camera.capture.release();
        }
    }
    cameras.clear();
}

std::vector<Detection> MultiCameraDetector::processFrame(cv::Mat& frame, const std::string& zone) {
    std::vector<Detection> detections;

    // Run YOLO detection
    auto results = detector->detect(frame);

    spdlog::debug("YOLO detected {} objects in frame", results.size());

    for (const auto& result : results) {
        Position3D position = calculatePosition(result.bbox, frame.cols, frame.rows, zone);

        // Calculate normalized center coordinates for blind spot check
        float x_center = (result.bbox.x + result.bbox.width/2.0f) / frame.cols;
        float y_center = (result.bbox.y + result.bbox.height/2.0f) / frame.rows;

        spdlog::debug("YOLO result: {} at normalized ({:.2f}, {:.2f}) position ({:.2f}, {:.2f}, {:.2f}) confidence {:.2f}",
                     result.className, x_center, y_center,
                     position.x, position.y, position.z, result.confidence);

        if (isInBlindSpot(x_center, y_center, zone)) {
            spdlog::info("Object {} in blind spot for {} zone", result.className, zone);
            detections.emplace_back(result.bbox, result.confidence,
                                  result.className, position, zone);
        }
    }

    return detections;
}

void MultiCameraDetector::processCameraFeeds() {
    while (isRunning && !shouldExit) {
        // Process each camera synchronously
        for (auto& camera : cameras) {
            if (!camera.isActive) {
                // Try to reconnect inactive cameras periodically
                static int reconnectAttempt = 0;
                if (++reconnectAttempt % 100 == 0) { // Try every 100 iterations
                    camera.capture.release();
                    camera.capture.open(camera.id);
                    if (camera.capture.isOpened()) {
                        camera.isActive = true;
                        spdlog::info("Successfully reconnected {} camera", camera.zone);
                    }
                }
                continue;
            }

            cv::Mat frame;
            bool frameRead = false;
            for (int retries = 0; retries < 3; retries++) {
                try {
                    if (camera.capture.read(frame)) {
                        frameRead = true;
                        break;
                    }
                    std::this_thread::sleep_for(std::chrono::milliseconds(10));
                } catch (const cv::Exception& e) {
                    spdlog::warn("OpenCV exception while reading frame: {}", e.what());
                }
            }

            if (!frameRead) {
                spdlog::error("Failed to read frame from {} camera after retries", camera.zone);
                camera.isActive = false;
                continue;
            }

            if (frame.empty()) {
                spdlog::warn("Empty frame received from {} camera", camera.zone);
                continue;
            }

            try {
                auto detections = processFrame(frame, camera.zone);
                if (!detections.empty()) {
                    spdlog::info("Detected {} objects in {} camera zone", detections.size(), camera.zone);
                    for (const auto& det : detections) {
                        spdlog::debug("Detection: {} at ({:.2f}, {:.2f}, {:.2f}) confidence {:.2f}",
                                    det.getObjectClass(), det.getPosition().x, det.getPosition().y, det.getPosition().z, det.getConfidence());
                    }
                    if (producer->sendDetections(detections)) {
                        spdlog::info("Successfully sent {} detections to Kafka", detections.size());
                    } else {
                        spdlog::error("Failed to send detections to Kafka");
                    }
                } else {
                    spdlog::debug("No detections in {} camera zone", camera.zone);
                }
            } catch (const std::exception& e) {
                spdlog::error("Error processing frame from {} camera: {}", camera.zone, e.what());
            }
        }

        // Small delay to prevent CPU overload
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
}

bool MultiCameraDetector::isInBlindSpot(float x_center, float y_center, const std::string& zone) {
    const auto& zoneConfig = BLIND_SPOT_ZONES.at(zone);
    return (x_center >= zoneConfig.xMin && x_center <= zoneConfig.xMax &&
            y_center >= zoneConfig.yMin && y_center <= zoneConfig.yMax);
}

Position3D MultiCameraDetector::calculatePosition(const cv::Rect& bbox, 
                                                int frameWidth, int frameHeight,
                                                const std::string& zone) {
    float x_center = (bbox.x + bbox.width/2.0f) / frameWidth;
    float y_center = (bbox.y + bbox.height/2.0f) / frameHeight;
    
    Position3D position;
    position.x = x_center * POSITION_SCALE_X;
    position.y = y_center * POSITION_SCALE_Y;
    
    // Set Z based on camera zone
    if (zone == "left") {
        position.z = 4.0f;
    } else if (zone == "right") {
        position.z = -5.0f;
    } else {
        position.z = 0.0f;
    }
    
    return position;
}

} // namespace SafeDetect
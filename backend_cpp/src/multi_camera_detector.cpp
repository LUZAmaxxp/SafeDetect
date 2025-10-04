#include "multi_camera_detector.hpp"
#include <spdlog/spdlog.h>
#include <chrono>
#include <algorithm>
#include <future>

namespace safedetect {

MultiCameraDetector::MultiCameraDetector(const std::string& model_path)
    : is_running_(false), frame_count_(0), fps_(0.0) {
    // Load YOLO model
    try {
        net_ = cv::dnn::readNetFromONNX(model_path);
        net_.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
        net_.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);
        spdlog::info("YOLO model loaded from {}", model_path);
    } catch (const cv::Exception& e) {
        spdlog::error("Failed to load YOLO model: {}", e.what());
    }

    // Initialize Kafka producer
    kafka_producer_ = std::make_unique<DetectionKafkaProducer>();
    kafka_producer_->start_producer();

    // Initialize audio alert
    audio_alert_ = std::make_unique<AudioAlert>();
    if (!audio_alert_->initialize()) {
        spdlog::warn("Audio alert initialization failed");
    }

    last_time_ = std::chrono::steady_clock::now();
}

MultiCameraDetector::~MultiCameraDetector() {
    stop();
}

bool MultiCameraDetector::start_cameras() {
    spdlog::info("Starting multi-camera system...");

    std::vector<std::future<std::pair<std::string, cv::VideoCapture>>> futures;

    // Launch async tasks to open cameras in parallel
    for (const auto& [zone, config] : CAMERA_CONFIG) {
        futures.push_back(std::async(std::launch::async, [zone, &config]() -> std::pair<std::string, cv::VideoCapture> {
            spdlog::info("Starting {} (Camera ID: {})...", config.name, config.camera_id);
            cv::VideoCapture cap(config.camera_id);
            if (cap.isOpened()) {
                cap.set(cv::CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH);
                cap.set(cv::CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT);
                cap.set(cv::CAP_PROP_FPS, FPS_TARGET);
                return {zone, std::move(cap)};
            } else {
                spdlog::error("{}: Failed to open camera {}", config.name, config.camera_id);
                return {zone, cv::VideoCapture()}; // empty capture
            }
        }));
    }

    int success_count = 0;
    cameras_.clear();
    camera_status_.clear();

    // Collect results
    for (auto& fut : futures) {
        auto [zone, cap] = fut.get();
        if (cap.isOpened()) {
            cameras_[zone] = std::move(cap);
            camera_status_[zone] = "available";
            spdlog::info("{}: Connected successfully", zone);
            success_count++;
        } else {
            camera_status_[zone] = "error";
        }
    }

    spdlog::info("Camera startup complete: {}/{} cameras connected", success_count, CAMERA_CONFIG.size());
    return success_count > 0;
}

void MultiCameraDetector::stop() {
    if (!is_running_) return;

    is_running_ = false;

    // Release cameras
    for (auto& [zone, cap] : cameras_) {
        if (cap.isOpened()) {
            cap.release();
            spdlog::info("Released {} camera", zone);
        }
    }
    cameras_.clear();

    // Update status
    for (const auto& [zone, _] : CAMERA_CONFIG) {
        camera_status_[zone] = "not_connected";
    }

    // Stop Kafka producer
    if (kafka_producer_) {
        kafka_producer_->stop_producer();
    }

    cv::destroyAllWindows();
    spdlog::info("Multi-camera system stopped");
}

std::unordered_map<std::string, std::string> MultiCameraDetector::get_camera_status() const {
    std::unordered_map<std::string, std::string> status;
    for (const auto& [zone, config] : CAMERA_CONFIG) {
        auto it = camera_status_.find(zone);
        std::string status_str = (it != camera_status_.end()) ? it->second : "unknown";
        status[zone] = config.name + " (ID: " + std::to_string(config.camera_id) + ") - " +
                      (CAMERA_STATUS.count(status_str) ? CAMERA_STATUS.at(status_str) : status_str);
    }
    return status;
}

std::vector<Detection> MultiCameraDetector::process_all_cameras() {
    std::vector<Detection> all_detections;

    for (auto& [zone, cap] : cameras_) {
        cv::Mat frame;
        if (!cap.read(frame)) {
            spdlog::warn("Failed to read frame from {} camera", zone);
            continue;
        }

        // Prepare frame for DNN
        cv::Mat blob = cv::dnn::blobFromImage(frame, 1 / 255.0,
                                              cv::Size(640, 640),
                                              cv::Scalar(), true, false);
        net_.setInput(blob);

        // Run inference
        std::vector<cv::Mat> outputs;
        net_.forward(outputs, net_.getUnconnectedOutLayersNames());
        if (outputs.empty()) {
            spdlog::error("No outputs from YOLO");
            continue;
        }

        cv::Mat output = outputs[0];
        float* data = (float*)output.data;

        // Log output shape
        spdlog::info("YOLO output shape: {} x {} x {}", output.size[0], output.size[1], output.size[2]);

        // Log first few detections
        for (int i = 0; i < std::min(5, (int)output.size[1]); i++) {
            int offset = i * 6;
            spdlog::info("Detection {}: x={}, y={}, w={}, h={}, conf={}, cls={}",
                         i, data[offset], data[offset+1], data[offset+2], data[offset+3], data[offset+4], data[offset+5]);
        }

        // YOLOv10 output shape: (1, 300, 6) -> [x, y, w, h, conf, cls]
        int num_boxes = output.size[1];  // 300

        std::vector<cv::Rect> boxes;
        std::vector<float> confidences;
        std::vector<int> classIds;

        for (int i = 0; i < num_boxes; i++) {
            int offset = i * 6;

            float x = data[offset + 0];
            float y = data[offset + 1];
            float w = data[offset + 2];
            float h = data[offset + 3];
            float confidence = data[offset + 4];
            int class_id = static_cast<int>(data[offset + 5]);

            // Only process "person" or "car"
            if (confidence > MODEL_CONFIDENCE &&
                OBJECT_CLASSES.count(class_id) &&
                (OBJECT_CLASSES.at(class_id) == "person" || OBJECT_CLASSES.at(class_id) == "car")) {

                int x1 = static_cast<int>(x - w / 2.0f);
                int y1 = static_cast<int>(y - h / 2.0f);
                int x2 = static_cast<int>(x + w / 2.0f);
                int y2 = static_cast<int>(y + h / 2.0f);

                // Skip invalid boxes
                if (x2 <= x1 || y2 <= y1 || w <= 0 || h <= 0) continue;

                cv::Rect bbox(x1, y1, x2 - x1, y2 - y1);
                bbox &= cv::Rect(0, 0, frame.cols, frame.rows);

                // Skip if bbox becomes invalid after clipping
                if (bbox.width <= 0 || bbox.height <= 0) continue;

                // Skip small boxes to reduce false positives
                if (bbox.width * bbox.height < 10000) continue;

                boxes.push_back(bbox);
                confidences.push_back(confidence);
                classIds.push_back(class_id);
            }
        }

        // Apply Non-Maximum Suppression
        std::vector<int> indices;
        cv::dnn::NMSBoxes(boxes, confidences, MODEL_CONFIDENCE, 0.5f, indices);

        // Limit to top 1 detection per frame to reduce false positives
        if (!indices.empty()) {
            // Sort by confidence descending
            std::sort(indices.begin(), indices.end(), [&](int a, int b) {
                return confidences[a] > confidences[b];
            });
            // Take only the top 1
            indices.resize(1);
        }

        std::vector<Detection> detections;
        for (int idx : indices) {
            detections.push_back(calculate_detection(
                boxes[idx], frame.cols, frame.rows, zone, classIds[idx], confidences[idx]));
        }

        all_detections.insert(all_detections.end(), detections.begin(), detections.end());

        if (!detections.empty()) {
            kafka_producer_->send_detections(detections);
        }
    }

    // FPS calculation
    frame_count_++;
    auto current_time = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::seconds>(current_time - last_time_).count();
    if (elapsed >= 1.0) {
        fps_ = frame_count_ / elapsed;
        frame_count_ = 0;
        last_time_ = current_time;
        spdlog::info("FPS: {:.1f} | Active detections: {}", fps_, all_detections.size());
    }

    // Blind spot check
    std::vector<Detection> blind_spot_detections;
    for (const auto& detection : all_detections) {
        float x_pos = detection.position.x / POSITION_SCALE.x;
        float y_pos = detection.position.y / POSITION_SCALE.y;
        if (is_in_blind_spot(x_pos, y_pos, detection.camera_zone)) {
            blind_spot_detections.push_back(detection);
        }
    }

    if (!blind_spot_detections.empty()) {
        play_alert_sound();
        spdlog::warn("BLIND SPOT ALERT! Objects detected: {}", blind_spot_detections.size());
    }

    return all_detections;
}

void MultiCameraDetector::play_alert_sound() {
    if (audio_alert_) {
        audio_alert_->play_alert();
    }
}

bool MultiCameraDetector::is_in_blind_spot(float x_center, float y_center, const std::string& zone) const {
    auto it = BLIND_SPOT_ZONES.find(zone);
    if (it == BLIND_SPOT_ZONES.end()) return false;

    const auto& zone_coords = it->second;
    return (zone_coords.x_min <= x_center && x_center <= zone_coords.x_max &&
            zone_coords.y_min <= y_center && y_center <= zone_coords.y_max);
}

Detection MultiCameraDetector::calculate_detection(const cv::Rect& bbox, int frame_width, int frame_height,
                                                   const std::string& zone, int class_id, float confidence) const {
    Detection detection;
    detection.object = OBJECT_CLASSES.at(class_id);
    detection.confidence = confidence;
    detection.bbox = {static_cast<float>(bbox.x), static_cast<float>(bbox.y),
                      static_cast<float>(bbox.x + bbox.width), static_cast<float>(bbox.y + bbox.height)};
    detection.class_id = class_id;
    detection.camera_zone = zone;
    detection.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count() / 1000.0;

    float x_center = (bbox.x + bbox.width / 2.0f) / frame_width;
    float y_center = (bbox.y + bbox.height / 2.0f) / frame_height;

    // Debug logging
    spdlog::info("Detection bbox: x1={}, y1={}, x2={}, y2={}, frame_size={}x{}",
                 bbox.x, bbox.y, bbox.x + bbox.width, bbox.y + bbox.height, frame_width, frame_height);
    spdlog::info("Detection center: x_center={}, y_center={}", x_center, y_center);

    detection.position.x = x_center * POSITION_SCALE.x;
    detection.position.y = y_center * POSITION_SCALE.y;

    if (zone == "left") detection.position.z = 4.0f;
    else if (zone == "right") detection.position.z = -5.0f;
    else if (zone == "rear") detection.position.z = 0.0f;
    else detection.position.z = 0.0f;

    detection.position.zone = zone;

    spdlog::info("Detection position: x={}, y={}, z={}, zone={}",
                 detection.position.x, detection.position.y, detection.position.z, detection.position.zone);

    return detection;
}

} // namespace safedetect

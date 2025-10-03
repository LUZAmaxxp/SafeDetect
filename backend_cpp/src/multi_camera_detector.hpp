#pragma once

#include <opencv2/opencv.hpp>
#include <opencv2/dnn.hpp>
#include <unordered_map>
#include <string>
#include <vector>
#include <memory>
#include <thread>
#include <atomic>
#include <future>
#include <chrono>
#include "config.hpp"
#include "kafka_producer.hpp"
#include "audio_alert.hpp"

namespace safedetect {

class MultiCameraDetector {
public:
    MultiCameraDetector(const std::string& model_path = "models/yolov8n.onnx");
    ~MultiCameraDetector();

    bool start_cameras();
    void stop();
    std::unordered_map<std::string, std::string> get_camera_status() const;
    std::vector<Detection> process_all_cameras();

private:
    cv::dnn::Net net_;
    std::unordered_map<std::string, cv::VideoCapture> cameras_;
    std::unordered_map<std::string, std::string> camera_status_;
    std::unique_ptr<DetectionKafkaProducer> kafka_producer_;
    std::unique_ptr<AudioAlert> audio_alert_;
    std::atomic<bool> is_running_;
    int frame_count_;
    double fps_;
    std::chrono::steady_clock::time_point last_time_;

    void play_alert_sound();
    bool is_in_blind_spot(float x_center, float y_center, const std::string& zone) const;
    Detection calculate_detection(const cv::Rect& bbox, int frame_width, int frame_height,
                                  const std::string& zone, int class_id, float confidence) const;

    // Added debug display
    void draw_debug(const cv::Mat& frame, const std::vector<Detection>& detections);
};

} // namespace safedetect

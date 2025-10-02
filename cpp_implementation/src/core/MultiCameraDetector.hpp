#pragma once

#include <opencv2/opencv.hpp>
#include <string>
#include <vector>
#include <memory>
#include <future>
#include "Detection.hpp"
#include "KafkaProducer.hpp"
#include "../models/YOLO.hpp"

namespace SafeDetect {

class MultiCameraDetector {
public:
    MultiCameraDetector();
    ~MultiCameraDetector();

    // Initialize the detection system
    bool initialize();
    
    // Start processing frames from all cameras
    void startProcessing();
    
    // Stop processing
    void stop();

private:
    struct Camera {
        cv::VideoCapture capture;
        std::string zone;
        int id;
        bool isActive;
    };

    // Member variables
    std::vector<Camera> cameras;
    std::unique_ptr<YOLO> detector;
    std::unique_ptr<KafkaProducer> producer;
    bool isRunning;
    static bool shouldExit;

    // FPS tracking
    int frameCount;
    std::chrono::steady_clock::time_point lastFpsTime;
    double fps;

    // Signal handler
    static void signalHandler(int signum);

    // Private methods
    bool initializeCameras();
    std::vector<Detection> processFrame(cv::Mat& frame, const std::string& zone);
    void processCameraFeeds();
    bool isInBlindSpot(float x_center, float y_center, const std::string& zone);
    Position3D calculatePosition(const cv::Rect& bbox, int frameWidth, int frameHeight, const std::string& zone);
};

} // namespace SafeDetect
#pragma once

#include <opencv2/opencv.hpp>
#include <opencv2/dnn.hpp>
#include <string>
#include <vector>
#include <memory>

namespace SafeDetect {

struct YOLOResult {
    cv::Rect bbox;
    float confidence;
    std::string className;
};

class YOLO {
public:
    explicit YOLO(const std::string& modelPath);
    ~YOLO() = default;

    // Detect objects in a frame
    std::vector<YOLOResult> detect(const cv::Mat& frame);

private:
    cv::dnn::Net net;
    std::vector<std::string> classNames;
    
    // Helper methods
    void loadModel(const std::string& modelPath);
    void loadClassNames();
    std::vector<YOLOResult> processOutput(const std::vector<cv::Mat>& output, 
                                        const cv::Mat& frame);
    void scaleBoxes(std::vector<YOLOResult>& results, 
                    float scaleX, float scaleY);
};

} // namespace SafeDetect
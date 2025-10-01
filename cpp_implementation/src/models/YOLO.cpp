#include "YOLO.hpp"
#include <fstream>
#include <spdlog/spdlog.h>
#include "../utils/Config.hpp"

namespace SafeDetect {

YOLO::YOLO(const std::string& modelPath) {
    loadModel(modelPath);
    loadClassNames();
}

void YOLO::loadModel(const std::string& modelPath) {
    try {
        std::string onnxPath = modelPath.substr(0, modelPath.length() - 3) + ".onnx";
    net = cv::dnn::readNetFromONNX(onnxPath);
        
        // Enable CUDA if available
        #ifdef CUDA_AVAILABLE
        net.setPreferableBackend(cv::dnn::DNN_BACKEND_CUDA);
        net.setPreferableTarget(cv::dnn::DNN_TARGET_CUDA);
        #else
        net.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
        net.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);
        #endif

        spdlog::info("YOLO model loaded successfully");
    } catch (const cv::Exception& e) {
        throw std::runtime_error("Failed to load YOLO model: " + std::string(e.what()));
    }
}

void YOLO::loadClassNames() {
    classNames = {
        "person",
        "bicycle",
        "car",
        "motorcycle",
        "truck"
        // Add other class names as needed
    };
}

std::vector<YOLOResult> YOLO::detect(const cv::Mat& frame) {
    try {
        // Prepare input blob
        cv::Mat blob = cv::dnn::blobFromImage(frame, 1/255.0, 
            cv::Size(640, 640), cv::Scalar(), true, false);
        
        net.setInput(blob);

        // Forward pass
        std::vector<cv::Mat> outputs;
        net.forward(outputs, net.getUnconnectedOutLayersNames());

        // Process detections
        std::vector<YOLOResult> results = processOutput(outputs, frame);
        
        // Scale boxes to original frame size
        float scaleX = static_cast<float>(frame.cols) / 640.0f;
        float scaleY = static_cast<float>(frame.rows) / 640.0f;
        scaleBoxes(results, scaleX, scaleY);

        return results;
    } catch (const cv::Exception& e) {
        spdlog::error("Error during detection: {}", e.what());
        return {};
    }
}

std::vector<YOLOResult> YOLO::processOutput(const std::vector<cv::Mat>& outputs,
                                          const cv::Mat& frame) {
    std::vector<YOLOResult> results;
    
    // Process network output
    for (const auto& output : outputs) {
        const float* data = reinterpret_cast<float*>(output.data);
        
        for (int i = 0; i < output.rows; ++i) {
            float confidence = data[4];
            
            if (confidence >= MODEL_CONFIDENCE) {
                const float* classes_scores = data + 5;
                cv::Mat scores(1, static_cast<int>(classNames.size()), CV_32FC1, const_cast<float*>(classes_scores));
                cv::Point class_id;
                double max_score;
                cv::minMaxLoc(scores, nullptr, &max_score, nullptr, &class_id);
                
                if (max_score > MODEL_CONFIDENCE) {
                    YOLOResult result;
                    result.confidence = confidence;
                    result.className = classNames[class_id.x];
                    
                    // Get bounding box
                    float x = data[0];
                    float y = data[1];
                    float w = data[2];
                    float h = data[3];
                    
                    result.bbox = cv::Rect(
                        static_cast<int>(x - w/2),
                        static_cast<int>(y - h/2),
                        static_cast<int>(w),
                        static_cast<int>(h)
                    );
                    
                    results.push_back(result);
                }
            }
            data += output.cols;
        }
    }
    
    return results;
}

void YOLO::scaleBoxes(std::vector<YOLOResult>& results, 
                      float scaleX, float scaleY) {
    for (auto& result : results) {
        result.bbox.x = static_cast<int>(result.bbox.x * scaleX);
        result.bbox.y = static_cast<int>(result.bbox.y * scaleY);
        result.bbox.width = static_cast<int>(result.bbox.width * scaleX);
        result.bbox.height = static_cast<int>(result.bbox.height * scaleY);
    }
}

} // namespace SafeDetect
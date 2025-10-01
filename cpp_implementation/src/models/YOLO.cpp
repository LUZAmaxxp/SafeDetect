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

        // Check if model loaded
        if (net.empty()) {
            throw std::runtime_error("Failed to load YOLO model: network is empty");
        }

        // Enable CUDA if available
        #ifdef CUDA_AVAILABLE
        net.setPreferableBackend(cv::dnn::DNN_BACKEND_CUDA);
        net.setPreferableTarget(cv::dnn::DNN_TARGET_CUDA);
        #else
        net.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
        net.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);
        #endif

        spdlog::info("YOLO model loaded successfully");
        spdlog::debug("Network layers: {}", net.getLayerNames().size());
    } catch (const cv::Exception& e) {
        throw std::runtime_error("Failed to load YOLO model: " + std::string(e.what()));
    }
}

void YOLO::loadClassNames() {
    classNames = {
        "person",
        "car",
        "motorcycle",
       
    };
}

std::vector<YOLOResult> YOLO::detect(const cv::Mat& frame) {
    try {
        // Prepare input blob
        cv::Mat blob = cv::dnn::blobFromImage(frame, 1/255.0,
            cv::Size(640, 640), cv::Scalar(), true, true);

        spdlog::debug("Input blob shape: {} x {} x {} x {}", blob.size[0], blob.size[1], blob.size[2], blob.size[3]);

        net.setInput(blob);

        // Get output layer names
        std::vector<std::string> outputLayerNames = net.getUnconnectedOutLayersNames();
        spdlog::debug("Output layer names:");
        for (const auto& name : outputLayerNames) {
            spdlog::debug("  {}", name);
        }

        // Forward pass
        cv::Mat output = net.forward(outputLayerNames[0]);

        spdlog::debug("YOLO forward pass completed");
        spdlog::debug("Output dims: {}", output.dims);
        if (output.dims == 3) {
            spdlog::debug("Output shape: {} x {} x {}", output.size[0], output.size[1], output.size[2]);
            // Reshape from (1, 84, 8400) to (84, 8400)
            output = output.reshape(1, {84, 8400});
            spdlog::debug("Reshaped output shape: {} x {}", output.rows, output.cols);
        } else if (output.dims == 2) {
            spdlog::debug("Output shape: {} x {}", output.rows, output.cols);
        }

        std::vector<cv::Mat> outputs = {output};
        // Process detections
        std::vector<YOLOResult> results = processOutput(outputs, frame);

        return results;
    } catch (const cv::Exception& e) {
        spdlog::error("Error during detection: {}", e.what());
        return {};
    }
}

std::vector<YOLOResult> YOLO::processOutput(const std::vector<cv::Mat>& outputs,
                                          const cv::Mat& frame) {
    std::vector<YOLOResult> results;

    // YOLOv8 output format: [1, 84, 8400] -> Mat shape (84, 8400)
    // Each column represents one detection box
    // Row 0-3: bbox (x,y,w,h), Row 4-83: class scores

    for (const auto& output : outputs) {
        if (output.rows != 84 || output.cols != 8400) {
            spdlog::warn("Unexpected output shape: {} x {}, expected 84 x 8400", output.rows, output.cols);
        }

        const float* data = reinterpret_cast<float*>(output.data);

        // Loop over each detection box (columns)
        for (int i = 0; i < output.cols; ++i) {
            // Get bbox coordinates (rows 0-3) - row-major access
            float x = data[0 * output.cols + i];
            float y = data[1 * output.cols + i];
            float w = data[2 * output.cols + i];
            float h = data[3 * output.cols + i];

            // Get class scores (rows 4-83) - collect first classNames.size() scores
            std::vector<float> class_scores(classNames.size());
            for (size_t c = 0; c < classNames.size(); ++c) {
                class_scores[c] = data[(4 + c) * output.cols + i];
            }
            cv::Mat scores(1, static_cast<int>(classNames.size()), CV_32FC1, class_scores.data());
            cv::Point class_id;
            double max_class_score;
            cv::minMaxLoc(scores, nullptr, &max_class_score, nullptr, &class_id);

            float confidence = static_cast<float>(max_class_score);

            if (i < 5) {  // Debug first 5 detections
                spdlog::debug("Detection {}: x={:.3f}, y={:.3f}, w={:.3f}, h={:.3f}, conf={:.3f}",
                             i, x, y, w, h, confidence);
            }

            if (confidence >= MODEL_CONFIDENCE) {
                YOLOResult result;
                result.confidence = confidence;
                result.className = classNames[class_id.x];

                // Bounding box is center x,y,w,h in normalized coordinates (0-1)
                // Scale to frame pixel coordinates
                result.bbox = cv::Rect(
                    static_cast<int>((x - w/2) * frame.cols),
                    static_cast<int>((y - h/2) * frame.rows),
                    static_cast<int>(w * frame.cols),
                    static_cast<int>(h * frame.rows)
                );

                results.push_back(result);
            }
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
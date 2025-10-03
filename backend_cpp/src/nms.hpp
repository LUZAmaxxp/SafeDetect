#include <iostream>
#include <vector>
#include <algorithm>

struct Detection {
    float x1, y1, x2, y2;  // bounding box
    float confidence;       // detection confidence
    int class_id;           // 0 = person
};

// Compute Intersection over Union (IoU) between two boxes
float IoU(const Detection &a, const Detection &b) {
    float xx1 = std::max(a.x1, b.x1);
    float yy1 = std::max(a.y1, b.y1);
    float xx2 = std::min(a.x2, b.x2);
    float yy2 = std::min(a.y2, b.y2);

    float w = std::max(0.0f, xx2 - xx1);
    float h = std::max(0.0f, yy2 - yy1);
    float inter = w * h;
    float areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
    float areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
    float unionArea = areaA + areaB - inter;

    return inter / unionArea;
}

// Non-Maximum Suppression
std::vector<Detection> NMS(const std::vector<Detection> &detections, float iou_threshold, float conf_threshold) {
    std::vector<Detection> filtered;

    // Filter out low-confidence detections first
    std::vector<Detection> dets;
    for (const auto &d : detections) {
        if (d.confidence >= conf_threshold) dets.push_back(d);
    }

    // Sort by confidence descending
    std::sort(dets.begin(), dets.end(), [](const Detection &a, const Detection &b) {
        return a.confidence > b.confidence;
    });

    std::vector<bool> suppressed(dets.size(), false);

    for (size_t i = 0; i < dets.size(); ++i) {
        if (suppressed[i]) continue;
        filtered.push_back(dets[i]);

        for (size_t j = i + 1; j < dets.size(); ++j) {
            if (suppressed[j]) continue;
            if (IoU(dets[i], dets[j]) > iou_threshold && dets[i].class_id == dets[j].class_id) {
                suppressed[j] = true;
            }
        }
    }

    return filtered;
}

// Example usage
int main() {
    std::vector<Detection> detections = {
        {284, 222, 640, 480, 399575.53125, 0},
        {110, 60, 580, 475, 321555.15625, 0},
        {290, 222, 640, 480, 399584.15625, 0},
        {146, 91, 494, 418, 305880.28125, 2}  // example car
    };

    float iou_thresh = 0.5f;        // merge overlapping boxes > 50%
    float conf_thresh = 10000.0f;   // filter out low confidence

    std::vector<Detection> final_detections = NMS(detections, iou_thresh, conf_thresh);

    for (auto &d : final_detections) {
        std::cout << "Class " << d.class_id << " bbox: [" 
                  << d.x1 << "," << d.y1 << "," << d.x2 << "," << d.y2 
                  << "] conf: " << d.confidence << std::endl;
    }

    return 0;
}

# Add library
add_library(SafeDetectCore
    core/MultiCameraDetector.cpp
    core/Detection.cpp
    core/KafkaProducer.cpp
    models/YOLO.cpp
)

# Include directories
target_include_directories(SafeDetectCore
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
)

# Link dependencies
target_link_libraries(SafeDetectCore
    PUBLIC
        ${OpenCV_LIBS}
        RdKafka::rdkafka++
        nlohmann_json::nlohmann_json
        spdlog::spdlog
)

# Enable warnings
if(MSVC)
    target_compile_options(SafeDetectCore PRIVATE /W4)
else()
    target_compile_options(SafeDetectCore PRIVATE -Wall -Wextra -Wpedantic)
endif()
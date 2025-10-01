cmake_minimum_required(VERSION 3.15)
project(SafeDetect CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Find required packages
find_package(OpenCV REQUIRED)
find_package(RdKafka REQUIRED)
find_package(nlohmann_json REQUIRED)
find_package(spdlog REQUIRED)

# Add source directories
add_subdirectory(src)

# Main executable
add_executable(safe_detect src/main.cpp)

target_link_libraries(safe_detect
    PRIVATE
        SafeDetectCore
        ${OpenCV_LIBS}
        RdKafka::rdkafka++
        nlohmann_json::nlohmann_json
        spdlog::spdlog
)

# Test executable
add_executable(test_kafka src/test/test_kafka.cpp)

target_link_libraries(test_kafka
    PRIVATE
        SafeDetectCore
        ${OpenCV_LIBS}
        RdKafka::rdkafka++
        nlohmann_json::nlohmann_json
        spdlog::spdlog
)
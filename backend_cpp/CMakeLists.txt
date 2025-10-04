cmake_minimum_required(VERSION 3.16)
project(SafeDetectCpp VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

message(STATUS "Configuring SafeDetect C++ project...")

# -----------------------------
# Find required packages
# -----------------------------
find_package(OpenCV REQUIRED)
message(STATUS "Found OpenCV: ${OpenCV_VERSION}")

find_package(CppKafka CONFIG REQUIRED)
message(STATUS "Found CppKafka")

find_package(nlohmann_json CONFIG REQUIRED)
message(STATUS "Found nlohmann_json")

find_package(spdlog CONFIG REQUIRED)
message(STATUS "Found spdlog")

# SDL2 is optional
find_package(SDL2 QUIET)
if(SDL2_FOUND)
    message(STATUS "Found SDL2 - audio alerts enabled")
    set(HAS_SDL2 TRUE)
else()
    message(WARNING "SDL2 not found - audio alerts disabled")
    set(HAS_SDL2 FALSE)
endif()

# -----------------------------
# Include directories
# -----------------------------
include_directories(${OpenCV_INCLUDE_DIRS})
if(HAS_SDL2)
    include_directories(${SDL2_INCLUDE_DIRS})
endif()

# -----------------------------
# Source files
# -----------------------------
set(SOURCES
    src/main.cpp
    src/config.cpp
    src/kafka_producer.cpp
    src/audio_alert.cpp
    src/multi_camera_detector.cpp
)

message(STATUS "Source files: ${SOURCES}")

# -----------------------------
# Executable
# -----------------------------
add_executable(safedetect ${SOURCES})

# -----------------------------
# Link libraries
# -----------------------------
target_link_libraries(safedetect
    ${OpenCV_LIBS}
    CppKafka::cppkafka
    nlohmann_json::nlohmann_json
    spdlog::spdlog
)

# Conditionally link SDL2
if(HAS_SDL2)
    target_compile_definitions(safedetect PRIVATE HAS_SDL2 SDL_MAIN_HANDLED)
    target_link_libraries(safedetect
        SDL2::SDL2main
        SDL2::SDL2
    )
endif()

# -----------------------------
# Copy YOLO model next to .exe
# -----------------------------
if(EXISTS ${CMAKE_SOURCE_DIR}/models/yolov10n.onnx)
    add_custom_command(
        TARGET safedetect POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
            ${CMAKE_SOURCE_DIR}/models/yolov10n.onnx
            $<TARGET_FILE_DIR:safedetect>/yolov10n.onnx
    )
    message(STATUS "Model file will be copied next to the executable")
else()
    message(WARNING "Model file not found at ${CMAKE_SOURCE_DIR}/models/yolov10n.onnx")
endif()

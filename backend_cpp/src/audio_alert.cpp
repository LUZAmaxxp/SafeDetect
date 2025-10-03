#include "audio_alert.hpp"
#include "config.hpp"
#include <cmath>

namespace safedetect {

AudioAlert::AudioAlert()
    : initialized_(false) {
}

AudioAlert::~AudioAlert() {
    cleanup();
}

bool AudioAlert::initialize() {
#ifdef HAS_SDL2
    if (SDL_Init(SDL_INIT_AUDIO) < 0) {
        spdlog::error("Failed to initialize SDL audio: {}", SDL_GetError());
        return false;
    }

    audio_spec_.freq = 44100;
    audio_spec_.format = AUDIO_S16SYS;
    audio_spec_.channels = 1;
    audio_spec_.samples = 4096;
    audio_spec_.callback = nullptr;

    generate_beep();

    initialized_ = true;
    return true;
#else
    // Fallback: no audio initialization needed
    spdlog::info("Audio alerts disabled (SDL2 not available)");
    initialized_ = true;
    return true;
#endif
}

#ifdef HAS_SDL2
void AudioAlert::generate_beep() {
    int sample_rate = audio_spec_.freq;
    int duration_samples = static_cast<int>(ALERT_DURATION * sample_rate);
    beep_buffer_.resize(duration_samples * sizeof(int16_t));

    int16_t* buffer = reinterpret_cast<int16_t*>(beep_buffer_.data());
    double frequency = ALERT_BEEP_FREQUENCY;
    double amplitude = 3000.0;

    for (int i = 0; i < duration_samples; ++i) {
        double time = static_cast<double>(i) / sample_rate;
        buffer[i] = static_cast<int16_t>(amplitude * sin(2.0 * M_PI * frequency * time));
    }
}
#endif

void AudioAlert::play_alert() {
    if (!initialized_) {
        spdlog::warn("AudioAlert not initialized");
        return;
    }

#ifdef HAS_SDL2
    SDL_AudioDeviceID device_id = SDL_OpenAudioDevice(nullptr, 0, &audio_spec_, nullptr, 0);
    if (device_id == 0) {
        spdlog::error("Failed to open audio device: {}", SDL_GetError());
        return;
    }

    int success = SDL_QueueAudio(device_id, beep_buffer_.data(), static_cast<Uint32>(beep_buffer_.size()));
    if (success < 0) {
        spdlog::error("Failed to queue audio: {}", SDL_GetError());
        SDL_CloseAudioDevice(device_id);
        return;
    }

    SDL_PauseAudioDevice(device_id, 0);

    // Wait for audio to finish playing
    SDL_Delay(static_cast<Uint32>(ALERT_DURATION * 1000));

    SDL_CloseAudioDevice(device_id);
#else
    // Fallback: simple console beep
    console_beep();
#endif
}

#ifndef HAS_SDL2
void AudioAlert::console_beep() {
    // Simple console beep using system beep
    spdlog::info("🚨 BLIND SPOT ALERT! (Audio disabled - SDL2 not available)");
    // On Windows, we could use Beep() function, but for simplicity just log
}
#endif

void AudioAlert::cleanup() {
    if (initialized_) {
#ifdef HAS_SDL2
        SDL_QuitSubSystem(SDL_INIT_AUDIO);
        SDL_Quit();
#endif
        initialized_ = false;
    }
}

} // namespace safedetect

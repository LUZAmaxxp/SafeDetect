#pragma once

#ifdef HAS_SDL2
#include <SDL2/SDL.h>
#include <SDL2/SDL_audio.h>
#endif

#include <vector>
#include <memory>
#include <spdlog/spdlog.h>

namespace safedetect {

class AudioAlert {
public:
    AudioAlert();
    ~AudioAlert();

    bool initialize();
    void play_alert();
    void cleanup();

private:
    bool initialized_;

#ifdef HAS_SDL2
    SDL_AudioSpec audio_spec_;
    std::vector<Uint8> beep_buffer_;
    void generate_beep();
#else
    // Fallback: simple console beep or no audio
    void console_beep();
#endif
};

} // namespace safedetect

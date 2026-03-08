// ==========================================
// Calibration & spatial constants
// ==========================================
(function () {
    const PianoLED = window.PianoLED || {};

    PianoLED.config = {
        LEDS_PER_METER: 144,
        LOWEST_MIDI_NOTE: 36,   // C2
        TOTAL_KEYS_COVERED: 72, // 1-meter strip covers ~72 keys
        OCTAVE_WIDTH_MM: 165.0, // Standard piano octave width
        STRIP_OFFSET_MM: 0.0,   // Adjust if your tape is slightly off-center
        keyFractions: [
            0.043, 0.129, 0.214, 0.300, 0.386,
            0.469, 0.551, 0.633, 0.714, 0.796, 0.878, 0.959
        ]
    };

    PianoLED.config.LED_PITCH_MM = 1000 / PianoLED.config.LEDS_PER_METER;
    window.PianoLED = PianoLED;
})();

// ==========================================
// Zero-drift spatial mapping (MIDI note → LED indices)
// ==========================================
(function () {
    const PianoLED = window.PianoLED || {};
    PianoLED.noteMap = {};

    function getKeyCenterMm(keyIndex) {
        const { OCTAVE_WIDTH_MM, STRIP_OFFSET_MM, keyFractions } = PianoLED.config;
        const octave = Math.floor(keyIndex / 12);
        const note = ((keyIndex % 12) + 12) % 12;
        return (octave * OCTAVE_WIDTH_MM) + (keyFractions[note] * OCTAVE_WIDTH_MM) + STRIP_OFFSET_MM;
    }

    function generateLedMapping() {
        const { LED_PITCH_MM, LOWEST_MIDI_NOTE, TOTAL_KEYS_COVERED } = PianoLED.config;
        PianoLED.noteMap = {};

        for (let keyIndex = 0; keyIndex < TOTAL_KEYS_COVERED; keyIndex++) {
            const midiNote = LOWEST_MIDI_NOTE + keyIndex;
            const validLeds = [];
            const centerMm = getKeyCenterMm(keyIndex);
            const leftBoundaryMm = (getKeyCenterMm(keyIndex - 1) + centerMm) / 2;
            const rightBoundaryMm = (getKeyCenterMm(keyIndex + 1) + centerMm) / 2;

            for (let i = 0; i < 144; i++) {
                const ledCenter = (i * LED_PITCH_MM) + (LED_PITCH_MM / 2);
                const ledLeftEdge = ledCenter - (LED_PITCH_MM / 2);
                const ledRightEdge = ledCenter + (LED_PITCH_MM / 2);
                const overlapLeft = Math.max(ledLeftEdge, leftBoundaryMm);
                const overlapRight = Math.min(ledRightEdge, rightBoundaryMm);
                const overlapMm = overlapRight - overlapLeft;
                if (overlapMm > (LED_PITCH_MM * 0.75)) {
                    validLeds.push(i);
                }
            }
            PianoLED.noteMap[midiNote] = validLeds;
        }
        console.log("Spatial Mapping Initialized:", PianoLED.noteMap);
    }

    PianoLED.generateLedMapping = generateLedMapping;
    window.PianoLED = PianoLED;
})();

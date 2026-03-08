// ==========================================
// Highlight Structure mode: apply a set of semitones to LED state
// ==========================================
(function () {
    const PianoLED = window.PianoLED || {};

    // Default C4 (60) to C6 (84). Read from PianoLED.highlightRange.
    PianoLED.highlightRange = { low: 60, high: 84 };

    /** Set LED state from a structure (set of semitones 0–11). Lights keys in highlightRange that match. */
    function applyStructureToLedState(semitoneSet) {
        if (!semitoneSet || !PianoLED.noteMap) return;
        const set = semitoneSet instanceof Set ? semitoneSet : new Set(semitoneSet);
        const range = PianoLED.highlightRange || { low: 60, high: 84 };
        const low = range.low;
        const high = range.high;
        for (const midiNote in PianoLED.noteMap) {
            const n = parseInt(midiNote, 10);
            const inRange = n >= low && n <= high;
            const leds = PianoLED.noteMap[n];
            const on = inRange && set.has(((n % 12) + 12) % 12) ? 1 : 0;
            for (let i = 0; i < leds.length; i++) {
                PianoLED.ledState[leds[i]] = on;
            }
        }
        PianoLED.needsUpdate = true;
    }

    /** Clear all LEDs. */
    function clearLedState() {
        for (let i = 0; i < 144; i++) {
            PianoLED.ledState[i] = 0;
        }
        PianoLED.needsUpdate = true;
    }

    PianoLED.applyStructureToLedState = applyStructureToLedState;
    PianoLED.clearLedState = clearLedState;
    window.PianoLED = PianoLED;
})();

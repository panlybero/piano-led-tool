// ==========================================
// Master LED state (144 LEDs: 0 off, 1 on). mode: 'play' | 'highlight' | 'highlightKeys'
// ==========================================
(function () {
    const PianoLED = window.PianoLED || {};
    PianoLED.ledState = new Uint8Array(144);
    PianoLED.needsUpdate = false;
    PianoLED.mode = 'play';
    window.PianoLED = PianoLED;
})();

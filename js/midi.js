// ==========================================
// Web MIDI: piano key presses → LED state
// ==========================================
(function () {
    const PianoLED = window.PianoLED || {};

    function handleMidiMessage(event) {
        const command = event.data[0] >> 4;
        const note = event.data[1];
        const velocity = (event.data.length > 2) ? event.data[2] : 0;
        let state = 0;
        if (command === 9 && velocity > 0) {
            state = 1;
            document.getElementById('midi-log').innerText = `Note ON: ${note}`;
        } else if (command === 8 || (command === 9 && velocity === 0)) {
            state = 0;
            document.getElementById('midi-log').innerText = `Note OFF: ${note}`;
        } else {
            return;
        }

        if (PianoLED.mode === 'highlightKeys') {
            if (command === 9 && velocity > 0 && PianoLED.toggleKeyByMidi) {
                PianoLED.toggleKeyByMidi(note);
            }
            return;
        }
        if (PianoLED.mode !== 'play') return;
        if (PianoLED.noteMap[note]) {
            const leds = PianoLED.noteMap[note];
            for (let i = 0; i < leds.length; i++) {
                PianoLED.ledState[leds[i]] = state;
            }
            PianoLED.needsUpdate = true;
        }
    }

    function onMidiSuccess(midiAccess) {
        document.getElementById('status').innerText = "✅ Arduino & Piano Connected! Play a note!";
        for (const input of midiAccess.inputs.values()) {
            input.onmidimessage = handleMidiMessage;
        }
    }

    function onMidiFailure() {
        document.getElementById('status').innerText = "✅ Arduino connected. (No MIDI keyboard — use Highlight tab or connect a keyboard.)";
    }

    function startMidi() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(onMidiSuccess, onMidiFailure);
        } else {
            document.getElementById('status').innerText = "❌ Web MIDI is not supported in this browser.";
        }
    }

    PianoLED.startMidi = startMidi;
    window.PianoLED = PianoLED;
})();

// ==========================================
// Highlight Keys: clickable piano + MIDI toggle
// ==========================================
(function () {
    const PianoLED = window.PianoLED || {};
    const BLACK = [1, 3, 6, 8, 10]; // note % 12

    function isBlack(midiNote) {
        return BLACK.indexOf(((midiNote % 12) + 12) % 12) >= 0;
    }

    function setKeyLedState(midiNote, on) {
        if (!PianoLED.noteMap || !PianoLED.noteMap[midiNote]) return;
        const leds = PianoLED.noteMap[midiNote];
        const v = on ? 1 : 0;
        for (let i = 0; i < leds.length; i++) {
            PianoLED.ledState[leds[i]] = v;
        }
        PianoLED.needsUpdate = true;
        PianoLED.updateVisualPianos();
    }

    function isKeyLit(midiNote) {
        if (!PianoLED.noteMap || !PianoLED.noteMap[midiNote]) return false;
        const leds = PianoLED.noteMap[midiNote];
        return PianoLED.ledState[leds[0]] === 1;
    }

    function updateVisualPianos() {
        document.querySelectorAll('.piano-key').forEach(function (el) {
            const midiNote = parseInt(el.getAttribute('data-midi'), 10);
            if (isKeyLit(midiNote)) {
                el.classList.add('lit');
            } else {
                el.classList.remove('lit');
            }
        });
    }

    function toggleKey(midiNote) {
        const on = !isKeyLit(midiNote);
        setKeyLedState(midiNote, on);
    }

    function buildPiano(containerId) {
        const wrap = document.getElementById(containerId);
        if (!wrap || !PianoLED.config) return;
        wrap.innerHTML = '';
        const low = PianoLED.config.LOWEST_MIDI_NOTE;
        const count = PianoLED.config.TOTAL_KEYS_COVERED || 72;
        const fragment = document.createDocumentFragment();
        for (let n = low; n < low + count; n++) {
            const key = document.createElement('button');
            key.type = 'button';
            key.className = 'piano-key ' + (isBlack(n) ? 'black' : 'white');
            key.setAttribute('data-midi', n);
            if (isKeyLit(n)) key.classList.add('lit');
            key.addEventListener('click', function () {
                if (PianoLED.mode !== 'highlightKeys' && PianoLED.mode !== 'tutor') return;
                toggleKey(n);
            });
            fragment.appendChild(key);
        }
        wrap.appendChild(fragment);
    }

    function clearKeys() {
        PianoLED.clearLedState();
        PianoLED.updateVisualPianos();
    }

    function toggleKeyByMidi(midiNote) {
        if (!PianoLED.noteMap || !PianoLED.noteMap[midiNote]) return;
        toggleKey(midiNote);
    }

    PianoLED.isKeyLit = isKeyLit;
    PianoLED.updateVisualPianos = updateVisualPianos;
    PianoLED.toggleKeyByMidi = toggleKeyByMidi;
    PianoLED.buildPianoKeys = buildPiano;
    PianoLED.clearKeysPanel = clearKeys;
    window.PianoLED = PianoLED;
})();

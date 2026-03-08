// ==========================================
// Load musical structures from embedded data (js/structures-data.js).
// Format: "Name: deg1 deg2 ..." — degrees are 1-7 with optional b/# (e.g. 1 3 5, 1 2 b3 4 5 b6 b7).
// Each line is expanded to all 12 roots (C major, C# major, ...).
// # for comments. New categories: add a key in STRUCTURES_DATA and add it to fileList.
// ==========================================
(function () {
    const PianoLED = window.PianoLED || {};

    // Scale degree (with optional b/#) → semitone offset from root
    const INTERVAL_OFFSET = {
        '1': 0, 'b2': 1, '2': 2, '#2': 3, 'bb3': 3, 'b3': 3, '3': 4, '#3': 5,
        '4': 5, '#4': 6, 'b5': 6, '5': 7, '#5': 8, 'b6': 8, '6': 9, '#6': 10,
        'bb7': 9, 'b7': 10, '7': 11
    };

    const ROOT_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

    /** Parse one interval token (e.g. "1", "b3", "#4") to semitone offset or null */
    function parseInterval(token) {
        const t = (token || '').trim().toLowerCase();
        if (!t) return null;
        if (INTERVAL_OFFSET[t] !== undefined) return INTERVAL_OFFSET[t];
        return null;
    }

    /** Parse one line: "Name: 1 3 5" → [{ name: "C major", semitones }, ...] for all 12 roots */
    function parseStructureLine(line) {
        const i = line.indexOf(':');
        if (i < 0) return [];
        const patternName = line.slice(0, i).trim();
        const rest = line.slice(i + 1).trim();
        if (!patternName || !rest) return [];
        const offsets = [];
        const tokens = rest.split(/\s+/);
        for (let j = 0; j < tokens.length; j++) {
            const off = parseInterval(tokens[j]);
            if (off === null) return [];
            offsets.push(off);
        }
        if (offsets.length === 0) return [];
        const result = [];
        for (let root = 0; root < 12; root++) {
            const semitones = new Set();
            offsets.forEach(function (off) {
                semitones.add((root + off) % 12);
            });
            const name = ROOT_NAMES[root] + ' ' + patternName;
            result.push({ name: name, semitones: semitones });
        }
        return result;
    }

    /** Parse file text into array of { name, semitones } (one entry per root per line) */
    function parseStructureFile(text) {
        const list = [];
        text.split('\n').forEach(function (line) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.indexOf('#') === 0) return;
            const items = parseStructureLine(trimmed);
            items.forEach(function (item) { list.push(item); });
        });
        return list;
    }

    /**
     * Load structures from embedded STRUCTURES_DATA. Returns Promise<{ byFile, fileList }>.
     */
    function loadStructures() {
        const data = window.STRUCTURES_DATA || { fileList: ['scales', 'chords'], scales: '', chords: '' };
        const fileList = data.fileList || Object.keys(data).filter(function (k) { return k !== 'fileList'; });
        const byFile = {};
        fileList.forEach(function (id) {
            const text = data[id];
            byFile[id] = typeof text === 'string' ? parseStructureFile(text) : [];
        });
        return Promise.resolve({ byFile: byFile, fileList: fileList });
    }

    PianoLED.INTERVAL_OFFSET = INTERVAL_OFFSET;
    PianoLED.ROOT_NAMES = ROOT_NAMES;
    PianoLED.parseInterval = parseInterval;
    PianoLED.parseStructureLine = parseStructureLine;
    PianoLED.parseStructureFile = parseStructureFile;
    PianoLED.loadStructures = loadStructures;
    window.PianoLED = PianoLED;
})();

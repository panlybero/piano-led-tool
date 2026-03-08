// ==========================================
// Musical structures: scales and chords as interval patterns.
// Format: "Name: deg1 deg2 ..." — degrees 1–7, optional b or # (e.g. b3, #4).
// Each line is expanded to all 12 roots (C, C#, D, …). # = comments.
// To add a category, add a key and include it in fileList.
// ==========================================
window.STRUCTURES_DATA = {
    fileList: ['scales', 'chords'],

    scales: `# Scales: name then scale degrees (1 2 3 4 5 6 7, use b for flat)
major scale: 1 2 3 4 5 6 7
natural minor scale: 1 2 b3 4 5 b6 b7
harmonic minor scale: 1 2 b3 4 5 b6 7
melodic minor scale: 1 2 b3 4 5 6 7
pentatonic major: 1 2 3 5 6
pentatonic minor: 1 b3 4 5 b7
blues scale: 1 b3 4 #4 5 b7
dorian: 1 2 b3 4 5 6 b7
phrygian: 1 b2 b3 4 5 b6 b7
lydian: 1 2 3 #4 5 6 7
mixolydian: 1 2 3 4 5 6 b7
locrian: 1 b2 b3 4 b5 b6 b7
half-whole diminished: 1 b2 b3 3 #4 5 6 b7
whole-half diminished: 1 2 b3 4 b5 b6 6 7
`,

    chords: `# Chords: name then chord degrees
major: 1 3 5
minor: 1 b3 5
dominant 7: 1 3 5 b7
major 7: 1 3 5 7
minor 7: 1 b3 5 b7
diminished: 1 b3 b5
augmented: 1 3 #5
sus2: 1 2 5
sus4: 1 4 5
diminished 7: 1 b3 b5 bb7
half-diminished 7: 1 b3 b5 b7
`
};

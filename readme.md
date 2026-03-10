# 🎹 DIY Piano LED Controller

A zero-install, browser-based LED visualization tool for digital pianos. This project connects a MIDI keyboard to a custom addressable LED strip mounted above the piano keys, lighting up keys in real-time as you play.

## 🏗️ Software Architecture Overview

This project uses a split-brain architecture to keep things fast and simple. All the heavy lifting (reading MIDI, spatial mapping, structures, UI) happens in the web browser, while the Arduino simply receives a frame buffer and updates the lights.

### The Data Protocol

Communication uses a **binary frame-buffer protocol** over USB Serial. The browser sends a 22-byte packet at 60 FPS:

- **Byte 0:** Start marker (`255`)
- **Bytes 1–21:** 21 compressed bytes (7 bits each), covering all 144 LEDs. Each bit = one LED on/off.

This full-frame approach eliminates per-note latency and sync bugs and keeps the Arduino logic minimal.

---

## 1. Device Software (Arduino)

The microcontroller (Arduino Nano) runs a lightweight sketch. Its only job is to listen on USB, read the 22-byte packet, decompress the bit-packed LED states, and update the NeoPixel strip.

* **Dependencies:** Requires the `Adafruit_NeoPixel` library.
* **Hardware:** LED data pin `6`, 144 LEDs (1 m strip at 144 LEDs/m).
* **Baud Rate:** `115200`.
* **Safety:** `strip.clear()` on boot to wipe residual state from DTR drop on connect/disconnect.

## 2. Web Interface (Vanilla JS)

The UI is a static web app built with HTML, CSS, and Vanilla JavaScript. No build step, no backend, zero installation.

It uses two native browser APIs:

1. **Web MIDI API** — Listens to the digital piano/MIDI keyboard and detects key presses and releases.
2. **Web Serial API** — Opens a secure connection to the Arduino's USB port to send LED frame buffers.

### ⚠️ Browser Compatibility

Web Serial is required to access local USB hardware. Use a Chromium-based browser:

* ✅ Google Chrome
* ✅ Microsoft Edge
* ✅ Opera
* ❌ Apple Safari / Mozilla Firefox (Web Serial not supported)

## 🚀 How to Run It

1. Connect your Arduino Nano to your computer via USB.
2. (Optional) Connect your digital piano via USB.
3. Open `index.html` in Chrome or Edge.
4. Click **"Connect to LEDs & MIDI"** and select your board from the browser popup.
5. Start playing or use the highlight modes.

## Modes

### Active Playing

Lights up keys in real-time as you play your MIDI keyboard. Play a note → the corresponding LEDs turn on; release → they turn off.

### Highlight Structure

Show scales or chords on the piano LEDs. Search by name, pick a category (Scales / Chords), choose a root and octave range, then click a structure to display it. **Clear LEDs** resets the strip.

Structures are defined in **`js/structures-data.js`** using interval degrees (works with static hosting, e.g. GitHub Pages):

- **Format:** `Name: deg1 deg2 ...` — degrees 1–7, optional `b` or `#` (e.g. `b3`, `#4`).
- **Example:** `major scale: 1 2 3 4 5 6 7`, `dominant 7: 1 3 5 b7`
- **Comments:** Lines starting with `#` are ignored.
- **New categories:** Add a key (e.g. `arpeggios`) and include it in `fileList`.

### Highlight Keys

A clickable virtual piano. Click keys to toggle LEDs on or off, or play keys on your MIDI keyboard to toggle. Useful for custom layouts without predefined structures.

## Project Structure

```
piano-tool/
├── index.html              # Main app
├── css/styles.css
├── js/
│   ├── config.js           # LED/key mapping (LOWEST_MIDI_NOTE, LEDS_PER_METER, etc.)
│   ├── structures-data.js  # Scales and chords definitions
│   ├── state.js            # 144-LED state buffer
│   ├── spatial-mapping.js  # MIDI note → LED indices
│   ├── serial.js           # Web Serial connection
│   ├── midi.js             # Web MIDI input
│   ├── render.js           # 60 FPS frame buffer → Arduino
│   ├── highlight.js        # Structure-based highlighting
│   ├── highlight-keys.js    # Manual key toggle mode
│   ├── structures-loader.js
│   └── main.js             # UI and tab logic
└── arduino-led-control/
    └── arduino-led-control.ino
```

## Calibration

Edit `js/config.js` to match your setup:

- `LOWEST_MIDI_NOTE` — First key covered by the strip (default `36` = C2)
- `TOTAL_KEYS_COVERED` — Number of keys (default `72` for 1 m strip)
- `LEDS_PER_METER` — Strip density (default `144`)
- `STRIP_OFFSET_MM` — Physical alignment offset

## Testing

A `test-piano.py` script is provided for basic serial testing. **Note:** It uses the legacy `note,1\n` / `note,0\n` text protocol. The current Arduino firmware expects the binary frame-buffer protocol, so the web interface is the primary way to drive the LEDs.



# 🎹 DIY Piano LED Controller

A zero-install, browser-based LED visualization tool for digital pianos. This project connects a MIDI keyboard to a custom addressable LED strip mounted above the piano keys, lighting up keys in real-time as you play.

## 🏗️ Software Architecture Overview

This project uses a split-brain architecture to keep things incredibly fast and simple. All the "heavy lifting" (reading MIDI, mapping chords, handling UI) happens in the web browser, while the hardware simply acts as a dumb terminal that turns lights on and off when told to.

### The Data Protocol

Communication between the web browser and the Arduino uses a dead-simple, comma-separated string format sent over USB Serial:
`[MIDI_NOTE],[STATE]\n`

* `60,1\n` = Turn ON Middle C
* `60,0\n` = Turn OFF Middle C

---

## 1. Device Software (Arduino)

The microcontroller (Arduino Nano V3.0) runs a lightweight C++ script. Its only job is to listen to the USB port, parse the simple string commands, and translate them to physical LEDs.

* **Dependencies:** Requires the `Adafruit_NeoPixel` library.
* **Baud Rate:** Operates at a blazing fast `115200` baud to eliminate visual lag.
* **Mapping Setup:** We mapped exactly **2 LEDs per piano key**. The code includes a configurable `lowestMidiNote` variable (currently set to `36` for C2) to align the physical strip perfectly with the piano's layout.
* **Safety Features:** Includes a `strip.clear()` command on boot to wipe any residual LED memory caused by the "DTR Drop" when connecting/disconnecting from the computer.

## 2. Web Interface (Vanilla JS)

The UI is a static web app built purely with HTML, CSS, and Vanilla JavaScript. There is no React, no Webpack, no backend server, and absolutely zero installation required.

It leverages two powerful native browser APIs:

1. **Web MIDI API:** Listens to the digital piano/MIDI keyboard plugged into the computer and detects exactly which keys are pressed and released.
2. **Web Serial API:** Opens a secure, direct connection to the Arduino's USB port to push the light commands.

### ⚠️ Browser Compatibility

Because this relies on the Web Serial API to safely access local USB hardware, the interface **must** be run in a Chromium-based browser:

* ✅ Google Chrome
* ✅ Microsoft Edge
* ✅ Opera
* ❌ Apple Safari / Mozilla Firefox (Web Serial not supported)

## 🚀 How to Run It

1. Connect your Arduino Nano to your computer via USB.
2. Connect your digital piano to your computer via USB.
3. Open `index.html` in Chrome or Edge.
4. Click **"Connect to Arduino"** and select your board from the browser popup.
5. Start playing!

### Highlight Structure mode

Use the **Highlight Structure** tab to show scales or chords on the piano LEDs. Search by name, pick a category (Scales / Chords), and click a structure to display it. **Clear LEDs** resets the strip.

Structures are embedded in **`js/structures-data.js`** in the same editable format (no server required; works with static hosting e.g. GitHub Pages). To add more:

- **New entries:** Open `js/structures-data.js` and append lines to the `scales` or `chords` string. Format: `Name: N1 N2 N3 ...` (e.g. `C major scale: C D E F G A B`). Lines starting with `#` are comments.
- **New categories:** Add a new key (e.g. `arpeggios`) with a string in the same format, and add it to the `fileList` array.


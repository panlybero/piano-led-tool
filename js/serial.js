// ==========================================
// Web Serial: connect to Arduino (USB)
// ==========================================
(function () {
    const PianoLED = window.PianoLED || {};
    PianoLED.port = null;
    PianoLED.writer = null;

    async function connect() {
        try {
            PianoLED.port = await navigator.serial.requestPort();
            await PianoLED.port.open({ baudRate: 115200 });
            PianoLED.writer = PianoLED.port.writable.getWriter();
            return true;
        } catch (err) {
            console.error("Serial connection failed:", err);
            return false;
        }
    }

    PianoLED.connect = connect;
    window.PianoLED = PianoLED;
})();

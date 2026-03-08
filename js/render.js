// ==========================================
// 60 FPS render loop: compress state → 22-byte packet → Arduino
// ==========================================
(function () {
    const PianoLED = window.PianoLED || {};

    async function renderLoop() {
        if (PianoLED.writer && PianoLED.needsUpdate) {
            PianoLED.needsUpdate = false;
            const packet = new Uint8Array(22);
            packet[0] = 255;

            for (let i = 0; i < 144; i++) {
                if (PianoLED.ledState[i] === 1) {
                    const byteIndex = 1 + Math.floor(i / 7);
                    const bitIndex = i % 7;
                    packet[byteIndex] |= (1 << bitIndex);
                }
            }
            await PianoLED.writer.write(packet);
        }
        requestAnimationFrame(renderLoop);
    }

    PianoLED.renderLoop = renderLoop;
    window.PianoLED = PianoLED;
})();

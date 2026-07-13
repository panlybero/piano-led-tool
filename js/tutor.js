// ==========================================
// AI Tutor Panel Logic & Gemini API integration
// ==========================================
(function () {
    const PianoLED = window.PianoLED || {};
    
    let conversationHistory = [];
    const STORAGE_KEY = "piano_tutor_gemini_api_key";
    
    // 1. Parser: Translate standard music notation (e.g., C4, Eb3) to MIDI numbers
    function parseNoteToMidi(noteStr) {
        if (typeof noteStr !== 'string') return null;
        
        // Matches e.g., C4, Eb3, F#5, G# (optional octave, defaults to 4)
        const match = noteStr.trim().match(/^([A-Ga-g])(#|b|x|##|bb)?(-?\d+)?$/);
        if (!match) return null;
        
        const name = match[1].toUpperCase();
        const accidental = match[2] || '';
        const octaveStr = match[3];
        const octave = octaveStr !== undefined ? parseInt(octaveStr, 10) : 4;
        
        let offset = 0;
        switch (name) {
            case 'C': offset = 0; break;
            case 'D': offset = 2; break;
            case 'E': offset = 4; break;
            case 'F': offset = 5; break;
            case 'G': offset = 7; break;
            case 'A': offset = 9; break;
            case 'B': offset = 11; break;
        }
        
        if (accidental === '#' || accidental === 'x') {
            offset += 1;
        } else if (accidental === 'b') {
            offset -= 1;
        } else if (accidental === '##') {
            offset += 2;
        } else if (accidental === 'bb') {
            offset -= 2;
        }
        
        return (octave + 1) * 12 + offset;
    }

    // Helper: format standard notes from MIDI (for status logging)
    const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    function midiToNoteName(midi) {
        const octave = Math.floor(midi / 12) - 1;
        const noteIndex = midi % 12;
        return `${NOTE_NAMES[noteIndex]}${octave}`;
    }

    // 2. Tool Execution: set piano state based on keys highlighted
    function executeTool(name, args) {
        if (name === "highlight_keys") {
            const keys = args.keys;
            if (!Array.isArray(keys)) {
                throw new Error("Invalid arguments: 'keys' must be an array of strings.");
            }
            
            // Clear current state first
            PianoLED.clearLedState();
            
            const successfullyHighlighted = [];
            const low = PianoLED.config.LOWEST_MIDI_NOTE || 36;
            const count = PianoLED.config.TOTAL_KEYS_COVERED || 72;
            const high = low + count - 1;
            
            keys.forEach(k => {
                const midi = parseNoteToMidi(k);
                if (midi !== null) {
                    if (midi >= low && midi <= high) {
                        if (PianoLED.noteMap[midi]) {
                            const leds = PianoLED.noteMap[midi];
                            for (let i = 0; i < leds.length; i++) {
                                PianoLED.ledState[leds[i]] = 1;
                            }
                            successfullyHighlighted.push(k);
                        }
                    } else {
                        console.warn(`Note ${k} (MIDI ${midi}) is outside physical keyboard range (${low} to ${high}).`);
                    }
                } else {
                    console.warn(`Could not parse note: ${k}`);
                }
            });
            
            PianoLED.needsUpdate = true;
            PianoLED.updateVisualPianos();
            
            if (successfullyHighlighted.length > 0) {
                return `Successfully highlighted: ${successfullyHighlighted.join(', ')}`;
            } else {
                return `No keys could be highlighted (out of range or invalid notation). Keyboard range is C2 to B7.`;
            }
        }
        
        if (name === "get_piano_state") {
            const litKeys = [];
            const low = PianoLED.config.LOWEST_MIDI_NOTE || 36;
            const count = PianoLED.config.TOTAL_KEYS_COVERED || 72;
            const high = low + count - 1;
            
            for (let midi = low; midi <= high; midi++) {
                if (PianoLED.isKeyLit && PianoLED.isKeyLit(midi)) {
                    litKeys.push(midiToNoteName(midi));
                }
            }
            
            return {
                highlighted_keys: litKeys,
                summary: litKeys.length > 0 ? `Currently highlighted keys: ${litKeys.join(', ')}` : "No keys are currently highlighted."
            };
        }
        
        throw new Error(`Unknown function: ${name}`);
    }

    // 3. API Communication helper
    async function callGeminiAPI(messages, apiKey) {
        const model = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const requestData = {
            contents: messages,
            tools: [{
                functionDeclarations: [{
                    name: "highlight_keys",
                    description: "Highlight a set of keys on the piano keyboard to show chords, scales, patterns, or notes. Overwrites the current piano state. Use octave numbers, e.g. C4 for middle C.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            keys: {
                                type: "ARRAY",
                                description: "List of keys to highlight (e.g., ['C4', 'E4', 'G4']). Keyboard range is C2 to B7.",
                                items: {
                                    type: "STRING"
                                }
                            }
                        },
                        required: ["keys"]
                    }
                }, {
                    name: "get_piano_state",
                    description: "Read the current state of the piano keyboard to find which keys are currently highlighted.",
                    parameters: {
                        type: "OBJECT",
                        properties: {}
                    }
                }]
            }],
            systemInstruction: {
                parts: [{
                    text: "You are a helpful and knowledgeable AI Piano Tutor. You help users learn piano concepts, scales, chords, and music theory. You can read the current state of highlighted keys using the `get_piano_state` tool, and you can highlight keys using the `highlight_keys` tool. Always explain what you are highlighting. Use standard note names with octaves (e.g., C4 for middle C, E4, G4). The piano covers keys from C2 (midi 36) to B7 (midi 107)."
                }]
            }
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    }

    // 4. Formatting markdown in chat bubbles
    function formatMarkdown(text) {
        if (!text) return "";
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
        html = html.replace(/`(.*?)`/g, "<code>$1</code>");
        html = html.replace(/^\s*[-*]\s+(.*)$/gm, "<li>$1</li>");
        html = html.replace(/\n/g, "<br>");
        
        return html;
    }

    // 5. DOM and UI controller
    let messagesContainer = null;
    let userInputField = null;
    let sendBtn = null;
    let resetBtn = null;
    let apiKeyInput = null;
    let saveKeyBtn = null;
    let toggleSettingsBtn = null;
    let settingsBox = null;
    let settingsStatus = null;
    
    function getApiKey() {
        return localStorage.getItem(STORAGE_KEY) || "";
    }
    
    function saveApiKey(key) {
        localStorage.setItem(STORAGE_KEY, key.trim());
    }

    function appendChatMessage(sender, text, type = "tutor-msg") {
        if (!messagesContainer) return;
        
        // Remove typing indicator if present
        const indicator = messagesContainer.querySelector(".typing-indicator-msg");
        if (indicator) {
            indicator.remove();
        }
        
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${type}`;
        
        if (type === "system-msg" || type === "error-msg") {
            messageDiv.textContent = text;
        } else {
            messageDiv.innerHTML = formatMarkdown(text);
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTypingIndicator() {
        if (!messagesContainer) return;
        
        // Check if indicator already exists
        if (messagesContainer.querySelector(".typing-indicator-msg")) return;
        
        const indicatorDiv = document.createElement("div");
        indicatorDiv.className = "message tutor-msg typing-indicator-msg";
        indicatorDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesContainer.appendChild(indicatorDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        if (!messagesContainer) return;
        const indicator = messagesContainer.querySelector(".typing-indicator-msg");
        if (indicator) {
            indicator.remove();
        }
    }

    async function handleSendMessage() {
        const text = userInputField.value.trim();
        if (!text) return;
        
        const apiKey = getApiKey();
        if (!apiKey) {
            appendChatMessage("System", "🔑 Click 'API Settings' to enter your Gemini API Key before starting.", "error-msg");
            return;
        }
        
        // Display user message
        appendChatMessage("User", text, "user-msg");
        userInputField.value = "";
        userInputField.style.height = "auto";
        
        // Append to history
        conversationHistory.push({
            role: "user",
            parts: [{ text: text }]
        });
        
        showTypingIndicator();
        
        try {
            let response = await callGeminiAPI(conversationHistory, apiKey);
            let responseHandled = false;
            
            // Loop in case of multiple tool execution turns
            while (!responseHandled) {
                if (!response.candidates || response.candidates.length === 0) {
                    throw new Error("No response from Gemini API.");
                }
                
                const candidate = response.candidates[0];
                const modelMessage = candidate.content;
                conversationHistory.push(modelMessage);
                
                // Extract function calls if any
                let functionCall = null;
                if (modelMessage.parts) {
                    for (const part of modelMessage.parts) {
                        if (part.functionCall) {
                            functionCall = part.functionCall;
                            break;
                        }
                    }
                }
                
                if (functionCall) {
                    // Log execution message in chat
                    appendChatMessage("System", `[Tool execution: highlighting keys...]`, "system-msg");
                    
                    const toolResult = executeTool(functionCall.name, functionCall.args);
                    
                    // Add tool response to history
                    const toolMessage = {
                        role: "function",
                        parts: [{
                            functionResponse: {
                                name: functionCall.name,
                                response: { output: toolResult }
                            }
                        }]
                    };
                    conversationHistory.push(toolMessage);
                    
                    // Call Gemini again with the tool output
                    response = await callGeminiAPI(conversationHistory, apiKey);
                } else {
                    // Extract text parts
                    let replyText = "";
                    if (modelMessage.parts) {
                        for (const part of modelMessage.parts) {
                            if (part.text) {
                                replyText += part.text;
                            }
                        }
                    }
                    
                    removeTypingIndicator();
                    appendChatMessage("AI Tutor", replyText, "tutor-msg");
                    responseHandled = true;
                }
            }
        } catch (error) {
            removeTypingIndicator();
            appendChatMessage("Error", `Connection Error: ${error.message}`, "error-msg");
            console.error(error);
        }
    }

    function initTutorPanel() {
        messagesContainer = document.getElementById("tutor-chat-messages");
        userInputField = document.getElementById("tutor-user-input");
        sendBtn = document.getElementById("tutor-send-btn");
        resetBtn = document.getElementById("tutor-reset-btn");
        apiKeyInput = document.getElementById("tutor-api-key");
        saveKeyBtn = document.getElementById("tutor-save-key-btn");
        toggleSettingsBtn = document.getElementById("tutor-toggle-settings");
        settingsBox = document.getElementById("tutor-settings-box");
        settingsStatus = document.getElementById("tutor-settings-status");
        
        if (!messagesContainer) return; // not loaded yet
        
        // Toggle settings
        toggleSettingsBtn.addEventListener("click", () => {
            settingsBox.classList.toggle("hidden");
        });
        
        // Load existing API Key
        const savedKey = getApiKey();
        if (savedKey) {
            apiKeyInput.value = savedKey;
            settingsStatus.textContent = "API Key saved. Ready to chat!";
            settingsStatus.style.color = "#4caf50";
        } else {
            settingsBox.classList.remove("hidden");
            settingsStatus.textContent = "No API Key configured.";
            settingsStatus.style.color = "#e57373";
        }
        
        // Save API Key
        saveKeyBtn.addEventListener("click", () => {
            const key = apiKeyInput.value.trim();
            if (key) {
                saveApiKey(key);
                settingsStatus.textContent = "API Key saved successfully!";
                settingsStatus.style.color = "#4caf50";
                setTimeout(() => { settingsBox.classList.add("hidden"); }, 1000);
            } else {
                localStorage.removeItem(STORAGE_KEY);
                settingsStatus.textContent = "API Key removed.";
                settingsStatus.style.color = "#e57373";
            }
        });
        
        // Auto-resize input textarea and handle keys
        userInputField.addEventListener("input", function () {
            this.style.height = "auto";
            this.style.height = (this.scrollHeight - 4) + "px";
        });
        
        userInputField.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        
        // Send button
        sendBtn.addEventListener("click", handleSendMessage);
        
        // Reset button
        resetBtn.addEventListener("click", () => {
            // 1. Reset conversation history
            conversationHistory = [];
            
            // 2. Clear messages list in UI and restore greeting
            messagesContainer.innerHTML = `
                <div class="message tutor-msg system-msg">
                    👋 Welcome! I am your AI Piano Tutor. Ask me to show you any scale, chord, or key pattern on the piano keyboard!
                </div>
            `;
            
            // 3. Clear piano highlighted states
            PianoLED.clearLedState();
            PianoLED.updateVisualPianos();
            
            appendChatMessage("System", "Chat history and piano highlighted keys have been reset.", "system-msg");
        });
    }

    PianoLED.initTutorPanel = initTutorPanel;
    window.PianoLED = PianoLED;
})();

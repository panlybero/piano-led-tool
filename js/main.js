// ==========================================
// App bootstrap: init mapping, bind UI, start loops
// ==========================================
(function () {
    const PianoLED = window.PianoLED;

    let structuresData = null; // { byFile, fileList } after load
    let selectedStructureSemitones = null; // re-apply when range changes

    var RANGE_NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    var RANGE_OCTAVES = [2, 3, 4, 5, 6, 7];

    function setTab(tabId) {
        if (tabId === 'highlight') PianoLED.mode = 'highlight';
        else if (tabId === 'keys') PianoLED.mode = 'highlightKeys';
        else PianoLED.mode = 'play';
        document.querySelectorAll('.tab').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.panel').forEach(function (panel) {
            panel.classList.toggle('active', panel.id === 'panel-' + tabId);
        });
        if (tabId === 'highlight') {
            if (!structuresData) loadStructuresAndPopulate();
            else populateStructureList();
            if (!document.getElementById('highlight-range-note').options.length) populateRangeDropdowns();
        }
        if (tabId === 'keys' && !document.querySelector('.piano-key')) PianoLED.buildPianoKeys('piano-keys-wrap');
    }

    function populateRangeDropdowns() {
        var noteSel = document.getElementById('highlight-range-note');
        var startSel = document.getElementById('highlight-range-octave-start');
        var endSel = document.getElementById('highlight-range-octave-end');
        if (!noteSel || noteSel.options.length) return;
        noteSel.innerHTML = '';
        RANGE_NOTE_NAMES.forEach(function (name, i) {
            var opt = document.createElement('option');
            opt.value = i;
            opt.textContent = name;
            if (i === 0) opt.selected = true;
            noteSel.appendChild(opt);
        });
        startSel.innerHTML = '';
        endSel.innerHTML = '';
        RANGE_OCTAVES.forEach(function (oct) {
            var o1 = document.createElement('option');
            o1.value = oct;
            o1.textContent = oct;
            if (oct === 4) o1.selected = true;
            startSel.appendChild(o1);
            var o2 = document.createElement('option');
            o2.value = oct;
            o2.textContent = oct;
            if (oct === 6) o2.selected = true;
            endSel.appendChild(o2);
        });
    }

    function getHighlightRange() {
        var noteSemitone = parseInt(document.getElementById('highlight-range-note').value, 10);
        var startOct = parseInt(document.getElementById('highlight-range-octave-start').value, 10);
        var endOct = parseInt(document.getElementById('highlight-range-octave-end').value, 10);
        var low = 12 * (startOct + 1) + noteSemitone;
        var high = 12 * (endOct + 1) + noteSemitone;
        if (low > high) { var t = low; low = high; high = t; }
        return { low: low, high: high };
    }

    function applyRangeAndRefresh() {
        var r = getHighlightRange();
        PianoLED.highlightRange = r;
        if (selectedStructureSemitones) {
            PianoLED.applyStructureToLedState(selectedStructureSemitones);
        }
    }

    function loadStructuresAndPopulate() {
        const listEl = document.getElementById('structure-list');
        listEl.innerHTML = '<span class="loading">Loading structures…</span>';
        PianoLED.loadStructures().then(function (data) {
            structuresData = data;
            populateFileDropdown();
            if (!document.getElementById('highlight-range-note').options.length) populateRangeDropdowns();
            populateStructureList();
        }).catch(function (e) {
            listEl.innerHTML = '<span class="error">Could not load structures. Check the console for errors.</span>';
            console.error(e);
        });
    }

    function populateFileDropdown() {
        if (!structuresData) return;
        const sel = document.getElementById('structure-file');
        sel.innerHTML = '';
        structuresData.fileList.forEach(function (id) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = id.charAt(0).toUpperCase() + id.slice(1);
            sel.appendChild(opt);
        });
        sel.dispatchEvent(new Event('change'));
    }

    function populateStructureList() {
        if (!structuresData) return;
        const fileId = document.getElementById('structure-file').value;
        const query = (document.getElementById('structure-search').value || '').trim().toLowerCase();
        const list = (structuresData.byFile[fileId] || []).filter(function (s) {
            return !query || s.name.toLowerCase().indexOf(query) >= 0;
        });
        const listEl = document.getElementById('structure-list');
        listEl.innerHTML = '';
        list.forEach(function (s) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'structure-item';
            btn.textContent = s.name;
            btn.addEventListener('click', function () {
                PianoLED.mode = 'highlight';
                selectedStructureSemitones = s.semitones;
                PianoLED.applyStructureToLedState(s.semitones);
                document.querySelectorAll('.structure-item').forEach(function (b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
            });
            listEl.appendChild(btn);
        });
    }

    function init() {
        PianoLED.generateLedMapping();
        PianoLED.renderLoop();

        document.getElementById('connect-btn').addEventListener('click', async function () {
            const ok = await PianoLED.connect();
            if (ok) {
                document.getElementById('status').innerText = "✅ Arduino connected.";
                PianoLED.startMidi();
            } else {
                document.getElementById('status').innerText = "❌ Connection Failed. Check console.";
            }
        });

        document.querySelectorAll('.tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setTab(btn.getAttribute('data-tab'));
            });
        });

        document.getElementById('structure-file').addEventListener('change', populateStructureList);
        document.getElementById('structure-search').addEventListener('input', populateStructureList);

        document.getElementById('highlight-clear').addEventListener('click', function () {
            PianoLED.clearLedState();
            selectedStructureSemitones = null;
            document.querySelectorAll('.structure-item').forEach(function (b) { b.classList.remove('selected'); });
        });

        populateRangeDropdowns();
        document.getElementById('highlight-range-note').addEventListener('change', applyRangeAndRefresh);
        document.getElementById('highlight-range-octave-start').addEventListener('change', applyRangeAndRefresh);
        document.getElementById('highlight-range-octave-end').addEventListener('change', applyRangeAndRefresh);

        document.getElementById('keys-clear').addEventListener('click', function () {
            PianoLED.clearKeysPanel();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

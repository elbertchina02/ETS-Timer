// Timer state
let timerInterval = null;
let bellInterval = null;
let audioContext = null;
let greenCardReached = false;
let yellowCardReached = false;
let redCardReached = false;
let bellRingReached = false;
let lastStartTime = null;

// Sync state
let sharedState = null;
let serverTimeOffset = 0;
let ws = null;

// DOM elements
const templatePanel = document.getElementById('templatePanel');
const setupPanel = document.getElementById('setupPanel');
const timerPanel = document.getElementById('timerPanel');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const backBtn = document.getElementById('backBtn');
const timeDisplay = document.getElementById('timeDisplay');
const statusIndicator = document.getElementById('statusIndicator');

// Template buttons
const preparedSpeechBtn = document.getElementById('preparedSpeechBtn');
const tableTopicBtn = document.getElementById('tableTopicBtn');
const evaluationBtn = document.getElementById('evaluationBtn');
const keynoteBtn = document.getElementById('keynoteBtn');
const customizeBtn = document.getElementById('customizeBtn');

// Template presets (all times in seconds)
const templates = {
    preparedSpeech: {
        green: 5 * 60,      // 5 minutes
        yellow: 6 * 60,     // 6 minutes
        red: 7 * 60,        // 7 minutes
        bell: 7 * 60 + 30   // 7 minutes 30 seconds
    },
    tableTopic: {
        green: 1 * 60,      // 1 minute
        yellow: 1 * 60 + 30, // 1 minute 30 seconds
        red: 2 * 60,        // 2 minutes
        bell: 2 * 60 + 30   // 2 minutes 30 seconds
    },
    evaluation: {
        green: 2 * 60,      // 2 minutes
        yellow: 2 * 60 + 30, // 2 minutes 30 seconds
        red: 3 * 60,        // 3 minutes
        bell: 3 * 60 + 30   // 3 minutes 30 seconds
    },
    keynote: {
        green: 10 * 60,     // 10 minutes
        yellow: 15 * 60,    // 15 minutes
        red: 20 * 60,       // 20 minutes
        bell: 0             // No bell ring for keynote
    }
};

// Initialize Audio Context
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Ensure audio is ready on iOS (resume if suspended)
function ensureAudioContext() {
    initAudioContext();
    if (audioContext.state === 'suspended') {
        return audioContext.resume();
    }
    return Promise.resolve();
}

// Show template selection panel
function showTemplatePanel() {
    templatePanel.style.display = 'flex';
    setupPanel.style.display = 'none';
    timerPanel.style.display = 'none';
}

// Show customize panel
function showCustomizePanel() {
    templatePanel.style.display = 'none';
    setupPanel.style.display = 'flex';
    timerPanel.style.display = 'none';
}

function showTimerPanel() {
    templatePanel.style.display = 'none';
    setupPanel.style.display = 'none';
    timerPanel.style.display = 'block';
}

function setBodyForIdle() {
    document.body.className = '';
}

function setBodyForTimer() {
    document.body.classList.add('timer-active');
}

function resetCardFlags() {
    greenCardReached = false;
    yellowCardReached = false;
    redCardReached = false;
    bellRingReached = false;
    if (bellInterval) {
        clearInterval(bellInterval);
        bellInterval = null;
    }
}

function applyState(state) {
    sharedState = state;

    if (state.screen === 'template') {
        setBodyForIdle();
        showTemplatePanel();
        statusIndicator.textContent = 'Ready...';
        resetCardFlags();
        lastStartTime = null;
        return;
    }

    if (state.screen === 'custom') {
        setBodyForIdle();
        showCustomizePanel();
        statusIndicator.textContent = 'Ready...';
        resetCardFlags();
        lastStartTime = null;
        return;
    }

    // running or stopped
    showTimerPanel();
    setBodyForTimer();

    if (state.screen === 'stopped') {
        statusIndicator.textContent = '⏸️ Stopped';
        if (bellInterval) {
            clearInterval(bellInterval);
            bellInterval = null;
        }
    }

    if (state.screen === 'running' && state.startTime !== lastStartTime) {
        lastStartTime = state.startTime;
        resetCardFlags();
        statusIndicator.textContent = "I'm ETS Timer";
    }
}

function getElapsedSeconds() {
    if (!sharedState) {
        return 0;
    }
    if (sharedState.screen === 'running' && sharedState.startTime) {
        const now = Date.now() + serverTimeOffset;
        return Math.max(0, Math.floor((now - sharedState.startTime) / 1000));
    }
    if (sharedState.screen === 'stopped') {
        return Math.max(0, sharedState.elapsedAtStop || 0);
    }
    return 0;
}

function startTicker() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(updateTimer, 100);
}

// Play doorbell sound using Web Audio API - "ding-dong" effect
function playDoorbell() {
    ensureAudioContext().then(() => {
        const now = audioContext.currentTime;
        
        // "Ding" - higher pitch (E note)
        const dingFreq = 659.25; // E5
        const dingOsc = audioContext.createOscillator();
        const dingGain = audioContext.createGain();
        
        dingOsc.connect(dingGain);
        dingGain.connect(audioContext.destination);
        
        dingOsc.type = 'sine';
        dingOsc.frequency.setValueAtTime(dingFreq, now);
        
        dingGain.gain.setValueAtTime(0.5, now);
        dingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        dingOsc.start(now);
        dingOsc.stop(now + 0.3);
        
        // "Dong" - lower pitch (C note), slightly delayed
        const dongFreq = 523.25; // C5
        const dongOsc = audioContext.createOscillator();
        const dongGain = audioContext.createGain();
        
        dongOsc.connect(dongGain);
        dongGain.connect(audioContext.destination);
        
        dongOsc.type = 'sine';
        dongOsc.frequency.setValueAtTime(dongFreq, now + 0.15);
        
        dongGain.gain.setValueAtTime(0.5, now + 0.15);
        dongGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        dongOsc.start(now + 0.15);
        dongOsc.stop(now + 0.5);
    });
}

// Play doorbell twice (two ding-dongs)
function playDoorbellTwice() {
    playDoorbell();
    setTimeout(() => {
        playDoorbell();
    }, 600);
}

// Format time display
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update timer display
function updateTimer() {
    if (!sharedState) {
        return;
    }

    const elapsedSeconds = getElapsedSeconds();
    const { green = 0, yellow = 0, red = 0, bell = 0 } = sharedState.settings || {};

    timeDisplay.textContent = formatTime(elapsedSeconds);

    // Check for Green Card (only if time was set)
    if (green > 0 && !greenCardReached && elapsedSeconds >= green) {
        greenCardReached = true;
        document.body.classList.remove('yellow-card', 'red-card');
        document.body.classList.add('timer-active', 'green-card');
        statusIndicator.textContent = '🟢 Green Card';
    }
    
    // Check for Yellow Card (only if time was set)
    if (yellow > 0 && !yellowCardReached && elapsedSeconds >= yellow) {
        yellowCardReached = true;
        document.body.classList.remove('green-card', 'red-card');
        document.body.classList.add('timer-active', 'yellow-card');
        statusIndicator.textContent = '🟡 Yellow Card';
    }
    
    // Check for Red Card (only if time was set)
    if (red > 0 && !redCardReached && elapsedSeconds >= red) {
        redCardReached = true;
        document.body.classList.remove('green-card', 'yellow-card');
        document.body.classList.add('timer-active', 'red-card');
        statusIndicator.textContent = '🔴 Red Card';
    }
    
    if (sharedState.screen !== 'running') {
        if (bellInterval) {
            clearInterval(bellInterval);
            bellInterval = null;
        }
        return;
    }

    // Check for Bell Ring (only if time was set)
    if (bell > 0 && !bellRingReached && elapsedSeconds >= bell) {
        bellRingReached = true;
        statusIndicator.textContent = '🔔 Bell Ringing!';
        playDoorbellTwice();
        
        bellInterval = setInterval(() => {
            playDoorbell();
        }, 5000);
    }
}

// Start timer (custom)
function startTimer() {
    const greenMin = parseInt(document.getElementById('greenMin').value) || 0;
    const greenSec = parseInt(document.getElementById('greenSec').value) || 0;
    const yellowMin = parseInt(document.getElementById('yellowMin').value) || 0;
    const yellowSec = parseInt(document.getElementById('yellowSec').value) || 0;
    const redMin = parseInt(document.getElementById('redMin').value) || 0;
    const redSec = parseInt(document.getElementById('redSec').value) || 0;
    const bellMin = parseInt(document.getElementById('bellMin').value) || 0;
    const bellSec = parseInt(document.getElementById('bellSec').value) || 0;

    const settings = {
        green: greenMin * 60 + greenSec,
        yellow: yellowMin * 60 + yellowSec,
        red: redMin * 60 + redSec,
        bell: bellMin * 60 + bellSec
    };

    if (settings.green === 0 && settings.yellow === 0 && settings.red === 0 && settings.bell === 0) {
        alert('Please fill in at least one time field!');
        return;
    }
    if (settings.green < 0 || settings.yellow < 0 || settings.red < 0 || settings.bell < 0) {
        alert('Time cannot be negative!');
        return;
    }

    ensureAudioContext();
    sendAction({ type: 'start', settings });
}

function stopTimer() {
    sendAction({ type: 'stop' });
}

function resetTimer() {
    sendAction({ type: 'reset' });
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);
backBtn.addEventListener('click', () => sendAction({ type: 'set_screen', screen: 'template' }));

preparedSpeechBtn.addEventListener('click', () => {
    ensureAudioContext();
    sendAction({ type: 'start', settings: templates.preparedSpeech });
});

tableTopicBtn.addEventListener('click', () => {
    ensureAudioContext();
    sendAction({ type: 'start', settings: templates.tableTopic });
});

evaluationBtn.addEventListener('click', () => {
    ensureAudioContext();
    sendAction({ type: 'start', settings: templates.evaluation });
});

keynoteBtn.addEventListener('click', () => {
    ensureAudioContext();
    sendAction({ type: 'start', settings: templates.keynote });
});

customizeBtn.addEventListener('click', () => sendAction({ type: 'set_screen', screen: 'custom' }));

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startTimer();
        }
    });
});

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${protocol}://${window.location.host}`);

    ws.addEventListener('message', (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'state') {
                serverTimeOffset = payload.serverTime - Date.now();
                applyState(payload.state);
            }
        } catch (error) {
            console.error('Failed to parse server message', error);
        }
    });

    ws.addEventListener('close', () => {
        setTimeout(connectWebSocket, 1000);
    });
}

function sendAction(action) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(action));
    }
}

showTemplatePanel();
connectWebSocket();
startTicker();

fetch('/version.json')
    .then(res => res.json())
    .then(data => {
        const versionEl = document.getElementById('version');
        if (versionEl) {
            versionEl.textContent = `${data.commit || 'unknown'} (${data.date || 'N/A'})`;
        }
    })
    .catch(() => {
        const versionEl = document.getElementById('version');
        if (versionEl) {
            versionEl.textContent = 'dev';
        }
    });

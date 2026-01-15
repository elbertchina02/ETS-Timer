// Timer state
let timerInterval = null;
let bellInterval = null;
let startTime = null;
let greenTime = 0;
let yellowTime = 0;
let redTime = 0;
let bellTime = 0;
let audioContext = null;
let greenCardReached = false;
let yellowCardReached = false;
let redCardReached = false;
let bellRingReached = false;

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

// Start timer with preset values
function startTimerWithPreset(preset) {
    greenTime = preset.green;
    yellowTime = preset.yellow;
    redTime = preset.red;
    bellTime = preset.bell;
    
    // Initialize audio context on user interaction
    ensureAudioContext();
    
    // Reset state
    greenCardReached = false;
    yellowCardReached = false;
    redCardReached = false;
    bellRingReached = false;
    
    // Start timer
    startTime = Date.now();
    templatePanel.style.display = 'none';
    setupPanel.style.display = 'none';
    timerPanel.style.display = 'block';
    document.body.classList.add('timer-active');
    statusIndicator.textContent = "I'm ETS Timer";
    
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
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    
    timeDisplay.textContent = formatTime(elapsedSeconds);
    
    // Check for Green Card (only if time was set)
    if (greenTime > 0 && !greenCardReached && elapsedSeconds >= greenTime) {
        greenCardReached = true;
        document.body.classList.remove('yellow-card', 'red-card');
        document.body.classList.add('timer-active', 'green-card');
        statusIndicator.textContent = '🟢 Green Card';
    }
    
    // Check for Yellow Card (only if time was set)
    if (yellowTime > 0 && !yellowCardReached && elapsedSeconds >= yellowTime) {
        yellowCardReached = true;
        document.body.classList.remove('green-card', 'red-card');
        document.body.classList.add('timer-active', 'yellow-card');
        statusIndicator.textContent = '🟡 Yellow Card';
    }
    
    // Check for Red Card (only if time was set)
    if (redTime > 0 && !redCardReached && elapsedSeconds >= redTime) {
        redCardReached = true;
        document.body.classList.remove('green-card', 'yellow-card');
        document.body.classList.add('timer-active', 'red-card');
        statusIndicator.textContent = '🔴 Red Card';
    }
    
    // Check for Bell Ring (only if time was set)
    if (bellTime > 0 && !bellRingReached && elapsedSeconds >= bellTime) {
        bellRingReached = true;
        statusIndicator.textContent = '🔔 Bell Ringing!';
        playDoorbellTwice(); // First time ring twice (two ding-dongs)
        
        // Ring doorbell (once) every 5 seconds after the first double ring
        bellInterval = setInterval(() => {
            playDoorbell();
        }, 5000);
    }
}

// Start timer
function startTimer() {
    // Get input values and convert to seconds
    const greenMin = parseInt(document.getElementById('greenMin').value) || 0;
    const greenSec = parseInt(document.getElementById('greenSec').value) || 0;
    const yellowMin = parseInt(document.getElementById('yellowMin').value) || 0;
    const yellowSec = parseInt(document.getElementById('yellowSec').value) || 0;
    const redMin = parseInt(document.getElementById('redMin').value) || 0;
    const redSec = parseInt(document.getElementById('redSec').value) || 0;
    const bellMin = parseInt(document.getElementById('bellMin').value) || 0;
    const bellSec = parseInt(document.getElementById('bellSec').value) || 0;
    
    greenTime = greenMin * 60 + greenSec;
    yellowTime = yellowMin * 60 + yellowSec;
    redTime = redMin * 60 + redSec;
    bellTime = bellMin * 60 + bellSec;
    
    // Validate inputs
    if (greenTime === 0 && yellowTime === 0 && redTime === 0 && bellTime === 0) {
        alert('Please fill in at least one time field!');
        return;
    }
    
    if (greenTime < 0 || yellowTime < 0 || redTime < 0 || bellTime < 0) {
        alert('Time cannot be negative!');
        return;
    }
    
    // Initialize audio context on user interaction
    ensureAudioContext();
    
    // Reset state
    greenCardReached = false;
    yellowCardReached = false;
    redCardReached = false;
    bellRingReached = false;
    
    // Start timer
    startTime = Date.now();
    templatePanel.style.display = 'none';
    setupPanel.style.display = 'none';
    timerPanel.style.display = 'block';
    document.body.classList.add('timer-active');
    statusIndicator.textContent = "I'm ETS Timer";
    
    timerInterval = setInterval(updateTimer, 100);
}

// Stop timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    if (bellInterval) {
        clearInterval(bellInterval);
        bellInterval = null;
    }
    
    statusIndicator.textContent = '⏸️ Stopped';
}

// Reset timer
function resetTimer() {
    stopTimer();
    
    // Reset UI
    document.body.className = '';
    timeDisplay.textContent = '00:00';
    
    // Clear inputs
    document.getElementById('greenMin').value = '';
    document.getElementById('greenSec').value = '';
    document.getElementById('yellowMin').value = '';
    document.getElementById('yellowSec').value = '';
    document.getElementById('redMin').value = '';
    document.getElementById('redSec').value = '';
    document.getElementById('bellMin').value = '';
    document.getElementById('bellSec').value = '';
    
    // Show template panel
    showTemplatePanel();
}

// Event listeners
startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);
backBtn.addEventListener('click', showTemplatePanel);

// Template selection event listeners
preparedSpeechBtn.addEventListener('click', () => {
    startTimerWithPreset(templates.preparedSpeech);
});

tableTopicBtn.addEventListener('click', () => {
    startTimerWithPreset(templates.tableTopic);
});

evaluationBtn.addEventListener('click', () => {
    startTimerWithPreset(templates.evaluation);
});

keynoteBtn.addEventListener('click', () => {
    startTimerWithPreset(templates.keynote);
});

customizeBtn.addEventListener('click', showCustomizePanel);

// Allow Enter key to start timer
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startTimer();
        }
    });
});


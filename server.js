const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

const defaultState = () => ({
    screen: 'template', // template | custom | running | stopped
    settings: {
        green: 0,
        yellow: 0,
        red: 0,
        bell: 0
    },
    startTime: null,
    elapsedAtStop: 0
});

let state = defaultState();

function sanitizeSettings(settings = {}) {
    const toNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
    };

    return {
        green: toNumber(settings.green),
        yellow: toNumber(settings.yellow),
        red: toNumber(settings.red),
        bell: toNumber(settings.bell)
    };
}

function broadcastState() {
    const payload = JSON.stringify({
        type: 'state',
        state,
        serverTime: Date.now()
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

wss.on('connection', (socket) => {
    socket.send(
        JSON.stringify({
            type: 'state',
            state,
            serverTime: Date.now()
        })
    );

    socket.on('message', (message) => {
        let payload;
        try {
            payload = JSON.parse(message.toString());
        } catch (error) {
            return;
        }

        switch (payload.type) {
            case 'start': {
                state.settings = sanitizeSettings(payload.settings);
                state.startTime = Date.now();
                state.elapsedAtStop = 0;
                state.screen = 'running';
                break;
            }
            case 'stop': {
                if (state.screen === 'running' && state.startTime) {
                    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
                    state.elapsedAtStop = Math.max(0, elapsed);
                }
                state.startTime = null;
                state.screen = 'stopped';
                break;
            }
            case 'reset': {
                state = defaultState();
                break;
            }
            case 'set_screen': {
                if (payload.screen === 'template' || payload.screen === 'custom') {
                    state.screen = payload.screen;
                    state.startTime = null;
                    state.elapsedAtStop = 0;
                }
                break;
            }
            default:
                return;
        }

        broadcastState();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`ETS Timer running at http://localhost:${PORT}`);
});

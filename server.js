// server.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const PORT = 3000;
const wss = new WebSocket.Server({ port: PORT });
console.log(`Server running on ws://localhost:${PORT}`);

// path to messages.json
const filePath = path.join(__dirname, 'messages.json');

// loading existing messages, reads from the JSON file. next stop is sql
let messages = [];
try {
    const data = fs.readFileSync(filePath, 'utf8');
    messages = JSON.parse(data);
    console.log(`Loaded ${messages.length} messages`);
} catch (err) {
    console.log("No existing messages file, starting fresh.");
}

// msg --> JSON
function saveMessages() {
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
    console.log(`Saved ${messages.length} messages`);
}

// broadcast helper
function broadcast(data) {
    const msg = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}

// new connections
wss.on('connection', (ws) => {
    console.log("New user connected");

    let currentUser = null;

    // send chat history
    ws.send(JSON.stringify({
        type: "history",
        messages: messages
    }));

    ws.on('message', (message) => {
        const data = JSON.parse(message.toString());

        // identifying user, first message, 
        if (!currentUser) {
            currentUser = data.user;

            const joinMsg = {
                type: "system",
                message: `${currentUser} has joined`,
                time: Date.now()
            };
            messages.push(joinMsg);
            messages = messages.slice(-60); // keep last 60 messages
            saveMessages();
            broadcast(joinMsg);
        }

        // normal 
        messages.push(data);
        messages = messages.slice(-60);
        saveMessages();
        broadcast(data);
    });

    ws.on('close', () => {
        if (currentUser) {
            const leaveMsg = {
                type: "system",
                message: `${currentUser} has left`,
                time: Date.now()
            };

            messages.push(leaveMsg);
            messages = messages.slice(-60);
            saveMessages();
            broadcast(leaveMsg);
        }
        console.log("Client disconnected");
    });
});

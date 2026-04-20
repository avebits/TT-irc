// client.js
const ws = new WebSocket('ws://localhost:3000');
const messagesDiv = document.getElementById('messages');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');

// username via localStorage
let username = localStorage.getItem("username") || "";
while (!username) {
    username = prompt("Your nickname:");
}

localStorage.setItem("username", username);

// timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
}

// setting  username to a color
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

// render message
function renderMessage(data) {
    const msg = document.createElement('div');

    if (data.type === "system") {
        msg.textContent = ` [${formatTime(data.time)}] ${data.message}`;
        msg.style.color = "gray";
        msg.style.fontStyle = "bold";
    } else {
        const color = stringToColor(data.user);
        msg.innerHTML = ` [${formatTime(data.time)}] <span style="color:${color}">${data.user}</span>: ${data.message}`;
    }
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// incoming 
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "history") {
        data.messages.forEach(renderMessage);
        return;
    }
    renderMessage(data);
};

// sending
function sendMessage() {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (input.value.trim() === "") return;
    const data = {
        type: "message",
        user: username,
        message: input.value,
        time: Date.now()
    };
    ws.send(JSON.stringify(data));
    input.value = "";
}

// click to send
sendBtn.addEventListener("click", sendMessage);

// allow to use the enter key
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
});

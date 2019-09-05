
let ws;
if (location.protocol.startsWith("https")) {
    ws = new WebSocket("wss://" + location.host);
} else {
    ws = new WebSocket("ws://" + location.host);
}

let pending = [];
let connected = false;
ws.onopen = () => {
    connected = true;
    for (let str of pending) {
        ws.send(str);
    }
};

function getSocket(ws) {
    let listeners = {};
    ws.onmessage = function(event) {
        let obj = JSON.parse(event.data);
        if (listeners[obj.type]) {
            listeners[obj.type](obj.data);
        } else {
            console.error("Listener not found: " + obj.type);
        }
    };
    return {
        on: function(type, func) {
            listeners[type] = func;
        },
        emit: function(type, data) {
            let str = JSON.stringify({
                type: type,
                data: data,
            });
            if (connected) {
                ws.send(str);
            } else {
                pending.push(str);
            }
        },
    };
}

const socket = getSocket(ws);

export function emit(name, data) {
    socket.emit(name, data);
}

export function initSIO(initializer) {
    initializer(socket);
}


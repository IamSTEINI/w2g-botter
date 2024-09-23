const express = require("express");
const axios = require("axios");
const WebSocket = require("ws");
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post("/join", async (req, res) => {
    const { username, roomCode } = req.body;

    if (!username || !roomCode) {
        return res
            .status(400)
            .send('[!] NEED "username" and "roomCode" in request');
    }

    const url = `https://w2g-api.w2g.tv/rooms/${roomCode}/join_room`;
    const postData = { nname: username };

    try {
        const response = await axios.post(url, postData);

        if (response.data.user) {
            let user = response.data.user;
            console.log("Benutzerinformationen erhalten:", user);

            const userStream = `${roomCode}_${user}`;
            const resToken = "584dfzlay6sh2t3b84n2";
            const bbakey = response.data.bbakey;

            const wsUrl = `wss://cosma.w2g.tv/w2gsub?stream=${roomCode}&user=${userStream}&res=${resToken}&bbakey=${bbakey}`;
            console.log(`[~ CONNECTING AS ${username}]`, wsUrl);

            let attempts = 0;
            const maxAttempts = 5;
            let responseSent = false;

            const connectWebSocket = () => {
                if (attempts >= maxAttempts) {
                    console.error(`[!] Maximum reconnect attempts reached. Unable to connect to ${wsUrl}`);
                    if (!responseSent) {
                        responseSent = true;
                        return res.status(503).send("Service Unavailable: Unable to connect to WebSocket. Slow down next time ;)");
                    }
                    return;
                }

                const ws = new WebSocket(wsUrl);

                ws.on("open", () => {
                    console.log(`[+] ${username} JOINED`);
                    if (!responseSent) {
                        responseSent = true;
                        res.status(200).send(`[JOINED]`);
                    }
                });

                ws.on("close", () => {
                    console.warn(`[!] WebSocket connection closed. Reconnecting...`);
                    attempts++;
                    setTimeout(connectWebSocket, 2000);
                });

                ws.on("error", (err) => {
                    console.error(`[!] WebSocket error: ${err.message}. Reconnecting...`);
                    attempts++;
                    setTimeout(connectWebSocket, 2000);
                });
            };

            connectWebSocket();

        } else {
            return res.status(500).send("Error: Unable to join room.");
        }
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response && error.response.status === 503) {
            return res.status(503).send("Service Unavailable: Remote server is temporarily unavailable.");
        }
        return res.status(500).send("Error: " + error.message);
    }
});

app.listen(PORT, () => {
    console.log("W2G BOT MADE BY DXBY\n");
    console.log("[STARTED] OPEN http://localhost:3000/ in your browser to access the tool.");
    console.log(`[LISTENING] http://localhost:${PORT}`);
});

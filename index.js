const express = require("express");
const axios = require("axios");
const WebSocket = require("ws");
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = 3000;

app.use(express.json());

app.post("/join", async (req, res) => {
    const { username, roomCode } = req.body;

    if (!username || !roomCode) {
        return res
            .status(400)
            .send('[!] NEED "username" and "roomCode" in request');
    }

    const url = `https://w2g-api.w2g.tv/rooms/${roomCode}/join_room`;
    const postData = {
        nname: username,
    };

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

            const ws = new WebSocket(wsUrl);

            ws.on("open", () => {
                console.log(`[+] ${username} JOINED`);
            });
            return res.status(200).send(`[JOINED]`);
        } else {
            return res.status(500).send("Error");
        }
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).send("Error: " + error.message);
    }
});

app.listen(PORT, () => {
    // __      _____ ___   ___  ___ _____ 
    // \ \    / /_  ) __| | _ )/ _ \_   _|
    //  \ \/\/ / / / (_ | | _ \ (_) || |  
    //   \_/\_/ /___\___| |___/\___/ |_|
    // MADE BY DXBY
                                       
    console.log(`[LISTENING] http://localhost:${PORT}`);
});

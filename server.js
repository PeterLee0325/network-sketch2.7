import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// modes: normal | lag | loss
let MODE = "normal";
let LAG_MS = 500;
let LOSS_RATE = 0.25;

function broadcast(data) {
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data);
  }
}

wss.on("connection", (ws) => {
  ws._id = Math.random().toString(16).slice(2, 8);
  ws.send(JSON.stringify({ type: "hello", id: ws._id, mode: MODE }));

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === "setMode") {
      const m = msg.mode;
      if (m === "normal" || m === "lag" || m === "loss") {
        MODE = m;
        broadcast(JSON.stringify({ type: "mode", mode: MODE }));
      }
      return;
    }

    if (msg.type === "draw") {
      const payload = JSON.stringify({
        type: "draw",
        id: ws._id,
        x: msg.x, y: msg.y,
        px: msg.px, py: msg.py,
        t: Date.now()
      });

      if (MODE === "loss" && Math.random() < LOSS_RATE) return;
      if (MODE === "lag") setTimeout(() => broadcast(payload), LAG_MS);
      else broadcast(payload);
    }

    if (msg.type === "clear") {
      broadcast(JSON.stringify({ type: "clear" }));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Running on http://localhost:" + PORT));

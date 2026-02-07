let ws;
let myId = "…";
let mode = "…";
let connected = false;

function setHUD() {
  document.getElementById("me").textContent = myId;
  document.getElementById("mode").textContent = connected ? mode : "disconnected";
}

function wsURL() {
  const proto = (location.protocol === "https:") ? "wss:" : "ws:";
  return `${proto}//${location.host}`;
}

function connectWS() {
  ws = new WebSocket(wsURL());

  ws.onopen = () => { connected = true; setHUD(); };
  ws.onclose = () => { connected = false; setHUD(); };
  ws.onerror = () => { connected = false; setHUD(); };

  ws.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }

    if (msg.type === "hello") { myId = msg.id; mode = msg.mode; setHUD(); return; }
    if (msg.type === "mode") { mode = msg.mode; setHUD(); return; }

    if (msg.type === "draw") {
      if (msg.id === myId) return;
      strokeWeight(2);
      line(msg.px, msg.py, msg.x, msg.y);
      return;
    }

    if (msg.type === "clear") {
      background(17);
      return;
    }
  };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(17);
  stroke(220);
  connectWS();
  setHUD();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseDragged() {
  strokeWeight(2);
  line(pmouseX, pmouseY, mouseX, mouseY);

  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({
      type: "draw",
      x: mouseX, y: mouseY,
      px: pmouseX, py: pmouseY
    }));
  }
}

function keyPressed() {
if (key === "c" || key === "C") {
  background(17);
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "clear" }));
}
  if (key === "1") sendMode("normal");
  if (key === "2") sendMode("lag");
  if (key === "3") sendMode("loss");

  if (key === "4") {
    if (ws && ws.readyState === 1) ws.close();
    else connectWS();
  }
}

function sendMode(newMode) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: "setMode", mode: newMode }));
  }
}


/* global mqtt, DASHBOARD_CONFIG */

// Elements
const statusEl = document.getElementById('status');
const gridEl = document.getElementById('grid');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
document.getElementById('brokerInfo').textContent = DASHBOARD_CONFIG.mqttUrl;
document.getElementById('topicInfo').textContent = DASHBOARD_CONFIG.topic;

let client;
const state = {
  tiles: {},   // id -> tile DOM & state
  timers: {},  // id -> stale timeout
};

// Build the 13 station tiles upfront (fixed order)
function initGrid() {
  gridEl.innerHTML = '';
  DASHBOARD_CONFIG.expectedStations.forEach((id) => {
    const tile = document.createElement('div');
    tile.className = 'tile stale';
    tile.id = `tile-${id}`;

    tile.innerHTML = `
      <div class="tile-header">
        <span class="dot" aria-hidden="true"></span>
        <span class="station-id">${id}</span>
      </div>
      <div class="bpm"><span class="val">--</span> <span class="unit">BPM</span></div>
      <div class="meta">
        <span class="status">No data</span>
        <span class="time">—</span>
      </div>
    `;

    gridEl.appendChild(tile);
    state.tiles[id] = {
      el: tile,
      bpmEl: tile.querySelector('.val'),
      statusEl: tile.querySelector('.status'),
      timeEl: tile.querySelector('.time'),
      dotEl: tile.querySelector('.dot'),
      lastTs: 0,
    };
  });
}

initGrid();

// ---- Connection helpers ----
function setStatus(text, ok = false) {
  statusEl.textContent = text;
  statusEl.style.color = ok ? '#198754' : '#dc3545';
}

function markStale(id) {
  const t = state.tiles[id];
  if (!t) return;
  t.el.classList.add('stale');
  t.statusEl.textContent = 'Stale';
  t.dotEl.style.background = '#6c757d';
}

function scheduleStale(id) {
  clearTimeout(state.timers[id]);
  state.timers[id] = setTimeout(() => markStale(id), DASHBOARD_CONFIG.staleAfterMs);
}

// ---- Message parsing (JSON preferred; CSV fallback) ----

function parsePayload(buf) {
  const text = buf.toString();

  // Formato oficial informado:
  // {"deviceId":"nano-001","hr_bpm":77}
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj.deviceId === 'string' && typeof obj.hr_bpm !== 'undefined') {
      const bpmNum = Number(obj.hr_bpm);
      if (!Number.isNaN(bpmNum)) {
        return { id: obj.deviceId, bpm: bpmNum };
      }
    }
  } catch (_) {}

  // Fallbacks (se aparecerem variações)
  // Ex: "nano-001,77" ou "deviceId=nano-001,hr_bpm=77"
  const parts = text.split(/[,\s]+/);
  if (parts.length >= 2) {
    let id = parts[0].replace(/^(deviceId[:=])?/i, '');
    let bpmStr = parts[1].replace(/^(hr_bpm[:=])?/i, '');
    const bpm = Number(bpmStr);
    if (id && !Number.isNaN(bpm)) return { id, bpm };
  }
  return null;
}


  // Try CSV or "id:...,bpm:..."
  // Examples: "station01,76"  |  "id=station01,bpm=76"
  const parts = text.split(/[,\s]+/);
  if (parts.length >= 2) {
    let id = parts[0].replace(/^(id[:=])?/i, '');
    let bpmStr = parts[1].replace(/^(bpm[:=])?/i, '');
    const bpm = Number(bpmStr);
    if (id && !Number.isNaN(bpm)) return { id, bpm };
  }
  return null;
}

// ---- Tile update ----
function updateTile({ id, bpm }) {
  const t = state.tiles[id];
  if (!t) return; // ignore unknown ids to keep grid clean

  t.bpmEl.textContent = bpm.toFixed(0);
  t.timeEl.textContent = new Date().toLocaleTimeString();
  t.lastTs = Date.now();

  // Color coding
  const { min: nMin, max: nMax } = DASHBOARD_CONFIG.bpmNormalRange;
  const { min: wMin, max: wMax } = DASHBOARD_CONFIG.bpmWarnRange;

  t.el.classList.remove('stale', 'ok', 'warn', 'bad');
  if (bpm >= nMin && bpm <= nMax) {
    t.el.classList.add('ok');
    t.statusEl.textContent = 'Normal';
    t.dotEl.style.background = '#198754';
  } else if (bpm >= wMin && bpm <= wMax) {
    t.el.classList.add('warn');
    t.statusEl.textContent = 'Warning';
    t.dotEl.style.background = '#ffc107';
  } else {
    t.el.classList.add('bad');
    t.statusEl.textContent = 'Out of range';
    t.dotEl.style.background = '#dc3545';
  }

  scheduleStale(id);
}

// ---- MQTT wiring ----
connectBtn.addEventListener('click', () => {
  if (client && client.connected) return;

  setStatus('Connecting...');
  client = mqtt.connect(DASHBOARD_CONFIG.mqttUrl, DASHBOARD_CONFIG.options);

  client.on('connect', () => {
    setStatus('Connected', true);
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    client.subscribe(DASHBOARD_CONFIG.topic, { qos: 0 }, (err) => {
      setStatus(err ? `Subscribe error: ${err.message}` : `Subscribed to ${DASHBOARD_CONFIG.topic}`, !err);
    });
  });

  client.on('reconnect', () => setStatus('Reconnecting...'));
  client.on('close', () => {
    setStatus('Disconnected');
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
  });
  client.on('error', (e) => setStatus(`Error: ${e?.message || e}`));

  client.on('message', (_topic, payload) => {
    const parsed = parsePayload(payload);
    if (!parsed) return;
    updateTile(parsed);
  });
});

disconnectBtn.addEventListener('click', () => {
  if (!client) return;
  client.end(true, () => setStatus('Disconnected'));
  connectBtn.disabled = false;
  disconnectBtn.disabled = true;
});
``

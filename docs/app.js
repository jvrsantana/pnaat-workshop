
/* global mqtt, DASHBOARD_CONFIG */

const statusEl = document.getElementById('status');
const brokerInfoEl = document.getElementById('brokerInfo');
const topicInfoEl  = document.getElementById('topicInfo');
const gridEl = document.getElementById('grid');

let client;

// Build tiles for fixed station IDs
function initGrid() {
  gridEl.innerHTML = '';
  (DASHBOARD_CONFIG.expectedStations || []).forEach((id) => {
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
  });
}

function setStatus(text, ok = false) {
  statusEl.textContent = text;
  statusEl.style.color = ok ? '#198754' : '#dc3545';
}

// Parse {"deviceId":"nano-001","hr_bpm":77}
function parsePayload(buf) {
  const txt = buf.toString();
  try {
    const obj = JSON.parse(txt);
    if (obj && typeof obj.deviceId === 'string' && typeof obj.hr_bpm !== 'undefined') {
      const bpm = Number(obj.hr_bpm);
      if (!Number.isNaN(bpm)) return { id: obj.deviceId, bpm };
    }
  } catch (_) {}
  return null;
}

function markStale(id) {
  const tile = document.getElementById(`tile-${id}`);
  if (!tile) return;
  tile.classList.add('stale');
  tile.querySelector('.status').textContent = 'Stale';
  tile.querySelector('.dot').style.background = '#6c757d';
}

function scheduleStale(id) {
  const timeoutMs = DASHBOARD_CONFIG.staleAfterMs || 15000;
  // store as dataset to clear later if needed
  const tile = document.getElementById(`tile-${id}`);
  if (!tile) return;
  const prev = tile.dataset.timerId;
  if (prev) clearTimeout(Number(prev));
  const timerId = setTimeout(() => markStale(id), timeoutMs);
  tile.dataset.timerId = String(timerId);
}

function updateTile(id, bpm) {
  const tile = document.getElementById(`tile-${id}`);
  if (!tile) return;
  const valEl = tile.querySelector('.val');
  const statusEl = tile.querySelector('.status');
  const dotEl = tile.querySelector('.dot');
  const timeEl = tile.querySelector('.time');

  valEl.textContent = bpm.toFixed(0);
  timeEl.textContent = new Date().toLocaleTimeString();

  const n = DASHBOARD_CONFIG.bpmNormalRange || { min: 50, max: 110 };
  const w = DASHBOARD_CONFIG.bpmWarnRange || { min: 40, max: 130 };

  tile.classList.remove('stale', 'ok', 'warn', 'bad');
  if (bpm >= n.min && bpm <= n.max) {
    tile.classList.add('ok');
    statusEl.textContent = 'Normal';
    dotEl.style.background = '#198754';
  } else if (bpm >= w.min && bpm <= w.max) {
    tile.classList.add('warn');
    statusEl.textContent = 'Warning';
    dotEl.style.background = '#ffc107';
  } else {
    tile.classList.add('bad');
    statusEl.textContent = 'Out of range';
    dotEl.style.background = '#dc3545';
  }

  scheduleStale(id);
}

function connectMqtt() {
  const { mqttUrl, options, topic } = DASHBOARD_CONFIG;

  brokerInfoEl.textContent = mqttUrl;
  topicInfoEl.textContent = topic;
  setStatus('Connecting…');

  client = mqtt.connect(mqttUrl, options);

  client.on('connect', () => {
    setStatus('Connected', true);
    client.subscribe(topic, { qos: 0 }, (err) => {
      setStatus(err ? `Subscribe error: ${err.message}` : `Subscribed: ${topic}`, !err);
    });
  });

  client.on('reconnect', () => setStatus('Reconnecting…'));
  client.on('close', () => setStatus('Disconnected'));
  client.on('error', (err) => setStatus(`Error: ${err?.message || err}`));

  client.on('message', (t, payload) => {
    // Print raw messages to the console for debugging
    console.log('MQTT message:', t, payload?.toString());
    const parsed = parsePayload(payload);
    if (parsed) updateTile(parsed.id, parsed.bpm);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.DASHBOARD_CONFIG) {
    setStatus('config.js not loaded or DASHBOARD_CONFIG undefined');
    brokerInfoEl.textContent = '(missing)';
    topicInfoEl.textContent = '(missing)';
    return;
  }
  initGrid();
  connectMqtt();
});

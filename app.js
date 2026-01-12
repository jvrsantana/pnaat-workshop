
/* global mqtt, Chart, MQTT_CONFIG */

let client;
let chart;
const statusEl = document.getElementById('status');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const subBtn = document.getElementById('subBtn');
const pubBtn = document.getElementById('pubBtn');
const subTopicInput = document.getElementById('subTopic');
const pubTopicInput = document.getElementById('pubTopic');
const pubPayloadInput = document.getElementById('pubPayload');
const clientIdInput = document.getElementById('clientId');
const messagesEl = document.getElementById('messages');

clientIdInput.value = MQTT_CONFIG.options.clientId || 'dashboard-' + Math.random().toString(16).slice(2, 10);

// Create chart
(function initChart() {
  const ctx = document.getElementById('hrChart');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'BPM',
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, .1)',
        data: [],
        tension: 0.25,
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: { x: { title: { display: true, text: 'Samples' } }, y: { beginAtZero: true, title: { display: true, text: 'BPM' } } }
    }
  });
})();

function setStatus(text, ok = false) {
  statusEl.textContent = text;
  statusEl.style.color = ok ? '#198754' : '#dc3545';
}

connectBtn.addEventListener('click', () => {
  const opts = { ...MQTT_CONFIG.options, clientId: clientIdInput.value };
  setStatus('Connecting...');
  client = mqtt.connect(MQTT_CONFIG.url, opts);

  client.on('connect', () => {
    setStatus('Connected', true);
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    subBtn.disabled = false;
    pubBtn.disabled = false;
  });

  client.on('reconnect', () => setStatus('Reconnecting...'));
  client.on('error', (err) => setStatus(`Error: ${err?.message || err}`));
  client.on('close', () => setStatus('Disconnected'));

  client.on('message', (topic, payload) => {
    const msg = payload.toString();
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleTimeString()}  ${topic}  →  ${msg}`;
    messagesEl.prepend(li);

    // If it's heart rate numeric data, update chart
    if (topic.includes('heart_rate')) {
      const val = Number(msg);
      if (!Number.isNaN(val)) {
        chart.data.labels.push(chart.data.labels.length + 1);
        chart.data.datasets[0].data.push(val);
        if (chart.data.labels.length > 120) {
          chart.data.labels.shift();
          chart.data.datasets[0].data.shift();
        }
        chart.update();
      }
    }
  });
});

disconnectBtn.addEventListener('click', () => {
  if (client) {
    client.end(true, () => setStatus('Disconnected'));
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    subBtn.disabled = true;
    pubBtn.disabled = true;
  }
});

subBtn.addEventListener('click', () => {
  const topic = subTopicInput.value.trim();
  client?.subscribe(topic, { qos: 0 }, (err) => {
    setStatus(err ? `Subscribe error: ${err.message}` : `Subscribed: ${topic}`, !err);
  });
});

pubBtn.addEventListener('click', () => {
  const topic = pubTopicInput.value.trim();
  const payload = pubPayloadInput.value;
  client?.publish(topic, payload, { qos: 0, retain: false }, (err) => {
    setStatus(err ? `Publish error: ${err.message}` : `Published to ${topic}`, !err);
  });
});


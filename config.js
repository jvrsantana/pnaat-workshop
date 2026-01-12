
// ===== Fill this for your environment =====

// --- Option A: HiveMQ Public Broker (demo only)
// window.MQTT_CONFIG = {
//   url: 'ws://broker.hivemq.com:8000/mqtt', // WebSocket
//   options: { keepalive: 30, reconnectPeriod: 2000 },
// };

// --- Option B: HiveMQ Cloud (recommended for GitHub Pages HTTPS)
window.MQTT_CONFIG = {
  // Replace <cluster-host> with your HiveMQ Cloud hostname
  url: 'wss://d21541ee50b24da2bc981ecbbce1478b.s1.eu.hivemq.cloud:8884/mqtt',
  options: {
    username: 'workshop',
    password: 'Workshop1',
    // Good practice: randomized clientId
    clientId: 'dashboard-' + Math.random().toString(16).slice(2, 10),
    keepalive: 30,
    reconnectPeriod: 2000,
    clean: true,
  },
};


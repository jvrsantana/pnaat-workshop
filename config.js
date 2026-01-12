// config.js
window.DASHBOARD_CONFIG = {
  // Secure WebSocket (mandatory on GitHub Pages / HTTPS)
  mqttUrl: 'wss://<your-cluster-host>:8884/mqtt',

  options: {
    username: '<your-username>',
    password: '<your-password>',
    clientId: 'hrdash-' + Math.random().toString(16).slice(2, 10),
    keepalive: 30,
    reconnectPeriod: 2000,
    clean: true,
  },

  topic: 'workshop/hr',

  expectedStations: [
    'nano-001','nano-002','nano-003','nano-004','nano-005',
    'nano-006','nano-007','nano-008','nano-009','nano-010',
    'nano-011','nano-012','nano-013'
  ],

  bpmNormalRange: { min: 50, max: 110 },
  bpmWarnRange:   { min: 40, max: 130 },
  staleAfterMs: 15000,
};

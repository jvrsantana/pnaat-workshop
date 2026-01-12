
// ===== Configure your broker, topic, stations, and thresholds here =====

// For GitHub Pages (HTTPS), use a secure WebSocket (wss) endpoint.
// HiveMQ Cloud example (replace <cluster-host>, username, password):
window.DASHBOARD_CONFIG = {
  mqttUrl: 'wss://d21541ee50b24da2bc981ecbbce1478b.s1.eu.hivemq.cloud:8884/mqtt',
  options: {
    username: 'workshop',
    password: 'Workshop1',
    clientId: 'hrdash-' + Math.random().toString(16).slice(2, 10),
    keepalive: 30,
    reconnectPeriod: 2000,
    clean: true,
  },

  // If you *really* want to test with the public broker locally:
  // mqttUrl: 'ws://broker.hivemq.com:8000/mqtt',
  // options: { clientId: 'hrdash-' + Math.random().toString(16).slice(2, 10), keepalive: 30, reconnectPeriod: 2000 },

  topic: 'workshop/hr',             // All devices publish to this topic
  expectedStations: [       // 13 stations (IDs must match payload "id")
    'nano-001','nano-002','nano-003','nano-004','nano-005',
    'nano-006','nano-007','nano-008','nano-009','nano-010',
    'nano-011','nano-012','nano-013'
  ],

  // UI & logic
  bpmNormalRange: { min: 50, max: 110 }, // color green inside range
  bpmWarnRange:   { min: 40, max: 130 }, // yellow if outside normal but inside warn; red otherwise
  staleAfterMs: 15000,                   // mark tile stale if no update after 15s
};

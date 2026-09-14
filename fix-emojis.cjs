const fs = require('fs');
let file = 'src/pages/Dashboards.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace emojis with professional text/icons in Dashboards.jsx
content = content.replace('🏆 Inspector Leaderboard', 'Inspector Performance');
content = content.replace('⚠️ Issues Requiring Attention', 'Issues Requiring Attention');
content = content.replace('⚠️ Risk & Anomaly Watchlist', 'Risk & Anomaly Watchlist');
content = content.replace('🚨 Corrective Actions (CAPA)', 'Corrective Actions (CAPA)');
content = content.replace('📍 Client Quality Matrix (Risk)', 'Client Quality Matrix (Risk)');

fs.writeFileSync(file, content, 'utf8');
console.log('Dashboards cleaned of emojis!');

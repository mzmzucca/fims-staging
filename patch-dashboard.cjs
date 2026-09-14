const fs = require('fs');
const file = 'src/pages/Dashboards.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports if missing
if (!content.includes('import { supabase } from "../lib/supabase";')) {
  content = content.replace('import { useComms } from "../context/CommsContext";', 'import { useComms } from "../context/CommsContext";\nimport { supabase } from "../lib/supabase";');
}

// 2. Add useState/useEffect to CEODashboard (More resilient search)
const ceoStart = 'export function CEODashboard({ inspections, locations, auditLogs, currentUser }) {';
if (content.includes(ceoStart)) {
  if (!content.includes('const [capas, setCapas] = useState([]);')) {
    const hooksBlock = `\n  const [capas, setCapas] = useState([]);\n\n  useEffect(() => {\n    const fetchCapas = async () => {\n      const { data } = await supabase.from('fims_capas').select('*').order('created_at', { ascending: false });\n      setCapas(data || []);\n    };\n    fetchCapas();\n  }, []);`;
    
    // Insert right after the opening brace of CEODashboard
    content = content.replace(ceoStart, ceoStart + hooksBlock);
  }
} else {
  console.error('ERROR: Could not find the CEO Dashboard function.');
  process.exit(1);
}

// 3. Add CAPA Widget right before the Risk Watchlist
const riskWidgetStart = '      {/* PHASE 4: RISK INTELLIGENCE & ANOMALY DETECTION */}';
const capaWidget = `      {/* PHASE 5: CAPA TRACKING */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16, color: '#1E2A3A' }}>🚨 Corrective Actions (CAPA)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#FEE2E2', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#991B1B' }}>{capas.filter(c => c.status === 'open').length}</div>
            <div style={{ fontSize: 11, color: '#991B1B' }}>Open</div>
          </div>
          <div style={{ background: '#FEF3C7', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#92400E' }}>{capas.filter(c => c.status === 'in_progress').length}</div>
            <div style={{ fontSize: 11, color: '#92400E' }}>In Progress</div>
          </div>
          <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#065F46' }}>{capas.filter(c => c.status === 'resolved').length}</div>
            <div style={{ fontSize: 11, color: '#065F46' }}>Resolved</div>
          </div>
        </div>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {capas.filter(c => c.status !== 'resolved').slice(0, 5).map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: 13 }}>
              <div>
                <strong style={{ color: '#991B1B' }}>{c.score}/5</strong> {c.item_text}
                <div style={{ fontSize: 11, color: '#888' }}>{c.location_name}</div>
              </div>
              <div style={{ fontSize: 11, color: new Date(c.due_date) < new Date() ? '#A32D2D' : '#666' }}>
                Due: {new Date(c.due_date).toLocaleDateString('pt-PT')}
              </div>
            </div>
          ))}
        </div>
      </div>

`;

if (content.includes(riskWidgetStart)) {
  content = content.replace(riskWidgetStart, capaWidget + riskWidgetStart);
} else {
  console.error('ERROR: Could not find the Risk Widget block.');
  process.exit(1);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Phase 5: CAPA Widget added to CEO Dashboard successfully!');

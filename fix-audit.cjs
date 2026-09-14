const fs = require('fs');
const file = 'src/pages/Management.jsx';
let content = fs.readFileSync(file, 'utf8');

const newAuditPage = `export function AuditPage({ currentUser }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const pageSize = 15;

  const [filters, setFilters] = useState({ user: '', type: '', fromDate: '', toDate: '' });

  const fetchEvents = async (pageNum = 0) => {
    setLoading(true);
    setPage(pageNum);
    
    let query = supabase.from('fims_events').select('*', { count: 'exact' });
    
    if (filters.user) query = query.ilike('actor_name', '%' + filters.user + '%');
    if (filters.type) query = query.ilike('event_type', '%' + filters.type + '%');
    if (filters.fromDate) query = query.gte('created_at', filters.fromDate + 'T00:00:00Z');
    if (filters.toDate) query = query.lte('created_at', filters.toDate + 'T23:59:59Z');

    query = query.order('created_at', { ascending: false }).range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error("Audit fetch error:", error);
    } else {
      setEvents(data || []);
      setTotalEvents(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvents(0); }, []);

  const formatMetadata = (metadata) => {
    if (!metadata || Object.keys(metadata).length === 0) return '-';
    return Object.entries(metadata).map(([key, val]) => key + ': ' + val).join(' | ');
  };

  return (
    <div>
      <div className="page-header"><div><div className="page-title">📜 Activity Intelligence</div><div className="page-sub">User Behavior & Audit Timeline</div></div></div>
      
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          <input className="form-input" placeholder="Search User Name..." value={filters.user} onChange={e => setFilters({...filters, user: e.target.value})} style={{ margin: 0, flex: 1 }} />
          
          <select className="form-select" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} style={{ margin: 0, maxWidth: 200 }}>
            <option value="">All Types</option>
            <option value="auth">Authentication</option>
            <option value="inspection">Inspections</option>
            <option value="capa">CAPA</option>
            <option value="security">Security</option>
          </select>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#888' }}>From Date</label>
            <input type="date" className="form-input" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} style={{ margin: 0 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#888' }}>To Date</label>
            <input type="date" className="form-input" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} style={{ margin: 0 }} />
          </div>

          <button className="btn btn-primary" onClick={() => fetchEvents(0)} style={{ height: 'fit-content', marginTop: 16 }}>
            <Icon name="filter" size={14} /> Filter
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Event Type</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20, color: '#888' }}>No events found for the selected filters.</td></tr>
              ) : (
                events.map(ev => (
                  <tr key={ev.id}>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(ev.created_at).toLocaleString('pt-PT')}</td>
                    <td style={{ fontWeight: 500 }}>{ev.actor_name}</td>
                    <td><span className="badge" style={{ background: '#E6F1FB', color: '#185FA5', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{ev.event_type}</span></td>
                    <td style={{ fontSize: 12, color: '#666' }}>{ev.ip_address}</td>
                    <td style={{ fontSize: 12, color: '#666', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatMetadata(ev.metadata)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: '#888' }}>
            Page {page + 1} of {Math.ceil(totalEvents / pageSize) || 1} ({totalEvents} events)
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => fetchEvents(page - 1)}>Prev</button>
            <button className="btn btn-secondary btn-sm" disabled={events.length < pageSize} onClick={() => fetchEvents(page + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// Find the old AuditPage and replace it
const regex = /export function AuditPage\(.*?\) \{[\s\S]*?\n\}\n\nexport function SettingsPage/;
content = content.replace(regex, newAuditPage + '\n\nexport function SettingsPage');

fs.writeFileSync(file, content, 'utf8');
console.log('AuditPage fixed with working filters!');

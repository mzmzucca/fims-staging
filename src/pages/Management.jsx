import { useState, useEffect, useRef } from "react";
import { Icon } from "../lib/icons";
import { dataStore } from "../lib/dataStore";
import { supabase } from "../lib/supabase";
import * as XLSX from 'xlsx';

export function UsersPage({ users, setUsers }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("inspector");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAddUser = async () => {
    setError("");
    if (!name || !email || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    try {
      const { data, error: supaError } = await supabase.from('fims_users').insert([
        { name, email, role, password, active: true, avatar: name.substring(0, 2).toUpperCase() }
      ]).select();

      if (supaError) {
        setError(supaError.message);
        return;
      }

      if (data && data.length > 0) {
        const newUser = { ...data[0], id: Number(data[0].id) };
        setUsers(prev => [...prev, newUser]);
      }

      setName(""); setEmail(""); setRole("inspector"); setPassword("");
      setShowForm(false);
    } catch (err) {
      setError("Erro ao adicionar utilizador.");
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div className="page-title">👥 Utilizadores</div><div className="page-sub">Gestão de equipa</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Icon name="plus" size={14} /> Adicionar Utilizador
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12, color: "#1E2A3A" }}>Novo Utilizador</h3>
          {error && <div style={{ color: 'red', marginBottom: 10, fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="inspector">Inspector</option>
                <option value="supervisor">Supervisor</option>
                <option value="ceo">CEO</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={handleAddUser}>Guardar</button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead><tr><th>Nome</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}><td style={{ fontWeight: 500 }}>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LocationsPage({ locations, setLocations, users, inspections }) {
  return (
    <div>
      <div className="page-header"><div><div className="page-title">📍 Localizações</div><div className="page-sub">Gestão de clientes</div></div></div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Nome</th><th>Endereço</th></tr></thead>
          <tbody>
            {locations.map(l => (
              <tr key={l.id}><td style={{ fontWeight: 500 }}>{l.name}</td><td>{l.address}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReportsPage({ inspections, locations, users }) {
  return (
    <div>
      <div className="page-header"><div><div className="page-title">📈 Relatórios</div><div className="page-sub">Análise de dados</div></div></div>
      <div className="card"><p>Relatórios detalhados estarão disponíveis em breve.</p></div>
    </div>
  );
}

export function TemplatesPage() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState("A carregar templates...");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    const { data, error } = await supabase.from('fims_templates').select('client_name').order('client_name');
    if (error) { setStatus("Erro ao carregar clientes."); return; }
    setClients(data.map(t => t.client_name));
    setStatus("Selecione um cliente para editar o template ou faça upload de um Excel.");
  }

  async function loadTemplate(name) {
    setSelectedClient(name);
    setStatus(`A carregar template de ${name}...`);
    const { data, error } = await supabase.from('fims_templates').select('sections').eq('client_name', name).single();
    if (error) { setStatus("Erro ao carregar template."); return; }
    setSections(data.sections || []);
    setStatus(`Pronto para editar.`);
  }

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    
    setUploading(true);
    setStatus('A processar Excel...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length === 0) {
          setStatus('Erro: O ficheiro está vazio.');
          setUploading(false);
          return;
        }

        const keys = Object.keys(json[0]);
        if (keys.length < 3) {
          setStatus('Erro: O Excel precisa de pelo menos 3 colunas (Cliente, Secção, Item).');
          setUploading(false);
          return;
        }

        const templatesMap = {};
        json.forEach(row => {
          const client = String(row[keys[0]] || '').trim();
          const section = String(row[keys[1]] || '').trim();
          const item = String(row[keys[2]] || '').trim();
          if (!client || !section || !item) return;
          if (!templatesMap[client]) templatesMap[client] = {};
          if (!templatesMap[client][section]) templatesMap[client][section] = [];
          templatesMap[client][section].push(item);
        });

        const upserts = Object.keys(templatesMap).map(client => {
          const secs = Object.keys(templatesMap[client]).map((secName, idx) => ({
            id: 'sec_' + idx + '_' + Date.now(),
            title: secName,
            items: templatesMap[client][secName].map((itemText, i) => ({
              id: 'item_' + idx + '_' + i + '_' + Date.now(),
              text: itemText,
              score: null,
              comment: '',
              photos: []
            }))
          }));
          return {
            client_name: client,
            sections: secs,
            total_items: secs.reduce((acc, s) => acc + s.items.length, 0),
            last_updated: new Date().toISOString()
          };
        });

        if (upserts.length === 0) {
          setStatus('Erro: Nenhuma linha válida. Verifique se as 3 colunas têm dados.');
          setUploading(false);
          return;
        }

        const { error } = await supabase.from('fims_templates').upsert(upserts);
        if (error) {
          setStatus('Erro ao guardar no Supabase: ' + error.message);
        } else {
          setStatus('Sucesso! ' + upserts.length + ' templates atualizados.');
          fetchClients();
        }
        setUploading(false);
      } catch (err) {
        console.error('Excel Parsing Error:', err);
        setStatus('Erro ao ler o ficheiro Excel: ' + err.message);
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const addSection = () => {
    setSections(prev => [...prev, { id: `sec_${Date.now()}`, title: "Nova Secção", items: [] }]);
  };

  const deleteSection = (secId) => {
    if (!window.confirm("Eliminar esta secção e todos os seus itens?")) return;
    setSections(prev => prev.filter(s => s.id !== secId));
  };

  const updateSectionTitle = (secId, newTitle) => {
    setSections(prev => prev.map(s => s.id === secId ? { ...s, title: newTitle } : s));
  };

  const addItem = (secId) => {
    setSections(prev => prev.map(s => {
      if (s.id === secId) {
        return { ...s, items: [...(s.items || []), { id: `item_${Date.now()}`, text: "Novo Item", score: null, comment: "", photos: [] }] };
      }
      return s;
    }));
  };

  const deleteItem = (secId, itemId) => {
    setSections(prev => prev.map(s => {
      if (s.id === secId) {
        return { ...s, items: s.items.filter(i => i.id !== itemId) };
      }
      return s;
    }));
  };

  const updateItemText = (secId, itemId, newText) => {
    setSections(prev => prev.map(s => {
      if (s.id === secId) {
        return { ...s, items: s.items.map(i => i.id === itemId ? { ...i, text: newText } : i) };
      }
      return s;
    }));
  };

  const saveChanges = async () => {
    if (!selectedClient) return;
    setStatus("A guardar no Supabase...");
    const totalItems = sections.reduce((acc, s) => acc + (s.items?.length || 0), 0);
    const { error } = await supabase.from('fims_templates').upsert({ 
      client_name: selectedClient, 
      sections: sections,
      total_items: totalItems,
      last_updated: new Date().toISOString()
    });
    if (error) { setStatus("Erro ao guardar."); console.error(error); } 
    else { setStatus("Guardado com sucesso!"); }
  };

  const deleteTemplate = async () => {
    if (!selectedClient || !window.confirm(`Eliminar o template de ${selectedClient} permanentemente?`)) return;
    const { error } = await supabase.from('fims_templates').delete().eq('client_name', selectedClient);
    if (error) return console.error(error);
    
    setClients(prev => prev.filter(c => c !== selectedClient));
    setSelectedClient(null);
    setSections([]);
    setStatus("Template eliminado.");
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-title">📋 Templates de Inspeção</div>
          <div className="page-sub">Gerir e editar templates por cliente</div>
        </div>
        <div>
          <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleExcelUpload} style={{ display: 'none' }} />
          <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current.click()} disabled={uploading}>
            <Icon name="upload" size={14} /> {uploading ? "A enviar..." : "Importar Excel"}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12, color: "#1E2A3A" }}>Status</h3>
        <div style={{ fontSize: 14, color: "#666" }}>{status}</div>
      </div>

      <div className="two-col">
        <div className="card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: 15, marginBottom: 12, color: "#1E2A3A" }}>Clientes</h3>
          {clients.length === 0 ? (
            <div style={{ color: "#888", fontSize: 14 }}>Nenhum template encontrado.</div>
          ) : (
            <table className="table">
              <tbody>
                {clients.map(client => (
                  <tr key={client} 
                      onClick={() => loadTemplate(client)} 
                      style={{ cursor: 'pointer', backgroundColor: selectedClient === client ? '#E6F1FB' : 'transparent' }}>
                    <td style={{ fontWeight: 500 }}>{client}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          {selectedClient ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, color: "#1E2A3A" }}>Editar: {selectedClient}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={addSection}><Icon name="plus" size={14} /> Secção</button>
                  <button className="btn btn-danger btn-sm" onClick={deleteTemplate} style={{ background: '#DC2626' }}><Icon name="trash" size={14} /></button>
                  <button className="btn btn-primary btn-sm" onClick={saveChanges}><Icon name="save" size={14} /> Guardar</button>
                </div>
              </div>

              {sections.length === 0 && <div style={{ color: "#888", fontSize: 14 }}>Sem secções. Clique em "Secção" para adicionar.</div>}

              {sections.map((sec, i) => (
                <div key={sec.id} style={{ marginBottom: 24, border: '1px solid #eee', borderRadius: 8, padding: 16, background: '#F8F7F4' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input 
                      className="form-input" 
                      value={sec.title || sec.name || ""} 
                      onChange={(e) => updateSectionTitle(sec.id, e.target.value)}
                      style={{ fontWeight: 600, fontSize: 15 }}
                    />
                    <button className="btn btn-danger btn-sm" onClick={() => deleteSection(sec.id)} style={{ background: '#DC2626' }}>X</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(sec.items || []).map((item, j) => (
                      <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#888', width: 24 }}>{j + 1}.</span>
                        <input 
                          className="form-input" 
                          value={item.text || ""} 
                          onChange={(e) => updateItemText(sec.id, item.id, e.target.value)}
                        />
                        <button className="btn btn-danger btn-sm" onClick={() => deleteItem(sec.id, item.id)} style={{ background: '#DC2626' }}>X</button>
                      </div>
                    ))}
                    <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => addItem(sec.id)}>
                      <Icon name="plus" size={12} /> Adicionar Item
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ color: "#888", fontSize: 14, textAlign: 'center', marginTop: 40 }}>
              Selecione um cliente à esquerda para ver e editar o seu template.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuditPage({ currentUser }) {
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


export function SettingsPage({ inspections, onDeleteInspection }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">⚙️ Configurações do Sistema</div>
          <div className="page-sub">Gestão de dados</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12, color: "#1E2A3A" }}>🗑️ Gerir Inspeções</h3>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          Aqui pode eliminar inspeções antigas ou duplicadas do banco de dados.
        </p>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Localização</th>
                <th>Data</th>
                <th>Estado</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(insp => (
                <tr key={insp.id}>
                  <td style={{ fontWeight: 500 }}>{insp.location_name || 'N/A'}</td>
                  <td>{insp.date || 'N/A'}</td>
                  <td>{insp.status || 'N/A'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => onDeleteInspection(insp.id)} style={{ background: '#DC2626' }}>
                      <Icon name="trash" size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

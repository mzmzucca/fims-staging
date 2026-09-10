import React from 'react';

const PrintableReport = React.forwardRef(({ inspection }, ref) => {
  if (!inspection) return null;

  const scoreColor = inspection.score_pct >= 75 ? '#0F6E56' : inspection.score_pct >= 50 ? '#BA7517' : '#A32D2D';
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('pt-PT') : 'N/A';

  return (
    <div ref={ref} style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: '#333', backgroundColor: '#fff', width: '800px' }}>
      
      {/* Header / Cover */}
      <div style={{ borderBottom: '4px solid #1E2A3A', paddingBottom: 20, marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ color: '#1E2A3A', margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}>NEMCHEM</h1>
          <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: 14, textTransform: 'uppercase', letterSpacing: '2px' }}>Field Inspection Management System</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: 24, color: '#1E2A3A' }}>{inspection.location_name || 'N/A'}</h2>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>{formatDate(inspection.date)}</p>
        </div>
      </div>

      {/* Score & Meta Card */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 30, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ background: scoreColor, color: '#fff', padding: 20, width: 150, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{inspection.score_pct || 0}%</div>
          <div style={{ fontSize: 12, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>Final Score</div>
        </div>
        <div style={{ flex: 1, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Inspector</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{inspection.inspector_name || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Client Supervisor</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{inspection.client_mgr_name || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Status</div>
            <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{inspection.status || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>GPS Coordinates</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#378ADD' }}>{inspection.gps_coords || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div style={{ background: '#F8F7F4', padding: 16, borderRadius: 8, marginBottom: 30 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#1E2A3A' }}>Executive Summary & Observations</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.5 }}>{inspection.notes || 'No general observations were recorded for this inspection.'}</p>
      </div>

      {/* Detailed Sections */}
      <h3 style={{ fontSize: 18, color: '#1E2A3A', borderBottom: '2px solid #eee', paddingBottom: 8, marginBottom: 16 }}>Detailed Inspection Report</h3>
      
      {(inspection.sections || []).map((sec, i) => {
        const secItems = (inspection.items || []).filter(it => it.section_id === sec.id);
        const secPhotos = sec.photos || [];
        
        return (
          <div key={sec.id} style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
            <div style={{ background: '#1E2A3A', color: '#fff', padding: '8px 12px', borderRadius: 4, fontWeight: 600, fontSize: 15 }}>
              {i + 1}. {sec.title || sec.name}
            </div>
            
            <div style={{ border: '1px solid #eee', borderTop: 'none', padding: 12 }}>
              <p style={{ fontSize: 12, color: '#555', fontStyle: 'italic', marginBottom: 12 }}>{sec.observation || 'No observation recorded.'}</p>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', textAlign: 'left' }}>
                    <th style={{ padding: 8, fontSize: 11, borderBottom: '2px solid #eee' }}>Item</th>
                    <th style={{ padding: 8, fontSize: 11, borderBottom: '2px solid #eee', width: 50, textAlign: 'center' }}>Score</th>
                    <th style={{ padding: 8, fontSize: 11, borderBottom: '2px solid #eee' }}>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {secItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: 8, fontSize: 12 }}>{item.text}</td>
                      <td style={{ padding: 8, textAlign: 'center', fontWeight: 800, color: item.score <= 2 ? '#A32D2D' : item.score <= 3 ? '#BA7517' : '#0F6E56' }}>
                        {item.score || '-'}
                      </td>
                      <td style={{ padding: 8, fontSize: 12, color: '#666' }}>{item.comment || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {secPhotos.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {secPhotos.map((p, idx) => (
                    <img key={idx} src={p} alt="Evidence" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Signatures */}
      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid' }}>
        <div style={{ textAlign: 'center' }}>
          {inspection.inspector_sig && <img src={inspection.inspector_sig} alt="Inspector" style={{ height: 60, marginBottom: 4 }} />}
          <div style={{ borderTop: '1px solid #000', width: 200, paddingTop: 4, fontSize: 12, fontWeight: 600 }}>
            {inspection.inspector_name || 'Inspector'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          {inspection.client_sig && <img src={inspection.client_sig} alt="Client" style={{ height: 60, marginBottom: 4 }} />}
          <div style={{ borderTop: '1px solid #000', width: 200, paddingTop: 4, fontSize: 12, fontWeight: 600 }}>
            {inspection.client_mgr_name || 'Client Manager'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 10, color: '#999' }}>
        NEMCHEM © 2024 - Documento gerado pelo FIMS
      </div>
    </div>
  );
});

export default PrintableReport;

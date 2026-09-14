import React from 'react';
import ReportFrame from './ReportFrame';

const PrintableReport = React.forwardRef(({ inspection }, ref) => {
  if (!inspection) return null;

  const items = inspection.items || [];
  const sections = inspection.sections || [];
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  // Calculations
  const scoredItems = items.filter(i => i.score !== null);
  const totalItems = items.length;
  const completion = totalItems > 0 ? Math.round((scoredItems.length / totalItems) * 100) : 0;
  const qualityScore = scoredItems.length > 0 ? (scoredItems.reduce((acc, i) => acc + i.score, 0) / scoredItems.length).toFixed(1) : '0.0';
  const issues = items.filter(i => i.score !== null && i.score <= 3);

  // Dynamic Signature Logic
  const sigs = [];
  if (inspection.inspector_sig) sigs.push({ img: inspection.inspector_sig, name: inspection.inspector_name || 'Inspector', role: 'NemChem Inspector' });
  if (inspection.client_sig) sigs.push({ img: inspection.client_sig, name: inspection.client_mgr_name || 'Client Manager', role: 'Client Representative' });

  return (
    <div ref={ref}>
      <ReportFrame inspectionType="Quality Inspection Report">
        
        {/* INFO BLOCK */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontSize: '10pt', color: '#4B5563' }}>
            <div style={{ fontSize: '8pt', textTransform: 'uppercase', fontWeight: 700, color: '#9CA3AF', marginBottom: '4px' }}>Client / Site Information</div>
            <div><strong>Client:</strong> {inspection.location_name || 'N/A'}</div>
            <div><strong>Address:</strong> Maputo, Moçambique</div>
            <div><strong>Attention:</strong> {inspection.client_mgr_name || 'N/A'}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10pt', color: '#4B5563' }}>
            Maputo, {formatDate(inspection.date)}
          </div>
        </div>

        {/* SUBJECT LINE */}
        <div style={{ marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '8pt', textTransform: 'uppercase', fontWeight: 700, color: '#9CA3AF' }}>Subject</div>
          <div style={{ fontSize: '14pt', fontWeight: 700, color: '#1E2A3A' }}>Relatório de Inspeção de Qualidade</div>
        </div>

        {/* EXECUTIVE SUMMARY CARDS */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <div style={{ flex: 1, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '8pt', color: '#666', textTransform: 'uppercase' }}>Quality Score</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E2A3A' }}>{qualityScore} / 5</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '8pt', color: '#666', textTransform: 'uppercase' }}>Completion</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E2A3A' }}>{completion}%</div>
          </div>
          <div style={{ flex: 1, backgroundColor: issues.length > 0 ? '#FEE2E2' : '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '8pt', color: '#666', textTransform: 'uppercase' }}>Findings</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: issues.length > 0 ? '#991B1B' : '#1E2A3A' }}>{issues.length}</div>
          </div>
        </div>

        {/* MODULE: SECTION & CHECKLIST & PHOTOS */}
        {sections.map(sec => {
          const secItems = items.filter(it => it.section_id === sec.id);
          const secScored = secItems.filter(i => i.score !== null);
          const secAvg = secScored.length > 0 ? (secScored.reduce((acc, i) => acc + i.score, 0) / secScored.length).toFixed(1) : 'N/A';
          const secPhotos = sec.photos || [];
          const photoGrid = secPhotos.length === 1 ? '1fr' : secPhotos.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr';

          return (
            <div key={sec.id} style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
              {/* Section Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#1E2A3A', color: '#fff', padding: '8px 12px', borderRadius: '4px 4px 0 0' }}>
                <div style={{ fontWeight: 700, fontSize: '12pt' }}>{sec.title || sec.name}</div>
                <div style={{ fontSize: '10pt', opacity: 0.9 }}>Score: {secAvg} / 5</div>
              </div>
              
              {/* Checklist Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '15px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', color: '#4B5563', fontSize: '8pt', textTransform: 'uppercase' }}>
                    <th style={{ padding: '6px 12px', textAlign: 'left', width: '70%' }}>Checklist Item</th>
                    <th style={{ padding: '6px 12px', textAlign: 'center', width: '10%' }}>Score</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left', width: '20%' }}>Observation</th>
                  </tr>
                </thead>
                <tbody>
                  {secItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '8px 12px' }}>{item.text}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: item.score <= 2 ? '#991B1B' : item.score <= 3 ? '#92400E' : '#065F46' }}>{item.score || '-'}</td>
                      <td style={{ padding: '8px 12px', color: '#666' }}>{item.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Photo Grid Module */}
              {secPhotos.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '8pt', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>PHOTO EVIDENCE</div>
                  <div style={{ display: 'grid', gridTemplateColumns: photoGrid, gap: '10px' }}>
                    {secPhotos.map((p, i) => (
                      <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                        <img src={p} alt={`Evidence ${i+1}`} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* MODULE: FINDINGS / ISSUES */}
        {issues.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '8px 12px', fontWeight: 700, fontSize: '12pt', borderRadius: '4px 4px 0 0' }}>
              ⚠️ Issues Requiring Attention
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', border: '1px solid #FECACA' }}>
              <tbody>
                {issues.map((issue, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #FEE2E2' }}>
                    <td style={{ padding: '8px 12px', width: '60%' }}>
                      <strong>{issue.text}</strong>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', width: '10%', fontWeight: 700, color: '#991B1B' }}>{issue.score}/5</td>
                    <td style={{ padding: '8px 12px', color: '#666', width: '30%' }}>{issue.comment || 'No comment provided'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DYNAMIC SIGNATURES */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-around', pageBreakInside: 'avoid' }}>
          {sigs.map((sig, i) => (
            <div key={i} style={{ textAlign: 'center', width: `${100/sigs.length}%` }}>
              <img src={sig.img} alt="Signature" style={{ height: '50px', marginBottom: '4px' }} />
              <div style={{ borderBottom: '1px solid #000', width: '80%', margin: '0 auto 4px auto' }}></div>
              <div style={{ fontWeight: 700, fontSize: '10pt' }}>{sig.name}</div>
              <div style={{ fontSize: '9pt', color: '#666' }}>{sig.role}</div>
            </div>
          ))}
        </div>

      </ReportFrame>
    </div>
  );
});

export default PrintableReport;

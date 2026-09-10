import { useState, useRef } from "react";
import { Icon } from "../lib/icons";
import { calcScore, getCategoryHealth, generateAISummary } from "../lib/helpers";
import StatusBadge from "../components/StatusBadge";
import ScoreRing from "../components/ScoreRing";
import PrintableReport from "../components/PrintableReport";

export default function InspectionDetail({ inspection, currentUser, onBack, onUpdate, addAuditLog, allInspections }) {
  const [showPDF, setShowPDF] = useState(false);
  const reportRef = useRef(null);

  if (!inspection) return null;
  const safeInspection = Array.isArray(inspection) ? inspection[0] : inspection;

  const handleDownloadPDF = () => {
    setShowPDF(true);
    setTimeout(() => {
      const opt = {
        margin: 0,
        filename: `Relatorio-${safeInspection.location_name || 'Inspecao'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'px', format: [800, 1130], orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      import('html2pdf.js').then(module => {
        const html2pdf = module.default;
        html2pdf().set(opt).from(reportRef.current).save().then(() => {
          setShowPDF(false);
        });
      });
    }, 100);
  };

  const handleDownloadWord = () => {
    const scoreColor = safeInspection.score_pct >= 75 ? '#0F6E56' : safeInspection.score_pct >= 50 ? '#BA7517' : '#A32D2D';
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('pt-PT') : 'N/A';

    let sectionsHTML = '';
    (safeInspection.sections || []).forEach((sec, i) => {
      const secItems = (safeInspection.items || []).filter(it => it.section_id === sec.id);
      const secPhotos = sec.photos || [];
      
      let itemsRows = secItems.map(item => `
        <tr>
          <td style="padding:8px;border:1px solid #eee;font-size:12px;">${item.text}</td>
          <td style="padding:8px;border:1px solid #eee;text-align:center;font-weight:800;color:${item.score <= 2 ? '#A32D2D' : item.score <= 3 ? '#BA7517' : '#0F6E56'}">${item.score || '-'}</td>
          <td style="padding:8px;border:1px solid #eee;font-size:12px;color:#666;">${item.comment || ''}</td>
        </tr>
      `).join('');

      let photosHTML = secPhotos.length > 0 ? `
        <div style="display:flex;gap:8px;margin-top:12px;">
          ${secPhotos.map(p => `<img src="${p}" style="width:90px;height:90px;object-fit:cover;border-radius:4px;border:1px solid #eee;" />`).join('')}
        </div>
      ` : '';

      sectionsHTML += `
        <div style="margin-bottom:24px;">
          <div style="background:#1E2A3A;color:#fff;padding:8px 12px;font-weight:600;font-size:15px;">${i + 1}. ${sec.title || sec.name}</div>
          <div style="border:1px solid #eee;border-top:none;padding:12px;">
            <p style="font-size:12px;color:#555;font-style:italic;margin-bottom:12px;">${sec.observation || 'No observation recorded.'}</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
              <thead>
                <tr style="background:#f9f9f9;">
                  <th style="padding:8px;text-align:left;border:1px solid #eee;font-size:11px;">Item</th>
                  <th style="padding:8px;text-align:center;border:1px solid #eee;font-size:11px;width:50px;">Score</th>
                  <th style="padding:8px;text-align:left;border:1px solid #eee;font-size:11px;">Comment</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
            </table>
            ${photosHTML}
          </div>
        </div>
      `;
    });

    const htmlContent = `
      <div style="font-family:Arial, sans-serif;color:#333;padding:40px;">
        <div style="border-bottom:4px solid #1E2A3A;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between;">
          <div>
            <h1 style="color:#1E2A3A;margin:0;font-size:32px;font-weight:800;">NEMCHEM</h1>
            <p style="color:#666;margin:4px 0 0 0;font-size:14px;text-transform:uppercase;">Field Inspection Management System</p>
          </div>
          <div style="text-align:right;">
            <h2 style="margin:0;font-size:24px;color:#1E2A3A;">${safeInspection.location_name || 'N/A'}</h2>
            <p style="margin:4px 0 0 0;color:#666;font-size:14px;">${formatDate(safeInspection.date)}</p>
          </div>
        </div>
        
        <div style="margin-bottom:30px;border:1px solid #eee;border-radius:8px;overflow:hidden;display:flex;">
          <div style="background:${scoreColor};color:#fff;padding:20px;width:150px;text-align:center;">
            <div style="font-size:36px;font-weight:800;">${safeInspection.score_pct || 0}%</div>
            <div style="font-size:12px;">Final Score</div>
          </div>
          <div style="flex:1;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><div style="font-size:11px;color:#888;">Inspector</div><div style="font-size:16px;font-weight:600;">${safeInspection.inspector_name || 'N/A'}</div></div>
            <div><div style="font-size:11px;color:#888;">Client Supervisor</div><div style="font-size:16px;font-weight:600;">${safeInspection.client_mgr_name || 'N/A'}</div></div>
            <div><div style="font-size:11px;color:#888;">Status</div><div style="font-size:14px;font-weight:600;text-transform:capitalize;">${safeInspection.status || 'N/A'}</div></div>
            <div><div style="font-size:11px;color:#888;">GPS Coordinates</div><div style="font-size:14px;font-weight:600;color:#378ADD;">${safeInspection.gps_coords || 'N/A'}</div></div>
          </div>
        </div>

        <div style="background:#F8F7F4;padding:16px;border-radius:8px;margin-bottom:30px;">
          <h3 style="margin:0 0 8px 0;font-size:16px;color:#1E2A3A;">Executive Summary & Observations</h3>
          <p style="margin:0;font-size:13px;color:#444;line-height:1.5;">${safeInspection.notes || 'No general observations were recorded.'}</p>
        </div>

        <h3 style="font-size:18px;color:#1E2A3A;border-bottom:2px solid #eee;padding-bottom:8px;margin-bottom:16px;">Detailed Inspection Report</h3>
        ${sectionsHTML}

        <div style="margin-top:40px;display:flex;justify-content:space-between;">
          <div style="text-align:center;">
            ${safeInspection.inspector_sig ? `<img src="${safeInspection.inspector_sig}" style="height:60px;margin-bottom:4px;" />` : ''}
            <div style="border-top:1px solid #000;width:200px;padding-top:4px;font-size:12px;font-weight:600;">${safeInspection.inspector_name || 'Inspector'}</div>
          </div>
          <div style="text-align:center;">
            ${safeInspection.client_sig ? `<img src="${safeInspection.client_sig}" style="height:60px;margin-bottom:4px;" />` : ''}
            <div style="border-top:1px solid #000;width:200px;padding-top:4px;font-size:12px;font-weight:600;">${safeInspection.client_mgr_name || 'Client Manager'}</div>
          </div>
        </div>
      </div>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio-${safeInspection.location_name || 'Inspecao'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const aiSummary = generateAISummary(safeInspection.items || [], safeInspection.location_name);

  return (
    <div>
      <div className="page-header" style={{ flexWrap: "wrap", gap: "16px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 8 }}>← Voltar</button>
          <div className="page-title">{safeInspection.location_name}</div>
          <div className="page-sub">Relatório de Inspeção · {safeInspection.date}</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ScoreRing pct={safeInspection.score_pct} size={48} />
          <button className="btn btn-secondary" onClick={handleDownloadWord}>
            <Icon name="download" size={14} /> Word
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPDF}>
            <Icon name="download" size={14} /> PDF Download
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8, color: "#1E2A3A" }}>AI Executive Summary</h3>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{aiSummary.summary}</p>
        {aiSummary.recommendations && aiSummary.recommendations.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Recommended Actions:</div>
            {aiSummary.recommendations.map((rec, i) => (
              <div key={i} style={{ fontSize: 12, color: "#444", marginBottom: 8, padding: 8, background: "#F8F7F4", borderRadius: 6 }} dangerouslySetInnerHTML={{ __html: rec.replace(/\*\*(.*?)\*\*/, '<strong>$1</strong>') }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <div className="card" style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: "#888" }}>Inspector</div>
          <div style={{ fontWeight: 500 }}>{safeInspection.inspector_name || 'N/A'}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: "#888" }}>Client Manager</div>
          <div style={{ fontWeight: 500 }}>{safeInspection.client_mgr_name || 'N/A'}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: "#888" }}>GPS Location</div>
          {safeInspection.gps_coords ? <a href={`https://maps.google.com/?q=${safeInspection.gps_coords}`} target="_blank" rel="noreferrer" style={{ fontWeight: 500, color: "#378ADD", fontSize: 12 }}>{safeInspection.gps_coords}</a> : <div style={{ fontWeight: 500 }}>N/A</div>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12, color: "#1E2A3A" }}>Observações Gerais</h3>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{safeInspection.notes || 'Sem observações.'}</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        {(safeInspection.sections || []).map((sec, i) => {
          const secItems = (safeInspection.items || []).filter(it => it.section_id === sec.id);
          return (
            <div key={sec.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
              <div style={{ background: "#F8F7F4", padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid #eee' }}>
                {sec.title || sec.name}
              </div>
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 12, color: '#555', fontStyle: 'italic', marginBottom: 12 }}>{sec.observation || 'No observation.'}</p>
                {secItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ fontSize: 13 }}>{item.text}</span>
                    <span style={{ fontWeight: 800, color: item.score <= 2 ? '#A32D2D' : item.score <= 3 ? '#BA7517' : '#0F6E56' }}>{item.score || '-'}</span>
                  </div>
                ))}
                {sec.photos && sec.photos.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {sec.photos.map((p, idx) => <img key={idx} src={p} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around', marginTop: 32 }}>
        <div style={{ textAlign: 'center' }}>
          {safeInspection.inspector_sig && <img src={safeInspection.inspector_sig} alt="Inspector" style={{ height: 50, marginBottom: 4 }} />}
          <div style={{ borderTop: '1px solid #000', width: 200, paddingTop: 4, fontSize: 12, fontWeight: 600 }}>{safeInspection.inspector_name || 'Inspector'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          {safeInspection.client_sig && <img src={safeInspection.client_sig} alt="Client" style={{ height: 50, marginBottom: 4 }} />}
          <div style={{ borderTop: '1px solid #000', width: 200, paddingTop: 4, fontSize: 12, fontWeight: 600 }}>{safeInspection.client_mgr_name || 'Client Manager'}</div>
        </div>
      </div>

      {/* Hidden Printable Component for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {showPDF && <PrintableReport ref={reportRef} inspection={safeInspection} />}
      </div>
    </div>
  );
}

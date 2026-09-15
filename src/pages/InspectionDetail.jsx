import { useState, useRef, useEffect } from "react";
import { Icon } from "../lib/icons";
import { calcScore, getCategoryHealth, generateAISummary } from "../lib/helpers";
import { supabase } from "../lib/supabase";
import StatusBadge from "../components/StatusBadge";
import ScoreRing from "../components/ScoreRing";
import PrintableReport from "../components/PrintableReport";

export default function InspectionDetail({ inspection, currentUser, onBack, onUpdate, addAuditLog, allInspections }) {
  const [showPDF, setShowPDF] = useState(false);
  const reportRef = useRef(null);
  const [displayInspection, setDisplayInspection] = useState(inspection);

  useEffect(() => {
    async function fetchMissingTemplate() {
      if (inspection && (!inspection.items || inspection.items.length === 0) && inspection.location_name) {
        const { data } = await supabase.from('fims_templates').select('sections').ilike('client_name', inspection.location_name).single();
        if (data && data.sections && data.sections.length > 0) {
          const newItems = data.sections.flatMap(s => 
            (s.items || s.itens || []).map(item => ({ 
              ...item, 
              section_id: s.id, 
              score: null, 
              comment: "", 
              photos: [] 
            }))
          );
          const newSections = data.sections.map(s => ({ 
            id: s.id, 
            title: s.title || s.name,
            observation: "", 
            photos: [] 
          }));
          setDisplayInspection({ ...inspection, items: newItems, sections: newSections });
        } else {
          setDisplayInspection(inspection);
        }
      } else {
        setDisplayInspection(inspection);
      }
    }
    fetchMissingTemplate();
  }, [inspection]);

  if (!displayInspection) return null;
  const safeInspection = Array.isArray(displayInspection) ? displayInspection[0] : displayInspection;

  const handleDownloadPDF = () => {
    setShowPDF(true);
    setTimeout(() => {
      const opt = {
        margin: 0,
        filename: `Relatorio-${safeInspection.location_name || 'Inspecao'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      import('html2pdf.js').then(module => {
        const html2pdf = module.default;
        html2pdf().set(opt).from(reportRef.current).save().then(() => {
          setShowPDF(false);
        });
      });
    }, 200);
  };

  const handleDownloadWord = () => {
    const items = safeInspection.items || [];
    const sections = safeInspection.sections || [];
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

    const scoredItems = items.filter(i => i.score !== null);
    const totalItems = items.length;
    const completion = totalItems > 0 ? Math.round((scoredItems.length / totalItems) * 100) : 0;
    const qualityScore = scoredItems.length > 0 ? (scoredItems.reduce((acc, i) => acc + i.score, 0) / scoredItems.length).toFixed(1) : '0.0';
    const issues = items.filter(i => i.score !== null && i.score <= 3);

    // Bulletproof grouping for Word export
    const grouped = {};
    items.forEach(it => {
      const secId = it.section_id || 'uncategorized';
      if (!grouped[secId]) grouped[secId] = [];
      grouped[secId].push(it);
    });

    let areasHTML = sections.map(sec => {
      const secItems = grouped[sec.id] || [];
      const secScored = secItems.filter(i => i.score !== null);
      const secAvg = secScored.length > 0 ? (secScored.reduce((acc, i) => acc + i.score, 0) / secScored.length).toFixed(1) : 'N/A';
      const secPhotos = sec.photos || [];
      const photoGrid = secPhotos.length === 1 ? '1fr' : secPhotos.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr';
      
      let rowsHTML = secItems.map(item => `
        <tr style="border-bottom:1px solid #f5f5f5;">
          <td style="padding:8px 12px;width:70%;">${item.text}</td>
          <td style="padding:8px 12px;text-align:center;width:10%;font-weight:700;color:${item.score <= 2 ? '#991B1B' : item.score <= 3 ? '#92400E' : '#065F46'};">${item.score || '-'}</td>
          <td style="padding:8px 12px;color:#666;width:20%;">${item.comment || '—'}</td>
        </tr>
      `).join('');

      let photoHTML = secPhotos.length > 0 ? `
        <div style="margin-top:10px;">
          <div style="font-size:8pt;font-weight:700;color:#9CA3AF;margin-bottom:8px;">PHOTO EVIDENCE</div>
          <div style="display:grid;grid-template-columns:${photoGrid};gap:10px;">
            ${secPhotos.map(p => `<div style="border:1px solid #E5E7EB;border-radius:4px;overflow:hidden;"><img src="${p}" style="width:100%;height:150px;object-fit:cover;" /></div>`).join('')}
          </div>
        </div>
      ` : '';

      return `
        <div style="margin-bottom:25px;">
          <div style="display:flex;justify-content:space-between;background-color:#1E2A3A;color:#fff;padding:8px 12px;border-radius:4px 4px 0 0;">
            <div style="font-weight:700;font-size:12pt;">${sec.title || sec.name}</div>
            <div style="font-size:10pt;opacity:0.9;">Score: ${secAvg} / 5</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:15px;">
            <thead>
              <tr style="background-color:#F9FAFB;color:#4B5563;font-size:8pt;text-transform:uppercase;">
                <th style="padding:6px 12px;text-align:left;width:70%;">Checklist Item</th>
                <th style="padding:6px 12px;text-align:center;width:10%;">Score</th>
                <th style="padding:6px 12px;text-align:left;width:20%;">Observation</th>
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
          </table>
          ${photoHTML}
        </div>
      `;
    }).join('');

    let findingsHTML = issues.length > 0 ? `
      <div style="margin-bottom:30px;">
        <div style="background-color:#FEE2E2;color:#991B1B;padding:8px 12px;font-weight:700;font-size:12pt;border-radius:4px 4px 0 0;">Issues Requiring Attention</div>
        <table style="width:100%;border-collapse:collapse;font-size:10pt;border:1px solid #FECACA;">
          <tbody>
            ${issues.map(issue => `
              <tr style="border-bottom:1px solid #FEE2E2;">
                <td style="padding:8px 12px;width:60%;"><strong>${issue.text}</strong></td>
                <td style="padding:8px 12px;text-align:center;width:10%;font-weight:700;color:#991B1B;">${issue.score}/5</td>
                <td style="padding:8px 12px;color:#666;width:30%;">${issue.comment || 'No comment provided'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    let sigsHTML = '';
    if (safeInspection.inspector_sig) {
      sigsHTML += `<td style="text-align:center;width:50%;"><img src="${safeInspection.inspector_sig}" style="height:50px;margin-bottom:4px;" /><div style="border-bottom:1px solid #000;width:80%;margin:0 auto 4px auto;"></div><div style="font-weight:700;font-size:10pt;">${safeInspection.inspector_name || 'Inspector'}</div><div style="font-size:9pt;color:#666;">NemChem Inspector</div></td>`;
    }
    if (safeInspection.client_sig) {
      sigsHTML += `<td style="text-align:center;width:50%;"><img src="${safeInspection.client_sig}" style="height:50px;margin-bottom:4px;" /><div style="border-bottom:1px solid #000;width:80%;margin:0 auto 4px auto;"></div><div style="font-weight:700;font-size:10pt;">${safeInspection.client_mgr_name || 'Client Manager'}</div><div style="font-size:9pt;color:#666;">Client Representative</div></td>`;
    }

    const htmlContent = `
      <div style="font-family:Helvetica, Arial, sans-serif;color:#1F2937;padding:40px;font-size:11pt;line-height:1.4;width:210mm;background-color:#fff;box-sizing:border-box;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1E2A3A;padding-bottom:15px;margin-bottom:30px;">
          <div>
            <img src="logo.png" alt="NemChem Logo" style="height:50px;margin-bottom:4px;" />
            <div style="font-size:9pt;font-weight:700;color:#1E2A3A;text-transform:uppercase;letter-spacing:1px;">The Professional Choice</div>
          </div>
          <div style="text-align:right;font-size:9pt;color:#4B5563;">
            <div style="font-weight:700;color:#1E2A3A;font-size:11pt;">Quality Inspection Report</div>
            <div>Powered by FIMS</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:20px;">
          <div style="font-size:10pt;color:#4B5563;">
            <div style="font-size:8pt;text-transform:uppercase;font-weight:700;color:#9CA3AF;margin-bottom:4px;">Client / Site Information</div>
            <div><strong>Client:</strong> ${safeInspection.location_name || 'N/A'}</div>
            <div><strong>Address:</strong> Maputo, Moçambique</div>
            <div><strong>Attention:</strong> ${safeInspection.client_mgr_name || 'N/A'}</div>
          </div>
          <div style="text-align:right;font-size:10pt;color:#4B5563;">Maputo, ${formatDate(safeInspection.date)}</div>
        </div>
        <div style="margin-bottom:25px;padding-bottom:15px;border-bottom:1px solid #E5E7EB;">
          <div style="font-size:8pt;text-transform:uppercase;font-weight:700;color:#9CA3AF;">Subject</div>
          <div style="font-size:14pt;font-weight:700;color:#1E2A3A;">Relatório de Inspeção de Qualidade</div>
        </div>
        <div style="display:flex;gap:15px;margin-bottom:30px;">
          <div style="flex:1;background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:12px;text-align:center;">
            <div style="font-size:8pt;color:#666;text-transform:uppercase;">Quality Score</div>
            <div style="font-size:20px;font-weight:800;color:#1E2A3A;">${qualityScore} / 5</div>
          </div>
          <div style="flex:1;background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:12px;text-align:center;">
            <div style="font-size:8pt;color:#666;text-transform:uppercase;">Completion</div>
            <div style="font-size:20px;font-weight:800;color:#1E2A3A;">${completion}%</div>
          </div>
          <div style="flex:1;background-color:${issues.length > 0 ? '#FEE2E2' : '#F9FAFB'};border:1px solid #E5E7EB;border-radius:6px;padding:12px;text-align:center;">
            <div style="font-size:8pt;color:#666;text-transform:uppercase;">Findings</div>
            <div style="font-size:20px;font-weight:800;color:${issues.length > 0 ? '#991B1B' : '#1E2A3A'};">${issues.length}</div>
          </div>
        </div>
        ${areasHTML}
        ${findingsHTML}
        <div style="margin-top:40px;display:flex;justify-content:space-around;">
          <table style="width:100%;"><tr>${sigsHTML}</tr></table>
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

  // BULLETPROOF GROUPING LOGIC FOR UI
  const items = safeInspection.items || [];
  const sections = safeInspection.sections || [];
  const groupedItems = {};
  items.forEach(it => {
    const secId = it.section_id || 'uncategorized';
    if (!groupedItems[secId]) groupedItems[secId] = [];
    groupedItems[secId].push(it);
  });

  let sectionsToRender = [...sections];
  if (groupedItems['uncategorized'] && groupedItems['uncategorized'].length > 0) {
    sectionsToRender.push({ id: 'uncategorized', title: 'General Items' });
  }
  if (sectionsToRender.length === 0 && items.length > 0) {
    sectionsToRender = [{ id: 'all', title: 'Checklist Items' }];
    groupedItems['all'] = items;
  }

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
      </div>

      <div style={{ marginBottom: 16 }}>
        {sectionsToRender.map(sec => {
          const secItems = groupedItems[sec.id] || [];
          const secPhotos = sec.photos || [];
          return (
            <div key={sec.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
              <div style={{ background: "#1E2A3A", color: '#fff', padding: '12px 16px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>{sec.title || sec.name}</span>
              </div>
              <div style={{ padding: 16 }}>
                {secItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ fontSize: 13 }}>{item.text}</span>
                    <span style={{ fontWeight: 800, color: item.score <= 2 ? '#A32D2D' : item.score <= 3 ? '#BA7517' : '#0F6E56' }}>{item.score || '-'}</span>
                  </div>
                ))}
                
                {secPhotos.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px' }}>PHOTO EVIDENCE</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {secPhotos.map((p, idx) => (
                        <img key={idx} src={p} alt="Evidence" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'fixed', left: '-10000px', top: 0, width: '210mm', backgroundColor: '#fff' }}>
        {showPDF && <PrintableReport ref={reportRef} inspection={safeInspection} />}
      </div>
    </div>
  );
}

// /src/pages/InspectionForm.jsx
import { useState, useEffect } from "react";
import { Icon } from "../lib/icons";
import { calcScore, isItemComplete, getCategoryHealth, generateAISummary } from "../lib/helpers";
import { getClientTemplate } from "../data/constants";
import { supabase } from "../lib/supabase";
import { dataStore } from "../lib/dataStore";
import { authService } from "../services/authService";
import SignaturePad from "../components/SignaturePad";
import PhotoUploader from "../components/PhotoUploader";
import VoiceInput from "../components/VoiceInput";

export default function InspectionForm({ inspection, onSave, onSubmit, onBack, allInspections }) {
  const draftKey = `fims_draft_${inspection.id}`;

  const ensureTemplate = (insp) => {
    if (!insp.items || insp.items.length === 0) {
      const template = getClientTemplate(insp.location_name);
      const templateSections = template.sections || [];
      
      return {
        ...insp,
        items: templateSections.flatMap(s => 
          (s.items || s.itens || []).map(item => ({ 
            ...item, 
            section_id: s.id, 
            score: null, 
            comment: "", 
            photos: [] 
          }))
        ),
        sections: templateSections.map(s => ({ 
          id: s.id, 
          title: s.title || s.name,
          observation: "", 
          photos: [] 
        }))
      };
    }
    return insp;
  };

  const safeInspection = ensureTemplate(inspection);

  const loadDraft = (field, fallback) => {
    try {
      return fallback;
    } catch (e) {}
    return fallback;
  };

  const initialSections = () => {
    let s = loadDraft("sections", safeInspection.sections || []);
    return s;
  };

  const [items, setItems] = useState(() => loadDraft("items", safeInspection.items || []));

  // Fetch draft from IndexedDB on mount
  useEffect(() => {
    async function fetchDraft() {
      const savedDraft = await dataStore.get('drafts', draftKey);
      if (savedDraft) {
        if (savedDraft.items) setItems(savedDraft.items);
        if (savedDraft.sections) setSections(savedDraft.sections);
        if (savedDraft.notes) setNotes(savedDraft.notes);
        if (savedDraft.clientMgrName) setClientMgrName(savedDraft.clientMgrName);
        if (savedDraft.inspectorSig) setInspectorSig(savedDraft.inspectorSig);
        if (savedDraft.clientSig) setClientSig(savedDraft.clientSig);
      }
    }
    fetchDraft();
  }, [draftKey]);
  const [sections, setSections] = useState(() => initialSections());
  const [notes, setNotes] = useState(() => loadDraft("notes", safeInspection.notes || ""));
  const [expandedSections, setExpandedSections] = useState([]);
  const [saved, setSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const [clientMgrName, setClientMgrName] = useState(() => loadDraft("clientMgrName", safeInspection.client_mgr_name || ""));
  const [inspectorSig, setInspectorSig] = useState(() => loadDraft("inspectorSig", safeInspection.inspector_sig || ""));
  const [clientSig, setClientSig] = useState(() => loadDraft("clientSig", safeInspection.client_sig || ""));

  const [gpsCoords, setGpsCoords] = useState(safeInspection.gps_coords || null);
  const [showRefModal, setShowRefModal] = useState(null);
  const [refPhotos, setRefPhotos] = useState([]);

  const currentTemplate = getClientTemplate(safeInspection.location_name);
  const templateSections = currentTemplate.sections || [];

  // All sections start collapsed by default

  // Items are now populated correctly on creation

  useEffect(() => {
    const draftData = { items, sections, notes, clientMgrName, inspectorSig, clientSig };
    dataStore.set('drafts', draftKey, draftData); // Save to IndexedDB instead
  }, [items, sections, notes, clientMgrName, inspectorSig, clientSig, draftKey]);

  useEffect(() => {
    if (!gpsCoords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords(`${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`),
        (err) => console.warn("GPS Error:", err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [gpsCoords]);

  const setScore = (itemId, score) => setItems(prev => prev.map(i => i.id === itemId ? { ...i, score } : i));
  const setComment = (itemId, comment) => setItems(prev => prev.map(i => i.id === itemId ? { ...i, comment } : i));
  const setSectionObservation = (secId, text) => setSections(prev => prev.map(s => s.id === secId ? { ...s, observation: text } : s));

  const addPhoto = (entityId, base64) => {
    setItems(prev => prev.map(i => i.id === entityId ? { ...i, photos: [...(i.photos || []), base64] } : i));
    setSections(prev => prev.map(s => s.id === entityId ? { ...s, photos: [...(s.photos || []), base64] } : s));
  };

  const removePhoto = (entityId, index) => {
    setItems(prev => prev.map(i => i.id === entityId ? { ...i, photos: (i.photos || []).filter((_, idx) => idx !== index) } : i));
    setSections(prev => prev.map(s => s.id === entityId ? { ...s, photos: (s.photos || []).filter((_, idx) => idx !== index) } : s));
  };

  const handleShowRefImage = (itemId) => {
    if (!allInspections) return;
    const clientInsps = allInspections.filter(i => i.location_id === safeInspection.location_id && i.id !== safeInspection.id && i.score_pct !== null);
    if (clientInsps.length === 0) return alert("No previous inspections found for this client.");
    const lastInsp = clientInsps.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    
    const lastItem = lastInsp.items?.find(i => i.id === itemId);
    setRefPhotos(lastItem?.photos || []);
    setShowRefModal(itemId);
  };

  const photoCount = entityId => {
    const item = items.find(i => i.id === entityId);
    if (item) return item.photos?.length || 0;
    const sec = sections.find(s => s.id === entityId);
    return sec?.photos?.length || 0;
  };

  const totalComplete = items.filter(i => isItemComplete(i, photoCount(i.id))).length;
  const totalItems = items.length;

  const handleSave = () => {
    onSave({ ...safeInspection, items, sections, notes, status: "in_progress", client_mgr_name: clientMgrName, inspector_sig: inspectorSig, client_sig: clientSig, gps_coords: gpsCoords });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Haversine formula to calculate distance between two GPS points (in meters)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const handleSubmit = () => {
    const errors = [];
    
    // Geofencing & GPS Validation
    if (!gpsCoords) {
      errors.push({ section: 'GPS Location', id: 'gps', errors: ['GPS location is mandatory to submit the inspection.'] });
    } else {
      const [inspLat, inspLon] = gpsCoords.split(',').map(Number);
      if (safeInspection.loc_latitude && safeInspection.loc_longitude) {
        const distance = calculateDistance(inspLat, inspLon, safeInspection.loc_latitude, safeInspection.loc_longitude);
        if (distance > 500) {
          authService.logEvent('inspection.location_anomaly', { name: 'System', role: 'inspector' }, {
            inspection_id: safeInspection.id,
            location: safeInspection.location_name,
            distance_meters: Math.round(distance)
          });
        } else {
          authService.logEvent('inspection.gps_validated', { name: 'System', role: 'inspector' }, {
            inspection_id: safeInspection.id,
            location: safeInspection.location_name,
            distance_meters: Math.round(distance)
          });
        }
      }
    }
    
    templateSections.forEach(section => {
      const sItems = items.filter(i => i.section_id === section.id);
      const secData = sections.find(s => s.id === section.id) || { observation: "", photos: [] };
      const secErrors = [];

      if (!secData.observation || !secData.observation.trim()) {
        secErrors.push("Category observation is missing (Mandatory).");
      }

      const catPhotos = secData.photos || [];
      if (catPhotos.length < 3) {
        secErrors.push(`Category requires at least 3 photos (has ${catPhotos.length}).`);
      }

      sItems.forEach(item => {
        if (item.score === null) {
          secErrors.push(`Item unanswered: "${item.label || item.text}".`);
        } else if (item.score <= 3) {
          if (!item.comment || !item.comment.trim()) {
            secErrors.push(`Note missing for: "${item.label || item.text}" (Score ${item.score}).`);
          }
          const itemPhotos = item.photos || [];
          if (itemPhotos.length < 3) {
            secErrors.push(`3 photos required for: "${item.label || item.text}" (Score ${item.score}).`);
          }
        }
      });

      if (secErrors.length > 0) {
        errors.push({ section: section.title || section.name || 'Seção', id: section.id, errors: secErrors });
      }
    });

    if (!clientMgrName.trim()) errors.push({ section: "Signatures", id: "sig", errors: ["Client Supervisor Name is missing."] });
    if (!inspectorSig || !clientSig) errors.push({ section: "Signatures", id: "sig", errors: ["Signatures are not confirmed."] });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const clearedItems = items.map(i => i.qc_comment ? { ...i, qc_comment: null } : i);
    const pct = calcScore(clearedItems);
    const alertLevel = pct < 60 ? "critical" : pct < 75 ? "warning" : "ok";
    
    dataStore.remove('drafts', draftKey);
    onSubmit({ ...safeInspection, items: clearedItems, sections, notes, status: "submitted", score_pct: pct, alert_level: alertLevel, client_mgr_name: clientMgrName, inspector_sig: inspectorSig, client_sig: clientSig, gps_coords: gpsCoords });
  };

  const toggleSection = (secId) => {
    setExpandedSections(prev => {
      if (prev.includes(secId)) {
        return prev.filter(id => id !== secId);
      } else {
        return [...prev, secId];
      }
    });
  };

  const aiSummary = generateAISummary(items, safeInspection.location_name);

  return (
    <div>
      <div className="page-header" style={{ flexWrap: "wrap", gap: "16px" }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 8 }}>← Voltar</button>
          <div className="page-title">{safeInspection.location_name}</div>
          <div className="page-sub">
            Relatório de Inspeção · {safeInspection.date}
            {currentTemplate.clientName && (
              <span style={{ marginLeft: 12, fontSize: 11, color: '#6B7280' }}>
                📋 {currentTemplate.clientName} ({totalItems} itens)
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <div style={{ color: gpsCoords ? "#0F6E56" : "#888", fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              <Icon name="location" size={12} /> {gpsCoords ? "GPS Captured" : "Requesting GPS..."}
            </div>
            {gpsCoords && <a href={`https://maps.google.com/?q=${gpsCoords}`} target="_blank" rel="noreferrer" style={{ color: "#378ADD", fontSize: 10 }}>{gpsCoords}</a>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: "#888" }}>Progress</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{totalComplete}/{totalItems}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAIPanel(true)}><Icon name="star" size={13} /> AI Review</button>
        </div>
      </div>

      {validationErrors && (
        <div className="modal-overlay" onClick={() => setValidationErrors(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header" style={{ borderBottom: "1px solid #A32D2D" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#A32D2D" }}>⚠️ Inspection Cannot Be Submitted</div>
              <button className="icon-btn" onClick={() => setValidationErrors(null)}><Icon name="x" size={14} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, marginBottom: 16 }}>The following sections require attention:</p>
              {validationErrors.map((err, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 10, background: "#FCEBEB", borderRadius: 6, cursor: "pointer" }} 
                  onClick={() => { setExpandedSections([err.id]); setValidationErrors(null); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#A32D2D" }}>{err.section}</div>
                  <ul style={{ margin: "4px 0 0 20px", fontSize: 12, color: "#993C1D" }}>
                    {err.errors.map((e, idx) => <li key={idx}>{e}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setValidationErrors(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setValidationErrors(null)}>Review Missing Items</button>
            </div>
          </div>
        </div>
      )}

      {showAIPanel && (
        <div className="modal-overlay" onClick={() => setShowAIPanel(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><div style={{ fontSize: 15, fontWeight: 500 }}>🤖 AI Inspection Assistant</div><button className="icon-btn" onClick={() => setShowAIPanel(false)}><Icon name="x" size={14} /></button></div>
            <div className="modal-body">
              <div style={{ background: "#E6F1FB", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Executive Summary</div>
                <div style={{ fontSize: 12, color: "#444" }}>{aiSummary.summary}</div>
              </div>
              {aiSummary.recommendations && aiSummary.recommendations.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Recommended Corrective Actions:</div>
                  {aiSummary.recommendations.map((rec, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#444", marginBottom: 8, padding: 8, background: "#F8F7F4", borderRadius: 6 }} dangerouslySetInnerHTML={{ __html: rec.replace(/\*\*(.*?)\*\*/, '<strong>$1</strong>') }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        {templateSections.map(section => {
          const sItems = items.filter(i => i.section_id === section.id);
          const secData = sections.find(s => s.id === section.id) || { observation: "", photos: [] };
          const health = getCategoryHealth(sItems);
          const isExpanded = expandedSections.includes(section.id);
          const complete = sItems.filter(i => isItemComplete(i, photoCount(i.id))).length;
          
          return (
            <div key={section.id} className="card" style={{ marginBottom: 8, padding: 0, overflow: "hidden" }}>
              <div 
                style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: isExpanded ? "#1E2A3A" : "#fff", color: isExpanded ? "#fff" : "#1E2A3A" }}
                onClick={() => toggleSection(section.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, background: isExpanded ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.3)' : '#ddd'}` }}>
                    <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300, color: isExpanded ? '#fff' : '#1E2A3A' }}>{isExpanded ? '−' : '+'}</span>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{section.title || section.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 60, height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${health.health}%`, height: "100%", background: health.color }}></div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{complete}/{sItems.length}</span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: health.color, color: "#fff" }}>{health.risk}</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: 16 }}>
                  <div style={{ background: "#F8F7F4", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Category Observation <span className="required">*</span></label>
                    <VoiceInput 
                      multiline
                      placeholder="Mandatory: Enter overall observations for this category..." 
                      value={secData.observation} 
                      onChange={val => setSectionObservation(section.id, val)} 
                      style={{ minHeight: 60, resize: "vertical", marginBottom: 12, borderColor: !secData.observation.trim() ? "#A32D2D" : undefined }}
                    />
                    <label className="form-label" style={{ fontWeight: 600 }}>Category Photos (Min 3, Max 4) <span className="required">*</span></label>
                    <PhotoUploader 
                      photos={secData.photos || []} 
                      onAdd={(base64) => addPhoto(section.id, base64)} 
                      onRemove={(index) => removePhoto(section.id, index)} 
                    />
                  </div>

                  {sItems.map(item => {
                    const complete = isItemComplete(item, photoCount(item.id));
                    const scored = item.score !== null;
                    const isLowScore = scored && item.score <= 3;
                    const needsNote = isLowScore && !item.comment?.trim();
                    const needsPhotos = isLowScore && photoCount(item.id) < 3;
                    
                    return (
                      <div key={item.id} className={`checklist-item ${scored ? "scored" : ""} ${complete ? "complete" : needsNote || needsPhotos ? "needs-note" : ""}`}>
                        <div style={{ marginBottom: 8, fontSize: 13, display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ flex: 1 }}>{item.label || item.text}</span>
                          {complete && <Icon name="check" size={14} style={{ color: "#0F6E56", flexShrink: 0, marginTop: 1 }} />} 
                        </div>
                        
                        {item.qc_comment && (
                          <div style={{ background: "#FCEBEB", padding: 8, borderRadius: 6, marginBottom: 8, borderLeft: "3px solid #A32D2D" }}>
                            <div style={{ fontSize: 11, color: "#A32D2D", fontWeight: 600, marginBottom: 4 }}>⚠️ CORREÇÃO PEDIDA PELO SUPERVISOR:</div>
                            <div style={{ fontSize: 12, color: "#A32D2D" }}>{item.qc_comment}</div>
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            {[1, 2, 3, 4, 5].map(n => (
                              <button key={n} className={`score-btn score-${n} ${item.score === n ? "selected" : ""}`} onClick={() => setScore(item.id, n)}>{n}</button>
                            ))}
                          </div>
                          <button className="btn btn-secondary btn-sm" style={{ fontSize: 10, marginLeft: "auto" }} onClick={() => handleShowRefImage(item.id)}>
                            <Icon name="eye" size={12} /> Ref
                          </button>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <VoiceInput 
                            placeholder={isLowScore ? "Observations (Mandatory for low scores)..." : "Observations (Optional)..." }
                            value={item.comment || ""} 
                            onChange={val => setComment(item.id, val)} 
                            style={{ fontSize: 12, borderColor: needsNote ? "#A32D2D" : undefined }}
                          />
                        </div>

                        {isLowScore && needsPhotos && (
                          <div style={{ fontSize: 11, color: "#A32D2D", fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon name="alert" size={12} /> Photo evidence required for scores 1-3.
                          </div>
                        )}
                        <PhotoUploader 
                          photos={item.photos || []} 
                          onAdd={(base64) => addPhoto(item.id, base64)} 
                          onRemove={(index) => removePhoto(item.id, index)} 
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label className="form-label">Observações Gerais da Inspeção</label>
        <VoiceInput multiline placeholder="Notas adicionais sobre esta inspeção..." value={notes} onChange={setNotes} style={{ resize: "vertical" }} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "#1E2A3A" }}>Assinaturas Obrigatórias</div>
        <div className="form-group">
          <label className="form-label">Nome do Supervisor do Cliente <span className="required">*</span></label>
          <VoiceInput placeholder="Nome do gestor do cliente" value={clientMgrName} onChange={setClientMgrName} />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <SignaturePad label="Assinatura do Inspetor *" onSave={setInspectorSig} onClear={() => setInspectorSig("")} />
            {inspectorSig && <div style={{ fontSize: 11, color: "#0F6E56", marginBottom: 8 }}>✓ Assinatura do Inspetor capturada.</div>}
            {inspectorSig && <img src={inspectorSig} alt="Assinatura Inspetor" style={{ width: 100, height: 30, objectFit: 'contain' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 250 }}>
            <SignaturePad label="Assinatura do Cliente *" onSave={setClientSig} onClear={() => setClientSig("")} />
            {clientSig && <div style={{ fontSize: 11, color: "#0F6E56", marginBottom: 8 }}>✓ Assinatura do Cliente capturada.</div>}
            {clientSig && <img src={clientSig} alt="Assinatura Cliente" style={{ width: 100, height: 30, objectFit: 'contain' }}/>}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
        <button className="btn btn-secondary" onClick={handleSave}>{saved ? <><Icon name="check" size={13} />Guardado!</> : "Guardar Rascunho"}</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={totalComplete === 0}><Icon name="check" size={13} />Submeter Inspeção</button>
      </div>

      {showRefModal && (
        <div className="modal-overlay" onClick={() => setShowRefModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><div style={{ fontSize: 15, fontWeight: 500 }}>Reference Images (Last Inspection)</div><button className="icon-btn" onClick={() => setShowRefModal(null)}><Icon name="x" size={14} /></button></div>
            <div className="modal-body">
              {refPhotos.length === 0 ? <div style={{ textAlign: "center", color: "#888", padding: 20 }}>No reference photos found for this item.</div> : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {refPhotos.map((p, i) => (
                    <img key={i} src={p} alt="Ref" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6 }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Icon } from "../lib/icons";
import { supabase } from "../lib/supabase";

export default function LiveMap({ inspections, users, currentUser, onRefresh, refreshIntervalMs }) {
  const [selectedInspection, setSelectedInspection] = useState(null);

  // Filter inspections that have GPS coordinates
  const mappedInspections = inspections.filter(i => i.gps_coords && i.status !== 'pending_acceptance');

  // Create a Google Maps embed URL with all the pins
  const mapSrc = mappedInspections.length > 0 
    ? `https://maps.google.com/maps?q=${mappedInspections.map(i => i.gps_coords).join('&q=')}&z=12&output=embed`
    : `https://maps.google.com/maps?q=Maputo&z=12&output=embed`;

  return (
    <div>
      <div className="page-header" style={{ flexWrap: "wrap", gap: "16px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-title">🗺️ Field Operations Map</div>
          <div className="page-sub">Real-time GPS locations of completed inspections</div>
        </div>
        <div style={{ background: '#F3F4F6', padding: '8px 12px', borderRadius: 6, fontSize: 13, color: '#4B5563' }}>
          <strong>{mappedInspections.length}</strong> Inspections Mapped
        </div>
      </div>

      <div className="two-col" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Map Embed */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: '600px' }}>
          <iframe 
            src={mapSrc} 
            width="100%" 
            height="100%" 
            style={{ border: 0 }}
            loading="lazy"
            title="FIMS Live Map"
          ></iframe>
        </div>

        {/* Inspection List */}
        <div className="card" style={{ height: '600px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: 15, marginBottom: 12, color: "#1E2A3A" }}>Mapped Locations</h3>
          {mappedInspections.length === 0 ? (
            <div style={{ color: "#888", fontSize: 14 }}>No GPS data available yet. Complete an inspection to see it on the map.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mappedInspections.map(insp => (
                <div 
                  key={insp.id} 
                  onClick={() => setSelectedInspection(insp)}
                  style={{ 
                    padding: 10, 
                    borderRadius: 6, 
                    cursor: 'pointer', 
                    border: '1px solid #eee',
                    backgroundColor: selectedInspection?.id === insp.id ? '#E6F1FB' : '#fff'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1E2A3A' }}>{insp.location_name}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                    {insp.inspector_name || 'Unassigned'} · {insp.date}
                  </div>
                  <div style={{ fontSize: 10, color: '#378ADD', marginTop: 4 }}>
                    📍 {insp.gps_coords}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Inspection Detail Modal/Popup */}
      {selectedInspection && (
        <div className="modal-overlay" onClick={() => setSelectedInspection(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div style={{ fontSize: 15, fontWeight: 500 }}>{selectedInspection.location_name}</div>
              <button className="icon-btn" onClick={() => setSelectedInspection(null)}><Icon name="x" size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: 13, marginBottom: 8 }}><strong>Inspector:</strong> {selectedInspection.inspector_name || 'N/A'}</div>
              <div style={{ fontSize: 13, marginBottom: 8 }}><strong>Date:</strong> {selectedInspection.date}</div>
              <div style={{ fontSize: 13, marginBottom: 8 }}><strong>Score:</strong> {selectedInspection.score_pct || 0}%</div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>
                <strong>GPS:</strong> 
                <a href={`https://maps.google.com/?q=${selectedInspection.gps_coords}`} target="_blank" rel="noreferrer" style={{ color: '#378ADD', marginLeft: 4 }}>
                  {selectedInspection.gps_coords}
                </a>
              </div>
              <a href={`https://maps.google.com/?q=${selectedInspection.gps_coords}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

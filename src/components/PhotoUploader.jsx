import { useState } from "react";
import { Icon } from "../lib/icons";

export default function PhotoUploader({ photos, onAdd, onRemove }) {
  const [compressing, setCompressing] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        onAdd(base64);
        setCompressing(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      {photos.map((p, i) => (
        <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
          <img src={p} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
          <button 
            onClick={() => onRemove(i)} 
            style={{ 
              position: 'absolute', top: -4, right: -4, background: '#dc2626', color: '#fff', 
              borderRadius: '50%', width: 20, height: 20, border: 'none', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 
            }}
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      ))}
      
      {photos.length < 4 && !compressing && (
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Camera Button */}
          <label style={{ 
            width: 80, height: 80, border: '2px dashed #cbd5e1', borderRadius: 8, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: '#64748b', backgroundColor: '#f8fafc'
          }}>
            <Icon name="camera" size={20} />
            <span style={{ fontSize: 10, marginTop: 4 }}>Camera</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
          </label>

          {/* Gallery Button */}
          <label style={{ 
            width: 80, height: 80, border: '2px dashed #cbd5e1', borderRadius: 8, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: '#64748b', backgroundColor: '#f8fafc'
          }}>
            <Icon name="upload" size={20} />
            <span style={{ fontSize: 10, marginTop: 4 }}>Gallery</span>
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {compressing && (
        <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></div>
        </div>
      )}
    </div>
  );
}

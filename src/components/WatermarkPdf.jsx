import React, { useState } from 'react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import saveAs from 'file-saver';
import confetti from 'canvas-confetti';
import { 
  Stamp, UploadCloud, Download, Settings, Type, Palette 
} from 'lucide-react';

export default function WatermarkPdf({ setToast }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBuffer, setPdfBuffer] = useState(null);
  const [totalPages, setTotalPages] = useState(0);

  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.3);
  const [angle, setAngle] = useState(45);
  const [colorHex, setColorHex] = useState('#ef4444');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPdfFile(file);
    try {
      const buffer = await file.arrayBuffer();
      setPdfBuffer(buffer);
      const pdfDoc = await PDFDocument.load(buffer);
      setTotalPages(pdfDoc.getPageCount());
      setToast({ message: `Loaded PDF (${pdfDoc.getPageCount()} pages)`, type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error loading PDF: ' + err.message, type: 'error' });
    }
  };

  const hexToRgb = (hex) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
    return rgb(r, g, b);
  };

  const addWatermark = async () => {
    if (!pdfBuffer || !text.trim()) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const color = hexToRgb(colorHex);

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // Center calculation
        const x = (width - textWidth) / 2;
        const y = (height - textHeight) / 2;

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color,
          opacity: Number(opacity),
          rotate: degrees(Number(angle))
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `${pdfFile.name.replace(/\.[^/.]+$/, '')}_watermarked.pdf`);

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
      setToast({ message: 'Watermark applied & PDF downloaded!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error adding watermark: ' + err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Stamp style={{ color: 'var(--accent-secondary)' }} /> Watermark PDF Document
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Add custom text watermarks, logos, or stamps to protect your documents.
        </p>

        {/* Dropzone */}
        <label className="dropzone">
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            style={{ display: 'none' }}
          />
          <div className="dropzone-icon" style={{ color: 'var(--accent-secondary)', background: 'rgba(236, 72, 153, 0.15)' }}>
            <UploadCloud size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>
            {pdfFile ? pdfFile.name : 'Drop your PDF here or click to browse'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {pdfFile ? `${totalPages} Page(s)` : 'Select a PDF file to watermark'}
          </p>
        </label>
      </div>

      {pdfBuffer && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
          {/* Live Preview Box */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Watermark Visual Mockup</h3>
            
            <div style={{
              width: '260px',
              height: '360px',
              background: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              userSelect: 'none'
            }}>
              {/* Fake doc lines */}
              <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.15 }}>
                <div style={{ height: '12px', background: '#000', width: '60%', borderRadius: '3px' }} />
                <div style={{ height: '8px', background: '#000', width: '100%', borderRadius: '2px' }} />
                <div style={{ height: '8px', background: '#000', width: '90%', borderRadius: '2px' }} />
                <div style={{ height: '8px', background: '#000', width: '95%', borderRadius: '2px' }} />
                <div style={{ height: '8px', background: '#000', width: '70%', borderRadius: '2px' }} />
              </div>

              {/* Watermark text */}
              <span style={{
                color: colorHex,
                opacity: opacity,
                fontSize: `${fontSize / 2.2}px`,
                fontWeight: '800',
                fontFamily: 'sans-serif',
                transform: `rotate(${angle}deg)`,
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}>
                {text || 'WATERMARK'}
              </span>
            </div>
          </div>

          {/* Watermark Controls */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} style={{ color: 'var(--accent-secondary)' }} /> Watermark Settings
            </h3>

            <div className="form-group">
              <label className="form-label">Watermark Text</label>
              <input
                type="text"
                className="form-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Font Size ({fontSize}px)</label>
              <input
                type="range"
                min="20"
                max="90"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Opacity ({Math.round(opacity * 100)}%)</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rotation Angle ({angle}°)</label>
              <select className="form-select" value={angle} onChange={(e) => setAngle(Number(e.target.value))}>
                <option value={45}>45° Diagonal</option>
                <option value={-45}>-45° Reverse Diagonal</option>
                <option value={0}>0° Horizontal</option>
                <option value={90}>90° Vertical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Text Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{colorHex}</span>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: '1rem',
                background: 'linear-gradient(135deg, var(--accent-secondary) 0%, #be185d 100%)',
                boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
              }}
              onClick={addWatermark}
              disabled={isProcessing || !text.trim()}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" /> Applying Watermark...
                </>
              ) : (
                <>
                  <Download size={18} /> Apply & Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

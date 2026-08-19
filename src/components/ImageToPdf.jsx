import React, { useState } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import saveAs from 'file-saver';
import confetti from 'canvas-confetti';
import { 
  FileImage, UploadCloud, Trash2, ArrowUp, ArrowDown, 
  Download, Settings, CheckCircle2, RotateCw 
} from 'lucide-react';

export default function ImageToPdf({ setToast }) {
  const [images, setImages] = useState([]);
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState('small'); // none, small, medium
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      preview: URL.createObjectURL(file),
      rotation: 0
    }));

    setImages((prev) => [...prev, ...newImages]);
    setToast({ message: `Added ${files.length} image(s)`, type: 'success' });
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const moveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
  };

  const rotateImage = (id) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      )
    );
  };

  // Convert image file/preview into HTML Image and draw on canvas to handle rotation & formats
  const processImageToDataUrl = (imgObj) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const rad = (imgObj.rotation * Math.PI) / 180;
        const isRotatedQuarter = imgObj.rotation % 180 !== 0;

        const width = isRotatedQuarter ? img.height : img.width;
        const height = isRotatedQuarter ? img.width : img.height;

        canvas.width = width;
        canvas.height = height;

        ctx.translate(width / 2, height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = reject;
      img.src = imgObj.preview;
    });
  };

  const generatePdf = async () => {
    if (!images.length) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      const marginValues = {
        none: 0,
        small: 15,
        medium: 30
      };
      const marginSize = marginValues[margin] || 15;

      for (let i = 0; i < images.length; i++) {
        const imgObj = images[i];
        const dataUrl = await processImageToDataUrl(imgObj);
        const imageBytes = await fetch(dataUrl).then((res) => res.arrayBuffer());

        let pdfImage;
        try {
          pdfImage = await pdfDoc.embedJpg(imageBytes);
        } catch {
          pdfImage = await pdfDoc.embedPng(imageBytes);
        }

        let targetPageWidth, targetPageHeight;

        if (pageSize === 'fit') {
          targetPageWidth = pdfImage.width + marginSize * 2;
          targetPageHeight = pdfImage.height + marginSize * 2;
        } else {
          const dims = PageSizes[pageSize] || PageSizes.A4;
          if (orientation === 'landscape') {
            targetPageWidth = Math.max(dims[0], dims[1]);
            targetPageHeight = Math.min(dims[0], dims[1]);
          } else {
            targetPageWidth = Math.min(dims[0], dims[1]);
            targetPageHeight = Math.max(dims[0], dims[1]);
          }
        }

        const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);

        const availWidth = targetPageWidth - marginSize * 2;
        const availHeight = targetPageHeight - marginSize * 2;

        const scale = Math.min(
          availWidth / pdfImage.width,
          availHeight / pdfImage.height
        );

        const drawWidth = pdfImage.width * scale;
        const drawHeight = pdfImage.height * scale;

        const x = (targetPageWidth - drawWidth) / 2;
        const y = (targetPageHeight - drawHeight) / 2;

        page.drawImage(pdfImage, {
          x,
          y,
          width: drawWidth,
          height: drawHeight
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `Converted_Images_${Date.now()}.pdf`);

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      setToast({ message: 'PDF generated & downloaded successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error generating PDF: ' + err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileImage style={{ color: 'var(--accent-primary)' }} /> Image to PDF Converter
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Convert JPG, PNG, WebP or GIF photos into a single sleek PDF document with custom margins & orientation.
        </p>

        {/* Dropzone */}
        <label className="dropzone">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className="dropzone-icon">
            <UploadCloud size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>Drop images here or click to browse</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Supports PNG, JPG, JPEG, WebP, GIF (Select multiple files)
          </p>
        </label>
      </div>

      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          {/* Image List & Controls */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Selected Images ({images.length})</h3>
              <button 
                className="btn-danger" 
                onClick={() => setImages([])}
              >
                <Trash2 size={16} /> Clear All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={img.preview}
                        alt="preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: `rotate(${img.rotation}deg)`
                        }}
                      />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{img.name}</h4>
                      <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                        {img.size} • Page {idx + 1}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button className="btn-icon" title="Rotate 90°" onClick={() => rotateImage(img.id)}>
                      <RotateCw size={16} />
                    </button>
                    <button className="btn-icon" title="Move Up" disabled={idx === 0} onClick={() => moveImage(idx, -1)}>
                      <ArrowUp size={16} />
                    </button>
                    <button className="btn-icon" title="Move Down" disabled={idx === images.length - 1} onClick={() => moveImage(idx, 1)}>
                      <ArrowDown size={16} />
                    </button>
                    <button className="btn-icon" title="Remove" style={{ color: '#f87171' }} onClick={() => removeImage(img.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Page Settings */}
          <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} style={{ color: 'var(--accent-primary)' }} /> Page Settings
            </h3>

            <div className="form-group">
              <label className="form-label">Page Size</label>
              <select className="form-select" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Letter">US Letter (8.5 × 11 in)</option>
                <option value="fit">Fit to Image Size</option>
              </select>
            </div>

            {pageSize !== 'fit' && (
              <div className="form-group">
                <label className="form-label">Orientation</label>
                <select className="form-select" value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Page Margin</label>
              <select className="form-select" value={margin} onChange={(e) => setMargin(e.target.value)}>
                <option value="none">No Margin (0px)</option>
                <option value="small">Small Margin (15px)</option>
                <option value="medium">Medium Margin (30px)</option>
              </select>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={generatePdf}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" /> Generating PDF...
                </>
              ) : (
                <>
                  <Download size={18} /> Convert to PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

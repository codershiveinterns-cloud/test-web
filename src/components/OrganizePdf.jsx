import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import pdfjsLib from '../utils/pdfWorker';
import saveAs from 'file-saver';
import confetti from 'canvas-confetti';
import { 
  Grid, UploadCloud, RotateCw, Trash2, ArrowLeft, 
  ArrowRight, Download, Save 
} from 'lucide-react';

export default function OrganizePdf({ setToast }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBuffer, setPdfBuffer] = useState(null);
  const [pagesState, setPagesState] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  const canvasRefs = useRef({});

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoadingPdf(true);
    setPdfFile(file);

    try {
      const buffer = await file.arrayBuffer();
      setPdfBuffer(buffer);

      const pdfDoc = await PDFDocument.load(buffer);
      const total = pdfDoc.getPageCount();

      const pageItems = Array.from({ length: total }, (_, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        originalIndex: i,
        rotation: 0
      }));

      setPagesState(pageItems);

      // Render thumbnails with PDFjs
      const loadedPdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
      setTimeout(async () => {
        for (let i = 0; i < pageItems.length; i++) {
          const item = pageItems[i];
          const canvas = canvasRefs.current[item.id];
          if (!canvas) continue;
          const page = await loadedPdf.getPage(item.originalIndex + 1);
          const viewport = page.getViewport({ scale: 0.4 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      }, 100);

      setToast({ message: `Loaded ${total} pages for organization`, type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load PDF: ' + err.message, type: 'error' });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const rotatePage = (id) => {
    setPagesState((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  const deletePage = (id) => {
    setPagesState((prev) => prev.filter((item) => item.id !== id));
  };

  const movePage = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= pagesState.length) return;
    const updated = [...pagesState];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setPagesState(updated);
  };

  const saveOrganizedPdf = async () => {
    if (!pdfBuffer || !pagesState.length) return;
    setIsProcessing(true);

    try {
      const srcPdf = await PDFDocument.load(pdfBuffer);
      const newPdf = await PDFDocument.create();

      for (let i = 0; i < pagesState.length; i++) {
        const item = pagesState[i];
        const [copiedPage] = await newPdf.copyPages(srcPdf, [item.originalIndex]);

        if (item.rotation !== 0) {
          const currentRot = copiedPage.getRotation().angle || 0;
          copiedPage.setRotation(degrees((currentRot + item.rotation) % 360));
        }

        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `${pdfFile.name.replace(/\.[^/.]+$/, '')}_organized.pdf`);

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
      setToast({ message: 'Organized PDF saved successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error saving PDF: ' + err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Grid style={{ color: 'var(--accent-primary)' }} /> Organize & Rotate PDF Pages
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Reorder pages, rotate sideways pages, or delete unnecessary pages from your PDF document.
        </p>

        {/* Dropzone */}
        <label className="dropzone">
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            style={{ display: 'none' }}
          />
          <div className="dropzone-icon">
            <UploadCloud size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>
            {pdfFile ? pdfFile.name : 'Drop your PDF here or click to browse'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {pdfFile ? `${pagesState.length} active page(s)` : 'Select a PDF document to organize'}
          </p>
        </label>
      </div>

      {isLoadingPdf && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading pages for preview...</p>
        </div>
      )}

      {!isLoadingPdf && pagesState.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Organize Pages ({pagesState.length} Remaining)</h3>
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                Use controls on each thumbnail to rotate, move or delete pages.
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={saveOrganizedPdf}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" /> Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> Save & Download PDF
                </>
              )}
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1.5rem'
          }}>
            {pagesState.map((item, idx) => (
              <div
                key={item.id}
                className="thumbnail-card"
                style={{ padding: '0.75rem' }}
              >
                <div style={{
                  width: '100%',
                  height: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  background: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.5rem'
                }}>
                  <canvas
                    ref={(el) => (canvasRefs.current[item.id] = el)}
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      transform: `rotate(${item.rotation}deg)`,
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </div>

                <span style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Page {idx + 1} {item.rotation ? `(${item.rotation}°)` : ''}
                </span>

                <div className="thumbnail-controls">
                  <button className="btn-icon" title="Rotate 90°" onClick={() => rotatePage(item.id)}>
                    <RotateCw size={14} />
                  </button>
                  <button className="btn-icon" title="Move Left" disabled={idx === 0} onClick={() => movePage(idx, -1)}>
                    <ArrowLeft size={14} />
                  </button>
                  <button className="btn-icon" title="Move Right" disabled={idx === pagesState.length - 1} onClick={() => movePage(idx, 1)}>
                    <ArrowRight size={14} />
                  </button>
                  <button className="btn-icon" title="Delete Page" style={{ color: '#f87171' }} onClick={() => deletePage(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

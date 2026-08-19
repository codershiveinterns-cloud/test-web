import React, { useState, useRef, useEffect } from 'react';
import pdfjsLib from '../utils/pdfWorker';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import confetti from 'canvas-confetti';
import { 
  FileText, UploadCloud, Download, Image as ImageIcon, 
  CheckSquare, Square, Layers, RefreshCw 
} from 'lucide-react';

export default function PdfToImage({ setToast }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [format, setFormat] = useState('png'); // png, jpeg, webp
  const [scale, setScale] = useState(2); // 1.5 = medium, 2 = 300dpi high res
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  const canvasRefs = useRef({});

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoadingPdf(true);
    setPdfFile(file);
    setPages([]);
    setSelectedPages(new Set());

    try {
      const buffer = await file.arrayBuffer();
      const loadedPdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setPdfDoc(loadedPdf);

      const totalPages = loadedPdf.numPages;
      const pageIndices = Array.from({ length: totalPages }, (_, i) => i + 1);
      
      setPages(pageIndices);
      setSelectedPages(new Set(pageIndices)); // select all by default
      setToast({ message: `Loaded PDF with ${totalPages} page(s)`, type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load PDF file: ' + err.message, type: 'error' });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Render thumbnail onto canvas for preview
  useEffect(() => {
    if (!pdfDoc || !pages.length) return;

    pages.forEach(async (pageNum) => {
      const canvas = canvasRefs.current[pageNum];
      if (!canvas) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.5 }); // thumbnail scale

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page thumbnail:', err);
      }
    });
  }, [pdfDoc, pages]);

  const toggleSelectPage = (pageNum) => {
    setSelectedPages((prev) => {
      const updated = new Set(prev);
      if (updated.has(pageNum)) {
        updated.delete(pageNum);
      } else {
        updated.add(pageNum);
      }
      return updated;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages));
    }
  };

  const convertAndDownload = async () => {
    if (!pdfDoc || selectedPages.size === 0) return;
    setIsProcessing(true);

    try {
      const zip = new JSZip();
      const targetPages = Array.from(selectedPages).sort((a, b) => a - b);
      const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
      const ext = format === 'jpeg' ? 'jpg' : format;

      for (let i = 0; i < targetPages.length; i++) {
        const pageNum = targetPages[i];
        const page = await pdfDoc.getPage(pageNum);
        
        // High resolution render based on scale setting
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        const dataUrl = canvas.toDataURL(mimeType, 0.95);
        const base64Data = dataUrl.split(',')[1];

        const fileName = `${pdfFile.name.replace(/\.[^/.]+$/, '')}_page_${pageNum}.${ext}`;

        if (targetPages.length === 1) {
          // Single image download directly
          saveAs(dataUrl, fileName);
        } else {
          // Add to ZIP
          zip.file(fileName, base64Data, { base64: true });
        }
      }

      if (targetPages.length > 1) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${pdfFile.name.replace(/\.[^/.]+$/, '')}_extracted_images.zip`);
      }

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
      setToast({ message: `Converted ${targetPages.length} page(s) to ${format.toUpperCase()}`, type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error converting PDF: ' + err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ImageIcon style={{ color: 'var(--accent-secondary)' }} /> PDF to Image Converter
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Extract PDF pages as high-resolution PNG, JPG, or WebP images with single or ZIP batch export.
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
            {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : 'Select a PDF document to convert'}
          </p>
        </label>
      </div>

      {isLoadingPdf && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Rendering PDF pages...</p>
        </div>
      )}

      {!isLoadingPdf && pages.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          {/* Thumbnail Selector Grid */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Pages Preview ({selectedPages.size}/{pages.length} Selected)</h3>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={toggleSelectAll}>
                {selectedPages.size === pages.length ? <CheckSquare size={16} /> : <Square size={16} />}
                {selectedPages.size === pages.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="thumbnail-grid">
              {pages.map((pageNum) => {
                const isSelected = selectedPages.has(pageNum);
                return (
                  <div
                    key={pageNum}
                    className={`thumbnail-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelectPage(pageNum)}
                    style={{ cursor: 'pointer' }}
                  >
                    <canvas
                      ref={(el) => (canvasRefs.current[pageNum] = el)}
                      className="thumbnail-preview"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '600' }}>Page {pageNum}</span>
                      {isSelected ? <CheckSquare size={16} style={{ color: 'var(--accent-primary)' }} /> : <Square size={16} style={{ color: 'var(--text-subtle)' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Settings */}
          <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: 'var(--accent-secondary)' }} /> Export Options
            </h3>

            <div className="form-group">
              <label className="form-label">Image Format</label>
              <select className="form-select" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="png">PNG (Lossless & Transparent)</option>
                <option value="jpg">JPG (Compact File Size)</option>
                <option value="webp">WebP (Modern Next-Gen)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Image Resolution (DPI)</label>
              <select className="form-select" value={scale} onChange={(e) => setScale(Number(e.target.value))}>
                <option value={1.2}>Standard Quality (150 DPI)</option>
                <option value={2}>High Quality (300 DPI)</option>
                <option value={3}>Ultra Ultra HD (450 DPI)</option>
              </select>
            </div>

            <button
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: '1rem',
                background: 'linear-gradient(135deg, var(--accent-secondary) 0%, #db2777 100%)',
                boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
              }}
              onClick={convertAndDownload}
              disabled={isProcessing || selectedPages.size === 0}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" /> Converting Images...
                </>
              ) : (
                <>
                  <Download size={18} /> Convert & Download {selectedPages.size > 1 ? '(ZIP)' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

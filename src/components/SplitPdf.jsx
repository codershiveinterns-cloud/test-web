import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import pdfjsLib from '../utils/pdfWorker';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import confetti from 'canvas-confetti';
import { 
  Scissors, UploadCloud, Download, CheckSquare, Square, 
  Layers, AlertCircle 
} from 'lucide-react';

export default function SplitPdf({ setToast }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBuffer, setPdfBuffer] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [splitMode, setSplitMode] = useState('range'); // range, individual, select
  const [rangeInput, setRangeInput] = useState('');
  const [selectedPages, setSelectedPages] = useState(new Set());
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
      const numPages = pdfDoc.getPageCount();
      setTotalPages(numPages);
      setRangeInput(`1-${numPages}`);
      setSelectedPages(new Set(Array.from({ length: numPages }, (_, i) => i + 1)));

      // Render page thumbnails using pdfjs
      const loadedPdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
      
      // Render canvas thumbnails asynchronously
      setTimeout(async () => {
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const canvas = canvasRefs.current[pageNum];
          if (!canvas) continue;
          const page = await loadedPdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.4 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      }, 100);

      setToast({ message: `Loaded PDF with ${numPages} page(s)`, type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load PDF file: ' + err.message, type: 'error' });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const togglePageSelect = (pageNum) => {
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

  const parseRangeInput = (input, maxPage) => {
    const pagesToExtract = new Set();
    const parts = input.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(maxPage, Math.max(start, end));
          for (let i = min; i <= max; i++) {
            pagesToExtract.add(i);
          }
        }
      } else {
        const num = Number(part);
        if (!isNaN(num) && num >= 1 && num <= maxPage) {
          pagesToExtract.add(num);
        }
      }
    }
    return Array.from(pagesToExtract).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!pdfBuffer || totalPages === 0) return;
    setIsProcessing(true);

    try {
      const srcPdfDoc = await PDFDocument.load(pdfBuffer);

      if (splitMode === 'individual') {
        // Separate every page into individual PDF in a ZIP
        const zip = new JSZip();

        for (let i = 0; i < totalPages; i++) {
          const singlePdf = await PDFDocument.create();
          const [copiedPage] = await singlePdf.copyPages(srcPdfDoc, [i]);
          singlePdf.addPage(copiedPage);

          const pdfBytes = await singlePdf.save();
          const fileName = `${pdfFile.name.replace(/\.[^/.]+$/, '')}_page_${i + 1}.pdf`;
          zip.file(fileName, pdfBytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${pdfFile.name.replace(/\.[^/.]+$/, '')}_split_pages.zip`);
        setToast({ message: `Split into ${totalPages} individual PDF files!`, type: 'success' });
      } else {
        // Range mode or Interactive visual select mode
        const targetPageNums = splitMode === 'range' 
          ? parseRangeInput(rangeInput, totalPages)
          : Array.from(selectedPages).sort((a, b) => a - b);

        if (!targetPageNums.length) {
          setToast({ message: 'No valid pages selected to split!', type: 'error' });
          setIsProcessing(false);
          return;
        }

        const newPdf = await PDFDocument.create();
        const pageIndices = targetPageNums.map((p) => p - 1);
        const copiedPages = await newPdf.copyPages(srcPdfDoc, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, `${pdfFile.name.replace(/\.[^/.]+$/, '')}_extracted.pdf`);

        setToast({ message: `Extracted ${targetPageNums.length} page(s) successfully!`, type: 'success' });
      }

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error splitting PDF: ' + err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Scissors style={{ color: 'var(--accent-amber)' }} /> Split & Extract PDF Pages
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Extract page ranges or separate your PDF document into single-page PDF files.
        </p>

        {/* Dropzone */}
        <label className="dropzone">
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            style={{ display: 'none' }}
          />
          <div className="dropzone-icon" style={{ color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.15)' }}>
            <UploadCloud size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>
            {pdfFile ? pdfFile.name : 'Drop your PDF here or click to browse'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {pdfFile ? `${totalPages} Page(s) • ${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : 'Select a PDF document to split'}
          </p>
        </label>
      </div>

      {isLoadingPdf && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading PDF document...</p>
        </div>
      )}

      {!isLoadingPdf && totalPages > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          {/* Main Visual Thumbnails or Controls */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Page Thumbnails ({totalPages} Total)</h3>
              {splitMode === 'select' && (
                <button
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    if (selectedPages.size === totalPages) setSelectedPages(new Set());
                    else setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
                  }}
                >
                  {selectedPages.size === totalPages ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            <div className="thumbnail-grid">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isSelected = selectedPages.has(pageNum);
                return (
                  <div
                    key={pageNum}
                    className={`thumbnail-card ${splitMode === 'select' && isSelected ? 'selected' : ''}`}
                    onClick={() => splitMode === 'select' && togglePageSelect(pageNum)}
                    style={{ cursor: splitMode === 'select' ? 'pointer' : 'default' }}
                  >
                    <canvas ref={(el) => (canvasRefs.current[pageNum] = el)} className="thumbnail-preview" />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '600' }}>Page {pageNum}</span>
                      {splitMode === 'select' && (isSelected ? <CheckSquare size={16} style={{ color: 'var(--accent-amber)' }} /> : <Square size={16} style={{ color: 'var(--text-subtle)' }} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Split Mode Options */}
          <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: 'var(--accent-amber)' }} /> Split Mode
            </h3>

            <div className="form-group">
              <label className="form-label">Method</label>
              <select className="form-select" value={splitMode} onChange={(e) => setSplitMode(e.target.value)}>
                <option value="range">Extract Range (e.g. 1-3, 5)</option>
                <option value="select">Interactive Page Selection</option>
                <option value="individual">Extract Every Page to Single PDFs (ZIP)</option>
              </select>
            </div>

            {splitMode === 'range' && (
              <div className="form-group">
                <label className="form-label">Page Ranges</label>
                <input
                  type="text"
                  className="form-input"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="e.g. 1-3, 5, 8-10"
                />
                <p style={{ color: 'var(--text-subtle)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                  Use commas & dashes (1-{totalPages})
                </p>
              </div>
            )}

            <button
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: '1rem',
                background: 'linear-gradient(135deg, var(--accent-amber) 0%, #d97706 100%)',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
              }}
              onClick={handleSplit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" /> Splitting PDF...
                </>
              ) : (
                <>
                  <Download size={18} /> {splitMode === 'individual' ? 'Download ZIP' : 'Extract PDF'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

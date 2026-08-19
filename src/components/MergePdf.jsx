import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import saveAs from 'file-saver';
import confetti from 'canvas-confetti';
import { 
  FilePlus, UploadCloud, Trash2, ArrowUp, ArrowDown, 
  Download, Layers, CheckCircle2 
} from 'lucide-react';

export default function MergePdf({ setToast }) {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const parsedFiles = [];

    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(buffer);
        const pageCount = doc.getPageCount();

        parsedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          pageCount,
          buffer
        });
      } catch (err) {
        console.error('Error reading PDF:', err);
        setToast({ message: `Failed to load ${file.name}: invalid PDF`, type: 'error' });
      }
    }

    setPdfFiles((prev) => [...prev, ...parsedFiles]);
    if (parsedFiles.length) {
      setToast({ message: `Added ${parsedFiles.length} PDF(s)`, type: 'success' });
    }
  };

  const removeFile = (id) => {
    setPdfFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const moveFile = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pdfFiles.length) return;
    const updated = [...pdfFiles];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPdfFiles(updated);
  };

  const totalPages = pdfFiles.reduce((acc, f) => acc + f.pageCount, 0);

  const mergePdfs = async () => {
    if (pdfFiles.length < 2) return;
    setIsMerging(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfItem of pdfFiles) {
        const srcPdf = await PDFDocument.load(pdfItem.buffer);
        const copiedPages = await mergedPdf.copyPages(
          srcPdf,
          srcPdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      saveAs(blob, `Merged_Document_${Date.now()}.pdf`);

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      setToast({ message: `Successfully merged ${pdfFiles.length} PDFs into one!`, type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error merging PDFs: ' + err.message, type: 'error' });
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FilePlus style={{ color: 'var(--accent-cyan)' }} /> Merge PDF Documents
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Combine multiple PDF documents into a single organized file with custom ordering.
        </p>

        {/* Dropzone */}
        <label className="dropzone">
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <div className="dropzone-icon" style={{ color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.15)' }}>
            <UploadCloud size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>Drop PDFs here or click to browse</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Select multiple PDF files to combine
          </p>
        </label>
      </div>

      {pdfFiles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          {/* File List */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>PDF Files to Merge ({pdfFiles.length})</h3>
              <button className="btn-danger" onClick={() => setPdfFiles([])}>
                <Trash2 size={16} /> Clear All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pdfFiles.map((pdf, idx) => (
                <div
                  key={pdf.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(6, 182, 212, 0.15)',
                      color: 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{pdf.name}</h4>
                      <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                        {pdf.pageCount} Pages • {pdf.size}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button className="btn-icon" title="Move Up" disabled={idx === 0} onClick={() => moveFile(idx, -1)}>
                      <ArrowUp size={16} />
                    </button>
                    <button className="btn-icon" title="Move Down" disabled={idx === pdfFiles.length - 1} onClick={() => moveFile(idx, 1)}>
                      <ArrowDown size={16} />
                    </button>
                    <button className="btn-icon" title="Remove" style={{ color: '#f87171' }} onClick={() => removeFile(pdf.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Merge summary box */}
          <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: 'var(--accent-cyan)' }} /> Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Total Files:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{pdfFiles.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Total Pages:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{totalPages}</span>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0284c7 100%)',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)'
              }}
              onClick={mergePdfs}
              disabled={isMerging || pdfFiles.length < 2}
            >
              {isMerging ? (
                <>
                  <div className="spinner" /> Merging Files...
                </>
              ) : (
                <>
                  <Download size={18} /> Merge PDFs
                </>
              )}
            </button>
            {pdfFiles.length < 2 && (
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginTop: '0.75rem', textAlign: 'center' }}>
                Add at least 2 PDF files to merge.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

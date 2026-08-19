import React, { useState } from 'react';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import saveAs from 'file-saver';
import confetti from 'canvas-confetti';
import { 
  FileText, Edit3, Download, Sparkles, BookOpen 
} from 'lucide-react';

export default function TextToPdf({ setToast }) {
  const [docTitle, setDocTitle] = useState('Document Title');
  const [bodyText, setBodyText] = useState(
`Welcome to DocuPulse PDF Studio!

This document was created directly from text inside your web browser. 

Features & Capabilities:
- Fast client-side PDF document generation
- Standardized document formatting
- Clean typography and page layout
- No server uploads or data privacy concerns

Thank you for choosing DocuPulse PDF Studio.`
  );
  const [pageSize, setPageSize] = useState('A4');
  const [fontSize, setFontSize] = useState(12);
  const [isProcessing, setIsProcessing] = useState(false);

  const applyTemplate = (type) => {
    if (type === 'report') {
      setDocTitle('Project Status Report');
      setBodyText(
`EXECUTIVE SUMMARY
This report outlines the progress made over the past quarter.

KEY ACHIEVEMENTS
1. Completed client-side PDF converter architecture.
2. Achieved sub-second document processing speeds.
3. Enhanced browser privacy compliance with 100% offline conversions.

NEXT STEPS
- Continue expanding document utility tools.
- Maintain top-tier performance standards.`
      );
    } else if (type === 'invoice') {
      setDocTitle('INVOICE #INV-2026-001');
      setBodyText(
`BILLED TO:
Acme Technologies Inc.
100 Innovation Way, Suite 400

DESCRIPTION                     QTY      AMOUNT
------------------------------------------------
Web Application Development      1      $2,500.00
PDF Processing Engine            1      $1,200.00
------------------------------------------------
TOTAL DUE:                              $3,700.00

Payment Terms: Due within 30 days. Thank you for your business!`
      );
    } else if (type === 'notes') {
      setDocTitle('Meeting Notes & Action Items');
      setBodyText(
`DATE: August 19, 2026
TOPIC: Product Launch Checklist

ATTENDEES:
- Engineering Team
- Product Design Lead

NOTES:
- All features verified across desktop and mobile browsers.
- Dark theme aesthetics approved.`
      );
    }
  };

  const generatePdf = async () => {
    if (!docTitle.trim() && !bodyText.trim()) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const dims = PageSizes[pageSize] || PageSizes.A4;
      const pageWidth = dims[0];
      const pageHeight = dims[1];
      const margin = 50;
      const maxLineWidth = pageWidth - margin * 2;

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Draw Title
      if (docTitle.trim()) {
        const titleFontSize = fontSize + 10;
        currentPage.drawText(docTitle, {
          x: margin,
          y: currentY - titleFontSize,
          size: titleFontSize,
          font: boldFont,
          color: rgb(0.06, 0.06, 0.1)
        });
        currentY -= titleFontSize + 25;
      }

      // Draw horizontal line divider
      currentPage.drawLine({
        start: { x: margin, y: currentY },
        end: { x: pageWidth - margin, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.85)
      });
      currentY -= 20;

      // Draw Body Text (Split by lines & wrap text)
      const lines = bodyText.split('\n');

      for (const rawLine of lines) {
        if (currentY < margin + 40) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        if (rawLine.trim() === '') {
          currentY -= fontSize * 1.2;
          continue;
        }

        // Simple text wrapping logic
        const words = rawLine.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (testWidth > maxLineWidth && currentLine !== '') {
            currentPage.drawText(currentLine, {
              x: margin,
              y: currentY,
              size: fontSize,
              font,
              color: rgb(0.15, 0.15, 0.2)
            });
            currentY -= fontSize * 1.5;

            if (currentY < margin + 40) {
              currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
              currentY = pageHeight - margin;
            }
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          currentPage.drawText(currentLine, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0.15, 0.15, 0.2)
          });
          currentY -= fontSize * 1.5;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `${docTitle.replace(/[^a-zA-Z0-9]/g, '_')}_document.pdf`);

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
      setToast({ message: 'Document PDF generated & downloaded!', type: 'success' });
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
          <Edit3 style={{ color: 'var(--accent-emerald)' }} /> Text to PDF Generator
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Type or paste text, select templates, and create crisp formatted PDF documents instantly.
        </p>

        {/* Quick Templates */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', alignSelf: 'center' }}>Templates:</span>
          <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }} onClick={() => applyTemplate('report')}>
            <Sparkles size={14} style={{ color: 'var(--accent-emerald)' }} /> Status Report
          </button>
          <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }} onClick={() => applyTemplate('invoice')}>
            <BookOpen size={14} style={{ color: 'var(--accent-cyan)' }} /> Invoice
          </button>
          <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }} onClick={() => applyTemplate('notes')}>
            <Edit3 size={14} style={{ color: 'var(--accent-amber)' }} /> Meeting Notes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
        {/* Editor Inputs */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Document Title</label>
            <input
              type="text"
              className="form-input"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Enter document title..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Document Content</label>
            <textarea
              className="form-textarea"
              rows={12}
              style={{ fontFamily: 'monospace', fontSize: '0.9rem', resize: 'vertical' }}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Enter text or paste document content here..."
            />
          </div>
        </div>

        {/* Export & Options */}
        <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Formatting Options</h3>

          <div className="form-group">
            <label className="form-label">Page Size</label>
            <select className="form-select" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
              <option value="A4">A4 Standard</option>
              <option value="Letter">US Letter</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Font Size ({fontSize}pt)</label>
            <select className="form-select" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
              <option value={10}>Small (10pt)</option>
              <option value={12}>Standard (12pt)</option>
              <option value={14}>Large (14pt)</option>
            </select>
          </div>

          <button
            className="btn-primary"
            style={{
              width: '100%',
              marginTop: '1rem',
              background: 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
            onClick={generatePdf}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="spinner" /> Generating PDF...
              </>
            ) : (
              <>
                <Download size={18} /> Create & Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

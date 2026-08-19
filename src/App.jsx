import React, { useState } from 'react';
import { 
  FileImage, Image as ImageIcon, FilePlus, Scissors, Grid, 
  Stamp, Edit3, ShieldCheck, Zap, Lock, Sparkles, CheckCircle2 
} from 'lucide-react';

import ImageToPdf from './components/ImageToPdf';
import PdfToImage from './components/PdfToImage';
import MergePdf from './components/MergePdf';
import SplitPdf from './components/SplitPdf';
import OrganizePdf from './components/OrganizePdf';
import WatermarkPdf from './components/WatermarkPdf';
import TextToPdf from './components/TextToPdf';

export default function App() {
  const [activeTab, setActiveTab] = useState('image-to-pdf');
  const [toast, setToast] = useState(null);

  const triggerToast = (toastObj) => {
    setToast(toastObj);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const tools = [
    { id: 'image-to-pdf', label: 'Image to PDF', icon: FileImage, color: '#6366f1' },
    { id: 'pdf-to-image', label: 'PDF to Image', icon: ImageIcon, color: '#ec4899' },
    { id: 'merge-pdf', label: 'Merge PDF', icon: FilePlus, color: '#06b6d4' },
    { id: 'split-pdf', label: 'Split & Extract', icon: Scissors, color: '#f59e0b' },
    { id: 'organize-pdf', label: 'Organize Pages', icon: Grid, color: '#a855f7' },
    { id: 'watermark-pdf', label: 'Watermark', icon: Stamp, color: '#f43f5e' },
    { id: 'text-to-pdf', label: 'Text to PDF', icon: Edit3, color: '#10b981' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toast && (
        <div className="toast" style={{ borderColor: toast.type === 'error' ? '#ef4444' : 'var(--accent-primary)' }}>
          <CheckCircle2 size={20} style={{ color: toast.type === 'error' ? '#ef4444' : 'var(--accent-primary)' }} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header style={{
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(17, 17, 26, 0.8)',
        backdropFilter: 'blur(12px)',
        sticky: 'top',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: '800', lineHeight: 1 }}>
                DocuPulse <span className="gradient-text">PDF Studio</span>
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 500 }}>
                100% Browser Client-Side Conversion
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent-emerald)' }} />
              <span>Private & Safe</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={16} style={{ color: 'var(--accent-amber)' }} />
              <span>Instant Local Speed</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '2.5rem 2rem', flex: 1 }}>
        
        {/* Tool Category Selector Bar */}
        <div className="glass-card" style={{ padding: '0.75rem', marginBottom: '2.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', minWidth: 'max-content' }}>
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTab === tool.id;

              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTab(tool.id)}
                  style={{
                    background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: isActive ? `1px solid ${tool.color}` : '1px solid transparent',
                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'all 0.25s ease',
                    boxShadow: isActive ? `0 0 15px ${tool.color}33` : 'none'
                  }}
                >
                  <Icon size={18} style={{ color: tool.color }} />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tool Content */}
        {activeTab === 'image-to-pdf' && <ImageToPdf setToast={triggerToast} />}
        {activeTab === 'pdf-to-image' && <PdfToImage setToast={triggerToast} />}
        {activeTab === 'merge-pdf' && <MergePdf setToast={triggerToast} />}
        {activeTab === 'split-pdf' && <SplitPdf setToast={triggerToast} />}
        {activeTab === 'organize-pdf' && <OrganizePdf setToast={triggerToast} />}
        {activeTab === 'watermark-pdf' && <WatermarkPdf setToast={triggerToast} />}
        {activeTab === 'text-to-pdf' && <TextToPdf setToast={triggerToast} />}

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(11, 11, 18, 0.9)', padding: '2rem 0', marginTop: '3rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
            DocuPulse PDF Studio • All conversions happen 100% locally in your web browser. No files are uploaded to any server.
          </p>
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>🔒 Complete Privacy Guaranteed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// src/components/ExportModal.tsx
import React, { useState } from 'react';

type ExportFormat = 'separate' | 'single';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'separate' | 'single') => void;
  projectName: string;
  isExporting: boolean; 
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, projectName, isExporting }) => {
  const [selectedFormat, setSelectedFormat] = useState<'separate' | 'single'>('separate');

  if (!isOpen) {
    return null;
  }

  const handleExportClick = () => {
    onExport(selectedFormat);
  };

  return (
    <div className="modal-overlay" onClick={isExporting ? undefined : onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Export "{projectName}"</h2>
        <p>Please choose an export format:</p>
        
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="export-format"
              value="separate"
              checked={selectedFormat === 'separate'}
              onChange={() => setSelectedFormat('separate')}
            />
            Separate Files (.html, .css, .js)
          </label>
          <label>
            <input
              type="radio"
              name="export-format"
              value="single"
              checked={selectedFormat === 'single'}
              onChange={() => setSelectedFormat('single')}
            />
            Single HTML File (Embedded CSS & JS)
          </label>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="button-secondary" disabled={isExporting}>Cancel</button>
          <button onClick={handleExportClick} className="button-primary" disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;

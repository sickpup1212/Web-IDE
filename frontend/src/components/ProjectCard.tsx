import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';
import Dropdown, { DropdownMenuItem } from './Dropdown';
import ConfirmDialog from './ConfirmDialog';
import RenameModal from './RenameModal';
import '../styles/ProjectCard.css';

interface ProjectCardProps {
  project: Project;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
  onExport: (project: Project) => void;
}

/**
 * ProjectCard component displays a single project with its details
 * and an "Open" button to navigate to the editor
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onRename, onDelete, onExport }) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);

  // Format date to a readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get a preview of the HTML code (first 50 characters)
  const getCodePreview = (): string => {
    if (!project.html_code || project.html_code.trim() === '') {
      return 'No code yet...';
    }
    const preview = project.html_code.substring(0, 50);
    return preview.length === 50 ? `${preview}...` : preview;
  };

  // Handle opening the project in the editor
  const handleOpen = () => {
    navigate(`/editor/${project.id}`);
  };

  // Handle rename action - show rename modal
  const handleRenameClick = () => {
    setShowRenameModal(true);
  };

  // Handle rename confirmation
  const handleRenameConfirm = (newName: string) => {
    if (onRename) {
      onRename({...project, name: newName});
    }
    setShowRenameModal(false);
  };

  // Handle rename cancel
  const handleRenameCancel = () => {
    setShowRenameModal(false);
  };

  // Handle delete action - show confirmation dialog
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(project);
    }
    setShowDeleteDialog(false);
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  // Handle export action
  const handleExport = () => {
    if (onExport) {
      onExport(project);
    }
  };

  // Define dropdown menu items
  const dropdownItems: DropdownMenuItem[] = [
    {
      label: 'Open',
      onClick: handleOpen,
    },
    {
      label: 'Rename',
      onClick: handleRenameClick,
    },
    {
      label: 'Export',
      onClick: handleExport,
    },
    {
      label: 'Delete',
      onClick: handleDeleteClick,
      variant: 'danger',
    },
  ];

  return (
    <div className="project-card">
      <div className="project-card-header">
        <h3 className="project-card-title">{project.name}</h3>
        <Dropdown
          trigger={
            <div className="project-card-menu-icon" data-testid={`project-menu-${project.id}`}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </div>
          }
          items={dropdownItems}
          align="right"
        />
      </div>

      <div className="project-card-body">
        <div className="project-card-meta">
          <div className="project-card-date">
            <span className="meta-label">Created:</span>
            <span className="meta-value">{formatDate(project.created_at)}</span>
          </div>
          <div className="project-card-date">
            <span className="meta-label">Updated:</span>
            <span className="meta-value">{formatDate(project.updated_at)}</span>
          </div>
        </div>

        <div className="project-card-preview">
          <span className="preview-label">HTML Preview:</span>
          <code className="preview-code">{getCodePreview()}</code>
        </div>
      </div>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={showRenameModal}
        currentName={project.name}
        onRename={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />
    </div>
  );
};

export default ProjectCard;

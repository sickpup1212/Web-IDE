import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProjects, deleteProject, updateProject } from '../services/projects';
import { Project } from '../types';
import { useToast } from '../context/ToastContext';
import ProjectCard from '../components/ProjectCard';
import ExportModal from '../components/ExportModal';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [projectToExport, setProjectToExport] = useState<Project | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
        console.error('Error fetching projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Handle creating a new project
  const handleNewProject = () => {
    navigate('/editor');
  };

  // Handle retrying after error
  const handleRetry = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProject(project.id);  // Use deleteProject from your import
      const updatedProjects = await getProjects();  // Use getProjects to reload
      setProjects(updatedProjects);  // Update your state (whatever it's called)
      showToast('Project deleted successfully!', 'success');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showToast('Failed to delete project', 'error');
    }
  };

  const handleRenameProject = async (project: Project) => {
    try {
      await updateProject(project.id, { name: project.name });  // Use updateProject from your import
      const updatedProjects = await getProjects();  // Reload projects
      setProjects(updatedProjects);  // Update your state
      showToast('Project renamed successfully!', 'success');
    } catch (error) {
      console.error('Failed to rename project:', error);
      showToast('Failed to rename project', 'error');
    } 
  };
 
  const handleExportProject = (project: Project) => {
    setProjectToExport(project);
    setShowExportModal(true);
  };

  // And add the exportProject function:
  const exportProject = async (project: Project, options: { format: string }) => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}.${options.format}`;
    link.click();
    URL.revokeObjectURL(url);
  };





  const handleExportRequest = (project: Project) => {
    setProjectToExport(project);
  };

  const handleConfirmExport = async (format: 'separate' | 'single') => {
    if (!projectToExport) return;

    setIsExporting(true);
    try {
      await exportProject(projectToExport, { format });
      showToast('Project exported successfully!', 'success');
    } catch (error) {
      console.error('Failed to export project:', error);
      showToast('Failed to export project.', 'error');
    } finally {
      setIsExporting(false);
      setProjectToExport(null); // Close the modal
    }
  };

  return (
    <div className="dashboard">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">My Projects</h1>
          <div className="dashboard-actions">
            <button
              className="btn btn-primary"
              onClick={handleNewProject}
            >
              New Project
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Loading State */}
        {isLoading && (
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading projects...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="dashboard-error">
            <p className="error-message">{error}</p>
            <button className="btn btn-primary" onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="dashboard-empty">
            <h2>No projects yet</h2>
            <p>Create your first project to get started!</p>
            <button className="btn btn-primary" onClick={handleNewProject}>
              Create Project
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && !error && projects.length > 0 && (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
                onRename={handleRenameProject}
                onExport={handleExportProject}
              />
            ))}
          </div>
        )}
      </main>

      {/* ADD: Render the ExportModal component */}
      <ExportModal
        isOpen={projectToExport !== null}
        onClose={() => setProjectToExport(null)}
        onExport={handleConfirmExport}
        projectName={projectToExport?.name || ''}
        isExporting={isExporting}
      />
    </div>
  );
};

export default Dashboard;

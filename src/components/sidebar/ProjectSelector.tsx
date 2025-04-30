import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Clipboard, Trash2, Pencil, Check, X, Download, Upload } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { clsx } from 'clsx';
import { nanoid } from 'nanoid';
import { saveProject } from '../../services/dbService';

const ProjectSelector: React.FC = () => {
  const { 
    currentProject, 
    projects, 
    loadProject, 
    updateProject,
    createNewProject, 
    cloneProject, 
    deleteProject 
  } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (currentProject) {
      setEditName(currentProject.name);
    }
  }, [currentProject]);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);
  
  const handleSaveName = () => {
    if (currentProject && editName.trim()) {
      updateProject({
        ...currentProject,
        name: editName.trim()
      });
      setIsEditing(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(currentProject?.name || '');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.project-selector') && !target.closest('.project-name-edit')) {
        closeDropdown();
        if (isEditing) {
          setIsEditing(false);
          setEditName(currentProject?.name || '');
        }
      }
    };

    if (isOpen || isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isEditing, currentProject]);

  // Handle project export
  const handleExport = () => {
    if (!currentProject) return;
    
    const projectData = JSON.stringify(currentProject, null, 2);
    const blob = new Blob([projectData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    closeDropdown();
  };
  
  // Handle project import
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const projectData = JSON.parse(content);
        
        // Validate project data structure
        if (!projectData.id || !projectData.name || !Array.isArray(projectData.nodes)) {
          throw new Error('Invalid project file format');
        }
        
        // Create a new project with the imported data
        const importedProject = {
          ...projectData,
          id: nanoid(), // Generate new ID to avoid conflicts
          name: `${projectData.name} (Imported)`,
          created: Date.now(),
          updated: Date.now(),
        };
        
        await saveProject(importedProject);
        loadProject(importedProject.id);
      } catch (error) {
        console.error('Failed to import project:', error);
        alert('Failed to import project. Please check the file format.');
      }
    };
    reader.readAsText(file);
    closeDropdown();
  };

  if (!currentProject) {
    return null;
  }

  return (
    <div className="project-selector relative flex items-center space-x-2 z-10">
      {isEditing ? (
        <div className="project-name-edit flex items-center space-x-1">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleSaveName}
            className="p-1 text-green-400 hover:text-green-300 hover:bg-slate-700 rounded-md"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditName(currentProject.name);
            }}
            className="p-1 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={toggleDropdown}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            <span className="text-sm font-medium truncate max-w-[180px]">
              {currentProject.name}
            </span>
            <ChevronDown className={clsx("w-4 h-4 transition-transform", {
              "transform rotate-180": isOpen
            })} />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
            title="Rename project"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 z-10 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-md shadow-lg">
          <div className="py-1 max-h-[calc(100vh-200px)] overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  loadProject(project.id);
                  closeDropdown();
                }}
                className={clsx(
                  "w-full text-left px-4 py-2 text-sm hover:bg-slate-700",
                  {
                    "bg-slate-700": project.id === currentProject.id,
                  }
                )}
              >
                {project.name}
              </button>
            ))}
          </div>
          
          <div className="sticky bottom-0 border-t border-slate-700 py-1 bg-slate-800">
            <button
              onClick={() => {
                createNewProject();
                closeDropdown();
              }}
              className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-slate-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </button>
            <button
              onClick={() => {
                cloneProject(currentProject.id);
                closeDropdown();
              }}
              className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-slate-700"
            >
              <Clipboard className="w-4 h-4 mr-2" />
              Clone Project
            </button>
            <button
              onClick={handleExport}
              className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Project
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-slate-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Project
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
                onClick={(e) => {
                  // Reset input value to allow importing the same file again
                  (e.target as HTMLInputElement).value = '';
                }}
              />
            </button>
            {projects.length > 1 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this project?')) {
                    deleteProject(currentProject.id);
                    closeDropdown();
                  }
                }}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Project
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;
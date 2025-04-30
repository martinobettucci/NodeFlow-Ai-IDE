import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '../types';
import { 
  getAllProjects, 
  getProject, 
  saveProject, 
  deleteProject as dbDeleteProject
} from '../services/dbService';
import { createDefaultProject, cloneProject as utilsCloneProject } from '../utils/projectUtils';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loadProject: (id: string) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  createNewProject: () => Promise<void>;
  cloneProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load all projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const allProjects = await getAllProjects();
        setProjects(allProjects);
        
        // Load first project if we have any
        if (allProjects.length > 0) {
          const firstProject = await getProject(allProjects[0].id);
          if (firstProject) {
            setCurrentProject(firstProject);
          }
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, []);
  
  // Load a project by ID
  const loadProject = async (id: string) => {
    try {
      const project = await getProject(id);
      if (project) {
        setCurrentProject(project);
      }
    } catch (error) {
      console.error(`Failed to load project ${id}:`, error);
    }
  };
  
  // Update a project
  const updateProject = async (project: Project) => {
    try {
      await saveProject(project);
      setCurrentProject(project);
      
      // Update the project in the projects list
      setProjects((prevProjects) =>
        prevProjects.map((p) => (p.id === project.id ? project : p))
      );
    } catch (error) {
      console.error(`Failed to update project ${project.id}:`, error);
    }
  };
  
  // Create a new project
  const createNewProject = async () => {
    try {
      const newProjectId = await createDefaultProject();
      const newProject = await getProject(newProjectId);
      
      if (newProject) {
        setProjects((prevProjects) => [...prevProjects, newProject]);
        setCurrentProject(newProject);
      }
    } catch (error) {
      console.error('Failed to create new project:', error);
    }
  };
  
  // Clone a project
  const cloneProject = async (id: string) => {
    try {
      const project = await getProject(id);
      if (!project) return;
      
      const clonedProjectId = await utilsCloneProject(project);
      const clonedProject = await getProject(clonedProjectId);
      
      if (clonedProject) {
        setProjects((prevProjects) => [...prevProjects, clonedProject]);
        setCurrentProject(clonedProject);
      }
    } catch (error) {
      console.error(`Failed to clone project ${id}:`, error);
    }
  };
  
  // Delete a project
  const deleteProject = async (id: string) => {
    try {
      await dbDeleteProject(id);
      
      // Remove the project from the projects list
      const updatedProjects = projects.filter((p) => p.id !== id);
      setProjects(updatedProjects);
      
      // Load another project if we have any
      if (updatedProjects.length > 0) {
        const firstProject = await getProject(updatedProjects[0].id);
        if (firstProject) {
          setCurrentProject(firstProject);
        }
      } else {
        setCurrentProject(null);
        // Create a new default project if we have none
        createNewProject();
      }
    } catch (error) {
      console.error(`Failed to delete project ${id}:`, error);
    }
  };
  
  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        loadProject,
        updateProject,
        createNewProject,
        cloneProject,
        deleteProject,
      }}
    >
      {!isLoading && children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
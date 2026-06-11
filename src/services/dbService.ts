import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project, UserSettings } from '../types';
import { nanoid } from 'nanoid';

interface NodeEditorDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-name': string };
  };
  settings: {
    key: string;
    value: UserSettings & { id: string };
  };
}

// Database name and version
const DB_NAME = 'node-editor-db';
const DB_VERSION = 1;

// Get database connection
async function getDB(): Promise<IDBPDatabase<NodeEditorDB>> {
  return openDB<NodeEditorDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-name', 'name');
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });
}

// Check if database is set up
export async function checkDatabaseSetup(): Promise<boolean> {
  const db = await getDB();
  const tx = db.transaction('projects', 'readonly');
  const count = await tx.store.count();
  return count > 0;
}

// Projects
export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAllFromIndex('projects', 'by-name');
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function saveProject(project: Project): Promise<string> {
  const db = await getDB();
  const id = project.id || nanoid();
  const now = Date.now();
  
  const projectToSave: Project = {
    ...project,
    id,
    created: project.created || now,
    updated: now,
  };
  
  await db.put('projects', projectToSave);
  return id;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
}

// Settings
export async function getSettings(): Promise<UserSettings | undefined> {
  const db = await getDB();
  return db.get('settings', 'user-settings');
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'user-settings' });
}

// Local Storage API Keys (for quick access)
export function saveApiKeys(openaiKey: string, falaiKey: string): void {
  localStorage.setItem('openai_api_key', openaiKey);
  localStorage.setItem('fal_ai_key', falaiKey);
}

export function getApiKeys(): { openai: string; falai: string } {
  return {
    openai: localStorage.getItem('openai_api_key') || '',
    falai: localStorage.getItem('fal_ai_key') || '',
  };
}
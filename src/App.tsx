import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import NodeEditor from './components/NodeEditor';
import { BackendProvider } from './contexts/BackendContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { SettingsModal } from './components/settings/SettingsModal';
import { createDefaultProject } from './utils/projectUtils';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { checkDatabaseSetup } from './services/dbService';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check if database is set up, if not, set it up
        const isDbSetup = await checkDatabaseSetup();
        
        if (!isDbSetup) {
          // Create a default project if none exists
          await createDefaultProject();
        }
        
        // Delay a bit to prevent flash
        setTimeout(() => setIsLoading(false), 600);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };
    
    initApp();
  }, []);

  useEffect(() => {
    // First run: open the settings so the user can register a backend
    if (!isLoading && !localStorage.getItem('nodeflow_backends')) {
      setShowSettings(true);
    }
  }, [isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BackendProvider>
      <ProjectProvider>
        <Layout
          onOpenSettings={() => setShowSettings(true)}
        >
          <NodeEditor />
          {showSettings && (
            <SettingsModal
              initialTab="backends"
              onClose={() => setShowSettings(false)}
            />
          )}
        </Layout>
      </ProjectProvider>
    </BackendProvider>
  );
}

export default App;
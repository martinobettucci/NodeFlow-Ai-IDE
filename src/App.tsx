import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import NodeEditor from './components/NodeEditor';
import { APIKeyProvider } from './contexts/APIKeyContext';
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
    // Check if API keys are set up
    const checkAPIKeys = async () => {
      const openaiKey = localStorage.getItem('openai_api_key');
      const falKey = localStorage.getItem('fal_ai_key');
      
      if (!openaiKey || !falKey) {
        setShowSettings(true);
      }
    };
    
    if (!isLoading) {
      checkAPIKeys();
    }
  }, [isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <APIKeyProvider>
      <BackendProvider>
        <ProjectProvider>
          <Layout
            onOpenSettings={() => setShowSettings(true)}
          >
            <NodeEditor />
            {showSettings && (
              <SettingsModal
                initialTab="api_keys"
                onClose={() => setShowSettings(false)}
              />
            )}
          </Layout>
        </ProjectProvider>
      </BackendProvider>
    </APIKeyProvider>
  );
}

export default App;
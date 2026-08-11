import React, { useState, useEffect } from 'react';
import { Project, Revision } from './types';
import { getProjects, getRevisions } from './services/storage';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { WelcomePage } from './components/WelcomePage';
import { StreakPage } from './components/StreakPage';
import { CreateProjectPage } from './components/CreateProjectPage';
import { SettingsProvider } from './contexts/SettingsContext';

type View = 'welcome' | 'dashboard' | 'editor' | 'streak' | 'create';

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>('welcome');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);

  const loadData = () => {
    const loadedProjects = getProjects();
    setProjects(loadedProjects);
    
    if (currentProject) {
      setRevisions(getRevisions(currentProject.id));
      const updated = loadedProjects.find(p => p.id === currentProject.id);
      if (updated) setCurrentProject(updated);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStart = () => {
    if (projects.length === 0) {
      setView('create');
    } else {
      setView('dashboard');
    }
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setRevisions(getRevisions(project.id));
    setView('editor');
  };

  const handleBackToDashboard = () => {
    setCurrentProject(null);
    loadData();
    setView('dashboard');
  };

  const handleProjectCreated = () => {
    loadData();
    setView('dashboard');
  };

  switch (view) {
    case 'welcome':
      return <WelcomePage onStart={handleStart} />;
    case 'dashboard':
      return (
        <Dashboard 
          projects={projects} 
          onSelectProject={handleSelectProject} 
          onRefresh={loadData}
          onNavigateToCreate={() => setView('create')}
          onNavigateToStreak={() => setView('streak')}
        />
      );
    case 'create':
      return (
        <CreateProjectPage 
          onBack={() => setView('dashboard')} 
          onCreated={handleProjectCreated} 
        />
      );
    case 'streak':
      return (
        <StreakPage projects={projects} onBack={() => setView('dashboard')} />
      );
    case 'editor':
      return currentProject ? (
        <Editor 
          project={currentProject} 
          allProjects={projects}
          revisions={revisions}
          onBack={handleBackToDashboard}
          onUpdate={loadData}
          onSelectProject={handleSelectProject}
        />
      ) : (
        <Dashboard 
           projects={projects} 
           onSelectProject={handleSelectProject} 
           onRefresh={loadData}
           onNavigateToCreate={() => setView('create')}
           onNavigateToStreak={() => setView('streak')}
        />
      );
    default:
      return <WelcomePage onStart={handleStart} />;
  }
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;
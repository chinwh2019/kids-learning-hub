import { useState } from 'react';
import Dashboard from './components/Dashboard';
import MathAdventure from './games/math/MathAdventure';
import PhonicsQuest from './games/phonics/PhonicsQuest';
import ShapeExplorer from './games/shapes/ShapeExplorer';
import ParentDashboard from './components/ParentDashboard';

type ActiveView = 'dashboard' | 'math' | 'phonics' | 'shapes' | 'parent-dashboard';

export default function App() {
  const [view, setView] = useState<ActiveView>('dashboard');

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {view === 'dashboard' && <Dashboard onViewChange={setView} />}
      {view === 'math' && <MathAdventure onBack={() => setView('dashboard')} />}
      {view === 'phonics' && <PhonicsQuest onBack={() => setView('dashboard')} />}
      {view === 'shapes' && <ShapeExplorer onBack={() => setView('dashboard')} />}
      {view === 'parent-dashboard' && <ParentDashboard onBack={() => setView('dashboard')} />}
    </div>
  );
}

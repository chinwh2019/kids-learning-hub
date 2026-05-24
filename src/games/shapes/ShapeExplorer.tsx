import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearnerStore } from '../../store/learnerStore';
import { ArrowLeft, Star, Lock, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import RocketBuilder from './components/RocketBuilder';
import ShapeQuiz from './components/ShapeQuiz';

interface ShapeExplorerProps {
  onBack: () => void;
}

export interface SpaceLevel {
  id: string;
  name: string;
  difficulty: string;
  description: string;
  emoji: string;
  color: string;
  borderColor: string;
  shapesUsed: string[];
}

export const spaceLevels: SpaceLevel[] = [
  {
    id: 'solar_shuttle',
    name: 'Solar Shuttle',
    difficulty: 'Easy 🚀',
    description: 'Assemble a shiny solar explorer using rectangles, triangles, and circles!',
    emoji: '🚀',
    color: 'rgba(254, 243, 199, 0.15)',
    borderColor: '#f59e0b',
    shapesUsed: ['rectangle', 'triangle', 'circle']
  },
  {
    id: 'cosmic_cruiser',
    name: 'Cosmic Cruiser',
    difficulty: 'Medium 🌠',
    description: 'Build a double-winged scout with semicircles, triangles, and long rectangles!',
    emoji: '🛸',
    color: 'rgba(239, 246, 255, 0.15)',
    borderColor: '#3b82f6',
    shapesUsed: ['rectangle', 'triangle', 'circle', 'semicircle']
  },
  {
    id: 'galaxy_explorer',
    name: 'Galaxy Explorer',
    difficulty: 'Hard 🌌',
    description: 'Construct a multi-stage mothership utilizing circles, trapezoids, squares, and wings!',
    emoji: '🛰️',
    color: 'rgba(243, 232, 255, 0.15)',
    borderColor: '#a855f7',
    shapesUsed: ['rectangle', 'triangle', 'circle', 'semicircle', 'square', 'trapezoid']
  }
];

type ActiveShapesView = 'map' | 'builder' | 'quiz';

export default function ShapeExplorer({ onBack }: ShapeExplorerProps) {
  const { stars, completedShapeLevels } = useLearnerStore();
  const [activeView, setActiveView] = useState<ActiveShapesView>('map');
  const [selectedLevel, setSelectedLevel] = useState<SpaceLevel | null>(null);

  const handleSelectLevel = (level: SpaceLevel) => {
    setSelectedLevel(level);
    setActiveView('builder');
  };

  const handleLevelComplete = () => {
    setActiveView('map');
    setSelectedLevel(null);
  };

  // Logic to determine if a level is unlocked
  // Level 1 is always unlocked. Next ones unlock if the previous is completed.
  const isLevelUnlocked = (levelId: string): boolean => {
    if (levelId === 'solar_shuttle') return true;
    if (levelId === 'cosmic_cruiser') return !!completedShapeLevels['solar_shuttle'];
    if (levelId === 'galaxy_explorer') return !!completedShapeLevels['cosmic_cruiser'];
    return false;
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background stars */}
      <div className="bubble-bg b1" style={{ opacity: 0.15, background: '#fff' }}></div>
      <div className="bubble-bg b2" style={{ opacity: 0.1, background: '#a855f7', width: '200px', height: '200px' }}></div>
      <div className="bubble-bg b3" style={{ opacity: 0.15, background: '#3b82f6' }}></div>
      <div className="bubble-bg b4" style={{ opacity: 0.08, background: '#f59e0b', width: '150px', height: '150px' }}></div>

      {/* Header Bar */}
      <div 
        style={{
          width: '95%',
          maxWidth: '900px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          zIndex: 10
        }}
      >
        <button 
          onClick={activeView === 'map' ? onBack : () => setActiveView('map')}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '2px solid rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1.1em',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          <ArrowLeft size={20} /> {activeView === 'map' ? 'Hub' : 'Space Station'}
        </button>

        <h1 
          style={{ 
            fontSize: '2.4em', 
            color: '#fff', 
            textShadow: '0 0 20px rgba(168, 85, 247, 0.4), 0 0 4px rgba(168, 85, 247, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          🎨 Shape Explorer 🚀
        </h1>

        {/* Global Stars Counter */}
        <div 
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '6px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '1.2em',
            fontWeight: 900,
            color: '#fbbf24',
            border: '2px solid rgba(255,255,255,0.15)'
          }}
        >
          <Star size={20} fill="#fbbf24" color="#fbbf24" />
          <span>{stars} Stars</span>
        </div>
      </div>

      {/* Main Glass Panel Container */}
      <div 
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          width: '95%',
          maxWidth: '900px',
          borderRadius: '40px',
          padding: '30px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1)',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          zIndex: 5,
          minHeight: '520px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <AnimatePresence mode="wait">
          {/* LEVEL MAP */}
          {activeView === 'map' && (
            <motion.div 
              key="map" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              style={{ width: '100%', textAlign: 'center' }}
            >
              <div style={{ marginBottom: '35px' }}>
                <h2 style={{ fontSize: '2em', fontWeight: 900, color: '#a855f7' }}>🛸 Launchpad Blueprint Deck</h2>
                <p style={{ fontSize: '1.2em', color: '#94a3b8', fontWeight: 700 }}>
                  Build spaceships with shapes to blast off into outer space!
                </p>
              </div>

              {/* Levels Grid */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '25px',
                  width: '100%',
                  marginBottom: '40px'
                }}
              >
                {spaceLevels.map((level) => {
                  const unlocked = isLevelUnlocked(level.id);
                  const completed = !!completedShapeLevels[level.id];
                  const active = unlocked && !completed;

                  return (
                    <motion.div
                      key={level.id}
                      onClick={() => unlocked && handleSelectLevel(level)}
                      whileHover={unlocked ? { scale: 1.05, y: -6 } : {}}
                      whileTap={unlocked ? { scale: 0.96 } : {}}
                      style={{
                        background: unlocked ? level.color : 'rgba(255,255,255,0.03)',
                        border: `4px solid ${unlocked ? level.borderColor : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '35px',
                        padding: '30px 20px',
                        textAlign: 'center',
                        boxShadow: active 
                          ? `0 0 25px rgba(168, 85, 247, 0.25), inset 0 0 20px ${level.borderColor}1e` 
                          : '0 8px 24px rgba(0,0,0,0.15)',
                        cursor: unlocked ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        filter: unlocked ? 'none' : 'opacity(0.35)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Completed badge */}
                      {completed && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', color: '#10b981' }}>
                          <CheckCircle2 size={26} fill="#064e3b" />
                        </div>
                      )}

                      {/* Locked Overlay */}
                      {!unlocked && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', color: '#94a3b8' }}>
                          <Lock size={22} />
                        </div>
                      )}

                      {/* Sparkles if currently active */}
                      {active && (
                        <div style={{ position: 'absolute', top: '15px', left: '15px', color: '#fbbf24' }}>
                          <Sparkles size={20} />
                        </div>
                      )}

                      <div style={{ fontSize: '5.2em', marginBottom: '15px', filter: 'drop-shadow(0 8px 8px rgba(0,0,0,0.3))' }}>
                        {level.emoji}
                      </div>

                      <h3 style={{ fontSize: '1.6em', fontWeight: 900, color: '#fff', marginBottom: '5px' }}>
                        {level.name}
                      </h3>
                      
                      <span 
                        style={{
                          fontSize: '0.9em',
                          fontWeight: 800,
                          background: unlocked ? 'rgba(255,255,255,0.1)' : 'transparent',
                          color: unlocked ? '#cbd5e1' : '#64748b',
                          padding: '3px 12px',
                          borderRadius: '12px',
                          marginBottom: '12px'
                        }}
                      >
                        {level.difficulty}
                      </span>

                      <p style={{ fontSize: '0.95em', color: '#94a3b8', fontWeight: 600, lineHeight: 1.4 }}>
                        {level.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Shape Quiz Link at the Bottom */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveView('quiz')}
                style={{
                  background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
                  border: '3px dashed #8b5cf6',
                  borderRadius: '30px',
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                  maxWidth: '650px',
                  margin: '0 auto'
                }}
              >
                <div style={{ fontSize: '4.5em' }}>🌠🧠</div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.6em', fontWeight: 950, color: '#a78bfa' }}>Cosmic Shape Quiz</h3>
                  <p style={{ fontSize: '1.05em', color: '#94a3b8', fontWeight: 700 }}>
                    Test your shape knowledge (sides, corners) to win bonus stars!
                  </p>
                </div>
                <Award size={36} color="#fbbf24" style={{ marginLeft: 'auto' }} />
              </motion.div>
            </motion.div>
          )}

          {/* ACTIVE ROCKET BUILDER */}
          {activeView === 'builder' && selectedLevel && (
            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%' }}>
              <RocketBuilder level={selectedLevel} onComplete={handleLevelComplete} />
            </motion.div>
          )}

          {/* SHAPE QUIZ */}
          {activeView === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%' }}>
              <ShapeQuiz onComplete={() => setActiveView('map')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

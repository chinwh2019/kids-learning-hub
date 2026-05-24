import { motion } from 'framer-motion';
import { useLearnerStore } from '../../../store/learnerStore';
import { Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProgressMapProps {
  onSelectWave: (wave: number) => void;
}

interface Island {
  wave: number;
  title: string;
  focus: string;
  emoji: string;
  color: string;
  borderColor: string;
}

const islands: Island[] = [
  { wave: 1, title: 'Island 1', focus: 'Short a', emoji: '🐱', color: '#ffecb3', borderColor: '#ffc107' },
  { wave: 2, title: 'Island 2', focus: 'Short i / o', emoji: '🐶', color: '#c8e6c9', borderColor: '#4caf50' },
  { wave: 3, title: 'Island 3', focus: 'Short e / u', emoji: '🐞', color: '#bbdefb', borderColor: '#2196f3' },
  { wave: 4, title: 'Island 4', focus: 'Blends', emoji: '🥞', color: '#e1bee7', borderColor: '#9c27b0' },
  { wave: 5, title: 'Island 5', focus: 'Digraphs', emoji: '🦆', color: '#d1c4e9', borderColor: '#673ab7' },
  { wave: 6, title: 'Island 6', focus: 'Magic e', emoji: '🍰', color: '#f8bbd0', borderColor: '#e91e63' },
  { wave: 7, title: 'Island 7', focus: 'Heart Words', emoji: '💬', color: '#ffccbc', borderColor: '#ff5722' },
];

export default function ProgressMap({ onSelectWave }: ProgressMapProps) {
  const { phonicsWave } = useLearnerStore();

  return (
    <div style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2em', fontWeight: 900, color: '#ff5722', marginBottom: '8px' }}>
          🚢 Phonics Island Map
        </h2>
        <p style={{ fontSize: '1.2em', color: '#666', fontWeight: 700 }}>
          Unlock islands to learn spelling and reading! Current progress: Island {phonicsWave}
        </p>
      </div>

      {/* Grid of Islands */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '25px',
          width: '100%',
          maxWidth: '850px',
          padding: '10px'
        }}
      >
        {islands.map((island) => {
          const isUnlocked = island.wave <= phonicsWave;
          const isActive = island.wave === phonicsWave;
          const isCompleted = island.wave < phonicsWave;

          return (
            <motion.div
              key={island.wave}
              onClick={() => isUnlocked && onSelectWave(island.wave)}
              whileHover={isUnlocked ? { scale: 1.05, y: -6 } : {}}
              whileTap={isUnlocked ? { scale: 0.96 } : {}}
              style={{
                background: isUnlocked ? island.color : '#e0e0e0',
                border: `4px solid ${isUnlocked ? island.borderColor : '#9e9e9e'}`,
                borderRadius: '35px',
                padding: '25px 15px',
                textAlign: 'center',
                boxShadow: isActive 
                  ? '0 0 0 6px #facc15, 0 15px 30px rgba(0,0,0,0.1)' 
                  : '0 8px 20px rgba(0,0,0,0.08)',
                cursor: isUnlocked ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(0.7)',
                overflow: 'hidden'
              }}
            >
              {/* Completed badge */}
              {isCompleted && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', color: '#4caf50' }}>
                  <CheckCircle2 size={24} fill="#e8f5e9" />
                </div>
              )}

              {/* Locked overlay key */}
              {!isUnlocked && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', color: '#757575' }}>
                  <Lock size={20} />
                </div>
              )}

              {/* Floating sparks if active */}
              {isActive && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', color: '#fbbf24', animation: 'spin 6s infinite linear' }}>
                  <Sparkles size={20} />
                </div>
              )}

              <div style={{ fontSize: '4.5em', marginBottom: '10px', filter: 'drop-shadow(0 8px 4px rgba(0,0,0,0.1))' }}>
                {island.emoji}
              </div>

              <h3 style={{ fontSize: '1.5em', fontWeight: 900, color: '#333', marginBottom: '4px' }}>
                {island.title}
              </h3>
              
              <div 
                style={{ 
                  fontSize: '1.1em', 
                  fontWeight: 800, 
                  color: isUnlocked ? '#555' : '#777', 
                  background: 'rgba(255,255,255,0.5)',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  marginTop: '5px'
                }}
              >
                {island.focus}
              </div>

              {isActive && (
                <span 
                  style={{
                    background: '#f57c00',
                    color: 'white',
                    padding: '3px 12px',
                    fontSize: '0.8em',
                    fontWeight: 900,
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    marginTop: '10px',
                    letterSpacing: '0.5px'
                  }}
                >
                  Active 🚀
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

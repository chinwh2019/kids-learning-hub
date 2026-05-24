import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearnerStore } from '../../store/learnerStore';
import ProgressMap from './components/ProgressMap';
import SoundGarden from './components/SoundGarden';
import BlendBuilder from './components/BlendBuilder';
import WordSwap from './components/WordSwap';
import AudioSpelling from './components/AudioSpelling';
import StoryReader from './components/StoryReader';
import { ArrowLeft, Star } from 'lucide-react';
import { speakWord } from './utils/speech';

interface PhonicsQuestProps {
  onBack: () => void;
}

type ActiveGameView = 'map' | 'island-menu' | 'garden' | 'builder' | 'swap' | 'spelling' | 'story';

export default function PhonicsQuest({ onBack }: PhonicsQuestProps) {
  const { stars, phonicsWave, setPhonicsWave } = useLearnerStore();
  const [activeView, setActiveView] = useState<ActiveGameView>('map');
  const [selectedWave, setSelectedWave] = useState<number>(1);

  const handleSelectWave = (wave: number) => {
    setSelectedWave(wave);
    setActiveView('island-menu');
    speakWord(`Welcome to Island ${wave}!`);
  };

  const handleBackToMap = () => {
    setActiveView('map');
  };

  const handleGameComplete = () => {
    // If completing the highest unlocked wave, let's unlock the next wave as well!
    if (selectedWave === phonicsWave && phonicsWave < 7) {
      setPhonicsWave(phonicsWave + 1);
    }
    setActiveView('island-menu');
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}
    >
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
          onClick={activeView === 'map' ? onBack : activeView === 'island-menu' ? handleBackToMap : () => setActiveView('island-menu')}
          style={{
            background: 'rgba(255,255,255,0.25)',
            border: '2px solid rgba(255,255,255,0.4)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1.1em',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          <ArrowLeft size={20} /> {activeView === 'map' ? 'Hub' : activeView === 'island-menu' ? 'Map' : 'Island'}
        </button>

        <h1 style={{ fontSize: '2.4em', color: '#fff', textShadow: '3px 3px 0px rgba(0,0,0,0.15)' }}>
          🔤 Dino Phonics Quest 🦖
        </h1>

        {/* Global Stars Counter inside game */}
        <div 
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '6px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '1.2em',
            fontWeight: 900,
            color: '#ff9800',
            border: '2px solid #fff'
          }}
        >
          <Star size={20} fill="#ff9800" color="#ff9800" />
          <span>{stars} Stars</span>
        </div>
      </div>

      {/* Main Glass Panel Container */}
      <div 
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          width: '95%',
          maxWidth: '900px',
          borderRadius: '40px',
          padding: '25px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          border: '6px solid #fff',
          color: '#333',
          zIndex: 5,
          minHeight: '480px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <AnimatePresence mode="wait">
          {/* 1. MAP VIEW */}
          {activeView === 'map' && (
            <motion.div key="map" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ width: '100%' }}>
              <ProgressMap onSelectWave={handleSelectWave} />
            </motion.div>
          )}

          {/* 2. ISLAND MENU VIEW */}
          {activeView === 'island-menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ marginBottom: '25px' }}>
                <h2 style={{ fontSize: '2.2em', fontWeight: 900, color: '#f43f5e' }}>🌴 Island {selectedWave} Playground</h2>
                <p style={{ fontSize: '1.2em', color: '#666', fontWeight: 700 }}>Choose a phonics game to play!</p>
              </div>

              {/* Grid of active games on this island */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '20px',
                  padding: '10px'
                }}
              >
                {/* Game 1: Sound Garden */}
                <motion.div 
                  className="clickable-card"
                  onClick={() => setActiveView('garden')}
                  style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}
                >
                  <div style={{ fontSize: '4.5em', marginBottom: '10px' }}>🏡🔊</div>
                  <h3 style={{ fontSize: '1.5em', fontWeight: 900, color: '#1d4ed8' }}>Sound Garden</h3>
                  <p style={{ fontSize: '1em', color: '#555', fontWeight: 700, marginTop: '5px' }}>
                    Listen to letters, learn their sounds, and play a fun sound matching quiz!
                  </p>
                </motion.div>

                {/* Game 2: Blend Builder */}
                <motion.div 
                  className="clickable-card"
                  onClick={() => setActiveView('builder')}
                  style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}
                >
                  <div style={{ fontSize: '4.5em', marginBottom: '10px' }}>🚀🧩</div>
                  <h3 style={{ fontSize: '1.5em', fontWeight: 900, color: '#7e22ce' }}>Blend Builder</h3>
                  <p style={{ fontSize: '1em', color: '#555', fontWeight: 700, marginTop: '5px' }}>
                    Slide the rocket under sound tiles to blend letters together into complete words!
                  </p>
                </motion.div>

                {/* Game 3: Word Swap */}
                <motion.div 
                  className="clickable-card"
                  onClick={() => setActiveView('swap')}
                  style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}
                >
                  <div style={{ fontSize: '4.5em', marginBottom: '10px' }}>🔀🧪</div>
                  <h3 style={{ fontSize: '1.5em', fontWeight: 900, color: '#047857' }}>Word Swap Lab</h3>
                  <p style={{ fontSize: '1em', color: '#555', fontWeight: 700, marginTop: '5px' }}>
                    Swap tiles to change letters and magically transform one word into another!
                  </p>
                </motion.div>

                {/* Game 4: Spelling */}
                <motion.div 
                  className="clickable-card"
                  onClick={() => setActiveView('spelling')}
                  style={{ background: '#fef3c7', borderColor: '#fde68a' }}
                >
                  <div style={{ fontSize: '4.5em', marginBottom: '10px' }}>✍️🎒</div>
                  <h3 style={{ fontSize: '1.5em', fontWeight: 900, color: '#b45309' }}>Audio Spelling</h3>
                  <p style={{ fontSize: '1em', color: '#555', fontWeight: 700, marginTop: '5px' }}>
                    Listen to words spoken aloud and assemble the tiles in the correct spelling!
                  </p>
                </motion.div>

                {/* Game 5: Stories */}
                <motion.div 
                  className="clickable-card"
                  onClick={() => setActiveView('story')}
                  style={{ background: '#fdf2f8', borderColor: '#fbcfe8', gridColumn: 'span 1' }}
                >
                  <div style={{ fontSize: '4.5em', marginBottom: '10px' }}>📖🦖</div>
                  <h3 style={{ fontSize: '1.5em', fontWeight: 900, color: '#be185d' }}>Decodable Stories</h3>
                  <p style={{ fontSize: '1em', color: '#555', fontWeight: 700, marginTop: '5px' }}>
                    Read funny stories with our friendly dinosaurs and sound out tricky words!
                  </p>
                </motion.div>
              </div>

              <button
                onClick={handleBackToMap}
                style={{
                  background: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  padding: '12px 30px',
                  fontSize: '1.1em',
                  fontWeight: 900,
                  borderRadius: '25px',
                  cursor: 'pointer',
                  marginTop: '30px',
                  boxShadow: '0 4px 0 #cbd5e1'
                }}
              >
                🗺️ Back to Island Map
              </button>
            </motion.div>
          )}

          {/* 3. ACTIVE GAMES MOUNTINGS */}
          {activeView === 'garden' && (
            <motion.div key="garden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%' }}>
              <SoundGarden wave={selectedWave} onActivityComplete={handleGameComplete} />
            </motion.div>
          )}

          {activeView === 'builder' && (
            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%' }}>
              <BlendBuilder wave={selectedWave} onActivityComplete={handleGameComplete} />
            </motion.div>
          )}

          {activeView === 'swap' && (
            <motion.div key="swap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%' }}>
              <WordSwap wave={selectedWave} onActivityComplete={handleGameComplete} />
            </motion.div>
          )}

          {activeView === 'spelling' && (
            <motion.div key="spelling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%' }}>
              <AudioSpelling wave={selectedWave} onActivityComplete={handleGameComplete} />
            </motion.div>
          )}

          {activeView === 'story' && (
            <motion.div key="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%' }}>
              <StoryReader wave={selectedWave} onActivityComplete={handleGameComplete} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

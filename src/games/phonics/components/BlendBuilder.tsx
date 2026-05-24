import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordItem, words } from '../curriculum/words';
import { Phoneme, phonemes } from '../curriculum/phonemes';
import { speakPhoneme, speakWord } from '../utils/speech';
import SoundTile from './SoundTile';
import { Rocket, Star } from 'lucide-react';
import { useLearnerStore } from '../../../store/learnerStore';
import confetti from 'canvas-confetti';

interface BlendBuilderProps {
  wave: number;
  onActivityComplete: () => void;
}

export default function BlendBuilder({ wave, onActivityComplete }: BlendBuilderProps) {
  const { addStars, completePhonicsWord } = useLearnerStore();
  const waveWords = words.filter((w) => w.wave === wave && w.decodable);

  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [activeWord, setActiveWord] = useState<WordItem | null>(null);
  const [wordPhonemes, setWordPhonemes] = useState<Phoneme[]>([]);
  
  // Game states
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [lastTriggeredIdx, setLastTriggeredIdx] = useState<number>(-1);
  const [gameState, setGameState] = useState<'blend' | 'success' | 'all-done'>('blend');

  useEffect(() => {
    if (waveWords.length > 0 && currentWordIdx < waveWords.length) {
      const w = waveWords[currentWordIdx];
      setActiveWord(w);
      
      // Resolve graphemes to full phoneme objects
      const resolved = w.phonemes.map((pid) => {
        return phonemes.find((p) => p.id === pid) || {
          id: pid,
          grapheme: pid,
          sound: pid,
          synthFreq: 260,
          synthType: 'sine' as OscillatorType,
          tileType: 'consonant' as const,
          exampleWord: '',
          color: 'blue' as const,
          wave: 1,
        };
      });
      setWordPhonemes(resolved);
      setSliderValue(0);
      setLastTriggeredIdx(-1);
      setGameState('blend');
    } else if (waveWords.length > 0) {
      setGameState('all-done');
    }
  }, [currentWordIdx, wave]);

  // Handle single tile click
  const handleTileClick = (p: Phoneme) => {
    speakPhoneme(p);
  };

  // Watch slider value to trigger sound play as rocket crosses letters
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'blend' || wordPhonemes.length === 0) return;
    
    const val = parseInt(e.target.value);
    setSliderValue(val);

    const segmentSize = 80 / wordPhonemes.length; // Range from 0 to 80 is letters, 80 to 100 is final blend
    const crossIndex = Math.floor(val / segmentSize);

    if (crossIndex >= 0 && crossIndex < wordPhonemes.length) {
      if (crossIndex !== lastTriggeredIdx) {
        speakPhoneme(wordPhonemes[crossIndex]);
        setLastTriggeredIdx(crossIndex);
      }
    }

    // Trigger full blend when sliding reaches 98+
    if (val >= 97) {
      triggerSuccessBlend();
    }
  };

  const triggerSuccessBlend = () => {
    if (!activeWord) return;
    setGameState('success');
    setSliderValue(100);
    
    // Confetti burst
    confetti({ particleCount: 60, spread: 50 });
    
    // Pronounce full word
    setTimeout(() => {
      speakWord(activeWord.text);
      completePhonicsWord(activeWord.id); // Add stars state
    }, 300);
  };

  const handleNextWord = () => {
    if (currentWordIdx + 1 >= waveWords.length) {
      setGameState('all-done');
      addStars(5); // completion award
    } else {
      setCurrentWordIdx((prev) => prev + 1);
    }
  };

  if (waveWords.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No decodable words available for this island yet! 🦖
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '10px', textAlign: 'center' }}>
      {gameState !== 'all-done' && activeWord && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ fontSize: '1.6em', fontWeight: 900, color: '#9c27b0', marginBottom: '25px' }}>
            Slide the Rocket to blend the sounds! 🚀
          </p>

          {/* Word sound tiles in a row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: wordPhonemes.length > 5 ? (wordPhonemes.length > 6 ? '6px' : '10px') : '15px', marginBottom: '40px', flexWrap: 'wrap' }}>
            {wordPhonemes.map((p, idx) => {
              const tileSize = wordPhonemes.length > 5 ? (wordPhonemes.length > 6 ? 'sm' : 'md') : 'lg';
              return (
                <SoundTile
                  key={idx}
                  phoneme={p}
                  selected={lastTriggeredIdx === idx && gameState === 'blend'}
                  size={tileSize}
                  onClick={() => handleTileClick(p)}
                />
              );
            })}
          </div>

          {/* Starry Rocket Slider Track */}
          {gameState === 'blend' && (
            <div 
              style={{
                width: '90%',
                maxWidth: '500px',
                margin: '0 auto 30px auto',
                background: 'radial-gradient(circle, #2e1065 0%, #0f172a 100%)',
                padding: '16px 24px',
                borderRadius: '30px',
                boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.1)',
                border: '3px solid #6b21a8',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {/* Star sparkles decorations in background */}
              <div style={{ position: 'absolute', left: '15%', top: '25%', color: 'rgba(255,255,255,0.2)' }}>★</div>
              <div style={{ position: 'absolute', right: '25%', top: '65%', color: 'rgba(255,255,255,0.15)' }}>★</div>
              <div style={{ position: 'absolute', right: '10%', top: '20%', color: 'rgba(255,255,255,0.3)' }}>★</div>

              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={handleSliderChange}
                style={{
                  width: '100%',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: 'rgba(255,255,255,0.15)',
                  height: '10px',
                  borderRadius: '10px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                className="rocket-slider"
              />

              {/* Styled Rocket indicator moving on top */}
              <div 
                style={{
                  position: 'absolute',
                  left: `calc(15px + ${sliderValue * 0.88}%)`, // dynamically shifts rocket
                  top: 'calc(50% - 24px)',
                  fontSize: '2.5em',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  transform: 'rotate(45deg)',
                  transition: 'left 0.05s linear'
                }}
              >
                🚀
              </div>
            </div>
          )}

          {/* Visual Blend Completion Reward */}
          <AnimatePresence>
            {gameState === 'success' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                style={{
                  background: '#f0fdf4',
                  border: '3px solid #86efac',
                  borderRadius: '35px',
                  padding: '25px 35px',
                  display: 'inline-block',
                  margin: '10px auto 30px auto',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.06)'
                }}
              >
                {/* Visual Emoji */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ fontSize: '7em', lineHeight: 1, marginBottom: '15px' }}
                >
                  {activeWord.imageEmoji}
                </motion.div>
                
                <h1 style={{ fontSize: '3.8em', fontWeight: 950, letterSpacing: '2px', color: '#166534', textTransform: 'uppercase' }}>
                  {activeWord.text}
                </h1>
                <p style={{ fontSize: '1.3em', fontWeight: 800, color: '#15803d', marginTop: '5px' }}>
                  Amazing blending! +10 Stars 🌟
                </p>

                <button
                  onClick={handleNextWord}
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    fontSize: '1.2em',
                    fontWeight: 900,
                    borderRadius: '25px',
                    cursor: 'pointer',
                    boxShadow: '0 5px 0 #15803d',
                    marginTop: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Next Word <Rocket size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* COMPLETE VIEW */}
      {gameState === 'all-done' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ padding: '30px 10px' }}
        >
          <div style={{ fontSize: '7em', marginBottom: '15px' }}>🚀✨</div>
          <h2 style={{ fontSize: '2.5em', fontWeight: 900, color: '#9c27b0', marginBottom: '10px' }}>
            Ultimate Blender!
          </h2>
          <p style={{ fontSize: '1.4em', color: '#666', fontWeight: 800, maxWidth: '500px', margin: '0 auto 30px auto', lineHeight: 1.4 }}>
            You have successfully blended every word on this island! You are ready to read full sentences! +5 Stars 🌟
          </p>

          <button
            onClick={onActivityComplete}
            style={{
              background: '#4caf50',
              color: 'white',
              border: 'none',
              padding: '14px 35px',
              fontSize: '1.4em',
              fontWeight: 900,
              borderRadius: '30px',
              cursor: 'pointer',
              boxShadow: '0 6px 0 #2e7d32',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Star size={20} fill="white" /> Choose Next Game!
          </button>
        </motion.div>
      )}
    </div>
  );
}

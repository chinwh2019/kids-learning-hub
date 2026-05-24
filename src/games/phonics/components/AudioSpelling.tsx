import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordItem, words } from '../curriculum/words';
import { Phoneme, phonemes } from '../curriculum/phonemes';
import { speakPhoneme, speakWord } from '../utils/speech';
import SoundTile from './SoundTile';
import { Volume2, Award, ArrowRight } from 'lucide-react';
import { useLearnerStore } from '../../../store/learnerStore';
import confetti from 'canvas-confetti';

interface AudioSpellingProps {
  wave: number;
  onActivityComplete: () => void;
}

export default function AudioSpelling({ wave, onActivityComplete }: AudioSpellingProps) {
  const { addStars } = useLearnerStore();
  const waveWords = words.filter((w) => w.wave === wave && w.decodable);

  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [activeWord, setActiveWord] = useState<WordItem | null>(null);
  const [wordPhonemes, setWordPhonemes] = useState<Phoneme[]>([]);
  const [scrambledPhonemes, setScrambledPhonemes] = useState<{ id: string; phoneme: Phoneme; uniqueKey: number }[]>([]);
  
  // Spelling assembly state
  const [placedPhonemes, setPlacedPhonemes] = useState<(Phoneme | null)[]>([]);
  const [gameState, setGameState] = useState<'syllable' | 'spell' | 'success' | 'all-done'>('spell');
  const [tappedSyllables, setTappedSyllables] = useState<Record<number, boolean>>({});
  const [spellingFeedback, setSpellingFeedback] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    if (waveWords.length > 0 && currentWordIdx < waveWords.length) {
      const w = waveWords[currentWordIdx];
      setActiveWord(w);
      
      // Resolve correct phoneme sequence
      const resolved = w.phonemes.map((pid) => {
        return phonemes.find((p) => p.id === pid) || phonemes[0];
      });
      setWordPhonemes(resolved);
      
      // Prepare empty assembly slots
      setPlacedPhonemes(new Array(resolved.length).fill(null));

      // Scramble the phonemes for the choices drawer
      const scrambled = [...resolved]
        .sort(() => Math.random() - 0.5)
        .map((p, idx) => ({ id: p.id, phoneme: p, uniqueKey: idx }));
      setScrambledPhonemes(scrambled);

      setSpellingFeedback('');
      setIsChecking(false);
      setTappedSyllables({});

      if (w.syllables && w.syllables.length > 0) {
        setGameState('syllable');
        setTimeout(() => {
          speakWord(`Let's chunk it! Listen: ${w.text}`);
        }, 500);
      } else {
        setGameState('spell');
        setTimeout(() => {
          speakWord(`Spell ${w.text}`);
        }, 500);
      }
    } else if (waveWords.length > 0) {
      setGameState('all-done');
    }
  }, [currentWordIdx, wave]);

  const handleHearWordAgain = () => {
    if (activeWord) {
      if (gameState === 'syllable') {
        speakWord(`Let's chunk it! Listen: ${activeWord.text}`);
      } else {
        speakWord(`Spell ${activeWord.text}`);
      }
    }
  };

  const handleSyllableTap = (idx: number, syllable: string) => {
    speakWord(syllable);
    setTappedSyllables((prev) => {
      const next = { ...prev, [idx]: true };
      
      // If all syllables are tapped, transition to spell mode
      if (activeWord?.syllables && Object.keys(next).length === activeWord.syllables.length) {
        confetti({ particleCount: 25, spread: 35, colors: ['#60a5fa', '#34d399', '#fbbf24'] });
        setTimeout(() => {
          if (activeWord) {
            speakWord(`Now spell ${activeWord.text}`);
            setGameState('spell');
          }
        }, 1200);
      }
      
      return next;
    });
  };

  const handleTilePlacement = (item: { id: string; phoneme: Phoneme; uniqueKey: number }) => {
    if (gameState !== 'spell' || isChecking) return;

    // Find the first empty slot
    const firstEmptyIdx = placedPhonemes.findIndex((slot) => slot === null);
    if (firstEmptyIdx !== -1) {
      speakPhoneme(item.phoneme);
      
      const nextPlaced = [...placedPhonemes];
      nextPlaced[firstEmptyIdx] = item.phoneme;
      setPlacedPhonemes(nextPlaced);

      // Remove from choices drawer
      setScrambledPhonemes((prev) => prev.filter((c) => c.uniqueKey !== item.uniqueKey));

      // Auto check when all slots are filled
      const fullyAssembled = nextPlaced.every((slot) => slot !== null);
      if (fullyAssembled) {
        setIsChecking(true);
        setTimeout(() => {
          checkSpelling(nextPlaced as Phoneme[]);
        }, 800);
      }
    }
  };

  const handleRemoveTile = (placedIdx: number) => {
    if (gameState !== 'spell' || isChecking) return;

    const removedPhoneme = placedPhonemes[placedIdx];
    if (removedPhoneme) {
      speakPhoneme(removedPhoneme);

      const nextPlaced = [...placedPhonemes];
      nextPlaced[placedIdx] = null;
      setPlacedPhonemes(nextPlaced);

      // Add back to choices drawer
      setScrambledPhonemes((prev) => [
        ...prev,
        { id: removedPhoneme.id, phoneme: removedPhoneme, uniqueKey: Math.random() },
      ]);
    }
  };

  const checkSpelling = (assembled: Phoneme[]) => {
    if (!activeWord) return;

    const spelledText = assembled.map((p) => p.grapheme).join('');
    const targetText = wordPhonemes.map((p) => p.grapheme).join('');

    if (spelledText === targetText) {
      // Correct!
      setGameState('success');
      setSpellingFeedback('⭐ Super spelling! ⭐');
      confetti({ particleCount: 50, spread: 60 });
      addStars(3); // Star reward
      
      setTimeout(() => {
        speakWord(`${activeWord.text}! Fantastic!`);
      }, 500);
    } else {
      // Incorrect, reset assembly
      setSpellingFeedback("Oops! Let's listen again and try spelling it! 🌟");
      speakWord(`Spell ${activeWord.text}`);

      setTimeout(() => {
        // Return all placed tiles to options
        const resolved = activeWord.phonemes.map((pid) => {
          return phonemes.find((p) => p.id === pid) || phonemes[0];
        });
        setPlacedPhonemes(new Array(resolved.length).fill(null));
        
        const scrambled = [...resolved]
          .sort(() => Math.random() - 0.5)
          .map((p, idx) => ({ id: p.id, phoneme: p, uniqueKey: idx }));
        setScrambledPhonemes(scrambled);
        
        setIsChecking(false);
        setSpellingFeedback('');
      }, 2500);
    }
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
        No spelling challenges for this wave yet! Let's explore other games.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '10px', textAlign: 'center' }}>
      {gameState !== 'all-done' && activeWord && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ fontSize: '1.8em', fontWeight: 900, color: '#3b82f6', marginBottom: '20px' }}>
            {gameState === 'syllable' ? "Let's clap the chunks! 👏" : "Spell the word you hear! 🔊"}
          </p>

          <button
            onClick={handleHearWordAgain}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '1.1em',
              fontWeight: 900,
              borderRadius: '25px',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #1d4ed8',
              marginBottom: '35px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Volume2 size={18} fill="white" /> {gameState === 'syllable' ? 'Hear Word Again' : 'Hear Word Again'}
          </button>

          {/* 1. SYLLABLE MODE INTERACTIVE BOARD */}
          {gameState === 'syllable' && activeWord.syllables && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: '#f8fafc',
                border: '4px dashed #3b82f6',
                borderRadius: '35px',
                padding: '40px 30px',
                maxWidth: '600px',
                margin: '0 auto 30px auto',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.05)'
              }}
            >
              <div style={{ fontSize: '7.5em', lineHeight: 1, marginBottom: '20px' }}>
                {activeWord.imageEmoji}
              </div>
              <h3 style={{ fontSize: '2.2em', fontWeight: 900, color: '#1e3a8a', marginBottom: '10px' }}>
                Break it down! 🧩
              </h3>
              <p style={{ fontSize: '1.2em', color: '#64748b', fontWeight: 800, marginBottom: '35px' }}>
                Tap each bubble to hear the syllable chunks!
              </p>

              {/* Bubbles row */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', flexWrap: 'wrap' }}>
                {activeWord.syllables.map((syll, idx) => {
                  const colors = ['#38bdf8', '#4ade80', '#fbbf24', '#c084fc', '#f87171'];
                  const bubbleColor = colors[idx % colors.length];
                  const isTapped = tappedSyllables[idx];

                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      onClick={() => handleSyllableTap(idx, syll)}
                      whileHover={{ scale: 1.1, y: -4 }}
                      whileTap={{ scale: 0.9, y: 4 }}
                      animate={isTapped ? { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] } : {}}
                      style={{
                        minWidth: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        border: `4px solid ${bubbleColor}`,
                        background: isTapped ? 'white' : `rgba(241, 245, 249, 0.6)`,
                        boxShadow: isTapped ? `0 8px 0 ${bubbleColor}` : '0 4px 0 #cbd5e1',
                        color: '#1e293b',
                        fontSize: '2.2em',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        outline: 'none',
                        transition: 'box-shadow 0.1s, transform 0.1s'
                      }}
                    >
                      <span>{syll}</span>
                      {isTapped && (
                        <span style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          background: '#22c55e',
                          color: 'white',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          fontSize: '0.45em',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          border: '2px solid white'
                        }}>
                          ⭐
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 2. SLOTS ASSEMBLY BOARD (SPELL PHASE) */}
          {gameState === 'spell' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: wordPhonemes.length > 5 ? '8px' : '15px', marginBottom: '40px', flexWrap: 'wrap' }}>
              {placedPhonemes.map((p, idx) => {
                const isCompact = wordPhonemes.length > 5;
                return (
                  <div 
                    key={idx}
                    style={{
                      width: isCompact ? '60px' : '85px',
                      height: isCompact ? '60px' : '85px',
                      borderRadius: isCompact ? '16px' : '24px',
                      border: '4px dashed #94a3b8',
                      background: 'rgba(241, 245, 249, 0.5)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: p ? 'pointer' : 'default',
                      position: 'relative'
                    }}
                    onClick={() => p && handleRemoveTile(idx)}
                  >
                    {p ? (
                      <SoundTile phoneme={p} disabled={isChecking} size={isCompact ? 'sm' : 'md'} />
                    ) : (
                      <span style={{ fontSize: isCompact ? '1.1em' : '1.5em', color: '#94a3b8', fontWeight: 900 }}>?</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. LETTER CHOICES DRAWER (SPELL PHASE) */}
          {gameState === 'spell' && scrambledPhonemes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: '#f8fafc',
                border: '3px solid #cbd5e1',
                borderRadius: '35px',
                padding: '25px',
                display: 'inline-block',
                margin: '10px auto 20px auto',
                boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {scrambledPhonemes.map((item) => (
                  <SoundTile
                    key={item.uniqueKey}
                    phoneme={item.phoneme}
                    onClick={() => handleTilePlacement(item)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Success Banner */}
          <AnimatePresence>
            {gameState === 'success' && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  background: '#f0fdf4',
                  border: '3px solid #86efac',
                  borderRadius: '30px',
                  padding: '20px 30px',
                  display: 'inline-block',
                  margin: '15px 0'
                }}
              >
                <div style={{ fontSize: '6.5em', lineHeight: 1, marginBottom: '10px' }}>
                  {activeWord.imageEmoji}
                </div>
                <h2 style={{ fontSize: '3em', fontWeight: 900, color: '#166534' }}>
                  {activeWord.text}!
                </h2>
                <button
                  onClick={handleNextWord}
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    padding: '12px 25px',
                    fontSize: '1.2em',
                    fontWeight: 900,
                    borderRadius: '25px',
                    cursor: 'pointer',
                    boxShadow: '0 5px 0 #15803d',
                    marginTop: '15px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Next spelling <ArrowRight size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spelling feedback messages */}
          <div style={{ fontSize: '1.6em', fontWeight: 'bold', height: '40px', marginTop: '15px', color: '#ff5722' }}>
            {spellingFeedback}
          </div>

        </motion.div>
      )}

      {/* ALL COMPLETED */}
      {gameState === 'all-done' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ padding: '30px 10px' }}
        >
          <div style={{ fontSize: '7em', marginBottom: '15px' }}>🎒🏅</div>
          <h2 style={{ fontSize: '2.5em', fontWeight: 900, color: '#3b82f6', marginBottom: '10px' }}>
            Master Speller!
          </h2>
          <p style={{ fontSize: '1.4em', color: '#666', fontWeight: 800, maxWidth: '500px', margin: '0 auto 30px auto', lineHeight: 1.4 }}>
            You spelled every word perfectly! Your spelling is stellar! You earned **5 Bonus Stars**!
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
            <Award size={20} /> Choose Next Game!
          </button>
        </motion.div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordItem, words } from '../curriculum/words';
import { Phoneme, phonemes } from '../curriculum/phonemes';
import { speakPhoneme, speakWord } from '../utils/speech';
import SoundTile from './SoundTile';
import { Award, CheckCircle } from 'lucide-react';
import { useLearnerStore } from '../../../store/learnerStore';
import confetti from 'canvas-confetti';

interface WordSwapProps {
  wave: number;
  onActivityComplete: () => void;
}

interface SwapChallenge {
  sourceWord: WordItem;
  targetWord: WordItem;
  changedIndex: number; // 0, 1, or 2
  replacementPhoneme: Phoneme;
  alternatives: Phoneme[];
}

export default function WordSwap({ wave, onActivityComplete }: WordSwapProps) {
  const { addStars } = useLearnerStore();

  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const [currentChallenge, setCurrentChallenge] = useState<SwapChallenge | null>(null);
  
  // Game interaction states
  const [gameState, setGameState] = useState<'prompt' | 'options' | 'success' | 'all-done'>('prompt');
  const [swappedPhonemes, setSwappedPhonemes] = useState<Phoneme[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [swapFeedback, setSwapFeedback] = useState<string>('');

  const generateSwapChallenges = (): SwapChallenge[] => {
    // 1. Get all decodable words up to the current wave
    const allowedWords = words.filter((w) => w.decodable && w.wave <= wave);

    // 2. Find all pairs that differ by EXACTLY one phoneme
    const validPairs: { source: WordItem; target: WordItem; changedIndex: number }[] = [];

    for (let i = 0; i < allowedWords.length; i++) {
      const w1 = allowedWords[i];
      for (let j = 0; j < allowedWords.length; j++) {
        if (i === j) continue;
        const w2 = allowedWords[j];

        // Must have the same number of phonemes
        if (w1.phonemes.length !== w2.phonemes.length) continue;

        // Count differences
        let diffCount = 0;
        let diffIdx = -1;
        for (let k = 0; k < w1.phonemes.length; k++) {
          if (w1.phonemes[k] !== w2.phonemes[k]) {
            diffCount++;
            diffIdx = k;
          }
        }

        // Must differ by EXACTLY one phoneme
        if (diffCount === 1) {
          validPairs.push({
            source: w1,
            target: w2,
            changedIndex: diffIdx,
          });
        }
      }
    }

    // 3. Filter pairs to prefer those where at least one word belongs to the current wave
    const currentWavePairs = validPairs.filter(
      (p) => p.source.wave === wave || p.target.wave === wave
    );

    // Use current wave pairs if we have enough, otherwise blend in previous ones to guarantee variety
    let selectedPairs = [...currentWavePairs];
    if (selectedPairs.length < 3) {
      const otherPairs = validPairs.filter(
        (p) => p.source.wave !== wave && p.target.wave !== wave
      );
      // shuffle and take up to what we need
      const shuffledOthers = [...otherPairs].sort(() => Math.random() - 0.5);
      selectedPairs = [...selectedPairs, ...shuffledOthers].slice(0, 4);
    } else {
      // Shuffle and take a child-friendly length (3-4 challenges)
      selectedPairs = selectedPairs.sort(() => Math.random() - 0.5).slice(0, 4);
    }

    // If no pairs found at all, let's fall back to safe default Wave 1 challenges so the game doesn't crash
    if (selectedPairs.length === 0) {
      const cat = words.find((w) => w.id === 'cat')!;
      const mat = words.find((w) => w.id === 'mat')!;
      const sat = words.find((w) => w.id === 'sat')!;

      const m = phonemes.find((p) => p.id === 'm')!;
      const s = phonemes.find((p) => p.id === 's')!;
      const r = phonemes.find((p) => p.id === 'r')!;

      return [
        { sourceWord: cat, targetWord: mat, changedIndex: 0, replacementPhoneme: m, alternatives: [m, s, r] },
        { sourceWord: mat, targetWord: sat, changedIndex: 0, replacementPhoneme: s, alternatives: [s, m, r] },
      ];
    }

    // 4. Map the selected pairs to SwapChallenges
    return selectedPairs.map((pair) => {
      const repId = pair.target.phonemes[pair.changedIndex];
      const repPhoneme = phonemes.find((p) => p.id === repId) || phonemes[0];

      // To make alternative options, find phonemes of the SAME tileType if possible,
      // otherwise any phonemes, avoiding duplicates
      const targetType = repPhoneme.tileType;
      let altPool = phonemes.filter(
        (p) => p.id !== repId && p.tileType === targetType && p.grapheme.length === repPhoneme.grapheme.length
      );

      if (altPool.length < 2) {
        altPool = phonemes.filter((p) => p.id !== repId);
      }

      // Shuffle and take 2 distractors
      const selectedAlts = altPool.sort(() => Math.random() - 0.5).slice(0, 2);

      // Alternatives array should contain the correct replacement + 2 distractors, shuffled
      const alternatives = [repPhoneme, ...selectedAlts].sort(() => Math.random() - 0.5);

      return {
        sourceWord: pair.source,
        targetWord: pair.target,
        changedIndex: pair.changedIndex,
        replacementPhoneme: repPhoneme,
        alternatives,
      };
    });
  };

  const [challenges, setChallenges] = useState<SwapChallenge[]>([]);

  useEffect(() => {
    const list = generateSwapChallenges();
    setChallenges(list);
    setChallengeIndex(0);
  }, [wave]);

  useEffect(() => {
    if (challenges.length > 0 && challengeIndex < challenges.length) {
      const chal = challenges[challengeIndex];
      setCurrentChallenge(chal);
      
      // Resolve source phonemes
      const resolved = chal.sourceWord.phonemes.map((pid) => {
        return phonemes.find((p) => p.id === pid) || phonemes[0];
      });

      setSwappedPhonemes(resolved);
      setSelectedIndex(null);
      setSwapFeedback('');
      setGameState('prompt');
      
      // Speak the prompt
      setTimeout(() => {
        speakWord(`Change ${chal.sourceWord.text} into ${chal.targetWord.text}. Which letter should change?`);
      }, 500);
    } else if (challenges.length > 0) {
      setGameState('all-done');
    }
  }, [challengeIndex, challenges]);

  const handleTileClick = (idx: number) => {
    if (gameState !== 'prompt' || !currentChallenge) return;
    
    // Check if child touched the correct tile to replace
    if (idx === currentChallenge.changedIndex) {
      setSelectedIndex(idx);
      setGameState('options');
      setSwapFeedback('Yes! That letter needs to swap! Which new letter goes there?');
      speakWord('Good! Which letter goes there?');
    } else {
      setSwapFeedback(`Oops! Listen again: ${currentChallenge.sourceWord.text} has /${swappedPhonemes[idx].sound}/ in it. We want to change that sound to make ${currentChallenge.targetWord.text}.`);
      speakPhoneme(swappedPhonemes[idx]);
    }
  };

  const handleAlternativeSelect = (option: Phoneme) => {
    if (!currentChallenge || selectedIndex === null) return;

    if (option.id === currentChallenge.replacementPhoneme.id) {
      // Correct replacement! Perform animation
      const nextPhonemes = [...swappedPhonemes];
      nextPhonemes[selectedIndex] = option;
      setSwappedPhonemes(nextPhonemes);
      
      setGameState('success');
      setSwapFeedback(`Amazing! You made ${currentChallenge.targetWord.text}! 🌟`);
      speakPhoneme(option);

      confetti({ particleCount: 30, spread: 45 });
      addStars(3); // Reward stars

      setTimeout(() => {
        speakWord(`${currentChallenge.targetWord.text}!`);
      }, 700);
    } else {
      setSwapFeedback(`Almost! That says /${option.sound}/. Try another letter to make ${currentChallenge.targetWord.text}!`);
      speakPhoneme(option);
    }
  };

  const handleNextChallenge = () => {
    if (challengeIndex + 1 >= challenges.length) {
      setGameState('all-done');
      addStars(5); // completion award
    } else {
      setChallengeIndex((prev) => prev + 1);
    }
  };

  if (challenges.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No swapping swap challenges for this wave yet! Let's explore other games.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '10px', textAlign: 'center' }}>
      {gameState !== 'all-done' && currentChallenge && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          
          {/* Main instruction bubble */}
          <div 
            style={{
              background: '#e0f2fe',
              borderRadius: '25px',
              padding: '16px 24px',
              border: '3px solid #7dd3fc',
              display: 'inline-block',
              maxWidth: '500px',
              marginBottom: '30px'
            }}
          >
            <h3 style={{ fontSize: '1.6em', fontWeight: 900, color: '#0369a1', lineHeight: 1.3 }}>
              Change <span style={{ color: '#ef4444' }}>{currentChallenge.sourceWord.text}</span> into <span style={{ color: '#22c55e' }}>{currentChallenge.targetWord.text}</span>!
            </h3>
            <p style={{ fontSize: '1.1em', fontWeight: 700, color: '#0284c7', marginTop: '6px' }}>
              {gameState === 'prompt' ? 'Touch the letter tile that should change!' : 'Choose the correct swapping letter!'}
            </p>
          </div>

          {/* Word layout tiles */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '35px' }}>
            {swappedPhonemes.map((p, idx) => {
              const isSelected = selectedIndex === idx;
              
              return (
                <div key={idx} style={{ position: 'relative' }}>
                  <SoundTile
                    phoneme={p}
                    selected={isSelected && gameState === 'options'}
                    onClick={() => handleTileClick(idx)}
                  />
                  {isSelected && gameState === 'options' && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      style={{ position: 'absolute', top: '-15px', right: '-15px', color: '#facc15' }}
                    >
                      ❓
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Letter Choices to Swap */}
          <AnimatePresence>
            {gameState === 'options' && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                style={{
                  background: '#f8fafc',
                  border: '3px dashed #cbd5e1',
                  borderRadius: '30px',
                  padding: '20px',
                  display: 'inline-block',
                  margin: '10px 0 25px 0'
                }}
              >
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  {currentChallenge.alternatives.map((alt) => (
                    <SoundTile
                      key={alt.id}
                      phoneme={alt}
                      onClick={() => handleAlternativeSelect(alt)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                <div style={{ fontSize: '6em', lineHeight: 1, marginBottom: '10px' }}>
                  {currentChallenge.targetWord.imageEmoji}
                </div>
                <h2 style={{ fontSize: '3em', fontWeight: 900, color: '#166534' }}>
                  {currentChallenge.targetWord.text}!
                </h2>
                <button
                  onClick={handleNextChallenge}
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
                  Next Swap <CheckCircle size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback */}
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', height: '40px', marginTop: '15px', color: '#ff5722' }}>
            {swapFeedback}
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
          <div style={{ fontSize: '7em', marginBottom: '15px' }}>🧙‍♂️✨</div>
          <h2 style={{ fontSize: '2.5em', fontWeight: 900, color: '#0284c7', marginBottom: '10px' }}>
            Word Swap Wizard!
          </h2>
          <p style={{ fontSize: '1.4em', color: '#666', fontWeight: 800, maxWidth: '500px', margin: '0 auto 30px auto', lineHeight: 1.4 }}>
            You mastered sound manipulation and changed words like magic! You earned **5 Bonus Stars**!
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

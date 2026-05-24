import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phoneme, phonemes } from '../curriculum/phonemes';
import { speakPhoneme, speakWord } from '../utils/speech';
import SoundTile from './SoundTile';
import { Sparkles, Play, Award, Volume2 } from 'lucide-react';
import { useLearnerStore } from '../../../store/learnerStore';
import confetti from 'canvas-confetti';

interface SoundGardenProps {
  wave: number;
  onActivityComplete: () => void;
}

export default function SoundGarden({ wave, onActivityComplete }: SoundGardenProps) {
  const { addStars } = useLearnerStore();
  const wavePhonemes = phonemes.filter((p) => p.wave === wave);
  
  const [selectedPhoneme, setSelectedPhoneme] = useState<Phoneme | null>(null);
  const [quizState, setQuizState] = useState<'learn' | 'quiz' | 'complete'>('learn');
  
  // Quiz specifics
  const [quizQuestion, setQuizQuestion] = useState<Phoneme | null>(null);
  const [quizOptions, setQuizOptions] = useState<Phoneme[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<Phoneme | null>(null);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState<number>(0);
  const totalQuizQuestions = Math.min(4, wavePhonemes.length * 2);

  // Trigger when a letter tile is tapped in learning phase
  const handleTileTap = (phoneme: Phoneme) => {
    setSelectedPhoneme(phoneme);
    speakPhoneme(phoneme);
  };

  const handleSpeakExample = () => {
    if (selectedPhoneme) {
      speakWord(`${selectedPhoneme.grapheme} is for ${selectedPhoneme.exampleWord}`);
    }
  };

  const startQuiz = () => {
    setQuizIndex(0);
    setQuizCorrectCount(0);
    setQuizState('quiz');
    generateQuizQuestion();
  };

  const generateQuizQuestion = () => {
    setIsAnswering(false);
    setSelectedOption(null);
    setQuizFeedback('');

    // Select a random phoneme from the current wave
    const questionPhoneme = wavePhonemes[Math.floor(Math.random() * wavePhonemes.length)];
    setQuizQuestion(questionPhoneme);

    // Prompt the audio after a short delay
    setTimeout(() => {
      speakPhoneme(questionPhoneme);
    }, 400);

    // Get filler options: prefer same tileType to make a cohesive multiple choice card
    let pool = [...phonemes].filter(
      (p) => p.id !== questionPhoneme.id && p.tileType === questionPhoneme.tileType
    );

    // If we don't have enough same-type phonemes, fall back to general pool (excluding heart-words)
    if (pool.length < 2) {
      pool = [...phonemes].filter(
        (p) => p.id !== questionPhoneme.id && p.tileType !== 'heart-word'
      );
    }
    
    // Pick 2 fillers randomly
    const fillers: Phoneme[] = [];
    while (fillers.length < 2 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      fillers.push(pool.splice(idx, 1)[0]);
    }

    const options = [questionPhoneme, ...fillers].sort(() => Math.random() - 0.5);
    setQuizOptions(options);
  };

  const handleOptionClick = (option: Phoneme) => {
    if (isAnswering || !quizQuestion) return;
    setIsAnswering(true);
    setSelectedOption(option);

    if (option.id === quizQuestion.id) {
      setQuizCorrectCount((prev) => prev + 1);
      setQuizFeedback('🌟 Fantastic! 🌟');
      confetti({ particleCount: 30, spread: 40 });
      addStars(1); // Small reward per question

      setTimeout(() => {
        advanceQuiz();
      }, 2000);
    } else {
      setQuizFeedback(`Oops! Let's listen again. ${quizQuestion.grapheme} says /${quizQuestion.sound}/.`);
      speakPhoneme(quizQuestion);

      setTimeout(() => {
        advanceQuiz();
      }, 3000);
    }
  };

  const advanceQuiz = () => {
    const nextIdx = quizIndex + 1;
    if (nextIdx >= totalQuizQuestions) {
      setQuizState('complete');
      confetti({ particleCount: 100, spread: 80 });
      addStars(5); // Complete reward
    } else {
      setQuizIndex(nextIdx);
      generateQuizQuestion();
    }
  };

  return (
    <div style={{ width: '100%', padding: '10px', minHeight: '350px' }}>
      {/* 1. LEARN MODE */}
      {quizState === 'learn' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.5em', fontWeight: 900, color: '#3b82f6', marginBottom: '20px' }}>
            Tap the tiles to listen to their sounds! 🔊
          </p>

          {/* Letter Tiles Grid */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '35px' }}>
            {wavePhonemes.map((phoneme) => (
              <SoundTile
                key={phoneme.id}
                phoneme={phoneme}
                selected={selectedPhoneme?.id === phoneme.id}
                onClick={() => handleTileTap(phoneme)}
              />
            ))}
          </div>

          {/* Tracing / Audio playground box */}
          <div style={{ minHeight: '160px', margin: '15px 0' }}>
            <AnimatePresence mode="wait">
              {selectedPhoneme ? (
                <motion.div
                  key={selectedPhoneme.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  style={{
                    background: 'white',
                    borderRadius: '30px',
                    padding: '30px',
                    border: '3px solid #e2e8f0',
                    display: 'inline-block',
                    width: '100%',
                    maxWidth: '520px',
                    textAlign: 'left',
                    boxShadow: '0 12px 24px rgba(59, 130, 246, 0.04)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      {/* Very large dictionary letter key */}
                      <span style={{ fontSize: '4.5em', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>
                        {selectedPhoneme.grapheme}
                      </span>
                      {/* IPA / Phonetic key transcription */}
                      <span style={{ 
                        fontSize: '1.8em', 
                        fontWeight: 800, 
                        color: '#64748b', 
                        marginLeft: '15px', 
                        fontFamily: 'monospace',
                        background: '#f1f5f9',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        verticalAlign: 'middle'
                      }}>
                        /{selectedPhoneme.sound}/
                      </span>
                    </div>

                    {/* Circular Speak Button (like Google Translate / Dictionary speaker icon) */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => speakPhoneme(selectedPhoneme)}
                      style={{
                        background: '#3b82f6',
                        border: 'none',
                        borderRadius: '50%',
                        width: '65px',
                        height: '65px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 6px 12px rgba(59, 130, 246, 0.3)',
                        outline: 'none'
                      }}
                    >
                      <Volume2 size={28} color="white" fill="white" />
                    </motion.button>
                  </div>

                  {/* Phonetic spelling guide */}
                  <div style={{ 
                    borderTop: '2px solid #f1f5f9', 
                    paddingTop: '20px',
                    fontSize: '1.25em', 
                    color: '#475569', 
                    fontWeight: 700, 
                    lineHeight: 1.5 
                  }}>
                    <p style={{ margin: '0 0 12px 0' }}>
                      📖 In words, it makes the sound <span style={{ color: '#3b82f6', fontWeight: 900 }}>/{selectedPhoneme.sound}/</span>.
                    </p>
                    <p style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💡 Try saying:</span>
                      <strong style={{ color: '#0f172a', background: '#fef08a', padding: '2px 8px', borderRadius: '8px' }}>
                        {selectedPhoneme.exampleWord}
                      </strong>
                    </p>
                  </div>

                  {/* Play Word Example Button */}
                  <button
                    onClick={handleSpeakExample}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '25px',
                      fontSize: '1.05em',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 0 #059669',
                      outline: 'none',
                      transition: 'transform 0.1s'
                    }}
                  >
                    <Play size={18} fill="white" /> Hear Full Example Word
                  </button>
                </motion.div>
              ) : (
                <div style={{ color: '#888', fontSize: '1.2em', fontWeight: 800, paddingTop: '40px' }}>
                  Tap a letter tile to begin learning!
                </div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={startQuiz}
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
              marginTop: '15px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={20} /> Play Sound Quiz!
          </button>
        </motion.div>
      )}

      {/* 2. QUIZ MODE */}
      {quizState === 'quiz' && quizQuestion && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
          <div style={{ background: '#fef3c7', padding: '10px 20px', borderRadius: '15px', color: '#d97706', display: 'inline-block', fontSize: '1.2em', fontWeight: 900, marginBottom: '20px' }}>
            Question: {quizIndex + 1} / {totalQuizQuestions}
          </div>

          <h3 style={{ fontSize: '1.8em', fontWeight: 900, color: '#333', marginBottom: '10px' }}>
            Which letter matches the sound you hear?
          </h3>
          
          <button
            onClick={() => speakPhoneme(quizQuestion)}
            style={{
              background: '#d97706',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '1.1em',
              fontWeight: 900,
              borderRadius: '25px',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #b45309',
              marginBottom: '30px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Play size={18} fill="white" /> Hear Sound Again
          </button>

          {/* Interactive Multiple Choice Options */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', flexWrap: 'wrap', marginBottom: '25px' }}>
            {quizOptions.map((option, idx) => {
              const isSelected = selectedOption?.id === option.id;
              const isCorrect = option.id === quizQuestion.id;
              
              return (
                <motion.div
                  key={idx}
                  animate={
                    isAnswering && isSelected
                      ? isCorrect
                        ? { y: [0, -15, 0], scale: 1.05 }
                        : { x: [-10, 10, -10, 10, 0] }
                      : {}
                  }
                  transition={{ duration: 0.5 }}
                >
                  <SoundTile
                    phoneme={option}
                    disabled={isAnswering}
                    selected={isAnswering && isSelected && isCorrect}
                    onClick={() => handleOptionClick(option)}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Feedback */}
          <div style={{ fontSize: '1.6em', fontWeight: 'bold', height: '40px', marginTop: '20px', color: '#ff5722' }}>
            {quizFeedback}
          </div>
        </motion.div>
      )}

      {/* 3. COMPLETE SCREEN */}
      {quizState === 'complete' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ textAlign: 'center', padding: '30px 10px' }}
        >
          <div style={{ fontSize: '7em', marginBottom: '15px' }}>🏆🌟</div>
          <h2 style={{ fontSize: '2.5em', fontWeight: 900, color: '#4caf50', marginBottom: '10px' }}>
            Amazing Sound Explorer!
          </h2>
          <p style={{ fontSize: '1.4em', color: '#666', fontWeight: 800, maxWidth: '500px', margin: '0 auto 30px auto', lineHeight: 1.4 }}>
            You completed the Sound Garden challenge and got {quizCorrectCount} matching sounds correct! You earned **5 Bonus Stars**!
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
            <Award size={20} /> Next Adventure!
          </button>
        </motion.div>
      )}
    </div>
  );
}

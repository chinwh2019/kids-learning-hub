import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLearnerStore } from '../../../store/learnerStore';
import { Volume2, Award, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShapeQuizProps {
  onComplete: () => void;
}

interface QuizQuestion {
  id: string;
  voiceText: string;
  displayText: string;
  options: {
    label: string;
    shapeType: 'triangle' | 'rectangle' | 'circle' | 'semicircle' | 'square' | 'trapezoid';
    color: string;
    isCorrect: boolean;
  }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    voiceText: 'Which shape has three sides and three corners?',
    displayText: 'Which shape has 3 sides and 3 corners?',
    options: [
      { label: 'Circle', shapeType: 'circle', color: '#fbbf24', isCorrect: false },
      { label: 'Triangle', shapeType: 'triangle', color: '#ef4444', isCorrect: true },
      { label: 'Square', shapeType: 'square', color: '#3b82f6', isCorrect: false }
    ]
  },
  {
    id: 'q2',
    voiceText: 'Which shape has four straight sides that are all exactly the same length?',
    displayText: 'Which shape has 4 equal straight sides?',
    options: [
      { label: 'Square', shapeType: 'square', color: '#10b981', isCorrect: true },
      { label: 'Triangle', shapeType: 'triangle', color: '#a855f7', isCorrect: false },
      { label: 'Circle', shapeType: 'circle', color: '#f59e0b', isCorrect: false }
    ]
  },
  {
    id: 'q3',
    voiceText: 'Which shape is perfectly round and has no straight sides at all?',
    displayText: 'Which shape is perfectly round?',
    options: [
      { label: 'Rectangle', shapeType: 'rectangle', color: '#3b82f6', isCorrect: false },
      { label: 'Semicircle', shapeType: 'semicircle', color: '#ec4899', isCorrect: false },
      { label: 'Circle', shapeType: 'circle', color: '#fbbf24', isCorrect: true }
    ]
  },
  {
    id: 'q4',
    voiceText: 'Find the shape that has four straight sides but is longer than a square!',
    displayText: 'Which shape is longer than a square?',
    options: [
      { label: 'Rectangle', shapeType: 'rectangle', color: '#ef4444', isCorrect: true },
      { label: 'Trapezoid', shapeType: 'trapezoid', color: '#8b5cf6', isCorrect: false },
      { label: 'Triangle', shapeType: 'triangle', color: '#10b981', isCorrect: false }
    ]
  },
  {
    id: 'q5',
    voiceText: 'Which shape looks like half of a circle?',
    displayText: 'Which shape looks like half a circle?',
    options: [
      { label: 'Triangle', shapeType: 'triangle', color: '#fb923c', isCorrect: false },
      { label: 'Semicircle', shapeType: 'semicircle', color: '#a855f7', isCorrect: true },
      { label: 'Square', shapeType: 'square', color: '#3b82f6', isCorrect: false }
    ]
  }
];

// Synth sounds helper
const playQuizOscillator = (isCorrect: boolean) => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (isCorrect) {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn('AudioContext synth failed:', e);
  }
};

// High pitched voice synthesis helper
const speakQuizQuestion = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.75; // Slower for clarity
  utterance.pitch = 1.35; // High cartoon-like voice pitch
  window.speechSynthesis.speak(utterance);
};

export default function ShapeQuiz({ onComplete }: ShapeQuizProps) {
  const { addStars } = useLearnerStore();
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [gameState, setGameState] = useState<'question' | 'success' | 'complete'>('question');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  const activeQuestion = quizQuestions[currentIdx];

  // Speak the question when it mounts or changes
  useEffect(() => {
    if (activeQuestion && gameState === 'question') {
      setSelectedOption(null);
      setIsAnswering(false);
      setFeedback('');
      
      // Delay speech slightly to let view mount smoothly
      const timer = setTimeout(() => {
        speakQuizQuestion(activeQuestion.voiceText);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, gameState]);

  const handleHearAgain = () => {
    if (activeQuestion) {
      speakQuizQuestion(activeQuestion.voiceText);
    }
  };

  const handleOptionClick = (optionIdx: number) => {
    if (isAnswering || !activeQuestion) return;
    setIsAnswering(true);
    setSelectedOption(optionIdx);
    
    const choice = activeQuestion.options[optionIdx];
    if (choice.isCorrect) {
      playQuizOscillator(true);
      confetti({ particleCount: 30, spread: 40 });
      setFeedback('🌟 Star Answer! Spectacular! 🌟');
      addStars(2); // Mini reward

      setTimeout(() => {
        setGameState('success');
        speakQuizQuestion(`${choice.label}! You got it!`);
      }, 1500);
    } else {
      playQuizOscillator(false);
      setFeedback(`Oops! Let's listen again and try! 🌟`);
      speakQuizQuestion(`Oops! Let's try again. ${activeQuestion.voiceText}`);
      
      setTimeout(() => {
        setIsAnswering(false);
        setSelectedOption(null);
        setFeedback('');
      }, 3000);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= quizQuestions.length) {
      setGameState('complete');
      confetti({ particleCount: 100, spread: 80 });
      addStars(5); // Completion bonus
      speakQuizQuestion("Amazing job! You are a master shape explorer!");
    } else {
      setCurrentIdx((prev) => prev + 1);
      setGameState('question');
    }
  };

  const renderSVGIcon = (type: string, fill: string) => {
    const stroke = '#ffffff';
    const strokeWidth = 5;

    switch (type) {
      case 'triangle':
        return (
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 6px 3px rgba(0,0,0,0.15))' }}>
            <polygon points="50,6 94,92 6,92" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'rectangle':
        return (
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 6px 3px rgba(0,0,0,0.15))' }}>
            <rect x="10" y="25" width="80" height="50" rx="8" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'circle':
        return (
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 6px 3px rgba(0,0,0,0.15))' }}>
            <circle cx="50" cy="50" r="42" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'semicircle':
        return (
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 6px 3px rgba(0,0,0,0.15))' }}>
            <path d="M10,80 A40,40 0 0,1 90,80 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'square':
        return (
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 6px 3px rgba(0,0,0,0.15))' }}>
            <rect x="15" y="15" width="70" height="70" rx="10" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'trapezoid':
        return (
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 6px 3px rgba(0,0,0,0.15))' }}>
            <polygon points="25,12 75,12 94,88 6,88" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100%', padding: '10px', textAlign: 'center' }}>
      
      {/* 1. QUIZ PLAYING */}
      {gameState === 'question' && activeQuestion && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div 
            style={{ 
              background: 'rgba(139, 92, 246, 0.15)', 
              padding: '8px 24px', 
              borderRadius: '20px', 
              color: '#c084fc', 
              display: 'inline-block', 
              fontSize: '1.2em', 
              fontWeight: 900, 
              border: '2px solid rgba(139, 92, 246, 0.3)',
              marginBottom: '20px' 
            }}
          >
            Cosmic Question: {currentIdx + 1} / {quizQuestions.length}
          </div>

          <h2 style={{ fontSize: '2em', fontWeight: 900, color: '#fff', marginBottom: '20px', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
            {activeQuestion.displayText}
          </h2>

          <button
            onClick={handleHearAgain}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              fontSize: '1.15em',
              fontWeight: 950,
              borderRadius: '25px',
              cursor: 'pointer',
              boxShadow: '0 5px 0 #6d28d9, 0 10px 20px rgba(139,92,246,0.3)',
              marginBottom: '35px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Volume2 size={18} fill="white" /> Hear Question 🔊
          </button>

          {/* Interactive Multiple Choice SVGs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', marginBottom: '30px' }}>
            {activeQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isChoiceCorrect = opt.isCorrect;

              return (
                <motion.button
                  key={idx}
                  disabled={isAnswering}
                  onClick={() => handleOptionClick(idx)}
                  whileHover={!isAnswering ? { scale: 1.08, y: -6 } : {}}
                  whileTap={!isAnswering ? { scale: 0.94 } : {}}
                  animate={
                    isAnswering && isSelected
                      ? isChoiceCorrect
                        ? { y: [0, -15, 0], scale: 1.05 }
                        : { x: [-10, 10, -10, 10, 0] }
                      : {}
                  }
                  transition={{ duration: 0.5 }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `4px solid ${
                      isAnswering && isSelected
                        ? isChoiceCorrect
                          ? '#10b981'
                          : '#ef4444'
                        : 'rgba(255,255,255,0.15)'
                    }`,
                    borderRadius: '35px',
                    padding: '25px 20px',
                    width: '180px',
                    height: '210px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: isAnswering ? 'default' : 'pointer',
                    gap: '15px',
                    boxShadow: isAnswering && isSelected && isChoiceCorrect 
                      ? '0 0 20px rgba(16,185,129,0.3)' 
                      : '0 8px 16px rgba(0,0,0,0.15)'
                  }}
                >
                  {renderSVGIcon(opt.shapeType, opt.color)}
                  <span style={{ fontSize: '1.2em', color: '#fff', fontWeight: 900 }}>
                    {opt.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback messages */}
          <div style={{ fontSize: '1.6em', fontWeight: 'bold', height: '40px', marginTop: '15px', color: '#fbbf24' }}>
            {feedback}
          </div>
        </motion.div>
      )}

      {/* 2. SINGLE QUESTION SUCCESS */}
      {gameState === 'success' && activeQuestion && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '40px 10px' }}>
          <div style={{ fontSize: '7.5em', marginBottom: '15px' }}>⭐🌌👽</div>
          
          <h2 style={{ fontSize: '2.5em', fontWeight: 950, color: '#10b981', marginBottom: '10px' }}>
            Spectacular Shape Mastery!
          </h2>

          <p style={{ fontSize: '1.3em', color: '#cbd5e1', fontWeight: 800, marginBottom: '35px' }}>
            You correctly identified the shape features and earned **2 Stars**!
          </p>

          <button
            onClick={handleNext}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 35px',
              fontSize: '1.3em',
              fontWeight: 950,
              borderRadius: '35px',
              cursor: 'pointer',
              boxShadow: '0 6px 0 #4c1d95, 0 10px 20px rgba(139,92,246,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Next Question <ArrowRight size={20} />
          </button>
        </motion.div>
      )}

      {/* 3. COMPLETE GAME SCREEN */}
      {gameState === 'complete' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ padding: '30px 10px' }}
        >
          <div style={{ fontSize: '7.5em', marginBottom: '15px', filter: 'drop-shadow(0 8px 4px rgba(0,0,0,0.2))' }}>
            🛸🏆👽
          </div>
          
          <h2 style={{ fontSize: '2.6em', fontWeight: 950, color: '#fbbf24', marginBottom: '10px', textShadow: '0 0 20px rgba(251,191,36,0.2)' }}>
            Cosmic Shape Professor!
          </h2>
          
          <p style={{ fontSize: '1.4em', color: '#cbd5e1', fontWeight: 800, maxWidth: '520px', margin: '0 auto 35px auto', lineHeight: 1.4 }}>
            You answered every cosmic shape question perfectly and mapped sides/corners like a rocket scientist! You earned **5 Bonus Stars**!
          </p>

          <button
            onClick={onComplete}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 40px',
              fontSize: '1.3em',
              fontWeight: 950,
              borderRadius: '35px',
              cursor: 'pointer',
              boxShadow: '0 6px 0 #047857',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Award size={20} /> Return to Launchpad
          </button>
        </motion.div>
      )}

    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { WordItem, words } from '../curriculum/words';
import { speakWord } from '../utils/speech';
import { useLearnerStore } from '../../../store/learnerStore';
import { Volume2, Award, ArrowRight, Mic, AlertCircle, Check, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpeechMirrorProps {
  wave: number;
  onActivityComplete: () => void;
}

type RecordingState = 'idle' | 'listening' | 'success' | 'encouraging' | 'all-done';

export default function SpeechMirror({ wave, onActivityComplete }: SpeechMirrorProps) {
  const { addStars } = useLearnerStore();
  const waveWords = words.filter((w) => w.wave === wave && w.decodable);

  // Challenge game lists
  const [challengeWords, setChallengeWords] = useState<WordItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [activeWord, setActiveWord] = useState<WordItem | null>(null);
  
  // Interaction states
  const [recState, setRecState] = useState<RecordingState>('idle');
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const [speechFeedback, setSpeechFeedback] = useState<string>('');
  const [dinoEmoji, setDinoEmoji] = useState<string>('🦖');

  // References for Web Speech API
  const recognitionRef = useRef<any>(null);
  const fallbackTimerRef = useRef<any>(null);

  // Initialize Speech Recognition API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechCtor) {
        const rec = new SpeechCtor();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setRecState('listening');
          setDinoEmoji('🦖👂');
          setSpeechFeedback('Listening... Speak clearly! 🔊');
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          handleSpeechResult(resultText);
        };

        rec.onerror = (event: any) => {
          console.warn('[SPEECH REC ERROR]:', event.error);
          if (event.error === 'not-allowed') {
            // Permission denied -> fallback to self-assessment
            setIsUsingFallback(true);
            setSpeechFeedback('Microphone blocked! Let\'s play in "Listen & Copy" mode! 🎙️✨');
          } else {
            setSpeechFeedback('Dino didn\'t hear quite right. Try again!');
          }
          setRecState('idle');
          setDinoEmoji('🦖');
        };

        rec.onend = () => {
          if (recState === 'listening') {
            setRecState('idle');
            setDinoEmoji('🦖');
          }
        };

        recognitionRef.current = rec;
      } else {
        // Speech recognition not supported (e.g. some webviews)
        setIsUsingFallback(true);
      }
    }

    // Prepare 5 random words from the current wave
    if (waveWords.length > 0) {
      const shuffled = [...waveWords].sort(() => Math.random() - 0.5).slice(0, 5);
      setChallengeWords(shuffled);
      setCurrentIdx(0);
    }
  }, [wave]);

  useEffect(() => {
    if (challengeWords.length > 0 && currentIdx < challengeWords.length) {
      const target = challengeWords[currentIdx];
      setActiveWord(target);
      setRecState('idle');
      setDinoEmoji('🦖');
      setSpeechFeedback(`Can you say: "${target.text}"?`);

      // Model the word
      setTimeout(() => {
        speakWord(`Say ${target.text}`);
      }, 600);
    } else if (challengeWords.length > 0) {
      setRecState('all-done');
    }
  }, [currentIdx, challengeWords]);

  const handleModelWord = () => {
    if (activeWord) {
      speakWord(activeWord.text);
    }
  };

  const handleStartListening = () => {
    if (recState === 'listening' || !activeWord) return;

    if (isUsingFallback || !recognitionRef.current) {
      // Run the visual simulated recorder fallback
      runFallbackRecorder();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Fallback if starting fails
        console.warn('SpeechRecognition failed to start, using fallback:', e);
        runFallbackRecorder();
      }
    }
  };

  // Run the bulletproof self-assessment simulator if mic is blocked/unsupported
  const runFallbackRecorder = () => {
    setRecState('listening');
    setDinoEmoji('🦖👂');
    setSpeechFeedback('Recording your voice... Speak now! 🎙️🗣️');

    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      // Stop "recording" and prompt self-assessment
      setRecState('encouraging');
      setDinoEmoji('🦖');
      setSpeechFeedback('Did your pronunciation match the Dino\'s voice?');
    }, 2500);
  };

  const handleSpeechResult = (resultText: string) => {
    if (!activeWord) return;

    const cleanedSpoken = resultText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
    const cleanedTarget = activeWord.text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();

    if (cleanedSpoken === cleanedTarget || cleanedSpoken.includes(cleanedTarget) || cleanedTarget.includes(cleanedSpoken)) {
      triggerSuccess();
    } else {
      // Encouraging failure
      setRecState('encouraging');
      setDinoEmoji('🦖😋');
      setSpeechFeedback(`Dino heard "${resultText}". Let's listen again and copy!`);
      setTimeout(() => {
        speakWord(`Say ${activeWord.text}`);
      }, 1000);
    }
  };

  const triggerSuccess = () => {
    if (!activeWord) return;

    setRecState('success');
    setDinoEmoji('🦖😋');
    setSpeechFeedback('⭐ Munch! Spectacular speaking! ⭐');
    confetti({ particleCount: 40, spread: 50, colors: ['#4caf50', '#22c55e', '#ffeb3b'] });
    addStars(3); // Speech award

    setTimeout(() => {
      speakWord(`${activeWord.text}! Yummy!`);
    }, 400);
  };

  const handleNextWord = () => {
    if (currentIdx + 1 >= challengeWords.length) {
      setRecState('all-done');
      addStars(5); // completion award
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  // Safe manual override feeds for fallback mode
  const handleFallbackSelfConfirm = (isMatch: boolean) => {
    if (isMatch) {
      triggerSuccess();
    } else {
      setRecState('idle');
      setDinoEmoji('🦖');
      setSpeechFeedback("No worries! Let's try again! 🌟");
      handleModelWord();
    }
  };

  if (challengeWords.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No spoken challenges available for this wave yet! Check back soon. 🗣️
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '10px', textAlign: 'center' }}>
      {recState !== 'all-done' && activeWord && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          
          {/* Wave Progress Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '25px' }}>
            {challengeWords.map((_, idx) => {
              const isActive = idx === currentIdx;
              const isCompleted = idx < currentIdx;

              return (
                <div
                  key={idx}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isCompleted ? '#22c55e' : isActive ? '#3b82f6' : '#cbd5e1',
                    border: '2px solid white',
                    boxShadow: isActive ? '0 0 0 4px rgba(59, 130, 246, 0.3)' : 'none',
                    transform: isActive ? 'scale(1.2)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              );
            })}
          </div>

          <p style={{ fontSize: '1.8em', fontWeight: 900, color: '#2563eb', marginBottom: '15px' }}>
            Dino Speech Mirror! 🎙️🦖
          </p>

          {/* DINO VIEWPORT PORTRAIT */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '40px', 
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}
          >
            {/* The Dinosaur Avatar */}
            <div style={{ position: 'relative' }}>
              <motion.div
                animate={
                  recState === 'listening'
                    ? { y: [0, -10, 0], scale: [1, 1.05, 1] }
                    : recState === 'success'
                    ? { scale: [1, 1.2, 1], rotate: [0, -15, 15, 0] }
                    : { y: [0, -4, 0] }
                }
                transition={{
                  repeat: Infinity,
                  duration: recState === 'listening' ? 1.2 : recState === 'success' ? 0.6 : 2.5
                }}
                style={{
                  fontSize: '9em',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 12px 6px rgba(0,0,0,0.06))'
                }}
              >
                {dinoEmoji}
              </motion.div>
              
              {/* Dino Dialogue Bubble */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-110px',
                  background: 'white',
                  border: '3px solid #2563eb',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '1em',
                  fontWeight: 900,
                  color: '#1e3a8a',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
                  pointerEvents: 'none'
                }}
              >
                {recState === 'success' ? 'Chomp! Yum!' : recState === 'listening' ? 'Tell me...' : 'Speak! 🦖'}
              </div>
            </div>

            {/* Target Vocabulary Word Card */}
            <motion.div
              animate={recState === 'success' ? { scale: [1, 0, 0], opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{
                background: 'white',
                border: '5px solid #2563eb',
                borderRadius: '35px',
                padding: '25px',
                minWidth: '220px',
                textAlign: 'center',
                boxShadow: '0 12px 24px rgba(37,99,235,0.06)'
              }}
            >
              <div style={{ fontSize: '6em', lineHeight: 1, marginBottom: '10px' }}>
                {activeWord.imageEmoji}
              </div>
              <h2 style={{ fontSize: '2.5em', fontWeight: 950, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {activeWord.text}
              </h2>
              
              <button
                onClick={handleModelWord}
                style={{
                  background: '#eff6ff',
                  border: '2px solid #bfdbfe',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: '#2563eb',
                  marginTop: '8px'
                }}
                title="Model Pronunciation"
              >
                <Volume2 size={20} fill="#2563eb" />
              </button>
            </motion.div>
          </div>

          {/* ACTIVE RECORDING COMPONENT CONTAINER */}
          <div style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* 1. BUILD/SIMULATE STAGE */}
            {recState === 'idle' && (
              <motion.button
                type="button"
                onClick={handleStartListening}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: '0 8px 0 #1d4ed8, 0 12px 24px rgba(37,99,235,0.15)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  outline: 'none'
                }}
              >
                <Mic size={38} fill="white" />
              </motion.button>
            )}

            {/* 2. LISTENING MODE WITH WAVEFORM */}
            {recState === 'listening' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Visual sound waveform simulation */}
                <div style={{ display: 'flex', gap: '6px', height: '45px', alignItems: 'center', marginBottom: '20px' }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [15, i % 2 === 0 ? 45 : 30, 15]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6 + i * 0.1,
                        ease: 'easeInOut'
                      }}
                      style={{
                        width: '8px',
                        background: '#2563eb',
                        borderRadius: '4px'
                      }}
                    />
                  ))}
                </div>

                <div 
                  style={{
                    background: 'rgba(37,99,235,0.1)',
                    border: '2px solid #2563eb',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    fontSize: '1em',
                    fontWeight: 900,
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />
                  <span>Dino is listening...</span>
                </div>
              </div>
            )}

            {/* 3. SUCCESS CARD CHOMPING */}
            {recState === 'success' && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                style={{
                  background: '#f0fdf4',
                  border: '3px solid #86efac',
                  borderRadius: '30px',
                  padding: '20px 30px',
                  display: 'inline-block'
                }}
              >
                <h3 style={{ fontSize: '1.6em', fontWeight: 900, color: '#166534', margin: 0 }}>
                  Dino fed successfully! 🦖✨
                </h3>
                <button
                  onClick={handleNextWord}
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    padding: '12px 26px',
                    fontSize: '1.15em',
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
                  Feed Next Word <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {/* 4. FALLBACK SELF-ASSESSMENT QUESTIONS */}
            {recState === 'encouraging' && isUsingFallback && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  background: '#fffbeb',
                  border: '3px solid #fde68a',
                  borderRadius: '35px',
                  padding: '20px 25px',
                  maxWidth: '450px',
                  boxShadow: '0 12px 24px rgba(251,191,36,0.05)'
                }}
              >
                <p style={{ fontSize: '1.2em', fontWeight: 800, color: '#b45309', marginBottom: '16px' }}>
                  Did your sound match: <span style={{ textTransform: 'uppercase', color: '#2563eb' }}>"{activeWord.text}"</span>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                  <button
                    onClick={() => handleFallbackSelfConfirm(false)}
                    style={{
                      background: '#cbd5e1',
                      color: '#334155',
                      border: 'none',
                      padding: '12px 22px',
                      borderRadius: '20px',
                      fontSize: '1em',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 4px 0 #94a3b8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RotateCcw size={16} /> Try Again
                  </button>

                  <button
                    onClick={() => handleFallbackSelfConfirm(true)}
                    style={{
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      padding: '12px 26px',
                      borderRadius: '20px',
                      fontSize: '1em',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 4px 0 #15803d',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Check size={18} /> Yes! Match! 👍
                  </button>
                </div>
              </motion.div>
            )}

            {/* 5. WRONG OR NOT RECOGNIZED RE-PROMPT */}
            {recState === 'encouraging' && !isUsingFallback && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ textAlign: 'center' }}
              >
                <button
                  onClick={handleStartListening}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '12px 26px',
                    fontSize: '1.1em',
                    fontWeight: 900,
                    borderRadius: '25px',
                    cursor: 'pointer',
                    boxShadow: '0 5px 0 #b91c1c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Mic size={16} fill="white" /> Try Speaking Again
                </button>
              </motion.div>
            )}

          </div>

          {/* Core feedback panel */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', marginTop: '20px', minHeight: '30px' }}>
            {isUsingFallback ? (
              <span 
                style={{ 
                  background: '#f1f5f9', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '12px', 
                  padding: '4px 12px', 
                  fontSize: '0.9em', 
                  color: '#475569',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <AlertCircle size={14} /> Copy Play Mode Active
              </span>
            ) : null}
            <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#ff5722' }}>
              {speechFeedback}
            </span>
          </div>

        </motion.div>
      )}

      {/* ALL COMPLETED */}
      {recState === 'all-done' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ padding: '30px 10px' }}
        >
          <div style={{ fontSize: '8em', filter: 'drop-shadow(0 10px 4px rgba(0,0,0,0.06))', marginBottom: '15px' }}>🦖🎙️🏅</div>
          <h2 style={{ fontSize: '2.8em', fontWeight: 900, color: '#2563eb', marginBottom: '10px' }}>
            Spectacular Speaker!
          </h2>
          <p style={{ fontSize: '1.4em', color: '#475569', fontWeight: 800, maxWidth: '520px', margin: '0 auto 30px auto', lineHeight: 1.45 }}>
            Splendid job! You fed the Phonics Dino every single word card and earned a huge **5 Stars completion bonus**!
          </p>

          <button
            onClick={onActivityComplete}
            style={{
              background: '#4caf50',
              color: 'white',
              border: 'none',
              padding: '14px 40px',
              fontSize: '1.4em',
              fontWeight: 900,
              borderRadius: '35px',
              cursor: 'pointer',
              boxShadow: '0 6px 0 #2e7d32',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Award size={20} /> Choose Next Playground!
          </button>
        </motion.div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useLearnerStore } from '../../store/learnerStore';
import { ArrowLeft } from 'lucide-react';

interface MathAdventureProps {
  onBack: () => void;
}

type TabType = 'apples' | 'bunny' | 'seeds' | 'butterfly';

// --- Sound Synthesizers using Web Audio API ---
const playSynthSound = (type: 'pop' | 'magic' | 'cheer') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'pop') {
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'magic') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'cheer') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.2); // C6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {
    console.warn('AudioContext not supported or blocked:', e);
  }
};

const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

export default function MathAdventure({ onBack }: MathAdventureProps) {
  const [activeTab, setActiveTab] = useState<TabType>('apples');
  const { completeMathLevel, addStars } = useLearnerStore();

  // --- 1. Apples Tab State ---
  const [applesCount, setApplesCount] = useState<number>(1);
  const maxApples = 10;

  const handleAddApple = () => {
    if (applesCount < maxApples) {
      playSynthSound('pop');
      const next = applesCount + 1;
      setApplesCount(next);
      if (next === maxApples) {
        triggerConfetti();
        playSynthSound('cheer');
        addStars(2); // Mini reward
      }
    }
  };

  const handleResetApples = () => {
    playSynthSound('pop');
    setApplesCount(1);
  };

  // --- 2. Bunny Tab State ---
  const [bunnyCurrent, setBunnyCurrent] = useState<number>(3);
  const [bunnyTarget, setBunnyTarget] = useState<number>(4);
  const [isFeeding, setIsFeeding] = useState<boolean>(false);
  const [bunnyFedState, setBunnyFedState] = useState<'idle' | 'happy' | 'full'>('idle');
  const carrotSourceRef = useRef<HTMLDivElement>(null);
  const bunnyPlateRef = useRef<HTMLDivElement>(null);

  const initBunnyMode = (prevValue = 0) => {
    let nextNum;
    do {
      nextNum = Math.floor(Math.random() * 8) + 1; // 1 to 8
    } while (nextNum === prevValue);
    
    setBunnyCurrent(nextNum);
    setBunnyTarget(nextNum + 1);
    setBunnyFedState('idle');
    setIsFeeding(false);
  };

  const feedBunny = () => {
    if (isFeeding || bunnyFedState === 'full') return;
    setIsFeeding(true);
    playSynthSound('pop');

    // Perform feeding animation trigger
    const sourceEl = carrotSourceRef.current;
    const plateEl = bunnyPlateRef.current;
    if (sourceEl && plateEl) {
      const sourceRect = sourceEl.getBoundingClientRect();
      const plateRect = plateEl.getBoundingClientRect();

      const flyingCarrot = document.createElement('div');
      flyingCarrot.innerText = '🥕';
      flyingCarrot.style.position = 'fixed';
      flyingCarrot.style.fontSize = '3.5em';
      flyingCarrot.style.left = `${sourceRect.left}px`;
      flyingCarrot.style.top = `${sourceRect.top}px`;
      flyingCarrot.style.zIndex = '9999';
      flyingCarrot.style.transition = 'all 0.55s cubic-bezier(0.25, 0.8, 0.25, 1)';
      document.body.appendChild(flyingCarrot);

      setTimeout(() => {
        flyingCarrot.style.left = `${plateRect.left + plateRect.width / 2 - 20}px`;
        flyingCarrot.style.top = `${plateRect.top - 20}px`;
        flyingCarrot.style.transform = 'scale(0.5) rotate(-90deg)';
        flyingCarrot.style.opacity = '0';
      }, 50);

      setTimeout(() => {
        document.body.removeChild(flyingCarrot);
        
        const nextCurrent = bunnyCurrent + 1;
        setBunnyCurrent(nextCurrent);

        if (nextCurrent === bunnyTarget) {
          setBunnyFedState('full');
          playSynthSound('cheer');
          triggerConfetti();
          addStars(3); // Star reward for completion

          setTimeout(() => {
            initBunnyMode(bunnyTarget);
          }, 3500);
        } else {
          setBunnyFedState('happy');
          setTimeout(() => {
            setBunnyFedState('idle');
            setIsFeeding(false);
          }, 600);
        }
      }, 600);
    }
  };

  useEffect(() => {
    if (activeTab === 'bunny') {
      initBunnyMode();
    }
  }, [activeTab]);

  // --- 3. Seeds (Place Value) State ---
  const [seedsCount, setSeedsCount] = useState<number>(199);
  const [isPacking, setIsPacking] = useState<boolean>(false);
  const [carryGrouping, setCarryGrouping] = useState<'none' | 'ones' | 'tens'>('none');

  const handleAddSeed = async () => {
    if (isPacking || seedsCount >= 999) return;
    setIsPacking(true);
    playSynthSound('pop');
    
    const nextCount = seedsCount + 1;
    setSeedsCount(nextCount);

    const prevO = seedsCount % 10;
    const nextO = nextCount % 10;

    // Carrying seeds (ones -> tens)
    if (nextO === 0 && prevO === 9) {
      setCarryGrouping('ones');
      playSynthSound('magic');
      await new Promise(r => setTimeout(r, 1000));
      setCarryGrouping('none');

      // Carrying pouches (tens -> hundreds)
      const prevT = Math.floor((seedsCount % 100) / 10);
      const nextT = Math.floor((nextCount % 100) / 10);
      if (nextT === 0 && prevT === 9) {
        setCarryGrouping('tens');
        playSynthSound('magic');
        await new Promise(r => setTimeout(r, 1000));
        setCarryGrouping('none');
        triggerConfetti();
        playSynthSound('cheer');
        addStars(5);
      }
    }
    setIsPacking(false);
  };

  const handleRandomizeSeeds = () => {
    if (isPacking) return;
    const rand = Math.floor(Math.random() * 990) + 1; // 1 to 990
    setSeedsCount(rand);
    playSynthSound('pop');
  };

  // --- 4. Quiz (Butterfly Rescue) State ---
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizCount, setQuizCount] = useState<number>(0);
  const [currentBase, setCurrentBase] = useState<number>(9);
  const [quizOptions, setQuizOptions] = useState<number[]>([]);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [quizFeedback, setQuizFeedback] = useState<string>('');
  const [quizState, setQuizState] = useState<'intro' | 'play' | 'end'>('intro');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const startQuiz = () => {
    setQuizScore(0);
    setQuizCount(0);
    setQuizState('play');
    initQuizQuestion(1);
  };

  const initQuizQuestion = (questionNum: number) => {
    setIsAnswering(false);
    setSelectedOption(null);
    setQuizFeedback('');
    setQuizCount(questionNum);

    const bases = [9, 19, 99, 199, 299, 309, 899];
    const base = bases[Math.floor(Math.random() * bases.length)];
    setCurrentBase(base);

    const correctAns = base + 1;
    const wrong1 = base + 10;
    const wrong2 = correctAns + 100;
    
    const options = [correctAns, wrong1, wrong2].sort(() => Math.random() - 0.5);
    setQuizOptions(options);
  };

  const handleAnswerClick = (option: number) => {
    if (isAnswering) return;
    setIsAnswering(true);
    setSelectedOption(option);
    const correctAns = currentBase + 1;

    if (option === correctAns) {
      setQuizScore(prev => prev + 10);
      setQuizFeedback('🎉 Great job! 🎉');
      playSynthSound('cheer');
      triggerConfetti();

      setTimeout(() => {
        if (quizCount >= 10) {
          setQuizState('end');
          completeMathLevel('addition_plus1'); // Register completion & grant stars
        } else {
          initQuizQuestion(quizCount + 1);
        }
      }, 2500);
    } else {
      setQuizFeedback("Oops! Let's try the next one! 🌟");
      playSynthSound('pop');

      setTimeout(() => {
        if (quizCount >= 10) {
          setQuizState('end');
          completeMathLevel('addition_plus1');
        } else {
          initQuizQuestion(quizCount + 1);
        }
      }, 2500);
    }
  };

  // Setup tab specifics
  const switchTab = (tab: TabType) => {
    playSynthSound('pop');
    setActiveTab(tab);
    if (tab === 'butterfly') {
      setQuizState('intro');
    }
  };

  // Helper selectors for packing rendering
  const renderSeedsArray = (count: number) => {
    const arr = [];
    for (let i = 0; i < count; i++) arr.push(i);
    return arr;
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #74ebd5 0%, #9face6 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      {/* Back button and title */}
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
          onClick={onBack}
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
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
        >
          <ArrowLeft size={20} /> Dashboard
        </button>
        <h1 style={{ fontSize: '2.4em', color: '#fff', textShadow: '3px 3px 0px rgba(0,0,0,0.2)' }}>
          ✨ Magic Math Adventure ✨
        </h1>
        <div style={{ width: '120px' }}></div> {/* Spacer */}
      </div>

      {/* Main Container */}
      <div 
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          width: '95%',
          maxWidth: '900px',
          borderRadius: '40px',
          padding: '25px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '6px solid #fff',
          color: '#333',
          textAlign: 'center',
          zIndex: 5
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
          {(['apples', 'bunny', 'seeds', 'butterfly'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              style={{
                padding: '12px 24px',
                fontSize: '1.2em',
                fontWeight: 900,
                background: activeTab === tab ? '#9c27b0' : '#e0e0e0',
                color: activeTab === tab ? 'white' : '#757575',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: activeTab === tab ? 'inset 0 -4px 0 #7b1fa2' : 'inset 0 -4px 0 rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.background = '#d5d5d5';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.background = '#e0e0e0';
                }
              }}
            >
              {tab === 'apples' && '🍎 1. Apples'}
              {tab === 'bunny' && '🐰 2. Bunny'}
              {tab === 'seeds' && '🌱 3. Seeds'}
              {tab === 'butterfly' && '🦋 4. Butterfly'}
            </button>
          ))}
        </div>

        {/* --- APPLES GAME TAB --- */}
        {activeTab === 'apples' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <p style={{ fontSize: '1.8em', fontWeight: 900, color: '#ff5722', marginBottom: '20px' }}>
              {applesCount === maxApples ? '10 Apples! Yay! 🎉' : 'Count the apples!'}
            </p>
            
            {/* Apples Basket */}
            <div 
              style={{
                background: '#e8f5e9',
                borderRadius: '30px',
                padding: '25px',
                minHeight: '260px',
                border: '4px dashed #81c784',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignContent: 'flex-start',
                gap: '15px',
                position: 'relative',
                marginBottom: '25px'
              }}
            >
              <AnimatePresence>
                {renderSeedsArray(applesCount).map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    style={{
                      fontSize: '5em',
                      lineHeight: 1,
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 8px 5px rgba(0,0,0,0.15))'
                    }}
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    onClick={() => {
                      playSynthSound('pop');
                    }}
                  >
                    🍎
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Equation */}
            <div 
              style={{
                fontSize: '3.5em',
                fontWeight: 900,
                color: '#2196f3',
                margin: '20px 0',
                background: '#e3f2fd',
                padding: '15px 35px',
                borderRadius: '25px',
                display: 'inline-block'
              }}
            >
              {applesCount === maxApples ? `${maxApples - 1} + 1 = ${maxApples}` : applesCount}
            </div>
            
            <br />
            
            <button
              onClick={handleAddApple}
              disabled={applesCount >= maxApples}
              style={{
                background: applesCount >= maxApples ? '#bcaaa4' : '#ff5252',
                color: 'white',
                border: 'none',
                padding: '16px 36px',
                fontSize: '1.8em',
                fontWeight: 900,
                borderRadius: '50px',
                cursor: applesCount >= maxApples ? 'not-allowed' : 'pointer',
                boxShadow: applesCount >= maxApples ? '0 8px 0 #8d6e63' : '0 8px 0 #d50000',
                transition: 'all 0.1s',
                marginTop: '10px'
              }}
              className="add-apple-btn"
              onMouseDown={(e) => {
                if (applesCount < maxApples) {
                  e.currentTarget.style.transform = 'translateY(8px)';
                  e.currentTarget.style.boxShadow = '0 0 0 #d50000';
                }
              }}
              onMouseUp={(e) => {
                if (applesCount < maxApples) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 0 #d50000';
                }
              }}
            >
              {applesCount >= maxApples ? 'Full! 🌟' : '+1 Apple!'}
            </button>
            
            <br /><br />
            
            <button 
              onClick={handleResetApples}
              style={{
                background: 'none',
                border: 'none',
                color: '#2196f3',
                fontSize: '1.2em',
                fontWeight: 'bold',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Start Over
            </button>
          </motion.div>
        )}

        {/* --- BUNNY FEEDING TAB --- */}
        {activeTab === 'bunny' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <p style={{ fontSize: '1.8em', fontWeight: 900, color: '#ff5722', marginBottom: '20px' }}>
              Give the Bunny 1 more carrot! 🥕
            </p>
            
            <div 
              style={{
                fontSize: '3.5em',
                fontWeight: 900,
                color: '#2196f3',
                margin: '10px 0',
                background: '#e3f2fd',
                padding: '10px 30px',
                borderRadius: '25px',
                display: 'inline-block'
              }}
            >
              {bunnyFedState === 'full' ? `${bunnyTarget - 1} + 1 = ${bunnyTarget}!` : `${bunnyCurrent} + 1 = ?`}
            </div>

            <div 
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                background: '#fff3e0',
                borderRadius: '35px',
                padding: '30px',
                border: '4px solid #ffcc80',
                marginTop: '15px',
                position: 'relative',
                minHeight: '270px'
              }}
            >
              {/* Bunny element */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <motion.div 
                  className="bunny-container"
                  animate={
                    bunnyFedState === 'happy'
                      ? { y: [0, -30, 0], scale: [1, 1.1, 1] }
                      : bunnyFedState === 'full'
                      ? { y: [0, -40, 0, -40, 0], rotate: [0, -5, 5, -5, 5, 0] }
                      : {}
                  }
                  transition={{ duration: bunnyFedState === 'full' ? 1.5 : 0.5 }}
                  style={{ fontSize: '8em', lineHeight: 1, position: 'relative', zIndex: 2, display: 'inline-block' }}
                >
                  <span>{bunnyFedState === 'full' ? '🥳' : '🐰'}</span>
                  
                  {/* Bubble */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '-50px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'white',
                      borderRadius: '20px',
                      padding: '10px 20px',
                      fontSize: '0.35em',
                      fontWeight: 900,
                      color: '#e65100',
                      border: '3px solid #e65100',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                    }}
                  >
                    {bunnyFedState === 'full' ? 'Yum! Thank you!' : `I want ${bunnyTarget}!`}
                  </div>
                </motion.div>
                
                {/* Carrot Plate */}
                <div 
                  ref={bunnyPlateRef}
                  style={{
                    width: '190px',
                    height: '35px',
                    background: '#e0e0e0',
                    borderRadius: '50%',
                    borderBottom: '4px solid #bdbdbd',
                    marginTop: '-25px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    gap: '4px',
                    zIndex: 1,
                    position: 'relative'
                  }}
                >
                  <AnimatePresence>
                    {renderSeedsArray(bunnyCurrent).map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        style={{ fontSize: '3.2em', lineHeight: 0.8, zIndex: 2 }}
                      >
                        🥕
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Feed/Carrot Spawner */}
              {bunnyFedState !== 'full' && (
                <motion.div 
                  ref={carrotSourceRef}
                  onClick={feedBunny}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    fontSize: '5em',
                    cursor: 'pointer',
                    filter: 'drop-shadow(0 10px 5px rgba(0,0,0,0.15))',
                    zIndex: 2,
                    textAlign: 'center',
                    lineHeight: 1
                  }}
                >
                  🥕
                  <span style={{ display: 'block', fontSize: '0.3em', color: '#e65100', fontWeight: 900 }}>+1</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* --- SEEDS PLACE VALUE TAB --- */}
        {activeTab === 'seeds' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <p style={{ fontSize: '1.8em', fontWeight: 900, color: '#ff5722', marginBottom: '20px' }}>
              Help pack the Magic Seeds! 🌱
            </p>
            
            {/* The Packing Machine columns */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                background: '#f1f8e9',
                borderRadius: '25px',
                padding: '20px',
                border: '4px solid #aed581',
                marginBottom: '20px',
                position: 'relative'
              }}
            >
              {/* Carry overlay highlights */}
              {carryGrouping === 'ones' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(139, 195, 74, 0.25)', border: '6px solid #8bc34a', borderRadius: '21px', zIndex: 100, pointerEvents: 'none', animation: 'pulse 0.5s infinite alternate' }}>
                  <div style={{ color: '#558b2f', fontSize: '2em', fontWeight: 900, marginTop: '70px' }}>10 Seeds bundle into 1 Pouch! 📦</div>
                </div>
              )}
              
              {carryGrouping === 'tens' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 152, 0, 0.25)', border: '6px solid #ff9800', borderRadius: '21px', zIndex: 100, pointerEvents: 'none', animation: 'pulse 0.5s infinite alternate' }}>
                  <div style={{ color: '#ef6c00', fontSize: '2em', fontWeight: 900, marginTop: '70px' }}>10 Pouches load into 1 Crate! 🪵</div>
                </div>
              )}

              {/* HUNDREDS (Crates) */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '30%',
                  background: '#fff8e1',
                  borderRadius: '15px',
                  padding: '15px 10px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  border: '3px dashed #ffb74d',
                  minHeight: '280px'
                }}
              >
                <div style={{ fontSize: '1.2em', fontWeight: 900, marginBottom: '10px', color: '#ffb74d' }}>Crates (100)</div>
                <div 
                  style={{
                    fontSize: '3em',
                    fontWeight: 900,
                    color: '#333',
                    marginBottom: '15px',
                    background: '#fff',
                    width: '70px',
                    borderRadius: '15px',
                    boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {Math.floor(seedsCount / 100)}
                </div>
                
                {/* Crates Visual Container */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-end', gap: '5px', height: '150px', width: '100%', position: 'relative' }}>
                  {renderSeedsArray(Math.floor(seedsCount / 100)).map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '80px',
                        height: '45px',
                        background: '#ffca28',
                        borderRadius: '5px',
                        boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2), -3px 3px 5px rgba(0,0,0,0.3)',
                        border: '3px solid #795548',
                        position: 'absolute',
                        bottom: `${i * 12}px`,
                        left: `calc(50% - 40px + ${i * 4}px)`,
                        zIndex: 20 - i,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '0.9em',
                        color: '#fff',
                        fontWeight: 900
                      }}
                    >
                      100
                    </div>
                  ))}
                </div>
              </div>

              {/* TENS (Pouches) */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '30%',
                  background: '#efebe9',
                  borderRadius: '15px',
                  padding: '15px 10px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  border: '3px dashed #8d6e63',
                  minHeight: '280px'
                }}
              >
                <div style={{ fontSize: '1.2em', fontWeight: 900, marginBottom: '10px', color: '#8d6e63' }}>Pouches (10)</div>
                <div 
                  style={{
                    fontSize: '3em',
                    fontWeight: 900,
                    color: '#333',
                    marginBottom: '15px',
                    background: '#fff',
                    width: '70px',
                    borderRadius: '15px',
                    boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {Math.floor((seedsCount % 100) / 10)}
                </div>
                
                {/* Pouches Visual Container */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-end', gap: '8px', height: '150px', width: '100%' }}>
                  {renderSeedsArray(Math.floor((seedsCount % 100) / 10)).map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '32px',
                        height: '42px',
                        background: '#8d6e63',
                        borderRadius: '40% 40% 12px 12px',
                        boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.3), 0 3px 5px rgba(0,0,0,0.2)',
                        borderTop: '5px solid #5d4037',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.8em',
                        paddingBottom: '3px'
                      }}
                    >
                      10
                    </div>
                  ))}
                </div>
              </div>

              {/* ONES (Seeds) */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '30%',
                  background: '#f1f8e9',
                  borderRadius: '15px',
                  padding: '15px 10px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  border: '3px dashed #64dd17',
                  minHeight: '280px'
                }}
              >
                <div style={{ fontSize: '1.2em', fontWeight: 900, marginBottom: '10px', color: '#64dd17' }}>Seeds (1)</div>
                <div 
                  style={{
                    fontSize: '3em',
                    fontWeight: 900,
                    color: '#333',
                    marginBottom: '15px',
                    background: '#fff',
                    width: '70px',
                    borderRadius: '15px',
                    boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {seedsCount % 10}
                </div>
                
                {/* Seeds Visual Container */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-end', gap: '6px', height: '150px', width: '100%', padding: '10px' }}>
                  {renderSeedsArray(seedsCount % 10).map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '22px',
                        height: '22px',
                        background: 'radial-gradient(circle, #b2ff59 30%, #64dd17 100%)',
                        borderRadius: '50%',
                        boxShadow: '0 0 8px #76ff03, inset -2px -2px 5px rgba(0,0,0,0.2)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <button
                onClick={handleAddSeed}
                disabled={isPacking || seedsCount >= 999}
                style={{
                  background: '#8bc34a',
                  color: 'white',
                  border: 'none',
                  padding: '15px 40px',
                  fontSize: '1.8em',
                  fontWeight: 900,
                  borderRadius: '50px',
                  cursor: isPacking || seedsCount >= 999 ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 0 #558b2f',
                  transition: 'all 0.1s'
                }}
                onMouseDown={(e) => {
                  if (!isPacking && seedsCount < 999) {
                    e.currentTarget.style.transform = 'translateY(8px)';
                    e.currentTarget.style.boxShadow = '0 0 0 #558b2f';
                  }
                }}
                onMouseUp={(e) => {
                  if (!isPacking && seedsCount < 999) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 8px 0 #558b2f';
                  }
                }}
              >
                +1 Seed!
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.2em', color: '#555' }}>Start at:</span>
                <input
                  type="number"
                  value={seedsCount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 0 && v <= 999) setSeedsCount(v);
                  }}
                  style={{
                    fontSize: '1.2em',
                    padding: '8px',
                    width: '90px',
                    textAlign: 'center',
                    border: '3px solid #ccc',
                    borderRadius: '10px',
                    fontWeight: 'bold'
                  }}
                />
                <button 
                  onClick={handleRandomizeSeeds}
                  style={{
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    padding: '10px 15px',
                    fontSize: '1.1em',
                    fontWeight: 'bold',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 0 #e65100'
                  }}
                >
                  🎲 Random
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- QUIZ: BUTTERFLY RESCUE TAB --- */}
        {activeTab === 'butterfly' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {/* Intro Screen */}
            {quizState === 'intro' && (
              <div style={{ padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ fontSize: '7em' }}>🦋🌸</div>
                <h2 style={{ fontSize: '2.2em', color: '#9c27b0', fontWeight: 900 }}>Butterfly Rescue Quiz</h2>
                <p style={{ fontSize: '1.3em', fontWeight: 700, color: '#666', maxWidth: '500px', lineHeight: 1.4 }}>
                  Help the colorful butterflies find the matching magical flowers! Get 10 questions correct to earn massive bonus stars!
                </p>
                <button
                  onClick={startQuiz}
                  style={{
                    background: '#00bcd4',
                    color: 'white',
                    border: 'none',
                    padding: '15px 40px',
                    fontSize: '1.6em',
                    fontWeight: 900,
                    borderRadius: '35px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 0 #0097a7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  Start Adventure 🚀
                </button>
              </div>
            )}

            {/* Play Screen */}
            {quizState === 'play' && (
              <div style={{ background: '#e0f7fa', padding: '30px', borderRadius: '30px', border: '4px solid #26c6da', position: 'relative' }}>
                {/* HUD */}
                <div 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.4em',
                    fontWeight: 900,
                    background: '#fff',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    color: '#ff9800',
                    marginBottom: '20px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <span>Question: {quizCount} / 10</span>
                  <span>Score: {quizScore}</span>
                </div>

                <div style={{ fontSize: '1.6em', color: '#00bcd4', fontWeight: 'bold', marginBottom: '15px' }}>
                  Help the butterfly find the right flower!
                </div>

                {/* Butterfly Arena */}
                <div style={{ position: 'relative', height: '170px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                  <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    style={{
                      fontSize: '5.5em',
                      lineHeight: 1,
                      filter: 'drop-shadow(0 10px 5px rgba(0,0,0,0.2))',
                      position: 'absolute',
                      zIndex: 10
                    }}
                  >
                    🦋
                    {/* Math Equation Bubble */}
                    <div 
                      style={{
                        position: 'absolute',
                        top: '-35px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'white',
                        borderRadius: '20px',
                        padding: '8px 18px',
                        fontSize: '0.35em',
                        fontWeight: 900,
                        color: '#9c27b0',
                        border: '3px solid #9c27b0',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                      }}
                    >
                      {currentBase} + 1 = ?
                    </div>
                  </motion.div>
                </div>

                {/* Flowers Selection */}
                <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: '10px' }}>
                  {quizOptions.map((opt, idx) => {
                    const flowers = ['🌸', '🌺', '🌻'];
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === currentBase + 1;
                    
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleAnswerClick(opt)}
                        disabled={isAnswering}
                        whileHover={!isAnswering ? { scale: 1.1 } : {}}
                        whileTap={!isAnswering ? { scale: 0.95 } : {}}
                        animate={
                          isAnswering && isSelected
                            ? isCorrect
                              ? { y: [0, -20, 0], scale: 1.05 }
                              : { x: [-10, 10, -10, 10, 0] }
                            : {}
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isAnswering ? 'default' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          position: 'relative'
                        }}
                      >
                        <div style={{ fontSize: '5.2em', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.15))' }}>
                          {flowers[idx]}
                        </div>
                        <div 
                          style={{
                            background: '#fff',
                            color: isAnswering && isSelected
                              ? isCorrect ? '#4caf50' : '#f44336'
                              : '#e91e63',
                            fontSize: '1.8em',
                            fontWeight: 900,
                            padding: '4px 18px',
                            borderRadius: '20px',
                            border: `3px solid ${
                              isAnswering && isSelected
                                ? isCorrect ? '#4caf50' : '#f44336'
                                : '#e91e63'
                            }`,
                            marginTop: '-15px',
                            zIndex: 2,
                            boxShadow: `0 4px 0 ${
                              isAnswering && isSelected
                                ? isCorrect ? '#388e3c' : '#d32f2f'
                                : '#c2185b'
                            }`
                          }}
                        >
                          {opt}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Feedback text */}
                <div 
                  style={{
                    fontSize: '1.8em',
                    fontWeight: 'bold',
                    height: '40px',
                    marginTop: '25px',
                    textAlign: 'center'
                  }}
                >
                  {quizFeedback}
                </div>
              </div>
            )}

            {/* End Screen */}
            {quizState === 'end' && (
              <div style={{ padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <motion.div 
                  animate={{ y: [0, -30, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{ fontSize: '8em' }}
                >
                  {quizScore >= 80 ? '🥳' : '❤️'}
                </motion.div>
                <h2 style={{ fontSize: '2.5em', fontWeight: 900, color: '#ef6c00' }}>
                  {quizScore >= 80 ? 'Amazing Job!' : 'Great effort!'}
                </h2>
                <div style={{ fontSize: '2em', color: '#00bcd4', fontWeight: 'bold' }}>
                  Final Score: {quizScore} / 100
                </div>
                <p style={{ fontSize: '1.2em', color: '#666', maxWidth: '400px', lineHeight: 1.4 }}>
                  {quizScore >= 80 
                    ? 'You rescued the butterflies beautifully and earned 10 Bonus Stars!' 
                    : 'Try again to rescue all butterflies and get a perfect score!'}
                </p>
                <button
                  onClick={startQuiz}
                  style={{
                    background: '#00bcd4',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    fontSize: '1.5em',
                    fontWeight: 900,
                    borderRadius: '35px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 0 #0097a7',
                    marginTop: '15px'
                  }}
                >
                  Play Again 🔄
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

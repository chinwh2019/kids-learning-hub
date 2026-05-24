import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SpaceLevel } from '../ShapeExplorer';
import { useLearnerStore } from '../../../store/learnerStore';
import { Rocket, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RocketBuilderProps {
  level: SpaceLevel;
  onComplete: () => void;
}

interface BlueprintSlot {
  id: string;
  shapeType: 'triangle' | 'rectangle' | 'circle' | 'semicircle' | 'square' | 'trapezoid';
  name: string;
  color: string;
  x: number; // percentage offset from center of blueprint
  y: number; // percentage offset from top of blueprint
  width: number;
  height: number;
  rotation?: number;
}

// Custom Sound Synthesizer using Web Audio API
const playShapesAudio = (type: 'tap' | 'correct' | 'wrong' | 'countdown' | 'launch') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    
    if (type === 'tap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'correct') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'countdown') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 beep
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'launch') {
      // Simulate rocket rumble using low frequency oscillators and high gain envelopes
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 4.5);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 4.5);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4.5);
      
      osc.start();
      osc.stop(ctx.currentTime + 4.5);
    }
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e);
  }
};

export default function RocketBuilder({ level, onComplete }: RocketBuilderProps) {
  const { completeShapeLevel, addStars } = useLearnerStore();
  
  // Define blueprint slots per level
  const [slots, setSlots] = useState<BlueprintSlot[]>([]);
  const [placedSlotIds, setPlacedSlotIds] = useState<Record<string, boolean>>({});
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0);
  const [gameState, setGameState] = useState<'build' | 'ready' | 'countdown' | 'launch' | 'success'>('build');
  const [countdownNum, setCountdownNum] = useState<number>(5);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  useEffect(() => {
    // Generate design blueprint slots based on level difficulty
    let levelSlots: BlueprintSlot[] = [];
    if (level.id === 'solar_shuttle') {
      levelSlots = [
        { id: '1', shapeType: 'triangle', name: 'Nose Cone', color: '#ef4444', x: 0, y: 15, width: 80, height: 80 },
        { id: '2', shapeType: 'rectangle', name: 'Main Rocket Body', color: '#3b82f6', x: 0, y: 46, width: 90, height: 160 },
        { id: '3', shapeType: 'circle', name: 'Engine Window', color: '#fbbf24', x: 0, y: 46, width: 50, height: 50 },
        { id: '4', shapeType: 'triangle', name: 'Left Wing Fin', color: '#a855f7', x: -65, y: 64, width: 50, height: 70, rotation: -90 },
        { id: '5', shapeType: 'triangle', name: 'Right Wing Fin', color: '#a855f7', x: 65, y: 64, width: 50, height: 70, rotation: 90 }
      ];
    } else if (level.id === 'cosmic_cruiser') {
      levelSlots = [
        { id: '1', shapeType: 'triangle', name: 'Nose Cone', color: '#ef4444', x: 0, y: 12, width: 70, height: 70 },
        { id: '2', shapeType: 'rectangle', name: 'Rocket Body', color: '#2563eb', x: 0, y: 42, width: 80, height: 165 },
        { id: '3', shapeType: 'semicircle', name: 'Rocket Window Canopy', color: '#06b6d4', x: 0, y: 35, width: 44, height: 44 },
        { id: '4', shapeType: 'rectangle', name: 'Left Booster', color: '#10b981', x: -55, y: 55, width: 40, height: 110 },
        { id: '5', shapeType: 'rectangle', name: 'Right Booster', color: '#10b981', x: 55, y: 55, width: 40, height: 110 },
        { id: '6', shapeType: 'circle', name: 'Fuel Porthole', color: '#fb923c', x: 0, y: 55, width: 34, height: 34 },
        { id: '7', shapeType: 'semicircle', name: 'Left Wing', color: '#8b5cf6', x: -95, y: 64, width: 48, height: 75, rotation: -90 },
        { id: '8', shapeType: 'semicircle', name: 'Right Wing', color: '#8b5cf6', x: 95, y: 64, width: 48, height: 75, rotation: 90 }
      ];
    } else {
      // galaxy_explorer
      levelSlots = [
        { id: '1', shapeType: 'triangle', name: 'Spire Tip', color: '#ef4444', x: 0, y: 8, width: 70, height: 70 },
        { id: '2', shapeType: 'rectangle', name: 'Command Deck', color: '#1e40af', x: 0, y: 33, width: 90, height: 140 },
        { id: '3', shapeType: 'circle', name: 'Main Deck Window', color: '#22d3ee', x: 0, y: 28, width: 46, height: 46 },
        { id: '4', shapeType: 'trapezoid', name: 'Cargo Bay', color: '#7c3aed', x: 0, y: 63, width: 120, height: 130 },
        { id: '5', shapeType: 'rectangle', name: 'Port Side Panel Connector', color: '#4b5563', x: -80, y: 44, width: 70, height: 26 },
        { id: '6', shapeType: 'rectangle', name: 'Starboard Side Panel Connector', color: '#4b5563', x: 80, y: 44, width: 70, height: 26 },
        { id: '7', shapeType: 'square', name: 'Solar Array Wing Panel', color: '#2563eb', x: 135, y: 44, width: 56, height: 56 },
        { id: '8', shapeType: 'semicircle', name: 'Radar Array', color: '#fbbf24', x: -130, y: 44, width: 56, height: 56, rotation: -90 },
        { id: '9', shapeType: 'triangle', name: 'Left Flame Thruster', color: '#f97316', x: -35, y: 84, width: 44, height: 56 },
        { id: '10', shapeType: 'triangle', name: 'Right Flame Thruster', color: '#f97316', x: 35, y: 84, width: 44, height: 56 }
      ];
    }
    setSlots(levelSlots);
    setPlacedSlotIds({});
    setActiveSlotIdx(0);
    setGameState('build');
    setFeedbackMsg('');
  }, [level]);

  const activeSlot = slots[activeSlotIdx];

  // Choices in the bottom drawer are derived from blueprint shapes shuffled slightly
  const [drawerOptions, setDrawerOptions] = useState<string[]>([]);
  useEffect(() => {
    if (slots.length > 0) {
      const list = slots.map((s) => s.shapeType);
      // Shuffle list
      const shuffled = [...list].sort(() => Math.random() - 0.5);
      setDrawerOptions(shuffled);
    }
  }, [slots]);

  const handleShapeSelect = (selectedType: string) => {
    if (gameState !== 'build' || !activeSlot) return;
    
    if (selectedType === activeSlot.shapeType) {
      // Correct shape selected!
      playShapesAudio('correct');
      setFeedbackMsg('🌟 Splendid snap! 🌟');
      
      const nextPlaced = { ...placedSlotIds, [activeSlot.id]: true };
      setPlacedSlotIds(nextPlaced);

      setTimeout(() => {
        setFeedbackMsg('');
        const nextIdx = activeSlotIdx + 1;
        if (nextIdx >= slots.length) {
          // Finished entire rocket!
          setGameState('ready');
        } else {
          setActiveSlotIdx(nextIdx);
        }
      }, 900);
    } else {
      // Incorrect shape choice
      playShapesAudio('wrong');
      setFeedbackMsg(`Oops! That's a ${selectedType}. Look closely at the outline shape! 🌟`);
      setTimeout(() => setFeedbackMsg(''), 1800);
    }
  };

  const handleStartCountdown = () => {
    setGameState('countdown');
    setCountdownNum(5);
    playShapesAudio('countdown');
  };

  useEffect(() => {
    if (gameState === 'countdown') {
      const timer = setInterval(() => {
        setCountdownNum((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            triggerBlastOff();
            return 0;
          }
          playShapesAudio('countdown');
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  const triggerBlastOff = () => {
    setGameState('launch');
    playShapesAudio('launch');
    
    // Complete level state
    completeShapeLevel(level.id);

    // Dynamic fire confetti burst
    const interval = setInterval(() => {
      confetti({
        particleCount: 15,
        angle: 90,
        spread: 40,
        origin: { x: Math.random() * 0.4 + 0.3, y: 0.8 },
        colors: ['#ff4500', '#ff8c00', '#ffd700']
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setGameState('success');
      confetti({ particleCount: 100, spread: 80 });
      addStars(10); // Reward stars
    }, 4000);
  };

  const renderShapeIcon = (type: string, fill = '#64748b') => {
    switch (type) {
      case 'triangle':
        return (
          <svg width="46" height="46" viewBox="0 0 100 100" style={{ fill, stroke: '#fff', strokeWidth: 4 }}>
            <polygon points="50,10 90,90 10,90" />
          </svg>
        );
      case 'rectangle':
        return (
          <svg width="46" height="46" viewBox="0 0 100 100" style={{ fill, stroke: '#fff', strokeWidth: 4 }}>
            <rect x="15" y="25" width="70" height="50" rx="6" />
          </svg>
        );
      case 'circle':
        return (
          <svg width="46" height="46" viewBox="0 0 100 100" style={{ fill, stroke: '#fff', strokeWidth: 4 }}>
            <circle cx="50" cy="50" r="40" />
          </svg>
        );
      case 'semicircle':
        return (
          <svg width="46" height="46" viewBox="0 0 100 100" style={{ fill, stroke: '#fff', strokeWidth: 4 }}>
            <path d="M10,80 A40,40 0 0,1 90,80 Z" />
          </svg>
        );
      case 'square':
        return (
          <svg width="46" height="46" viewBox="0 0 100 100" style={{ fill, stroke: '#fff', strokeWidth: 4 }}>
            <rect x="20" y="20" width="60" height="60" rx="6" />
          </svg>
        );
      case 'trapezoid':
        return (
          <svg width="46" height="46" viewBox="0 0 100 100" style={{ fill, stroke: '#fff', strokeWidth: 4 }}>
            <polygon points="25,20 75,20 95,80 5,80" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderFullShapeOnBlueprint = (slot: BlueprintSlot, opacity = 1) => {
    const isPlaced = placedSlotIds[slot.id];
    const fill = isPlaced ? slot.color : 'rgba(255,255,255,0.06)';
    const stroke = isPlaced ? '#fff' : activeSlot?.id === slot.id ? '#a855f7' : 'rgba(255,255,255,0.2)';
    const strokeWidth = activeSlot?.id === slot.id ? 5 : 3;
    const strokeDasharray = isPlaced ? 'none' : '6, 6';

    const baseStyles = {
      position: 'absolute' as const,
      left: `calc(50% + ${slot.x}px - ${slot.width / 2}px)`,
      top: `${slot.y}%`,
      width: `${slot.width}px`,
      height: `${slot.height}px`,
      transform: slot.rotation ? `rotate(${slot.rotation}deg)` : 'none',
      opacity,
      transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2)'
    };

    switch (slot.shapeType) {
      case 'triangle':
        return (
          <svg key={slot.id} style={baseStyles} viewBox="0 0 100 100">
            <polygon points="50,4 96,96 4,96" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </svg>
        );
      case 'rectangle':
        return (
          <svg key={slot.id} style={baseStyles} viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="4" y="4" width="92" height="92" rx="10" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </svg>
        );
      case 'circle':
        return (
          <svg key={slot.id} style={baseStyles} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </svg>
        );
      case 'semicircle':
        return (
          <svg key={slot.id} style={baseStyles} viewBox="0 0 100 100">
            <path d="M6,90 A44,44 0 0,1 94,90 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </svg>
        );
      case 'square':
        return (
          <svg key={slot.id} style={baseStyles} viewBox="0 0 100 100">
            <rect x="6" y="6" width="88" height="88" rx="12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </svg>
        );
      case 'trapezoid':
        return (
          <svg key={slot.id} style={baseStyles} viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="20,6 80,6 96,94 4,94" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '450px', textAlign: 'center', position: 'relative' }}>
      
      {/* 1. BLUEPRINT CONSTRUCTION MODE */}
      {gameState === 'build' && activeSlot && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 style={{ fontSize: '1.8em', color: '#a855f7', fontWeight: 900, marginBottom: '5px' }}>
            Find the shape that fits the glow! 🧩
          </h2>
          <p style={{ fontSize: '1.2em', color: '#cbd5e1', fontWeight: 700, marginBottom: '20px' }}>
            Active Slot: <span style={{ color: '#a855f7', textTransform: 'uppercase' }}>{activeSlot.name}</span>
          </p>

          <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap-reverse' }}>
            
            {/* Shapes Drawer Choices Drawer */}
            <div 
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '3px dashed rgba(255,255,255,0.15)',
                borderRadius: '35px',
                padding: '25px',
                display: 'flex',
                gap: '15px',
                maxWidth: '400px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {Array.from(new Set(drawerOptions)).map((type) => (
                <motion.button
                  key={type}
                  onClick={() => handleShapeSelect(type)}
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.94 }}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '3px solid rgba(255,255,255,0.2)',
                    borderRadius: '24px',
                    width: '95px',
                    height: '95px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: '4px'
                  }}
                >
                  {renderShapeIcon(type, '#a855f7')}
                  <span style={{ fontSize: '0.7em', color: '#fff', fontWeight: 900, textTransform: 'uppercase' }}>
                    {type}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Launchpad Blueprint Board */}
            <div 
              style={{
                width: '320px',
                height: '380px',
                background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
                borderRadius: '35px',
                border: '4px solid rgba(255,255,255,0.15)',
                position: 'relative',
                boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
                overflow: 'hidden'
              }}
            >
              {/* Gridlines for engineering visual blueprint theme */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              
              {/* Render slots */}
              {slots.map((slot) => renderFullShapeOnBlueprint(slot))}
            </div>

          </div>

          {/* Feedback Text Message Box */}
          <div style={{ fontSize: '1.6em', fontWeight: 'bold', height: '40px', marginTop: '20px', color: '#fbbf24' }}>
            {feedbackMsg}
          </div>

        </motion.div>
      )}

      {/* 2. ROCKET ASSEMBLED - READY SCREEN */}
      {gameState === 'ready' && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '20px 10px' }}>
          <h2 style={{ fontSize: '2.5em', color: '#10b981', fontWeight: 950, marginBottom: '10px' }}>
            Rocket Construction Complete! 🛠️🛰️
          </h2>
          <p style={{ fontSize: '1.4em', color: '#cbd5e1', fontWeight: 700, marginBottom: '35px' }}>
            All shapes are perfectly aligned! Your stellar spaceship is ready for launch!
          </p>

          <div 
            style={{
              width: '260px',
              height: '300px',
              background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
              borderRadius: '35px',
              border: '4px solid #10b981',
              position: 'relative',
              boxShadow: '0 0 25px rgba(16,185,129,0.3)',
              margin: '0 auto 40px auto'
            }}
          >
            {slots.map((slot) => renderFullShapeOnBlueprint(slot))}
          </div>

          <button
            onClick={handleStartCountdown}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 45px',
              fontSize: '1.6em',
              fontWeight: 950,
              borderRadius: '35px',
              cursor: 'pointer',
              boxShadow: '0 8px 0 #991b1b, 0 15px 30px rgba(239,68,68,0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Rocket size={24} style={{ transform: 'rotate(45deg)' }} /> Prepare Launch! 🚀
          </button>
        </motion.div>
      )}

      {/* 3. COUNTDOWN IN PROGRESS */}
      {gameState === 'countdown' && (
        <div style={{ padding: '50px 10px' }}>
          <h2 style={{ fontSize: '2.5em', color: '#ef4444', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '40px' }}>
            Launching in...
          </h2>
          <motion.div
            key={countdownNum}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.4, 1], opacity: 1 }}
            transition={{ duration: 0.95 }}
            style={{
              fontSize: '12em',
              fontWeight: 950,
              color: countdownNum <= 2 ? '#ef4444' : countdownNum <= 4 ? '#f59e0b' : '#3b82f6',
              lineHeight: 1,
              textShadow: '0 0 30px rgba(255,255,255,0.4)'
            }}
          >
            {countdownNum}
          </motion.div>
        </div>
      )}

      {/* 4. ANIMATED BLAST OFF / SPACE FLIGHT LAUNCH */}
      {gameState === 'launch' && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: '#030712',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Parallax Starfield Canvas or CSS simulated background */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, #0c1020 0%, #030712 100%)',
              overflow: 'hidden'
            }}
          >
            {/* Flying Star Streamers */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
              <motion.div
                key={i}
                initial={{ y: -50, x: `${Math.random() * 100}%`, height: `${Math.random() * 80 + 30}px`, opacity: Math.random() * 0.7 + 0.3 }}
                animate={{ y: '110vh' }}
                transition={{ repeat: Infinity, duration: Math.random() * 0.8 + 0.4, ease: 'linear', delay: Math.random() * 1.5 }}
                style={{
                  position: 'absolute',
                  width: '2px',
                  background: 'linear-gradient(to bottom, transparent, #fff)',
                  pointerEvents: 'none'
                }}
              />
            ))}
          </div>

          <h2 style={{ position: 'absolute', top: '10%', fontSize: '3em', fontWeight: 950, color: '#fbbf24', textShadow: '0 0 20px #ef4444', textTransform: 'uppercase', letterSpacing: '3px', zIndex: 10 }}>
            Blast Off! 🚀✨
          </h2>

          {/* Flying Assembled Rocket Container */}
          <motion.div
            animate={{
              y: [180, -280],
              x: [0, -6, 6, -3, 3, 0],
              scale: [1, 0.95, 0.8]
            }}
            transition={{
              y: { duration: 4, ease: 'easeInOut' },
              x: { repeat: Infinity, duration: 0.12, ease: 'linear' },
              scale: { duration: 4 }
            }}
            style={{
              width: '240px',
              height: '280px',
              position: 'relative',
              zIndex: 5
            }}
          >
            {slots.map((slot) => renderFullShapeOnBlueprint(slot, 1))}

            {/* Fire Exhaust Jet Flame Simulation */}
            <motion.div
              animate={{
                scaleY: [1, 1.4, 0.9, 1.3, 1],
                opacity: [0.9, 1, 0.85, 1]
              }}
              transition={{ repeat: Infinity, duration: 0.15 }}
              style={{
                position: 'absolute',
                bottom: '-70px',
                left: 'calc(50% - 25px)',
                width: '50px',
                height: '75px',
                background: 'linear-gradient(to bottom, #ffd700, #ff4500, transparent)',
                borderRadius: '50%',
                transformOrigin: 'top center',
                filter: 'drop-shadow(0 0 15px #ff4500)'
              }}
            />
          </motion.div>
        </div>
      )}

      {/* 5. SUCCESS MODULE SCREEN */}
      {gameState === 'success' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ padding: '30px 10px' }}
        >
          <div style={{ fontSize: '7.5em', marginBottom: '15px', filter: 'drop-shadow(0 8px 4px rgba(0,0,0,0.15))' }}>
            🛰️🏆🎉
          </div>
          
          <h2 style={{ fontSize: '2.6em', fontWeight: 950, color: '#10b981', marginBottom: '10px' }}>
            Splendid Space Launch!
          </h2>
          
          <p style={{ fontSize: '1.4em', color: '#cbd5e1', fontWeight: 800, maxWidth: '520px', margin: '0 auto 35px auto', lineHeight: 1.4 }}>
            Your custom {level.name} flew straight into orbit! You successfully mastered shape blueprints and earned **10 Star Rewards!**
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
            <Award size={20} /> Space Blueprint Selection
          </button>
        </motion.div>
      )}

    </div>
  );
}

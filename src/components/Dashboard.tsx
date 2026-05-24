import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearnerStore } from '../store/learnerStore';
import { Star, RefreshCw, Lock, X } from 'lucide-react';

interface DashboardProps {
  onViewChange: (view: 'dashboard' | 'math' | 'phonics' | 'shapes' | 'parent-dashboard') => void;
}

export default function Dashboard({ onViewChange }: DashboardProps) {
  const { stars, resetAll } = useLearnerStore();
  
  // Parent gate states
  const [showGate, setShowGate] = useState(false);
  const [gateNum1, setGateNum1] = useState(0);
  const [gateNum2, setGateNum2] = useState(0);
  const [gateAnswer, setGateAnswer] = useState('');
  const [gateFeedback, setGateFeedback] = useState('');

  const openParentPortal = () => {
    const n1 = Math.floor(Math.random() * 4) + 6; // 6 to 9
    const n2 = Math.floor(Math.random() * 4) + 6; // 6 to 9
    setGateNum1(n1);
    setGateNum2(n2);
    setGateAnswer('');
    setGateFeedback('');
    setShowGate(true);
  };

  const handleVerifyGate = (e: React.FormEvent) => {
    e.preventDefault();
    const correct = gateNum1 * gateNum2;
    if (parseInt(gateAnswer) === correct) {
      setShowGate(false);
      onViewChange('parent-dashboard');
    } else {
      setGateFeedback('Incorrect! Please try again. 🔒');
      setGateAnswer('');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all your stars? 🌟')) {
      resetAll();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.4 } }
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
      {/* Floating Background Bubbles */}
      <div className="bubble-bg b1"></div>
      <div className="bubble-bg b2"></div>
      <div className="bubble-bg b3"></div>
      <div className="bubble-bg b4"></div>

      {/* Parent Portal Button */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <button
          onClick={openParentPortal}
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            color: '#fff',
            padding: '10px 22px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 900,
            fontSize: '1.1em',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
        >
          <Lock size={16} /> Parents
        </button>
      </div>

      {/* Header section */}
      <header style={{ marginTop: '50px', marginBottom: '30px', textAlign: 'center', position: 'relative' }}>
        <motion.h1
          initial={{ scale: 0.8, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 1 }}
          style={{
            fontSize: '3.8em',
            color: '#fff',
            textShadow: '4px 4px 0px rgba(0,0,0,0.1)',
            letterSpacing: '2px',
            marginBottom: '10px'
          }}
        >
          ✨ Magic Learning Hub ✨
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: '1.4em',
            color: '#fff',
            fontWeight: 700,
            background: 'rgba(0,0,0,0.1)',
            padding: '10px 24px',
            borderRadius: '30px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <span>Choose an adventure to begin!</span>
        </motion.div>
      </header>

      {/* Stats Board */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        style={{
          display: 'flex',
          gap: '20px',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '15px 30px',
          borderRadius: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '3px solid #fff',
          alignItems: 'center',
          marginBottom: '40px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.div
            animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <Star size={36} fill="#ffd700" color="#ffb700" />
          </motion.div>
          <span style={{ fontSize: '2em', fontWeight: 900, color: '#f57c00' }}>
            {stars} Stars
          </span>
        </div>
        
        <div style={{ width: '2px', height: '30px', background: '#ccc' }}></div>
        
        <button 
          onClick={handleReset}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            color: '#888',
            transition: 'color 0.2s'
          }}
          title="Reset stars"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5252')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
        >
          <RefreshCw size={20} />
        </button>
      </motion.div>

      {/* Grid Layout */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          width: '90%',
          maxWidth: '1000px',
          padding: '20px 20px 60px 20px',
        }}
      >
        {/* Module 1: Magic Addition */}
        <motion.div 
          variants={itemVariants}
          className="clickable-card"
          onClick={() => onViewChange('math')}
        >
          <div style={{ fontSize: '5em', marginBottom: '15px', filter: 'drop-shadow(0 8px 5px rgba(0,0,0,0.15))' }}>🍎🐰</div>
          <h2 style={{ fontSize: '2em', fontWeight: 900, marginBottom: '10px', color: '#4caf50' }}>Magic Addition (+1)</h2>
          <p style={{ fontSize: '1.1em', fontWeight: 700, color: '#666', marginBottom: '25px', lineHeight: 1.4 }}>
            Learn to count apples, feed the bunny, pack magic seeds, and rescue butterflies!
          </p>
          <button className="kid-button" style={{ background: '#4caf50', boxShadow: '0 6px 0 #388e3c' }}>
            Play Now 🚀
          </button>
        </motion.div>

        {/* Module 2: Dino Spelling (Phonics Quest) */}
        <motion.div 
          variants={itemVariants}
          className="clickable-card"
          onClick={() => onViewChange('phonics')}
        >
          <div style={{ fontSize: '5em', marginBottom: '15px', filter: 'drop-shadow(0 8px 5px rgba(0,0,0,0.15))' }}>🔤🦕</div>
          <h2 style={{ fontSize: '2em', fontWeight: 900, marginBottom: '10px', color: '#ff5252' }}>Phonics Quest</h2>
          <p style={{ fontSize: '1.1em', fontWeight: 700, color: '#666', marginBottom: '25px', lineHeight: 1.4 }}>
            Explore islands of sound, drag spell tiles, blend phonemes, and unlock cute stories!
          </p>
          <button className="kid-button">
            Play Now 🚀
          </button>
        </motion.div>

        {/* Module 3: Shape Explorer */}
        <motion.div 
          variants={itemVariants}
          className="clickable-card"
          onClick={() => onViewChange('shapes')}
        >
          <div style={{ fontSize: '5em', marginBottom: '15px', filter: 'drop-shadow(0 8px 5px rgba(0,0,0,0.15))' }}>🎨🚀</div>
          <h2 style={{ fontSize: '2em', fontWeight: 900, marginBottom: '10px', color: '#9c27b0' }}>Shape Explorer</h2>
          <p style={{ fontSize: '1.1em', fontWeight: 700, color: '#666', marginBottom: '25px', lineHeight: 1.4 }}>
            Blast off into space and build rockets using magical geometric shapes!
          </p>
          <button className="kid-button" style={{ background: '#9c27b0', boxShadow: '0 6px 0 #7b1fa2' }}>
            Play Now 🚀
          </button>
        </motion.div>
      </motion.div>

      {/* Parents Verification Gate Modal */}
      <AnimatePresence>
        {showGate && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: 'white',
                border: '6px solid #8b5cf6',
                borderRadius: '40px',
                padding: '30px',
                width: '90%',
                maxWidth: '440px',
                textAlign: 'center',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                position: 'relative',
                color: '#333'
              }}
            >
              <button
                onClick={() => setShowGate(false)}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>

              <Lock size={44} color="#8b5cf6" style={{ marginBottom: '15px' }} />
              
              <h3 style={{ fontSize: '1.8em', fontWeight: 950, color: '#333', marginBottom: '8px' }}>
                Parents Only Portal
              </h3>
              
              <p style={{ fontSize: '1.05em', color: '#64748b', fontWeight: 700, marginBottom: '25px', lineHeight: 1.4 }}>
                Please solve this multiplication puzzle to prove you are an adult:
              </p>

              <form onSubmit={handleVerifyGate}>
                <div 
                  style={{
                    fontSize: '3em',
                    fontWeight: 950,
                    color: '#8b5cf6',
                    background: '#f5f3ff',
                    padding: '10px 25px',
                    borderRadius: '20px',
                    display: 'inline-block',
                    marginBottom: '20px',
                    border: '2px solid #ddd6fe'
                  }}
                >
                  {gateNum1} &times; {gateNum2} = ?
                </div>

                <br />

                <input
                  type="number"
                  required
                  value={gateAnswer}
                  onChange={(e) => setGateAnswer(e.target.value)}
                  placeholder="Answer"
                  style={{
                    width: '160px',
                    padding: '12px',
                    fontSize: '1.5em',
                    fontWeight: 900,
                    textAlign: 'center',
                    border: '3px solid #cbd5e1',
                    borderRadius: '20px',
                    outline: 'none',
                    marginBottom: '15px',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />

                <br />

                <button
                  type="submit"
                  style={{
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    padding: '12px 35px',
                    fontSize: '1.2em',
                    fontWeight: 900,
                    borderRadius: '25px',
                    cursor: 'pointer',
                    boxShadow: '0 5px 0 #6d28d9',
                  }}
                >
                  Enter Portal 🔑
                </button>
              </form>

              <div style={{ height: '30px', marginTop: '12px', color: '#ef4444', fontWeight: 'bold', fontSize: '1.1em' }}>
                {gateFeedback}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

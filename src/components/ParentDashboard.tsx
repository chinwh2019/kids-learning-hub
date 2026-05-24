import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLearnerStore } from '../store/learnerStore';
import { ArrowLeft, Star, BarChart3, RotateCw, Activity, Mic } from 'lucide-react';
import ParentVoiceStudio from './ParentVoiceStudio';
import { words } from '../games/phonics/curriculum/words';
import { phonemes } from '../games/phonics/curriculum/phonemes';
import { getDueItems, ReviewItem } from '../games/phonics/srs/scheduler';
import confetti from 'canvas-confetti';

interface ParentDashboardProps {
  onBack: () => void;
}

type ParentTab = 'analytics' | 'srs' | 'offline' | 'voice';

export default function ParentDashboard({ onBack }: ParentDashboardProps) {
  const { 
    stars, 
    completedMathLevels, 
    phonicsWave, 
    phonicsCompletedWords, 
    completedShapeLevels,
    phonicsSrsItems,
    updateSrsItem,
    addStars 
  } = useLearnerStore();

  const [activeTab, setActiveTab] = useState<ParentTab>('analytics');

  // SRS states
  const [activeReviewItem, setActiveReviewItem] = useState<ReviewItem | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<string>('');

  // Extract due items
  const srsArray = Object.values(phonicsSrsItems);
  const dueItems = getDueItems(srsArray);

  const startReviewSession = () => {
    if (dueItems.length > 0) {
      setActiveReviewItem(dueItems[0]);
      setReviewFeedback('');
    }
  };

  const handleReviewAnswer = (result: 'again' | 'good' | 'easy') => {
    if (!activeReviewItem) return;

    // Call store action to schedule srs due dates
    updateSrsItem(activeReviewItem.id, result);

    if (result === 'good' || result === 'easy') {
      confetti({ particleCount: 30, spread: 40 });
      addStars(5); // Double stars for parent-led reviews!
      setReviewFeedback('⭐ Super Job! Double Star Reward +5 Stars! ⭐');
    } else {
      setReviewFeedback('Scheduled for review in this session. Practice again! 🔁');
    }

    setTimeout(() => {
      setReviewFeedback('');
      // Move to next due item
      const nextDue = dueItems.filter((i) => i.id !== activeReviewItem.id);
      if (nextDue.length > 0) {
        setActiveReviewItem(nextDue[0]);
      } else {
        setActiveReviewItem(null);
      }
    }, 1800);
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #111827 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        color: '#fff',
        overflowX: 'hidden'
      }}
    >
      {/* Background Star Blobs */}
      <div className="bubble-bg b1" style={{ opacity: 0.08, background: '#a855f7' }}></div>
      <div className="bubble-bg b2" style={{ opacity: 0.06, background: '#3b82f6' }}></div>

      {/* Header bar */}
      <div 
        style={{
          width: '95%',
          maxWidth: '900px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          zIndex: 10
        }}
      >
        <button 
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '2px solid rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1.1em',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          <ArrowLeft size={20} /> Kid Hub
        </button>

        <h1 style={{ fontSize: '2.4em', fontWeight: 950, textShadow: '0 0 15px rgba(139,92,246,0.3)' }}>
          🔑 Parent Portal & Analytics
        </h1>

        {/* Global Stars Counter */}
        <div 
          style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '6px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '1.2em',
            fontWeight: 900,
            color: '#fbbf24',
            border: '2px solid rgba(255,255,255,0.15)'
          }}
        >
          <Star size={20} fill="#fbbf24" color="#fbbf24" />
          <span>{stars} Stars</span>
        </div>
      </div>

      {/* Main Glass Panel */}
      <div 
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          width: '95%',
          maxWidth: '900px',
          borderRadius: '40px',
          padding: '30px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          zIndex: 5,
          minHeight: '520px',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {(['analytics', 'srs', 'offline', 'voice'] as ParentTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                fontSize: '1.15em',
                fontWeight: 900,
                background: activeTab === tab ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? 'white' : '#cbd5e1',
                border: `2px solid ${activeTab === tab ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '30px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {tab === 'analytics' && <BarChart3 size={18} />}
              {tab === 'srs' && <RotateCw size={18} />}
              {tab === 'offline' && <Activity size={18} />}
              {tab === 'voice' && <Mic size={18} />}
              
              {tab === 'analytics' && 'Progress Stats'}
              {tab === 'srs' && `Soft Reviews (${dueItems.length} due)`}
              {tab === 'offline' && 'Offline Play Guides'}
              {tab === 'voice' && 'Parent Voice Studio'}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div style={{ flex: 1 }}>
          
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '20px',
                  marginBottom: '35px'
                }}
              >
                {/* Math Progress Card */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: '25px', padding: '20px' }}>
                  <h3 style={{ fontSize: '1.4em', color: '#81c784', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                    🍎 Math Progress
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05em' }}>
                      <span>Magic Addition (+1):</span>
                      <span style={{ fontWeight: 800, color: completedMathLevels['addition_plus1'] ? '#81c784' : '#fb923c' }}>
                        {completedMathLevels['addition_plus1'] ? 'Completed 🌟' : 'In Progress ⏳'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phonics Progress Card */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: '25px', padding: '20px' }}>
                  <h3 style={{ fontSize: '1.4em', color: '#ff7043', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                    🔤 Phonics Island Wave
                  </h3>
                  <div style={{ fontSize: '1.1em', fontWeight: 800, color: '#ff7043', marginBottom: '8px' }}>
                    Active: Island {phonicsWave} (Wave {phonicsWave} of 7)
                  </div>
                  <p style={{ fontSize: '0.95em', color: '#94a3b8', lineHeight: 1.4 }}>
                    Taught Phonic Units: <strong>
                      {phonemes.filter((p) => p.wave <= phonicsWave).map((p) => p.grapheme).join(', ')}
                    </strong>
                  </p>
                </div>

                {/* Shapes Progress Card */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: '25px', padding: '20px' }}>
                  <h3 style={{ fontSize: '1.4em', color: '#b388ff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                    🎨 Space Shapes Explorer
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95em' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Solar Shuttle (Easy):</span>
                      <span style={{ fontWeight: 800, color: completedShapeLevels['solar_shuttle'] ? '#b388ff' : '#64748b' }}>
                        {completedShapeLevels['solar_shuttle'] ? 'Completed 🚀' : 'Locked 🔒'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Cosmic Cruiser (Medium):</span>
                      <span style={{ fontWeight: 800, color: completedShapeLevels['cosmic_cruiser'] ? '#b388ff' : '#64748b' }}>
                        {completedShapeLevels['cosmic_cruiser'] ? 'Completed 🛸' : 'Locked 🔒'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Galaxy Explorer (Hard):</span>
                      <span style={{ fontWeight: 800, color: completedShapeLevels['galaxy_explorer'] ? '#b388ff' : '#64748b' }}>
                        {completedShapeLevels['galaxy_explorer'] ? 'Completed 🛰️' : 'Locked 🔒'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mastered Phonics Words Report */}
              <div 
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '2px solid rgba(255,255,255,0.08)',
                  borderRadius: '30px',
                  padding: '25px',
                  textAlign: 'left'
                }}
              >
                <h3 style={{ fontSize: '1.5em', fontWeight: 900, marginBottom: '20px', color: '#ffb74d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📖 Words Mastered Breakdown
                </h3>
                
                {Object.keys(phonicsCompletedWords).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
                    {Object.entries(phonicsCompletedWords).map(([wordId, count]) => {
                      const matched = words.find((w) => w.id === wordId);
                      
                      return (
                        <div 
                          key={wordId}
                          style={{
                            background: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            padding: '12px',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontSize: '2em' }}>{matched?.imageEmoji || '📝'}</div>
                          <div style={{ fontSize: '1.2em', fontWeight: 900, textTransform: 'capitalize', margin: '4px 0' }}>
                            {matched?.text || wordId}
                          </div>
                          <div style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 700 }}>
                            Spelled: {count} times
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '1.1em', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                    No spelling/blend words completed in game activities yet. Complete some island tasks to see stats! 🦖
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: SRS DAILY REVIEW SYSTEM */}
          {activeTab === 'srs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
              
              {!activeReviewItem ? (
                <div style={{ padding: '30px 10px' }}>
                  <h3 style={{ fontSize: '2em', fontWeight: 900, color: '#a78bfa', marginBottom: '15px' }}>
                    Spaced Repetition reviews
                  </h3>
                  <p style={{ fontSize: '1.2em', color: '#cbd5e1', fontWeight: 700, maxWidth: '550px', margin: '0 auto 35px auto', lineHeight: 1.5 }}>
                    Spaced repetition helps reinforce letter sound retention in long-term memory. Completed words are scheduled for soft review here.
                  </p>

                  <div 
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '3px dashed rgba(255,255,255,0.15)',
                      borderRadius: '35px',
                      padding: '30px',
                      maxWidth: '450px',
                      margin: '0 auto 30px auto'
                    }}
                  >
                    <div style={{ fontSize: '4.5em', marginBottom: '10px' }}>🎒📚</div>
                    <div style={{ fontSize: '1.8em', fontWeight: 950, color: '#fbbf24', marginBottom: '10px' }}>
                      {dueItems.length} Cards Due Today
                    </div>
                    <p style={{ fontSize: '1.05em', color: '#94a3b8', fontWeight: 700, lineHeight: 1.4 }}>
                      Parents: Launch a quick **Double-Star Review Session**! Stand with your child, ask them to spell or read the card, and rate their memory recall!
                    </p>
                  </div>

                  <button
                    onClick={startReviewSession}
                    disabled={dueItems.length === 0}
                    style={{
                      background: dueItems.length === 0 ? '#475569' : 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '16px 40px',
                      fontSize: '1.3em',
                      fontWeight: 950,
                      borderRadius: '35px',
                      cursor: dueItems.length === 0 ? 'default' : 'pointer',
                      boxShadow: dueItems.length === 0 ? 'none' : '0 6px 0 #5b21b6, 0 10px 20px rgba(167,139,250,0.3)',
                    }}
                  >
                    Start Phonics Reviews! 🚀
                  </button>
                </div>
              ) : (
                /* ACTIVE REVIEW PLAYGROUND SCREEN */
                <div style={{ padding: '20px 10px' }}>
                  <div style={{ fontSize: '1.3em', color: '#a78bfa', fontWeight: 900, marginBottom: '20px' }}>
                    Phonics Review Session ({dueItems.length} remaining)
                  </div>

                  {/* Words Card to Review */}
                  <motion.div 
                    key={activeReviewItem.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      background: '#fdfbf7',
                      color: '#4e342e',
                      border: '6px solid #ffd54f',
                      borderRadius: '40px',
                      padding: '40px 20px',
                      width: '100%',
                      maxWidth: '450px',
                      margin: '0 auto 30px auto',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '7.5em', lineHeight: 1, marginBottom: '10px' }}>
                      {words.find((w) => w.id === activeReviewItem.id)?.imageEmoji || '📝'}
                    </div>

                    <h1 style={{ fontSize: '4.5em', fontWeight: 950, letterSpacing: '1px', textTransform: 'capitalize', color: '#4e342e', marginBottom: '8px' }}>
                      {words.find((w) => w.id === activeReviewItem.id)?.text || activeReviewItem.id}
                    </h1>

                    <p style={{ fontSize: '1.2em', color: '#8d6e63', fontWeight: 800 }}>
                      Phonics sounds: <strong>
                        /{words.find((w) => w.id === activeReviewItem.id)?.phonemes.join('/')}/
                      </strong>
                    </p>
                  </motion.div>

                  <div style={{ fontSize: '1.25em', color: '#cbd5e1', fontWeight: 700, marginBottom: '25px' }}>
                    Parents: Ask your child to sound out or spell this word. How did they do?
                  </div>

                  {/* Rating Actions */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleReviewAnswer('again')}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '12px 28px',
                        fontSize: '1.1em',
                        fontWeight: 900,
                        borderRadius: '25px',
                        cursor: 'pointer',
                        boxShadow: '0 5px 0 #991b1b',
                      }}
                    >
                      🔁 Practice Again
                    </button>
                    <button
                      onClick={() => handleReviewAnswer('good')}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '12px 28px',
                        fontSize: '1.1em',
                        fontWeight: 900,
                        borderRadius: '25px',
                        cursor: 'pointer',
                        boxShadow: '0 5px 0 #064e3b',
                      }}
                    >
                      👍 Got it Good!
                    </button>
                    <button
                      onClick={() => handleReviewAnswer('easy')}
                      style={{
                        background: '#fbbf24',
                        color: '#451a03',
                        border: 'none',
                        padding: '12px 28px',
                        fontSize: '1.1em',
                        fontWeight: 900,
                        borderRadius: '25px',
                        cursor: 'pointer',
                        boxShadow: '0 5px 0 #b45309',
                      }}
                    >
                      🌟 Perfect & Easy!
                    </button>
                  </div>

                  <div style={{ fontSize: '1.5em', fontWeight: 'bold', height: '40px', marginTop: '25px', color: '#fbbf24' }}>
                    {reviewFeedback}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: OFFLINE PLAY GUIDES */}
          {activeTab === 'offline' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '25px',
                  maxWidth: '750px',
                  margin: '0 auto'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.8em', color: '#ffb74d', fontWeight: 900, marginBottom: '5px' }}>
                    Tactile Offline Play Guides
                  </h3>
                  <p style={{ fontSize: '1.15em', color: '#cbd5e1', fontWeight: 700 }}>
                    Reinforce digital learning with tactile physical parent-child activities!
                  </p>
                </div>

                {/* Activity 1 */}
                <div 
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '2px solid rgba(255,255,255,0.08)',
                    borderRadius: '30px',
                    padding: '25px',
                    textAlign: 'left',
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ fontSize: '3.5em', lineHeight: 1 }}>🧴🔤</div>
                  <div>
                    <h4 style={{ fontSize: '1.3em', fontWeight: 900, color: '#ff8f00', marginBottom: '8px' }}>
                      Activity 1: Sensory Shaving Cream Tracing
                    </h4>
                    <p style={{ fontSize: '1.05em', color: '#94a3b8', lineHeight: 1.5, fontWeight: 600 }}>
                      Spread a thin layer of shaving cream or table salt on a tray. Call out a phonic sound (e.g. <strong>/aaa/</strong>) and have your child trace the letter 'a' with their finger, reciting the sound out loud. This sensory play binds physical memory to grapheme shapes.
                    </p>
                  </div>
                </div>

                {/* Activity 2 */}
                <div 
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '2px solid rgba(255,255,255,0.08)',
                    borderRadius: '30px',
                    padding: '25px',
                    textAlign: 'left',
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ fontSize: '3.5em', lineHeight: 1 }}>🔍🏠</div>
                  <div>
                    <h4 style={{ fontSize: '1.3em', fontWeight: 900, color: '#4caf50', marginBottom: '8px' }}>
                      Activity 2:Living Room Letter Hunt
                    </h4>
                    <p style={{ fontSize: '1.05em', color: '#94a3b8', lineHeight: 1.5, fontWeight: 600 }}>
                      Hide cardboard or wooden letter cards/tiles around the room (e.g., <strong>c, a, t</strong>). Give your child a checklist, let them hunt for the letters, and assemble them on the floor to spell the word **cat**. Celebrate with a giant high-five!
                    </p>
                  </div>
                </div>

                {/* Activity 3 */}
                <div 
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '2px solid rgba(255,255,255,0.08)',
                    borderRadius: '30px',
                    padding: '25px',
                    textAlign: 'left',
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ fontSize: '3.5em', lineHeight: 1 }}>🍎🍽️</div>
                  <div>
                    <h4 style={{ fontSize: '1.3em', fontWeight: 900, color: '#2196f3', marginBottom: '8px' }}>
                      Activity 3: Snack-time Fruit Addition
                    </h4>
                    <p style={{ fontSize: '1.05em', color: '#94a3b8', lineHeight: 1.5, fontWeight: 600 }}>
                      Use grapes, berries, or apple slices during snack time to practice addition! Give your child 4 grapes, ask them to count them, then say "Let's add one more plus one! How many now?" This mirrors the digital Apples and Bunny counting activities in real life.
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 4: PARENT VOICE STUDIO */}
          {activeTab === 'voice' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ParentVoiceStudio />
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}

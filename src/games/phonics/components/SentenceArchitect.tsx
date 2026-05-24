import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { speakWord } from '../utils/speech';
import { useLearnerStore } from '../../../store/learnerStore';
import { Volume2, ArrowRight, RotateCcw, Sparkles, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SentenceArchitectProps {
  wave: number;
  onActivityComplete: () => void;
}

interface SentenceChallenge {
  id: string;
  text: string;           // Target sentence
  words: string[];        // Words to scramble (may contain duplicates like "the")
  emojiBlueprint: string; // The kid-friendly clue representation
  theatreEmoji: string;   // The emojis displayed on the theater stage
  theatreAction: string;  // Visual storytelling text for child comprehension
}

// Curriculum database mapping to progressive wave unlocks
const challengesData: Record<number, SentenceChallenge[]> = {
  1: [
    {
      id: 'w1_s1',
      text: 'sam sat on the tram',
      words: ['sat', 'sam', 'the', 'on', 'tram'],
      emojiBlueprint: '🧘 ➡️ 🚃',
      theatreEmoji: '🧘🚃🚃',
      theatreAction: 'Sam sits comfortably inside the tram! 🚃'
    },
    {
      id: 'w1_s2',
      text: 'the cat sat on the mat',
      words: ['sat', 'the', 'cat', 'mat', 'on', 'the'],
      emojiBlueprint: '🐱 ➡️ 🟫',
      theatreEmoji: '🐱🟫🐱',
      theatreAction: 'The cute cat sits on the soft mat! 🟫'
    },
    {
      id: 'w1_s3',
      text: 'sam saw a cat and a ram',
      words: ['sam', 'saw', 'a', 'ram', 'and', 'cat', 'a'],
      emojiBlueprint: 'sam ➡️ 🐱 + 🐏',
      theatreEmoji: '🧘🐱🐏',
      theatreAction: 'Sam waves hello to the cat and the big ram! 🐏'
    }
  ],
  2: [
    {
      id: 'w2_s1',
      text: 'a sad pig saw a dragon',
      words: ['sad', 'a', 'pig', 'saw', 'dragon', 'a'],
      emojiBlueprint: '😢🐷 ➡️ 🐉',
      theatreEmoji: '🐷🐉✨',
      theatreAction: 'A sad little pig meets a giant friendly dragon! 🐉'
    },
    {
      id: 'w2_s2',
      text: 'the dog got carrots from the pond',
      words: ['the', 'dog', 'got', 'carrots', 'from', 'the', 'pond'],
      emojiBlueprint: '🐶 ➡️ 🥕 + 🏞️',
      theatreEmoji: '🐶🥕🏞️',
      theatreAction: 'The clever dog gathers delicious carrots from the pond! 🥕'
    },
    {
      id: 'w2_s3',
      text: 'the dog ran to the parrot',
      words: ['the', 'dog', 'ran', 'to', 'the', 'parrot'],
      emojiBlueprint: '🐶 ➡️ 🦜',
      theatreEmoji: '🐶🏃🦜',
      theatreAction: 'The happy dog runs fast to greet the colorful parrot! 🦜'
    }
  ],
  3: [
    {
      id: 'w3_s1',
      text: 'the dentist put a helmet on the fox',
      words: ['the', 'dentist', 'put', 'a', 'helmet', 'on', 'the', 'fox'],
      emojiBlueprint: '🦷 ➡️ 🪖 + 🦊',
      theatreEmoji: '🦷🪖🦊',
      theatreAction: 'The dentist fits a safety helmet on the little fox! 🦊'
    },
    {
      id: 'w3_s2',
      text: 'she had a hotdog and a banana',
      words: ['had', 'she', 'a', 'hotdog', 'and', 'a', 'banana'],
      emojiBlueprint: '👧 ➡️ 🌭 + 🍌',
      theatreEmoji: '👧🌭🍌',
      theatreAction: 'She enjoys eating a hotdog and a sweet yellow banana! 🍌'
    },
    {
      id: 'w3_s3',
      text: 'a bug sat on a big pumpkin',
      words: ['bug', 'a', 'sat', 'on', 'big', 'a', 'pumpkin'],
      emojiBlueprint: '🐞 ➡️ 🎃',
      theatreEmoji: '🐞🎃✨',
      theatreAction: 'A tiny ladybug sits on top of a giant orange pumpkin! 🎃'
    }
  ],
  4: [
    {
      id: 'w4_s1',
      text: 'a grumpy monster saw splendid flowers',
      words: ['monster', 'a', 'grumpy', 'saw', 'splendid', 'flowers'],
      emojiBlueprint: '😠👾 ➡️ 🌸',
      theatreEmoji: '👾🌸🌸',
      theatreAction: 'A grumpy little monster discovers beautiful, splendid flowers! 🌸'
    },
    {
      id: 'w4_s2',
      text: 'grandpa did stop the monster',
      words: ['grandpa', 'did', 'stop', 'the', 'monster'],
      emojiBlueprint: '👴 ➡️ 🛑 ➡️ 👾',
      theatreEmoji: '👴🛑👾',
      theatreAction: 'Grandpa stands up tall and stops the silly monster! 🛑'
    },
    {
      id: 'w4_s3',
      text: 'the spider ran in the dark forests',
      words: ['the', 'spider', 'ran', 'in', 'the', 'dark', 'forests'],
      emojiBlueprint: '🕷️ ➡️ 🌑🌲',
      theatreEmoji: '🕷️🌲🌲',
      theatreAction: 'The spider scurries through the tall, dark forests! 🌲'
    }
  ],
  5: [
    {
      id: 'w5_s1',
      text: 'the children ran on the big ship',
      words: ['the', 'children', 'ran', 'on', 'the', 'big', 'ship'],
      emojiBlueprint: '🧑‍🤝‍🧑 ➡️ 🚢',
      theatreEmoji: '🧑‍🤝‍🧑🚢🚢',
      theatreAction: 'The children run happily across the deck of the giant ship! 🚢'
    },
    {
      id: 'w5_s2',
      text: 'chickens sat in the pocket of a coat',
      words: ['chickens', 'sat', 'in', 'the', 'pocket', 'of', 'a', 'coat'],
      emojiBlueprint: '🐔 ➡️ 🪙 + 🧥',
      theatreEmoji: '🐔🪙🧥',
      theatreAction: 'Baby chickens snuggle warm inside the pocket of a coat! 🐔'
    },
    {
      id: 'w5_s3',
      text: 'thunder gave the duckling a shock',
      words: ['thunder', 'gave', 'the', 'duckling', 'a', 'shock'],
      emojiBlueprint: '⚡ ➡️ 🐥 ➡️ 😮',
      theatreEmoji: '⚡🐥⚡',
      theatreAction: 'Loud crackling thunder gives the little duckling a big surprise! ⚡'
    }
  ],
  6: [
    {
      id: 'w6_s1',
      text: 'the kids made sweet cupcakes at home',
      words: ['the', 'kids', 'made', 'sweet', 'cupcakes', 'at', 'home'],
      emojiBlueprint: '🧑‍🤝‍🧑 ➡️ 🧁 + 🏠',
      theatreEmoji: '🧑‍🤝‍🧑🧁🏠',
      theatreAction: 'The kids bake yummy, sweet cupcakes at home! 🧁'
    },
    {
      id: 'w6_s2',
      text: 'tadpoles and reptiles swam in the lake',
      words: ['tadpoles', 'and', 'reptiles', 'swam', 'in', 'the', 'lake'],
      emojiBlueprint: '🐸 + 🦎 ➡️ 🌊',
      theatreEmoji: '🐸🦎🌊',
      theatreAction: 'Tadpoles and colorful reptiles swim around the blue lake! 🌊'
    },
    {
      id: 'w6_s3',
      text: 'they ate pancakes under the bright sunshine',
      words: ['they', 'ate', 'pancakes', 'under', 'the', 'bright', 'sunshine'],
      emojiBlueprint: '🥞 ➡️ ☀️',
      theatreEmoji: '🥞☀️🥞',
      theatreAction: 'They enjoy eating warm pancakes under the bright, happy sunshine! 🥞'
    }
  ],
  7: [
    {
      id: 'w7_s1',
      text: 'the child saw the magic lights in the sky',
      words: ['the', 'child', 'saw', 'the', 'magic', 'lights', 'in', 'the', 'sky'],
      emojiBlueprint: '👧 ➡️ ✨🌌',
      theatreEmoji: '👧✨🌌',
      theatreAction: 'The child gazes up at the sparkling magic lights in the sky! 🌌'
    },
    {
      id: 'w7_s2',
      text: 'she said look at the beautiful stars',
      words: ['she', 'said', 'look', 'at', 'the', 'beautiful', 'stars'],
      emojiBlueprint: '👧💬 ➡️ ⭐',
      theatreEmoji: '💬⭐✨',
      theatreAction: 'She points up and says: Look at the beautiful, shining stars! ⭐'
    },
    {
      id: 'w7_s3',
      text: 'it was a wonderful night under the moon',
      words: ['it', 'was', 'a', 'wonderful', 'night', 'under', 'the', 'moon'],
      emojiBlueprint: '🌃 ➡️ 🌙',
      theatreEmoji: '🌃🌙✨',
      theatreAction: 'It is a wonderful, peaceful night under the glowing crescent moon! 🌙'
    }
  ]
};

export default function SentenceArchitect({ wave, onActivityComplete }: SentenceArchitectProps) {
  const { addStars } = useLearnerStore();
  const waveChallenges = challengesData[wave] || challengesData[1];

  const [challengeIdx, setChallengeIdx] = useState<number>(0);
  const [activeChallenge, setActiveChallenge] = useState<SentenceChallenge | null>(null);
  
  // Game state
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [scrambledTray, setScrambledTray] = useState<{ id: string; word: string; uniqueKey: number }[]>([]);
  const [gameState, setGameState] = useState<'build' | 'theatre' | 'all-done'>('build');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  useEffect(() => {
    if (challengeIdx < waveChallenges.length) {
      const chal = waveChallenges[challengeIdx];
      setActiveChallenge(chal);
      setPlacedWords([]);
      setFeedbackMsg('');
      setGameState('build');

      // Scramble the words tray
      const tray = [...chal.words]
        .sort(() => Math.random() - 0.5)
        .map((w, idx) => ({ id: w, word: w, uniqueKey: idx }));
      setScrambledTray(tray);

      // Speak prompt
      setTimeout(() => {
        speakWord(`Let's build a sentence!`);
      }, 600);
    } else {
      setGameState('all-done');
    }
  }, [challengeIdx, wave]);

  const handleHearTargetSentence = () => {
    if (activeChallenge) {
      speakWord(activeChallenge.text);
    }
  };

  const handleWordTapFromTray = (item: { id: string; word: string; uniqueKey: number }) => {
    if (gameState !== 'build') return;

    speakWord(item.word);
    
    // Add to placed list
    const newPlaced = [...placedWords, item.word];
    setPlacedWords(newPlaced);

    // Remove from scrambled tray
    setScrambledTray((prev) => prev.filter((t) => t.uniqueKey !== item.uniqueKey));

    // Auto-check once all words are placed
    if (activeChallenge && newPlaced.length === activeChallenge.words.length) {
      setTimeout(() => {
        checkSentence(newPlaced);
      }, 700);
    }
  };

  const handleRemovePlacedWord = (idx: number) => {
    if (gameState !== 'build') return;

    const removedWord = placedWords[idx];
    speakWord(removedWord);

    // Remove from placed lists
    const newPlaced = [...placedWords];
    newPlaced.splice(idx, 1);
    setPlacedWords(newPlaced);

    // Return to scrambled tray
    setScrambledTray((prev) => [
      ...prev,
      { id: removedWord, word: removedWord, uniqueKey: Math.random() }
    ]);
    setFeedbackMsg('');
  };

  const handleResetBoard = () => {
    if (gameState !== 'build' || !activeChallenge) return;

    setPlacedWords([]);
    setFeedbackMsg('');
    
    const tray = [...activeChallenge.words]
      .sort(() => Math.random() - 0.5)
      .map((w, idx) => ({ id: w, word: w, uniqueKey: idx }));
    setScrambledTray(tray);
    speakWord('Reset!');
  };

  const checkSentence = (placed: string[]) => {
    if (!activeChallenge) return;

    const spelled = placed.join(' ').toLowerCase().trim();
    const target = activeChallenge.text.toLowerCase().trim();

    if (spelled === target) {
      // Correct! Transition to Emoji Theatre
      setGameState('theatre');
      confetti({ particleCount: 65, spread: 55, colors: ['#f97316', '#fbbf24', '#34d399', '#60a5fa'] });
      addStars(5); // Star Reward!

      setTimeout(() => {
        speakWord(activeChallenge.text);
      }, 400);
    } else {
      // Incorrect feedback
      setFeedbackMsg("Almost! Let's listen again and check the order! 🌟");
      speakWord("Let's try again!");
    }
  };

  const handleNextChallenge = () => {
    if (challengeIdx + 1 >= waveChallenges.length) {
      setGameState('all-done');
      addStars(10); // Massive bonus for completing the island playground
    } else {
      setChallengeIdx((prev) => prev + 1);
    }
  };

  return (
    <div style={{ width: '100%', padding: '10px', textAlign: 'center' }}>
      {gameState !== 'all-done' && activeChallenge && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          
          {/* HEADER INSTRUCTIONS */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '3em' }}>🏗️</span>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '2em', fontWeight: 900, color: '#ea580c', margin: 0 }}>
                Sentence Architect
              </h2>
              <p style={{ fontSize: '1.1em', color: '#64748b', fontWeight: 800, margin: 0 }}>
                Construct the sentence in the correct grammar order!
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '25px' }}>
            {/* Clue and Speaker */}
            <div 
              style={{
                background: '#fff7ed',
                border: '3px solid #ffedd5',
                borderRadius: '25px',
                padding: '12px 24px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
              }}
            >
              <span style={{ fontSize: '1.2em', fontWeight: 900, color: '#c2410c' }}>Blueprint:</span>
              <span style={{ fontSize: '1.6em', fontWeight: 900, letterSpacing: '2px' }}>
                {activeChallenge.emojiBlueprint}
              </span>
            </div>

            <button
              onClick={handleHearTargetSentence}
              style={{
                background: '#ea580c',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 900,
                boxShadow: '0 4px 0 #c2410c',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '1.05em'
              }}
              title="Hear Sentence Blueprint"
            >
              <Volume2 size={18} fill="white" /> Hear Goal
            </button>
          </div>

          {/* ACTIVE GAME BOARD */}
          {gameState === 'build' ? (
            <div>
              {/* 1. PLACED SENTENCE SLOTS */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '12px', 
                  flexWrap: 'wrap', 
                  minHeight: '80px',
                  background: '#f8fafc',
                  border: '4px dashed #cbd5e1',
                  borderRadius: '30px',
                  padding: '18px',
                  maxWidth: '750px',
                  margin: '0 auto 30px auto',
                  alignItems: 'center'
                }}
              >
                {/* Visual Placeholder Slots */}
                {Array.from({ length: activeChallenge.words.length }).map((_, idx) => {
                  const placedWord = placedWords[idx];

                  return (
                    <motion.div
                      key={idx}
                      onClick={() => placedWord && handleRemovePlacedWord(idx)}
                      whileHover={placedWord ? { scale: 1.05, y: -2 } : {}}
                      style={{
                        minWidth: '95px',
                        height: '58px',
                        borderRadius: '16px',
                        border: placedWord ? '3px solid #f97316' : '3px dashed #cbd5e1',
                        background: placedWord ? '#fffaf8' : 'rgba(241, 245, 249, 0.4)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: placedWord ? 'pointer' : 'default',
                        boxShadow: placedWord ? '0 4px 0 #f97316, 0 6px 12px rgba(0,0,0,0.04)' : 'none',
                        padding: '0 12px'
                      }}
                    >
                      <span style={{ fontSize: '1.4em', fontWeight: 900, color: '#334155' }}>
                        {placedWord || '?'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* 2. SCRAMBLED WORDS TRAY */}
              <div style={{ marginBottom: '25px' }}>
                <p style={{ fontSize: '1.2em', fontWeight: 800, color: '#64748b', marginBottom: '12px' }}>
                  Tap words to add them in order:
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', maxWidth: '650px', margin: '0 auto' }}>
                  {scrambledTray.map((item) => (
                    <motion.button
                      key={item.uniqueKey}
                      onClick={() => handleWordTapFromTray(item)}
                      whileHover={{ scale: 1.08, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        background: 'white',
                        border: '3px solid #ea580c',
                        borderRadius: '20px',
                        padding: '12px 22px',
                        fontSize: '1.4em',
                        fontWeight: 900,
                        color: '#c2410c',
                        cursor: 'pointer',
                        boxShadow: '0 6px 0 #ea580c, 0 8px 16px rgba(234,88,12,0.08)'
                      }}
                    >
                      {item.word}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Action resets */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                <button
                  onClick={handleResetBoard}
                  style={{
                    background: '#cbd5e1',
                    color: '#334155',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: 900,
                    fontSize: '1em',
                    boxShadow: '0 4px 0 #94a3b8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RotateCcw size={16} /> Reset Sentence
                </button>
              </div>

              {/* Spelled incorrect feedback */}
              <div style={{ fontSize: '1.4em', fontWeight: 800, color: '#ef4444', height: '30px', marginTop: '20px' }}>
                {feedbackMsg}
              </div>

            </div>
          ) : (
            
            /* --- EMOJI THEATRE SUCCESS MODE --- */
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: '#fffefb',
                border: '6px solid #fbbf24',
                borderRadius: '40px',
                padding: '30px',
                maxWidth: '650px',
                margin: '0 auto 25px auto',
                boxShadow: '0 20px 40px rgba(251,191,36,0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Theatre stage background arches */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '14px',
                  background: 'repeating-linear-gradient(90deg, #ef4444, #ef4444 20px, #dc2626 20px, #dc2626 40px)'
                }}
              />

              <h4 style={{ fontSize: '1.2em', color: '#b45309', fontWeight: 900, marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} fill="#fbbf24" /> THEATRE SHOWTIME! <Sparkles size={16} fill="#fbbf24" />
              </h4>

              {/* Massive animated stage emojis */}
              <div style={{ background: '#f8fafc', border: '3px dashed #cbd5e1', borderRadius: '30px', padding: '30px 10px', marginBottom: '20px' }}>
                <motion.div 
                  animate={{ 
                    scale: [1, 1.15, 1], 
                    y: [0, -15, 0],
                    rotate: [0, -4, 4, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  style={{ fontSize: '7.5em', lineHeight: 1, filter: 'drop-shadow(0 12px 6px rgba(0,0,0,0.06))' }}
                >
                  {activeChallenge.theatreEmoji}
                </motion.div>
              </div>

              {/* Assembled Sentence Display */}
              <h1 style={{ fontSize: '2.5em', fontWeight: 950, color: '#c2410c', textTransform: 'capitalize', letterSpacing: '0.5px', marginBottom: '10px' }}>
                "{activeChallenge.text}"
              </h1>

              {/* Action sentence description */}
              <p style={{ fontSize: '1.3em', color: '#475569', fontWeight: 800, maxWidth: '500px', margin: '0 auto 25px auto', lineHeight: 1.4 }}>
                {activeChallenge.theatreAction}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button
                  onClick={() => speakWord(activeChallenge.text)}
                  style={{
                    background: '#ea580c',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontWeight: 900,
                    boxShadow: '0 5px 0 #c2410c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1.1em'
                  }}
                >
                  <Volume2 size={18} fill="white" /> Hear Again
                </button>

                <button
                  onClick={handleNextChallenge}
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontWeight: 900,
                    boxShadow: '0 5px 0 #166534',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1.1em'
                  }}
                >
                  Next Challenge <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

        </motion.div>
      )}

      {/* ALL DONE PLAYGROUND STAGE */}
      {gameState === 'all-done' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ padding: '30px 10px' }}
        >
          <div style={{ fontSize: '8em', filter: 'drop-shadow(0 10px 4px rgba(0,0,0,0.06))', marginBottom: '15px' }}>🏗️🏛️🏆</div>
          <h2 style={{ fontSize: '2.8em', fontWeight: 900, color: '#ea580c', marginBottom: '10px' }}>
            Ultimate Sentence Architect!
          </h2>
          <p style={{ fontSize: '1.4em', color: '#475569', fontWeight: 800, maxWidth: '520px', margin: '0 auto 30px auto', lineHeight: 1.45 }}>
            Splendid structure! You successfully constructed every sentence blueprint and earned **10 Bonus Stars**!
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
            <BookOpen size={20} /> Back to Playground!
          </button>
        </motion.div>
      )}
    </div>
  );
}

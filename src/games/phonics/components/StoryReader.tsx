import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phoneme, phonemes } from '../curriculum/phonemes';
import { speakPhoneme, speakWord } from '../utils/speech';
import SoundTile from './SoundTile';
import { BookOpen, Volume2, X } from 'lucide-react';
import { useLearnerStore } from '../../../store/learnerStore';
import confetti from 'canvas-confetti';

interface StoryReaderProps {
  wave: number;
  onActivityComplete: () => void;
}

interface DecodableStory {
  id: string;
  title: string;
  wave: number;
  lines: string[];
  emoji: string;
}

const stories: DecodableStory[] = [
  {
    id: 'story_wave1',
    title: 'Sam and the Cat',
    wave: 1,
    lines: [
      'sam sat on the tram.',
      'sam saw a cat and a ram.',
      'the cat sat on the mast.',
      'sam the cat and the ram ran.'
    ],
    emoji: '🧘🐱'
  },
  {
    id: 'story_wave2',
    title: 'The Sad Pig',
    wave: 2,
    lines: [
      'a sad pig saw a parrot and a dragon.',
      'the dog got carrots from the pond.',
      'the pig did drop the carrots in the pond.',
      'the parrot the dragon and the dog had a picnic!'
    ],
    emoji: '😢🐷'
  },
  {
    id: 'story_wave3',
    title: 'The Bug in the Hat',
    wave: 3,
    lines: [
      'a dentist sat on a blanket under the sunset.',
      'she had a hotdog a banana and a big pumpkin.',
      'a clever fox saw the pumpkin on the blanket.',
      'the dentist put a helmet on the fox!'
    ],
    emoji: '🎩🐞'
  },
  {
    id: 'story_wave4',
    title: 'The Frog in the Fog',
    wave: 4,
    lines: [
      'a grumpy monster ran in the dark forests.',
      'the monster saw splendid flowers and a spider.',
      'grandpa did stand up and stop the monster.',
      'the monster got stamps and began to grin!'
    ],
    emoji: '🐸🌫️'
  },
  {
    id: 'story_wave5',
    title: 'The Duck on the Ship',
    wave: 5,
    lines: [
      'the children ran on the big ship.',
      'they saw chickens in the pocket of a coat.',
      'thunder gave the children a big shock.',
      'a cute duckling swam past the thin fish.',
      'the children had pocket toys on the ship.'
    ],
    emoji: '🦆🚢'
  },
  {
    id: 'story_wave6',
    title: 'The Cake in the Pine Home',
    wave: 6,
    lines: [
      'the kids made cupcakes and sweet pancakes at home.',
      'they took a campfire trip to the pine lake.',
      'a tadpole and some reptiles saw the cupcakes.',
      'they ate the sweet pancakes under the bright sunshine!'
    ],
    emoji: '🍰🏠'
  },
  {
    id: 'story_wave7',
    title: 'Sam and the Magic Star',
    wave: 7,
    lines: [
      'the night was very quiet the mother said.',
      'she said look at the beautiful stars and the moon.',
      'the child saw the magic lights in the sky.',
      'it was a wonderful night she said.'
    ],
    emoji: '⭐🌙'
  }
];

export default function StoryReader({ wave, onActivityComplete }: StoryReaderProps) {
  const { addStars } = useLearnerStore();
  const [activeStory, setActiveStory] = useState<DecodableStory | null>(null);
  
  // Modal for decoding a tapped word
  const [decodingWord, setDecodingWord] = useState<string | null>(null);
  const [decodingPhonemes, setDecodingPhonemes] = useState<Phoneme[]>([]);
  const [isStoryRead, setIsStoryRead] = useState<boolean>(false);

  useEffect(() => {
    // Pick the story for this wave (or fall back to the first story if none found)
    const story = stories.find((s) => s.wave === wave) || stories[0];
    setActiveStory(story);
    setIsStoryRead(false);
    setDecodingWord(null);
  }, [wave]);

  const handleWordTap = (word: string) => {
    // Strip punctuation
    const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    if (!cleanWord) return;

    setDecodingWord(cleanWord);
    
    // Resolve to phonemes (greedy mapping)
    const resolved: Phoneme[] = [];
    let remaining = cleanWord;

    while (remaining.length > 0) {
      // Find the longest matching grapheme
      let match: Phoneme | null = null;
      for (const p of phonemes) {
        if (remaining.startsWith(p.grapheme)) {
          if (!match || p.grapheme.length > match.grapheme.length) {
            match = p;
          }
        }
      }

      if (match) {
        resolved.push(match);
        remaining = remaining.substring(match.grapheme.length);
      } else {
        // Fallback for single unknown letters
        const singleChar = remaining.charAt(0);
        resolved.push({
          id: singleChar,
          grapheme: singleChar,
          sound: singleChar,
          synthFreq: 260,
          synthType: 'sine',
          tileType: 'consonant',
          exampleWord: '',
          color: 'blue',
          wave: 1
        });
        remaining = remaining.substring(1);
      }
    }

    setDecodingPhonemes(resolved);
    speakWord(cleanWord);
  };

  const handleSpeakLine = (line: string) => {
    speakWord(line);
  };

  const handleFinishStory = () => {
    setIsStoryRead(true);
    confetti({ particleCount: 80, spread: 70 });
    addStars(10); // Massive stars for reading story
  };

  if (!activeStory) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No stories loaded for this island yet! Check back soon. 📖
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '10px', textAlign: 'center' }}>
      {!isStoryRead ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <div style={{ fontSize: '3.5em', filter: 'drop-shadow(0 6px 3px rgba(0,0,0,0.1))' }}>
              {activeStory.emoji}
            </div>
            <h3 style={{ fontSize: '2em', fontWeight: 900, color: '#f57c00' }}>
              {activeStory.title}
            </h3>
          </div>

          <p style={{ fontSize: '1.2em', color: '#666', fontWeight: 700, marginBottom: '25px' }}>
            Tap any word to hear it spoken and break it down! 🔊📖
          </p>

          {/* Book Content Area */}
          <div 
            style={{
              background: '#fdfbf7',
              border: '6px solid #ffcc80',
              borderRadius: '35px',
              padding: '35px 25px',
              maxWidth: '650px',
              margin: '0 auto 30px auto',
              boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative'
            }}
          >
            {activeStory.lines.map((line, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px', 
                  borderBottom: idx < activeStory.lines.length - 1 ? '1px dashed #ffe0b2' : 'none',
                  paddingBottom: '12px'
                }}
              >
                {/* Speaker icon */}
                <button
                  onClick={() => handleSpeakLine(line)}
                  style={{
                    background: '#ffe0b2',
                    border: 'none',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: '#e65100',
                  }}
                  title="Speak line"
                >
                  <Volume2 size={18} fill="#e65100" />
                </button>

                {/* Split line into clickable words */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {line.split(' ').map((word, wIdx) => (
                    <span
                      key={wIdx}
                      onClick={() => handleWordTap(word)}
                      style={{
                        fontSize: '1.8em',
                        fontWeight: 900,
                        color: '#4e342e',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ffe0b2';
                        e.currentTarget.style.color = '#e65100';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#4e342e';
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleFinishStory}
            style={{
              background: '#ff9800',
              color: 'white',
              border: 'none',
              padding: '14px 40px',
              fontSize: '1.4em',
              fontWeight: 900,
              borderRadius: '35px',
              cursor: 'pointer',
              boxShadow: '0 6px 0 #e65100',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '10px'
            }}
          >
            Finished Reading! 🌟
          </button>
        </motion.div>
      ) : (
        /* Reading Success View */
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ padding: '30px 10px' }}
        >
          <div style={{ fontSize: '7.5em', marginBottom: '15px' }}>📖👑🏆</div>
          <h2 style={{ fontSize: '2.5em', fontWeight: 900, color: '#ff9800', marginBottom: '10px' }}>
            Spectacular Story Reader!
          </h2>
          <p style={{ fontSize: '1.4em', color: '#666', fontWeight: 800, maxWidth: '500px', margin: '0 auto 30px auto', lineHeight: 1.4 }}>
            You completed the entire decodable story and practiced all your words! You earned **10 Star Rewards**!
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
            <BookOpen size={20} /> Back to Island!
          </button>
        </motion.div>
      )}

      {/* --- DECODING WORD MODAL/POPUP OVERLAY --- */}
      <AnimatePresence>
        {decodingWord && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 99999,
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: 'white',
                border: '6px solid #ffd54f',
                borderRadius: '40px',
                padding: '30px',
                width: '90%',
                maxWidth: '480px',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setDecodingWord(null)}
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

              <h4 style={{ fontSize: '1.3em', color: '#666', fontWeight: 800, marginBottom: '15px' }}>
                Tap the tiles to sound out:
              </h4>
              
              <h2 style={{ fontSize: '3em', fontWeight: 950, textTransform: 'uppercase', color: '#ff9800', letterSpacing: '1px', marginBottom: '25px' }}>
                "{decodingWord}"
              </h2>

              {/* Broken down phonics tiles */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '30px' }}>
                {decodingPhonemes.map((p, idx) => (
                  <SoundTile
                    key={idx}
                    phoneme={p}
                    size="md"
                    onClick={() => speakPhoneme(p)}
                  />
                ))}
              </div>

              <button
                onClick={() => speakWord(decodingWord)}
                style={{
                  background: '#ffb300',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  fontSize: '1.2em',
                  fontWeight: 900,
                  borderRadius: '25px',
                  cursor: 'pointer',
                  boxShadow: '0 5px 0 #ff8f00',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Volume2 size={18} fill="white" /> Hear Whole Word
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

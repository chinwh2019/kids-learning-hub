import { motion } from 'framer-motion';
import { Phoneme } from '../curriculum/phonemes';

interface SoundTileProps {
  phoneme: Phoneme;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    bg: 'rgba(224, 242, 254, 0.95)',
    border: '4px solid #38bdf8',
    text: '#0369a1',
    shadow: '0 6px 0 #0284c7',
  },
  red: {
    bg: 'rgba(254, 226, 226, 0.95)',
    border: '4px solid #f87171',
    text: '#b91c1c',
    shadow: '0 6px 0 #dc2626',
  },
  green: {
    bg: 'rgba(220, 252, 231, 0.95)',
    border: '4px solid #4ade80',
    text: '#15803d',
    shadow: '0 6px 0 #16a34a',
  },
  purple: {
    bg: 'rgba(243, 232, 255, 0.95)',
    border: '4px solid #c084fc',
    text: '#7e22ce',
    shadow: '0 6px 0 #9333ea',
  },
  gold: {
    bg: 'rgba(254, 243, 199, 0.95)',
    border: '4px solid #fbbf24',
    text: '#b45309',
    shadow: '0 6px 0 #d97706',
  },
};

export default function SoundTile({
  phoneme,
  selected = false,
  disabled = false,
  size = 'md',
  onClick,
}: SoundTileProps) {
  const styles = colorStyles[phoneme.color] || colorStyles.blue;
  
  const sizeMap = {
    sm: { width: '60px', height: '60px', fontSize: '1.8em', borderRadius: '16px' },
    md: { width: '85px', height: '85px', fontSize: '2.5em', borderRadius: '24px' },
    lg: { width: '110px', height: '110px', fontSize: '3.2em', borderRadius: '32px' },
  };

  const activeSize = sizeMap[size];

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={!disabled ? { scale: 1.08, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.94, y: 4 } : {}}
      animate={selected ? { scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        width: activeSize.width,
        height: activeSize.height,
        borderRadius: activeSize.borderRadius,
        background: styles.bg,
        border: styles.border,
        color: styles.text,
        fontSize: activeSize.fontSize,
        fontWeight: 900,
        boxShadow: selected ? '0 0 0 6px #facc15' : `${styles.shadow}, 0 8px 16px rgba(0,0,0,0.1)`,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        outline: 'none',
        lineHeight: 1.1,
        transition: 'box-shadow 0.1s, transform 0.1s',
      }}
    >
      <span style={{ 
        transform: size === 'sm' ? 'translateY(-2px)' : 'translateY(-6px)',
        display: 'block'
      }}>
        {phoneme.grapheme}
      </span>
      {size !== 'sm' && (
        <span style={{
          fontSize: '0.3em',
          fontWeight: 800,
          background: 'rgba(255, 255, 255, 0.75)',
          padding: '2px 8px',
          borderRadius: '12px',
          marginTop: '-4px',
          color: '#475569',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          fontFamily: 'monospace',
          lineHeight: 1,
          letterSpacing: '0.5px'
        }}>
          /{phoneme.sound}/
        </span>
      )}
    </motion.button>
  );
}

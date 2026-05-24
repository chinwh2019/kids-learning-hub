export type TileType = 'consonant' | 'vowel' | 'digraph' | 'magic-e' | 'heart-word';

export interface Phoneme {
  id: string;
  grapheme: string;
  sound: string;        // Phoneme sound text description or guide
  synthFreq: number;    // Frequency offset for AudioContext synth represents this sound
  synthType: OscillatorType; // Synth voice shape
  tileType: TileType;
  exampleWord: string;
  color: 'blue' | 'red' | 'green' | 'purple' | 'gold';
  wave: number;         // Island number it belongs to
}

export const phonemes: Phoneme[] = [
  // Island 1: Short a
  { id: 'a', grapheme: 'a', sound: 'ă', synthFreq: 261.63, synthType: 'sine', tileType: 'vowel', exampleWord: 'cat', color: 'red', wave: 1 },
  { id: 'm', grapheme: 'm', sound: 'mmm', synthFreq: 180.00, synthType: 'triangle', tileType: 'consonant', exampleWord: 'mat', color: 'blue', wave: 1 },
  { id: 's', grapheme: 's', sound: 'sss', synthFreq: 900.00, synthType: 'sawtooth', tileType: 'consonant', exampleWord: 'sat', color: 'blue', wave: 1 },
  { id: 't', grapheme: 't', sound: 't-t', synthFreq: 400.00, synthType: 'triangle', tileType: 'consonant', exampleWord: 'tap', color: 'blue', wave: 1 },
  { id: 'c', grapheme: 'c', sound: 'k-k', synthFreq: 320.00, synthType: 'triangle', tileType: 'consonant', exampleWord: 'cat', color: 'blue', wave: 1 },
  { id: 'r', grapheme: 'r', sound: 'rrr', synthFreq: 220.00, synthType: 'sine', tileType: 'consonant', exampleWord: 'rat', color: 'blue', wave: 1 },

  // Island 2: Short i / o
  { id: 'i', grapheme: 'i', sound: 'ĭ', synthFreq: 293.66, synthType: 'sine', tileType: 'vowel', exampleWord: 'pin', color: 'red', wave: 2 },
  { id: 'o', grapheme: 'o', sound: 'ŏ', synthFreq: 329.63, synthType: 'sine', tileType: 'vowel', exampleWord: 'hop', color: 'red', wave: 2 },
  { id: 'p', grapheme: 'p', sound: 'p-p', synthFreq: 380.00, synthType: 'triangle', tileType: 'consonant', exampleWord: 'pig', color: 'blue', wave: 2 },
  { id: 'n', grapheme: 'n', sound: 'nnn', synthFreq: 200.00, synthType: 'triangle', tileType: 'consonant', exampleWord: 'net', color: 'blue', wave: 2 },
  { id: 'd', grapheme: 'd', sound: 'd-d', synthFreq: 150.00, synthType: 'triangle', tileType: 'consonant', exampleWord: 'dog', color: 'blue', wave: 2 },
  { id: 'g', grapheme: 'g', sound: 'g-g', synthFreq: 130.00, synthType: 'triangle', tileType: 'consonant', exampleWord: 'gap', color: 'blue', wave: 2 },

  // Island 3: Short e / u
  { id: 'e', grapheme: 'e', sound: 'ĕ', synthFreq: 349.23, synthType: 'sine', tileType: 'vowel', exampleWord: 'red', color: 'red', wave: 3 },
  { id: 'u', grapheme: 'u', sound: 'ŭ', synthFreq: 392.00, synthType: 'sine', tileType: 'vowel', exampleWord: 'cup', color: 'red', wave: 3 },
  { id: 'f', grapheme: 'f', sound: 'fff', synthFreq: 800.00, synthType: 'sawtooth', tileType: 'consonant', exampleWord: 'fox', color: 'blue', wave: 3 },
  { id: 'h', grapheme: 'h', sound: 'h-h', synthFreq: 600.00, synthType: 'sine', tileType: 'consonant', exampleWord: 'hat', color: 'blue', wave: 3 },
  { id: 'l', grapheme: 'l', sound: 'lll', synthFreq: 240.00, synthType: 'sine', tileType: 'consonant', exampleWord: 'leg', color: 'blue', wave: 3 },
  { id: 'b', grapheme: 'b', sound: 'b-b', synthFreq: 120.00, synthType: 'triangle', tileType: 'consonant', exampleWord: 'bat', color: 'blue', wave: 3 },
  { id: 'j', grapheme: 'j', sound: 'j-j', synthFreq: 190.00, synthType: 'triangle', tileType: 'consonant', exampleWord: 'jam', color: 'blue', wave: 3 },
  { id: 'k', grapheme: 'k', sound: 'k-k', synthFreq: 320.00, synthType: 'triangle', tileType: 'consonant', exampleWord: 'kite', color: 'blue', wave: 3 },
  { id: 'q', grapheme: 'q', sound: 'kw', synthFreq: 420.00, synthType: 'sawtooth', tileType: 'consonant', exampleWord: 'queen', color: 'blue', wave: 3 },
  { id: 'v', grapheme: 'v', sound: 'vvv', synthFreq: 220.00, synthType: 'sine', tileType: 'consonant', exampleWord: 'van', color: 'blue', wave: 3 },
  { id: 'w', grapheme: 'w', sound: 'www', synthFreq: 280.00, synthType: 'sine', tileType: 'consonant', exampleWord: 'web', color: 'blue', wave: 3 },
  { id: 'x', grapheme: 'x', sound: 'ks', synthFreq: 750.00, synthType: 'sawtooth', tileType: 'consonant', exampleWord: 'box', color: 'blue', wave: 3 },
  { id: 'y', grapheme: 'y', sound: 'y-y', synthFreq: 310.00, synthType: 'sine', tileType: 'consonant', exampleWord: 'yo-yo', color: 'blue', wave: 3 },
  { id: 'z', grapheme: 'z', sound: 'zzz', synthFreq: 850.00, synthType: 'sawtooth', tileType: 'consonant', exampleWord: 'zebra', color: 'blue', wave: 3 },

  // Island 4: Blends
  { id: 'fl', grapheme: 'fl', sound: 'f-l', synthFreq: 500.00, synthType: 'sawtooth', tileType: 'digraph', exampleWord: 'flat', color: 'purple', wave: 4 },
  { id: 'gr', grapheme: 'gr', synthFreq: 180.00, sound: 'g-r', synthType: 'sawtooth', tileType: 'digraph', exampleWord: 'grin', color: 'purple', wave: 4 },
  { id: 'st', grapheme: 'st', sound: 's-t', synthFreq: 650.00, synthType: 'sawtooth', tileType: 'digraph', exampleWord: 'stop', color: 'purple', wave: 4 },
  { id: 'sp', grapheme: 'sp', sound: 's-p', synthFreq: 620.00, synthType: 'sawtooth', tileType: 'digraph', exampleWord: 'spin', color: 'purple', wave: 4 },

  // Island 5: Digraphs
  { id: 'sh', grapheme: 'sh', sound: 'shhh', synthFreq: 700.00, synthType: 'sawtooth', tileType: 'digraph', exampleWord: 'ship', color: 'green', wave: 5 },
  { id: 'ch', grapheme: 'ch', sound: 'ch-ch', synthFreq: 550.00, synthType: 'sawtooth', tileType: 'digraph', exampleWord: 'chin', color: 'green', wave: 5 },
  { id: 'th', grapheme: 'th', sound: 'thth', synthFreq: 480.00, synthType: 'sawtooth', tileType: 'digraph', exampleWord: 'thin', color: 'green', wave: 5 },
  { id: 'ck', grapheme: 'ck', sound: 'k-k', synthFreq: 330.00, synthType: 'triangle', tileType: 'digraph', exampleWord: 'duck', color: 'green', wave: 5 },

  // Island 6: Magic e
  { id: 'a_e', grapheme: 'a-e', sound: 'ā', synthFreq: 523.25, synthType: 'sine', tileType: 'magic-e', exampleWord: 'cake', color: 'purple', wave: 6 },
  { id: 'i_e', grapheme: 'i-e', sound: 'ī', synthFreq: 587.33, synthType: 'sine', tileType: 'magic-e', exampleWord: 'pine', color: 'purple', wave: 6 },
  { id: 'o_e', grapheme: 'o-e', sound: 'ō', synthFreq: 659.25, synthType: 'sine', tileType: 'magic-e', exampleWord: 'home', color: 'purple', wave: 6 },

  // Island 7: Heart words
  { id: 'the', grapheme: 'the', sound: 'the', synthFreq: 300.00, synthType: 'sine', tileType: 'heart-word', exampleWord: 'the', color: 'gold', wave: 7 },
  { id: 'said', grapheme: 'said', sound: 'said', synthFreq: 340.00, synthType: 'sine', tileType: 'heart-word', exampleWord: 'said', color: 'gold', wave: 7 },
  { id: 'was', grapheme: 'was', sound: 'was', synthFreq: 310.00, synthType: 'sine', tileType: 'heart-word', exampleWord: 'was', color: 'gold', wave: 7 }
];

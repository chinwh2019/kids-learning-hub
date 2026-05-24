import { Phoneme } from '../curriculum/phonemes';
import { useLearnerStore } from '../../../store/learnerStore';

// Map of grapheme IDs to spelling helpers that browser TTS will pronounce correctly as pure phonemes
const phoneticSpellings: Record<string, string> = {
  a: 'ae',
  m: 'mm',
  s: 'ss',
  t: 'tuh',
  c: 'kh',
  r: 'err',
  i: 'ih',
  o: 'ah',
  p: 'puh',
  n: 'nn',
  d: 'duh',
  g: 'guh',
  e: 'eh',
  u: 'uh',
  f: 'ff',
  h: 'huh',
  l: 'uhl',
  b: 'buh',
  fl: 'fl',
  gr: 'gr',
  st: 'st',
  sp: 'sp',
  sh: 'shh',
  ch: 'ch',
  th: 'th',
  ck: 'kh',
  a_e: 'ay',
  i_e: 'eye',
  o_e: 'oh',
};

// Pre-trigger voice loading — Chrome loads voices asynchronously, so we must
// call getVoices() early AND listen for the onvoiceschanged event.
// Also cancel() at init to clear any zombie "speaking" state from prior sessions.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };

  // Debug helper — type window.__testSpeech() in the browser console to test bare-bones TTS
  (window as unknown as Record<string, unknown>).__testSpeech = () => {
    const u = new SpeechSynthesisUtterance('hello world');
    u.onstart = () => console.log('[TEST] onstart — you should hear audio');
    u.onerror = (e) => console.log('[TEST] onerror:', e.error);
    u.onend = () => console.log('[TEST] onend');
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    console.log('[TEST] speak() called. speaking:', window.speechSynthesis.speaking);
  };
}

// Reuse a single AudioContext to avoid exhausting Chrome's ~6 context limit.
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      sharedAudioCtx = new Ctor();
    }
    // Resume if it was suspended (Chrome suspends until user gesture)
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Play a very short, quiet "tick" sound — just a subtle tactile feedback,
// NOT a long instrument tone that drowns out the human voice.
function playSubtleTick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);

  // Very quiet, very short — just a click feedback
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

/**
 * Helper to play a base64 Data URL audio clip in the browser
 */
function playParentVoiceClip(base64Data: string): boolean {
  try {
    const audio = new Audio(base64Data);
    audio.play().catch((err) => {
      console.warn('Audio playback failed:', err);
    });
    return true;
  } catch (e) {
    console.warn('Failed to play base64 parent clip:', e);
    return false;
  }
}

// Hold a global reference to prevent garbage collection mid-playback
let activeUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Pick the best available English voice from the browser's voice list.
 */
function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  console.log('[SPEECH DEBUG] Total voices available:', voices.length);
  if (voices.length > 0) {
    console.log('[SPEECH DEBUG] All voices:', voices.map(v => `${v.name} (${v.lang}) default=${v.default}`).join(', '));
  }
  if (voices.length === 0) return null;

  const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
  console.log('[SPEECH DEBUG] English voices found:', enVoices.length);

  const preferred = [
    'samantha', 'siri', 'google us english', 'google uk english',
    'zira', 'david', 'karen', 'daniel'
  ];

  if (enVoices.length > 0) {
    for (const name of preferred) {
      const found = enVoices.find(v => v.name.toLowerCase().includes(name));
      if (found) {
        console.log('[SPEECH DEBUG] Selected preferred voice:', found.name, found.lang);
        return found;
      }
    }
    const fallback = enVoices.find(v => v.default) || enVoices[0];
    console.log('[SPEECH DEBUG] Selected fallback EN voice:', fallback.name, fallback.lang);
    return fallback;
  }

  const anyDefault = voices.find(v => v.default) || voices[0];
  console.log('[SPEECH DEBUG] No EN voice, using:', anyDefault.name, anyDefault.lang);
  return anyDefault;
}

function performSafeSpeak(utterance: SpeechSynthesisUtterance, isFallback = false) {
  if (!('speechSynthesis' in window)) {
    console.warn('[SPEECH DEBUG] speechSynthesis NOT available in window!');
    return;
  }

  const isStuck = window.speechSynthesis.speaking;
  console.log(`[SPEECH DEBUG] performSafeSpeak called (isFallback=${isFallback}), Stuck state=${isStuck}, text:`, utterance.text, 'voice:', utterance.voice?.name, 'lang:', utterance.lang);
  console.log('[SPEECH DEBUG] PRE-speak state — speaking:', window.speechSynthesis.speaking, 'pending:', window.speechSynthesis.pending, 'paused:', window.speechSynthesis.paused);

  // Resume in case the engine was suspended/paused
  try {
    window.speechSynthesis.resume();
  } catch {
    // ignore
  }

  // Prevent garbage collection by holding a global reference
  activeUtterance = utterance;

  let started = false;
  let watchdogTimer: any = null;

  utterance.onstart = () => {
    started = true;
    if (watchdogTimer) clearTimeout(watchdogTimer);
    console.log('[SPEECH DEBUG] ✅ utterance.onstart fired — voice IS playing');
  };

  utterance.onend = () => {
    if (watchdogTimer) clearTimeout(watchdogTimer);
    console.log('[SPEECH DEBUG] utterance.onend fired');
    if (activeUtterance === utterance) activeUtterance = null;
  };

  utterance.onerror = (ev) => {
    if (watchdogTimer) clearTimeout(watchdogTimer);
    if (ev.error !== 'interrupted' && ev.error !== 'canceled') {
      console.warn('[SPEECH DEBUG] ❌ utterance.onerror fired:', ev.error);
    } else {
      console.log('[SPEECH DEBUG] utterance notice:', ev.error);
    }
    if (activeUtterance === utterance) activeUtterance = null;
  };

  // Start watchdog timer if this is the primary voice try (not the fallback)
  if (!isFallback) {
    watchdogTimer = setTimeout(() => {
      if (!started) {
        console.warn('[SPEECH DEBUG] ⚠️ Watchdog triggered! Voice did not start in 400ms. Calling emergency cancel and trying default browser voice.');
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }

        const fallbackUtterance = new SpeechSynthesisUtterance(utterance.text);
        fallbackUtterance.lang = 'en-US';
        fallbackUtterance.rate = utterance.rate;
        fallbackUtterance.pitch = utterance.pitch;

        // Wait 150ms for cancel to settle, then run fallback speak
        setTimeout(() => {
          performSafeSpeak(fallbackUtterance, true);
        }, 150);
      }
    }, 400);
  }

  const executeSpeak = () => {
    try {
      window.speechSynthesis.speak(utterance);
      console.log('[SPEECH DEBUG] speechSynthesis.speak() completed. speaking:', window.speechSynthesis.speaking, 'pending:', window.speechSynthesis.pending);
    } catch (e) {
      console.warn('[SPEECH DEBUG] speechSynthesis.speak() threw:', e);
      if (watchdogTimer) clearTimeout(watchdogTimer);
      activeUtterance = null;
    }
  };

  if (isStuck) {
    console.log('[SPEECH DEBUG] Speech engine is reporting BUSY/STUCK. Calling cancel() and waiting 150ms to settle...');
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    setTimeout(executeSpeak, 150);
  } else {
    // Speak immediately if engine is clear
    executeSpeak();
  }
}

/**
 * Pronounces a full word or sentence clearly.
 */
export function speakWord(text: string) {
  // Check parent voice recording override
  const cleanId = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
  const store = useLearnerStore.getState();
  if (store?.parentVoiceClips?.[cleanId]) {
    if (playParentVoiceClip(store.parentVoiceClips[cleanId])) {
      return;
    }
  }

  if (!('speechSynthesis' in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';

  const voice = getBestEnglishVoice();
  if (voice) utterance.voice = voice;

  utterance.rate = 0.75;
  utterance.pitch = 1.0;

  performSafeSpeak(utterance);
}

/**
 * Pronounces an isolated phoneme sound.
 * Plays a subtle tick for tactile feedback, then speaks the phonetic approximation.
 */
export function speakPhoneme(phoneme: Phoneme) {
  // Check parent voice recording override
  const store = useLearnerStore.getState();
  if (store?.parentVoiceClips?.[phoneme.id]) {
    if (playParentVoiceClip(store.parentVoiceClips[phoneme.id])) {
      return;
    }
  }

  // 1. Play a tiny subtle tick for tactile feedback (NOT the loud 0.5s instrument beep)
  playSubtleTick();

  // 2. Speak the phoneme with TTS human voice
  if (!('speechSynthesis' in window)) return;

  const isSingleLetter = phoneme.grapheme.length === 1;
  const textToSpeak = isSingleLetter ? phoneme.grapheme : (phoneticSpellings[phoneme.id] || phoneme.grapheme);
  const utterance = new SpeechSynthesisUtterance(textToSpeak);

  utterance.lang = 'en-US';

  const voice = getBestEnglishVoice();
  if (voice) utterance.voice = voice;

  // Speak single letter names slightly faster so they don't stretch and sound robotic
  utterance.rate = isSingleLetter ? 0.85 : 0.55;
  utterance.pitch = 1.0;

  performSafeSpeak(utterance);
}

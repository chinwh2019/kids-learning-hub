import { create } from 'zustand';
import { ReviewItem, scheduleReview } from '../games/phonics/srs/scheduler';

export interface LearnerState {
  stars: number;
  unlockedGames: string[];
  completedMathLevels: Record<string, boolean>;
  phonicsWave: number;
  phonicsCompletedWords: Record<string, number>;
  completedShapeLevels: Record<string, boolean>;
  phonicsSrsItems: Record<string, ReviewItem>;
  parentVoiceClips: Record<string, string>;
  
  // Actions
  addStars: (count: number) => void;
  completeMathLevel: (levelId: string) => void;
  completePhonicsWord: (wordId: string) => void;
  completeShapeLevel: (levelId: string) => void;
  updateSrsItem: (wordId: string, result: 'again' | 'good' | 'easy') => void;
  saveParentVoiceClip: (id: string, base64Data: string) => void;
  deleteParentVoiceClip: (id: string) => void;
  setPhonicsWave: (wave: number) => void;
  resetAll: () => void;
}

export const useLearnerStore = create<LearnerState>((set) => {
  // Try to load initial state from localStorage if available
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem('kids_learning_hub_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          stars: parsed.stars ?? 0,
          unlockedGames: parsed.unlockedGames ?? ['math', 'phonics', 'shapes'],
          completedMathLevels: parsed.completedMathLevels ?? {},
          phonicsWave: parsed.phonicsWave ?? 1,
          phonicsCompletedWords: parsed.phonicsCompletedWords ?? {},
          completedShapeLevels: parsed.completedShapeLevels ?? {},
          phonicsSrsItems: parsed.phonicsSrsItems ?? {},
          parentVoiceClips: parsed.parentVoiceClips ?? {},
        };
      }
    } catch (e) {
      console.error('Failed to load storage state:', e);
    }
    return {
      stars: 0,
      unlockedGames: ['math', 'phonics', 'shapes'],
      completedMathLevels: {},
      phonicsWave: 1,
      phonicsCompletedWords: {},
      completedShapeLevels: {},
      phonicsSrsItems: {},
      parentVoiceClips: {},
    };
  };

  const saveState = (newState: Partial<LearnerState>) => {
    try {
      const current = localStorage.getItem('kids_learning_hub_progress');
      const base = current ? JSON.parse(current) : {};
      localStorage.setItem('kids_learning_hub_progress', JSON.stringify({ ...base, ...newState }));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  };

  const initial = getInitialState();

  return {
    ...initial,

    addStars: (count) => set((state) => {
      const nextStars = state.stars + count;
      saveState({ stars: nextStars });
      return { stars: nextStars };
    }),

    completeMathLevel: (levelId) => set((state) => {
      const completed = { ...state.completedMathLevels, [levelId]: true };
      const starReward = state.completedMathLevels[levelId] ? 1 : 10; // 10 stars first time, 1 star after
      const nextStars = state.stars + starReward;
      saveState({ completedMathLevels: completed, stars: nextStars });
      return { completedMathLevels: completed, stars: nextStars };
    }),

    completePhonicsWord: (wordId) => set((state) => {
      const completedCount = (state.phonicsCompletedWords[wordId] ?? 0) + 1;
      const completed = { ...state.phonicsCompletedWords, [wordId]: completedCount };
      
      // Initialize SRS review item if it doesn't exist
      const srsItems = { ...state.phonicsSrsItems };
      if (!srsItems[wordId]) {
        srsItems[wordId] = {
          id: wordId,
          type: 'word',
          targetId: wordId,
          mastery: 1,
          dueAt: Date.now() + 24 * 60 * 60 * 1000, // Due in 1 day
          intervalDays: 1,
          ease: 2.5
        };
      }

      const starReward = completedCount === 1 ? 10 : 2; // 10 stars first time, 2 subsequent
      const nextStars = state.stars + starReward;
      saveState({ phonicsCompletedWords: completed, phonicsSrsItems: srsItems, stars: nextStars });
      return { phonicsCompletedWords: completed, phonicsSrsItems: srsItems, stars: nextStars };
    }),

    completeShapeLevel: (levelId) => set((state) => {
      const completed = { ...state.completedShapeLevels, [levelId]: true };
      const starReward = state.completedShapeLevels[levelId] ? 1 : 10; // 10 stars first time, 1 star after
      const nextStars = state.stars + starReward;
      saveState({ completedShapeLevels: completed, stars: nextStars });
      return { completedShapeLevels: completed, stars: nextStars };
    }),

    updateSrsItem: (wordId, result) => set((state) => {
      const currentItem = state.phonicsSrsItems[wordId];
      if (!currentItem) return {};
      const updatedItem = scheduleReview(currentItem, result);
      const nextItems = { ...state.phonicsSrsItems, [wordId]: updatedItem };
      saveState({ phonicsSrsItems: nextItems });
      return { phonicsSrsItems: nextItems };
    }),

    saveParentVoiceClip: (id, base64Data) => set((state) => {
      const nextClips = { ...state.parentVoiceClips, [id]: base64Data };
      saveState({ parentVoiceClips: nextClips });
      return { parentVoiceClips: nextClips };
    }),

    deleteParentVoiceClip: (id) => set((state) => {
      const nextClips = { ...state.parentVoiceClips };
      delete nextClips[id];
      saveState({ parentVoiceClips: nextClips });
      return { parentVoiceClips: nextClips };
    }),

    setPhonicsWave: (wave) => set(() => {
      saveState({ phonicsWave: wave });
      return { phonicsWave: wave };
    }),

    resetAll: () => set(() => {
      const fresh = {
        stars: 0,
        unlockedGames: ['math', 'phonics', 'shapes'],
        completedMathLevels: {},
        phonicsWave: 1,
        phonicsCompletedWords: {},
        completedShapeLevels: {},
        phonicsSrsItems: {},
        parentVoiceClips: {},
      };
      saveState(fresh);
      return fresh;
    }),
  };
});

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewItem {
  id: string;
  type: 'sound' | 'word' | 'spelling';
  targetId: string;
  mastery: MasteryLevel;
  dueAt: number;
  intervalDays: number;
  ease: number;
}

export const MAX_DAILY_REVIEWS = 15;
export const MAX_NEW_ITEMS = 4;

/**
 * Child-safe soft scheduler. It is highly forgiving, avoids streak pressure,
 * and sets comfortable daily review caps.
 */
export function scheduleReview(
  item: ReviewItem,
  result: 'again' | 'good' | 'easy'
): ReviewItem {
  const now = Date.now();

  if (result === 'again') {
    return {
      ...item,
      mastery: Math.max(0, item.mastery - 1) as MasteryLevel,
      intervalDays: 0,
      dueAt: now + 10 * 60 * 1000, // Review in 10 minutes (current session)
    };
  }

  // Calculate new interval in days
  const nextInterval =
    result === 'easy'
      ? Math.max(1, Math.round(item.intervalDays * 2.5 || 2))
      : Math.max(1, Math.round(item.intervalDays * 1.7 || 1));

  return {
    ...item,
    mastery: Math.min(5, item.mastery + 1) as MasteryLevel,
    intervalDays: nextInterval,
    dueAt: now + nextInterval * 24 * 60 * 60 * 1000, // Due in next interval
  };
}

/**
 * Filter items that are due today.
 */
export function getDueItems(items: ReviewItem[]): ReviewItem[] {
  const now = Date.now();
  return items
    .filter((item) => item.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, MAX_DAILY_REVIEWS);
}

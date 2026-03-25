type ThrottleRecord = {
  failures: number;
  lastAttempt: number;
};

// In-memory store for tracking failed login attempts
// Keys are typically the user's normalized email, optionally prefixed by IP.
const throttleStore = new Map<string, ThrottleRecord>();

// Delay intervals in milliseconds mapping failure counts.
// 0 failures = 0ms; 1 = 500ms; 2 = 1500ms; 3 = 3000ms; 4+ = 5000ms.
const DELAY_STAGES = [0, 500, 1500, 3000, 5000];
const MAX_DELAY = 5000;

// Optional: clean up old records entirely if they haven't been touched in e.g., 1 hour.
const CLEANUP_THRESHOLD_MS = 60 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [key, record] of throttleStore.entries()) {
    if (now - record.lastAttempt > CLEANUP_THRESHOLD_MS) {
      throttleStore.delete(key);
    }
  }
}

// Periodically clear the map to prevent unbounded memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, 10 * 60 * 1000);
}

export function getDelayMs(key: string): number {
  const record = throttleStore.get(key);
  if (!record) return 0;

  const stage = Math.min(record.failures, DELAY_STAGES.length - 1);
  return DELAY_STAGES[stage] ?? MAX_DELAY;
}

export function recordFailure(key: string): void {
  const record = throttleStore.get(key) || { failures: 0, lastAttempt: 0 };
  record.failures += 1;
  record.lastAttempt = Date.now();
  throttleStore.set(key, record);
}

export function recordSuccess(key: string): void {
  throttleStore.delete(key);
}

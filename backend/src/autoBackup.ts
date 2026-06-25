import { createRollingBackup } from './backup.js';

const DEBOUNCE_MS = 60_000;

let timer: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutoBackup(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    try {
      createRollingBackup();
      console.log('[backup] Auto snapshot saved to backend/data/backups/latest/');
    } catch (error) {
      console.error('[backup] Auto snapshot failed:', error);
    }
  }, DEBOUNCE_MS);
}

/** Clears a pending auto-backup timer (for tests). */
export function cancelScheduledAutoBackup(): void {
  if (timer) clearTimeout(timer);
  timer = null;
}

import { createRollingBackup } from '../backup.js';

const dest = createRollingBackup();
console.log(`Backup saved to ${dest}`);

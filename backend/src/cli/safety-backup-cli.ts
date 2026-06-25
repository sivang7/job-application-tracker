import { createSafetySnapshot } from '../backup.js';

const prefix = process.argv[2];
if (prefix !== 'pre-seed-demo' && prefix !== 'pre-restore') {
  console.error('Usage: safety-backup-cli.ts <pre-seed-demo|pre-restore>');
  process.exit(1);
}

const dest = createSafetySnapshot(prefix);
console.log(`Safety snapshot saved to ${dest}`);

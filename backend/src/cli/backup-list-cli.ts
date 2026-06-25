import { listBackups } from '../backup.js';

const backups = listBackups();
if (backups.length === 0) {
  console.log('No backups found.');
  process.exit(0);
}

for (const entry of backups) {
  console.log(`${entry.name}\t${entry.kind}\t${entry.modifiedAt}`);
}

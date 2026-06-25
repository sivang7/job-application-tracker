import { reloadCvStoreFromDisk } from '../cvStore.js';
import { loadApplications } from '../persistence.js';
import { reloadStoreFromDisk } from '../store.js';
import { isBackendRunning, resolveBackupPath, restoreBackup } from '../backup.js';

async function main(): Promise<void> {
  const name = process.argv[2];
  const backupDir = resolveBackupPath(name);

  if (await isBackendRunning()) {
    console.error('Backend is running on port 3001. Stop it before restoring a backup.');
    process.exit(1);
  }

  restoreBackup(backupDir);
  reloadStoreFromDisk();
  reloadCvStoreFromDisk();

  const apps = loadApplications();
  console.log(`Restored ${apps.length} application(s) from ${backupDir}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

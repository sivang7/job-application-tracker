import { writeApplicationsExcel } from '../applicationsExport.js';
import { loadApplications } from '../persistence.js';

function readOutputPath(): string | undefined {
  const outputIndex = process.argv.indexOf('--output');
  if (outputIndex === -1) return undefined;
  return process.argv[outputIndex + 1];
}

const apps = loadApplications();
const outputPath = writeApplicationsExcel(apps, readOutputPath());
console.log(`Exported ${apps.length} application(s) to ${outputPath}`);

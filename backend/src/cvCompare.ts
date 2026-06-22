import { readFileSync, existsSync } from 'node:fs';
import type { CvVersionCompareResult } from '@jat/shared';
import { getCvFilePath } from './cvPersistence.js';
import { extractCvText } from './cvTextExtraction.js';
import { getCvProfileById, getCvVersionById } from './cvStore.js';

export type CompareCvVersionsResult =
  | { ok: true; data: CvVersionCompareResult }
  | { ok: false; error: string; status: number };

export async function compareCvVersions(
  fromVersionId: string,
  toVersionId: string,
): Promise<CompareCvVersionsResult> {
  if (!fromVersionId || !toVersionId) {
    return { ok: false, error: 'Both from and to version ids are required', status: 400 };
  }
  if (fromVersionId === toVersionId) {
    return { ok: false, error: 'Cannot compare a version to itself', status: 400 };
  }

  const versionA = getCvVersionById(fromVersionId);
  const versionB = getCvVersionById(toVersionId);
  if (!versionA) return { ok: false, error: 'CV version not found', status: 404 };
  if (!versionB) return { ok: false, error: 'CV version not found', status: 404 };

  const profileA = getCvProfileById(versionA.profileId);
  const profileB = getCvProfileById(versionB.profileId);
  if (!profileA || !profileB) {
    return { ok: false, error: 'CV profile not found', status: 404 };
  }

  const pathA = getCvFilePath(versionA.id, versionA.mimeType);
  const pathB = getCvFilePath(versionB.id, versionB.mimeType);
  if (!existsSync(pathA) || !existsSync(pathB)) {
    return { ok: false, error: 'CV file not found', status: 404 };
  }

  const bufferA = readFileSync(pathA);
  const bufferB = readFileSync(pathB);

  let textA: string;
  let textB: string;
  try {
    [textA, textB] = await Promise.all([
      extractCvText(bufferA, versionA.mimeType),
      extractCvText(bufferB, versionB.mimeType),
    ]);
  } catch {
    return { ok: false, error: 'Failed to extract text from CV file', status: 422 };
  }

  if (!textA && !textB) {
    return { ok: false, error: 'Could not extract text from either file', status: 422 };
  }

  const [older, newer] =
    versionA.uploadedAt <= versionB.uploadedAt
      ? [
          { version: versionA, profileDescription: profileA.description, text: textA },
          { version: versionB, profileDescription: profileB.description, text: textB },
        ]
      : [
          { version: versionB, profileDescription: profileB.description, text: textB },
          { version: versionA, profileDescription: profileA.description, text: textA },
        ];

  return {
    ok: true,
    data: {
      from: { version: older.version, profileDescription: older.profileDescription },
      to: { version: newer.version, profileDescription: newer.profileDescription },
      fromText: older.text,
      toText: newer.text,
    },
  };
}

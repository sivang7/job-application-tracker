import { Router } from 'express';
import multer from 'multer';
import { readFileSync, existsSync } from 'node:fs';
import {
  countCvProfileReferences,
  countCvVersionReferences,
  listApplicationsForCvProfile,
  listApplicationsForCvVersion,
} from '../applicationCv.js';
import { getCvFilePath } from '../cvPersistence.js';
import {
  createCvProfile,
  deleteCvVersion,
  getCvVersionById,
  getVersionsForProfile,
  listCvProfileSummaries,
  updateCvProfileDescription,
  uploadCvVersion,
} from '../cvStore.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

function withApplicationCount<T extends { id: string }>(summary: T) {
  return { ...summary, applicationCount: countCvProfileReferences(summary.id) };
}

router.get('/cv-profiles', (_req, res) => {
  res.json(listCvProfileSummaries().map(withApplicationCount));
});

router.get('/cv-profiles/:id/applications', (req, res) => {
  const apps = listApplicationsForCvProfile(req.params.id);
  if (apps === null) {
    res.status(404).json({ error: 'CV profile not found' });
    return;
  }
  res.json(apps);
});

router.get('/cv-profiles/:id/versions', (req, res) => {
  const versions = getVersionsForProfile(req.params.id);
  if (versions.length === 0) {
    const summaries = listCvProfileSummaries();
    if (!summaries.some((s) => s.id === req.params.id)) {
      res.status(404).json({ error: 'CV profile not found' });
      return;
    }
  }
  const withRefs = versions.map((v) => ({
    ...v,
    referenceCount: countCvVersionReferences(v.id),
  }));
  res.json(withRefs);
});

router.post('/cv-profiles', upload.single('file'), (req, res) => {
  const description = req.body?.description;
  const file = req.file;
  const result = createCvProfile(description, file?.buffer ?? Buffer.alloc(0), file?.originalname ?? '');
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(201).json(withApplicationCount(result.data));
});

router.patch('/cv-profiles/:id', (req, res) => {
  const description = req.body?.description;
  const result = updateCvProfileDescription(req.params.id, description);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(withApplicationCount(result.data));
});

router.post('/cv-profiles/:id/versions', upload.single('file'), (req, res) => {
  const file = req.file;
  const result = uploadCvVersion(
    req.params.id,
    file?.buffer ?? Buffer.alloc(0),
    file?.originalname ?? '',
  );
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(withApplicationCount(result.data));
});

router.get('/cv-versions/:id/applications', (req, res) => {
  const apps = listApplicationsForCvVersion(req.params.id);
  if (apps === null) {
    res.status(404).json({ error: 'CV version not found' });
    return;
  }
  res.json(apps);
});

router.get('/cv-versions/:id', (req, res) => {
  const version = getCvVersionById(req.params.id);
  if (!version) {
    res.status(404).json({ error: 'CV version not found' });
    return;
  }
  res.json(version);
});

router.get('/cv-versions/:id/file', (req, res) => {
  const version = getCvVersionById(req.params.id);
  if (!version) {
    res.status(404).json({ error: 'CV version not found' });
    return;
  }
  const filePath = getCvFilePath(version.id, version.mimeType);
  if (!existsSync(filePath)) {
    res.status(404).json({ error: 'CV file not found' });
    return;
  }
  const buffer = readFileSync(filePath);
  const forceDownload = req.query.download === '1';
  const disposition = forceDownload ? 'attachment' : 'inline';
  res.setHeader('Content-Type', version.mimeType);
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename="${encodeURIComponent(version.originalFilename)}"`,
  );
  res.send(buffer);
});

router.delete('/cv-versions/:id', (req, res) => {
  const refCount = countCvVersionReferences(req.params.id);
  const result = deleteCvVersion(req.params.id, refCount);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(204).send();
});

export default router;

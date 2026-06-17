import { Router } from 'express';
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  getApplications,
  updateApplication,
} from '../store.js';
import { validateCreateInput, validateUpdateInput } from '../applicationsValidation.js';
import {
  enrichApplication,
  enrichApplications,
  resolveCvLinkForCreate,
  resolveCvLinkForUpdate,
  stripCvProfileId,
} from '../applicationCv.js';

const router = Router();

router.get('/applications', (_req, res) => {
  res.json(enrichApplications(getApplications()));
});

router.get('/applications/:id', (req, res) => {
  const app = getApplicationById(req.params.id);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  res.json(enrichApplication(app));
});

router.post('/applications', (req, res) => {
  const result = validateCreateInput(req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  const cvResolution = resolveCvLinkForCreate(result.data);
  if (!cvResolution.ok) {
    res.status(cvResolution.status).json({ error: cvResolution.error });
    return;
  }

  const input = stripCvProfileId(result.data);
  const app = createApplication(input, cvResolution.cvLink);
  res.status(201).json(enrichApplication(app));
});

router.patch('/applications/:id', (req, res) => {
  const result = validateUpdateInput(req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  const cvResolution = resolveCvLinkForUpdate(result.data);
  if (!cvResolution.ok) {
    res.status(cvResolution.status).json({ error: cvResolution.error });
    return;
  }

  const patch = stripCvProfileId(result.data);
  const cvLink = cvResolution.clear ? { clear: true as const } : cvResolution.cvLink;
  const app = updateApplication(req.params.id, patch, cvLink);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  res.json(enrichApplication(app));
});

router.delete('/applications/:id', (req, res) => {
  const deleted = deleteApplication(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  res.status(204).send();
});

export default router;

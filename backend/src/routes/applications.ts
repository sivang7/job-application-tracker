import { Router } from 'express';
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  getApplications,
  updateApplication,
} from '../store.js';
import { validateCreateInput, validateUpdateInput } from '../applicationsValidation.js';

const router = Router();

router.get('/applications', (_req, res) => {
  res.json([...getApplications()]);
});

router.get('/applications/:id', (req, res) => {
  const app = getApplicationById(req.params.id);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  res.json(app);
});

router.post('/applications', (req, res) => {
  const result = validateCreateInput(req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  const app = createApplication(result.data);
  res.status(201).json(app);
});

router.patch('/applications/:id', (req, res) => {
  const result = validateUpdateInput(req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  const app = updateApplication(req.params.id, result.data);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  res.json(app);
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

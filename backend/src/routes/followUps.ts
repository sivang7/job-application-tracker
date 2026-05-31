import { Router } from 'express';
import { getFollowUpReminders, parseIsoDate, todayIsoDate } from '../reminders.js';
import { getApplications } from '../store.js';

const router = Router();

router.get('/applications/follow-ups', (req, res) => {
  const asOfParam = req.query.asOf;

  if (asOfParam !== undefined) {
    if (typeof asOfParam !== 'string' || !parseIsoDate(asOfParam)) {
      res.status(400).json({ error: 'Invalid asOf date; use YYYY-MM-DD' });
      return;
    }
    const reminders = getFollowUpReminders([...getApplications()], asOfParam);
    res.json({ reminders, asOf: asOfParam });
    return;
  }

  const asOf = todayIsoDate();
  const reminders = getFollowUpReminders([...getApplications()], asOf);
  res.json({ reminders, asOf });
});

export default router;

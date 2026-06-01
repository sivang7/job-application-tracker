import express from 'express';
import cors from 'cors';
import followUpsRouter from './routes/followUps.js';
import applicationsRouter from './routes/applications.js';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(followUpsRouter);
app.use(applicationsRouter);

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

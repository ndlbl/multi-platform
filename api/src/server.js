import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import tasksRouter from './routes/tasks.js';
import libraryRouter from './routes/library.js';
import adminRouter from './routes/admin.js';
import authRouter from './routes/auth.js';
import {adminRequired, authRequired } from './middleware/auth.js';

  const PORT = process.env.PORT ?? 3003;

  const app = express();

  app.use(cors());                 // allow Angular dev server to call us
  app.use(express.json());         // parse JSON request bodies
   app.use('/api/auth', authRouter);
   app.use('/api/admin', authRequired, adminRequired, adminRouter);
    app.use('/api/tasks',authRequired, tasksRouter);
  app.use('/api/library',authRequired, libraryRouter);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Dev-only: browser previews of the HTML email templates (not mounted in prod).
  if (process.env.NODE_ENV !== 'production') {
    const { default: testRouter } = await import('./routes/test.js');
    app.use('/test', testRouter);
    console.log('🔧 Email previews: http://localhost:' + PORT + '/test/mails');
  }

  // Centralised error handler (must be LAST, must have 4 args)
  app.use((err, _req, res, _next) => {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid id format' });
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  await connectDB();
  app.listen(PORT, () => console.log(`✓ API listening on http://localhost:${PORT}`));

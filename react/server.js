import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, 'build', 'client');

const app = express();

// Real files first
app.use(express.static(clientDir));

// SPA fallback: anything without a matching file 200, not 404.
app.use((_req, res) => {
  res.sendFile(path.join(clientDir, '__spa-fallback.html'));
});

const port = process.env.PORT || 4173;
app.listen(port, () => console.log(`React app running at http://localhost:${port}`));

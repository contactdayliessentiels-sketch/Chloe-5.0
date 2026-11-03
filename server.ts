import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes.ts';
import { serverScheduler } from './server/scheduler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Restrict cross-origin API access to explicitly configured frontend origins + Capacitor & Cloud Run defaults.
const customAllowedOrigins = (process.env.CHLOE_ALLOWED_ORIGINS || '')
  .split(',').map(value => value.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = !origin ||
    customAllowedOrigins.includes('*') ||
    (origin && customAllowedOrigins.includes(origin)) ||
    (origin && (
      origin.startsWith('capacitor://') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.run.app')
    ));

  if (origin && isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Body parsers with generous limit for multimodal base64 photos from Samsung Galaxy S24
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'CHLOÉ AI',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: attach Vite dev server middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[CHLOÉ AI] Vite middleware attached in development mode');
  } else {
    // Production mode: serve static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[CHLOÉ AI] Serving production build from dist');
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[CHLOÉ AI] Server running at http://0.0.0.0:${PORT}`);
    serverScheduler.start();
  });
}

startServer().catch((err) => {
  console.error('[CHLOÉ AI] Failed to start server:', err);
  process.exit(1);
});

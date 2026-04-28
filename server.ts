import express from 'express';
import { Client } from '@notionhq/client';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Notion client
let notionClient: Client | null = null;

function getNotionClient() {
  if (!notionClient) {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      throw new Error('NOTION_API_KEY environment variable is required. Please add it to your environment variables.');
    }
    notionClient = new Client({ auth: apiKey });
  }
  return notionClient;
}

import fs from 'fs/promises';

app.get('/api/places', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'src', 'data', 'notion-places.json'), 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading places data:', error);
    res.status(500).json({ error: 'Failed to fetch places data' });
  }
});

app.get('/api/events-pasto', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'src', 'data', 'notion-events-pasto.json'), 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading events pasto data:', error);
    res.status(500).json({ error: 'Failed to fetch events data' });
  }
});

app.get('/api/events-narino', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(process.cwd(), 'src', 'data', 'notion-events-narino.json'), 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading events narino data:', error);
    res.status(500).json({ error: 'Failed to fetch events data' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

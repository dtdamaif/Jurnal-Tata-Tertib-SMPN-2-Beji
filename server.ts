import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_ID = '1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '25mb' }));

  // API Proxy untuk Google Sheets - menyelesaikan kendala CORS di browser
  app.get('/api/sheets', async (req, res) => {
    const sheet = (req.query.sheet as string) || 'Murid';
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}&tq=`;
      const response = await fetch(gvizUrl, { cache: 'no-cache' });
      if (!response.ok) {
        return res.status(response.status).json({
          error: `Gagal mengambil tab "${sheet}" dari Google Sheets (HTTP ${response.status})`
        });
      }

      const text = await response.text();
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) {
        return res.status(502).json({ error: 'Format data Google Sheets tidak valid' });
      }

      const jsonStr = text.substring(startIdx, endIdx + 1);
      const data = JSON.parse(jsonStr);

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        status: 'ok',
        sheet,
        rows: data?.table?.rows || [],
        cols: data?.table?.cols || []
      });
    } catch (err: any) {
      console.error(`Error proxying sheet "${sheet}":`, err);
      return res.status(500).json({ error: err?.message || 'Server error fetching sheet' });
    }
  });

  // Cek Status Koneksi Google Sheets
  app.get('/api/sheets/status', async (_req, res) => {
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=Guru&tq=`;
      const response = await fetch(gvizUrl, { cache: 'no-cache' });
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.json({
        connected: response.ok,
        spreadsheetId: SPREADSHEET_ID,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.json({
        connected: false,
        error: err?.message || 'Gagal tersambung ke Google Sheets'
      });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Jurnal Tata Tertib SMPN 2 Beji berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  INITIAL_ADMINS, 
  INITIAL_PELANGGARAN_REF, 
  INITIAL_LOGS, 
  INITIAL_PENGATURAN,
  GAS_CONFIG
} from './src/data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_ID = '1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10';
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE_PATH = path.resolve(__dirname, 'server-database.json');

interface CentralDatabase {
  admins: any[];
  refPelanggaran: any[];
  logs: any[];
  pengaturan: any;
  gasWebAppUrl: string;
  lastUpdated: string;
}

// Inisialisasi Database Terpusat di Server
function getDatabase(): CentralDatabase {
  let savedSettingsGasUrl = '';
  const settingsPath = path.resolve(__dirname, 'server-settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const sContent = fs.readFileSync(settingsPath, 'utf-8');
      const sData = JSON.parse(sContent);
      if (sData.gasWebAppUrl) savedSettingsGasUrl = sData.gasWebAppUrl;
    } catch {}
  }

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const data = JSON.parse(content);
      const activeUrl = data.gasWebAppUrl || data.pengaturan?.gasWebAppUrl || savedSettingsGasUrl || GAS_CONFIG?.webAppUrl || '';
      return {
        admins: data.admins || INITIAL_ADMINS,
        refPelanggaran: data.refPelanggaran || INITIAL_PELANGGARAN_REF,
        logs: data.logs || INITIAL_LOGS,
        pengaturan: data.pengaturan || INITIAL_PENGATURAN,
        gasWebAppUrl: activeUrl,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      };
    } catch (e) {
      console.error('Error reading server-database.json, falling back to defaults:', e);
    }
  }

  // Jika file belum ada, buat database awal
  const fallbackUrl = savedSettingsGasUrl || GAS_CONFIG?.webAppUrl || 'https://script.google.com/macros/s/AKfycbx4fpy1xSBJuh8HSot5OchwAuV-sTAPvtLOiQOT7AZL-sOPd-CQ4Tzp853BBSkQ0mE/exec';
  const initialDb: CentralDatabase = {
    admins: INITIAL_ADMINS,
    refPelanggaran: INITIAL_PELANGGARAN_REF,
    logs: INITIAL_LOGS,
    pengaturan: INITIAL_PENGATURAN,
    gasWebAppUrl: fallbackUrl,
    lastUpdated: new Date().toISOString()
  };

  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error creating initial server-database.json:', err);
  }

  return initialDb;
}

function saveDatabase(db: CentralDatabase) {
  db.lastUpdated = new Date().toISOString();
  try {
    if (db.gasWebAppUrl && db.pengaturan) {
      db.pengaturan.gasWebAppUrl = db.gasWebAppUrl;
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
    if (db.pengaturan) {
      const settingsPath = path.resolve(__dirname, 'server-settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify({ ...db.pengaturan, gasWebAppUrl: db.gasWebAppUrl }, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error writing database to disk:', err);
  }
}

// Teruskan mutasi data ke Google Apps Script Web App jika URL tersedia
async function forwardToGAS(gasUrl: string, action: string, payload: any, fileObj?: any) {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload, fileObj }),
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      try {
        return await res.json();
      } catch {
        return { success: true };
      }
    }
  } catch (err: any) {
    console.warn(`Forwarding action "${action}" to GAS failed:`, err?.message || err);
  }
  return null;
}

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '35mb' }));

  // Middleware CORS agar API dapat diakses dengan lancar
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  // =========================================================================
  // 1. ENDPOINTS DATABASE TERPUSAT CLOUD (Sinkron Antar Seluruh Komputer & Device)
  // =========================================================================

  // GET /api/db - Ambil seluruh data terpusat (Admins, Ref Pelanggaran, Logs, Pengaturan, GAS URL)
  app.get('/api/db', (_req, res) => {
    const db = getDatabase();
    return res.json({ success: true, data: db });
  });

  // POST /api/db/admin - Tambah / Edit Admin
  app.post('/api/db/admin', async (req, res) => {
    const admin = req.body;
    if (!admin || !admin.username) {
      return res.status(400).json({ success: false, message: 'Data admin tidak valid' });
    }
    const db = getDatabase();
    const idx = db.admins.findIndex(a => a.id === admin.id);
    if (idx >= 0) {
      db.admins[idx] = admin;
    } else {
      db.admins.push(admin);
    }
    saveDatabase(db);

    // Kirim juga ke Google Spreadsheet via GAS
    let gasResult = null;
    if (db.gasWebAppUrl) {
      gasResult = await forwardToGAS(db.gasWebAppUrl, 'saveAdmin', admin);
    }

    return res.json({ 
      success: true, 
      message: 'Data admin berhasil disimpan ke database cloud & spreadsheet',
      data: admin,
      gasSynced: !!gasResult?.success
    });
  });

  // DELETE /api/db/admin/:id - Hapus Admin
  app.delete('/api/db/admin/:id', async (req, res) => {
    const { id } = req.params;
    const db = getDatabase();
    db.admins = db.admins.filter(a => a.id !== id);
    saveDatabase(db);

    if (db.gasWebAppUrl) {
      await forwardToGAS(db.gasWebAppUrl, 'deleteAdmin', { id });
    }

    return res.json({ success: true, message: 'Data admin berhasil dihapus' });
  });

  // POST /api/db/ref-pelanggaran - Tambah / Edit Master Pelanggaran
  app.post('/api/db/ref-pelanggaran', async (req, res) => {
    const pel = req.body;
    if (!pel || !pel.kode || !pel.namaPelanggaran) {
      return res.status(400).json({ success: false, message: 'Data pelanggaran tidak valid' });
    }
    const db = getDatabase();
    const idx = db.refPelanggaran.findIndex(p => p.id === pel.id);
    if (idx >= 0) {
      db.refPelanggaran[idx] = pel;
    } else {
      db.refPelanggaran.unshift(pel);
    }
    saveDatabase(db);

    let gasResult = null;
    if (db.gasWebAppUrl) {
      gasResult = await forwardToGAS(db.gasWebAppUrl, 'saveRefPelanggaran', pel);
    }

    return res.json({ 
      success: true, 
      message: 'Master pelanggaran berhasil disimpan',
      data: pel,
      gasSynced: !!gasResult?.success
    });
  });

  // DELETE /api/db/ref-pelanggaran/:id - Hapus Master Pelanggaran
  app.delete('/api/db/ref-pelanggaran/:id', async (req, res) => {
    const { id } = req.params;
    const db = getDatabase();
    db.refPelanggaran = db.refPelanggaran.filter(p => p.id !== id);
    saveDatabase(db);

    if (db.gasWebAppUrl) {
      await forwardToGAS(db.gasWebAppUrl, 'deleteRefPelanggaran', { id });
    }

    return res.json({ success: true, message: 'Data jenis pelanggaran berhasil dihapus' });
  });

  // POST /api/db/log-pelanggaran - Tambah Log Pelanggaran dari Guru
  app.post('/api/db/log-pelanggaran', async (req, res) => {
    const { log, fileObj } = req.body;
    if (!log || !log.namaMurid) {
      return res.status(400).json({ success: false, message: 'Data log pelanggaran tidak valid' });
    }
    const db = getDatabase();
    db.logs.unshift(log);
    saveDatabase(db);

    let gasResult = null;
    if (db.gasWebAppUrl) {
      gasResult = await forwardToGAS(db.gasWebAppUrl, 'submitPelanggaran', log, fileObj);
      if (gasResult && gasResult.fotoUrl) {
        log.fotoBuktiUrl = gasResult.fotoUrl;
        saveDatabase(db);
      }
    }

    return res.json({ 
      success: true, 
      message: 'Log pelanggaran berhasil dicatat dan disinkronkan',
      data: log,
      gasSynced: !!gasResult?.success,
      fotoUrl: gasResult?.fotoUrl || log.fotoBuktiUrl
    });
  });

  // POST /api/db/pengaturan - Simpan Pengaturan Lembaga & Kop Surat
  app.post('/api/db/pengaturan', async (req, res) => {
    const settings = req.body.settings || req.body;
    if (!settings || !settings.namaSekolah) {
      return res.status(400).json({ success: false, message: 'Data pengaturan tidak valid' });
    }
    const db = getDatabase();
    db.pengaturan = { ...db.pengaturan, ...settings };
    if (req.body.gasWebAppUrl || settings.gasWebAppUrl) {
      db.gasWebAppUrl = String(req.body.gasWebAppUrl || settings.gasWebAppUrl).trim();
    }
    if (db.gasWebAppUrl) {
      db.pengaturan.gasWebAppUrl = db.gasWebAppUrl;
    }
    saveDatabase(db);

    let gasResult = null;
    if (db.gasWebAppUrl) {
      gasResult = await forwardToGAS(db.gasWebAppUrl, 'savePengaturan', {
        ...db.pengaturan,
        gasWebAppUrl: db.gasWebAppUrl
      });
    }

    return res.json({ 
      success: true, 
      message: 'Pengaturan lembaga dan kop surat resmi berhasil disimpan online!',
      data: db.pengaturan,
      gasSynced: !!gasResult?.success,
      gasWebAppUrl: db.gasWebAppUrl
    });
  });

  // POST /api/db/test-gas - Uji Coba Koneksi Google Apps Script Web App
  app.post('/api/db/test-gas', async (req, res) => {
    const { url } = req.body;
    if (!url || !String(url).trim().startsWith('http')) {
      return res.status(400).json({ success: false, message: 'URL Web App tidak boleh kosong' });
    }
    const cleanUrl = String(url).trim();
    try {
      const pingUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const testRes = await fetch(pingUrl, { redirect: 'follow', signal: controller.signal });
      clearTimeout(timer);

      if (testRes.ok) {
        let json: any = {};
        try {
          json = await testRes.json();
        } catch {
          json = { success: true };
        }
        return res.json({ 
          success: true, 
          message: json.message || 'Google Apps Script Web App berhasil terhubung!', 
          details: json 
        });
      } else {
        return res.json({ 
          success: false, 
          message: `Server Google Apps Script merespon kode HTTP ${testRes.status}. Pastikan deploy 'Siapa saja (Anyone)'.` 
        });
      }
    } catch (err: any) {
      return res.json({ 
        success: false, 
        message: 'Gagal menghubungi Web App: ' + (err?.message || err) 
      });
    }
  });

  // POST /api/db/gas-url - Simpan URL Web App Google Apps Script Secara Terpusat
  app.post('/api/db/gas-url', async (req, res) => {
    const { url } = req.body;
    const db = getDatabase();
    if (url !== undefined && url !== null) {
      db.gasWebAppUrl = String(url).trim();
    }
    if (db.gasWebAppUrl && db.pengaturan) {
      db.pengaturan.gasWebAppUrl = db.gasWebAppUrl;
    }
    saveDatabase(db);

    let testConnected = false;
    let message = 'URL Google Apps Script disimpan di server';

    if (db.gasWebAppUrl.startsWith('http')) {
      try {
        const pingUrl = db.gasWebAppUrl.includes('?') ? `${db.gasWebAppUrl}&action=ping` : `${db.gasWebAppUrl}?action=ping`;
        const testRes = await fetch(pingUrl, { redirect: 'follow' });
        testConnected = testRes.ok;
        if (testConnected) {
          message = 'URL Google Apps Script berhasil terhubung dan tersimpan online di server & spreadsheet!';
          // Simpan juga ke Google Spreadsheet tab Pengaturan
          await forwardToGAS(db.gasWebAppUrl, 'savePengaturan', {
            ...db.pengaturan,
            gasWebAppUrl: db.gasWebAppUrl
          });
        }
      } catch (err: any) {
        message = 'URL disimpan di server, namun uji koneksi: ' + (err?.message || err);
      }
    }

    return res.json({ success: true, message, gasWebAppUrl: db.gasWebAppUrl, testConnected });
  });

  // POST /api/db/sync-all-to-sheets - Kirim Seluruh Data (Admin, Ref Pelanggaran, Pengaturan) ke Google Sheets
  app.post('/api/db/sync-all-to-sheets', async (req, res) => {
    const db = getDatabase();
    const targetGasUrl = (req.body.gasWebAppUrl || db.gasWebAppUrl || '').trim();

    if (!targetGasUrl || !targetGasUrl.startsWith('http')) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL Google Apps Script Web App belum dikonfigurasi. Masukkan URL Web App terlebih dahulu.' 
      });
    }

    try {
      // Batch sync seluruh data ke Google Spreadsheet
      const syncRes = await forwardToGAS(targetGasUrl, 'syncAllToSheets', {
        admins: db.admins,
        refPelanggaran: db.refPelanggaran,
        pengaturan: db.pengaturan,
        logs: db.logs
      });

      if (syncRes && syncRes.success) {
        return res.json({
          success: true,
          message: syncRes.message || 'Seluruh data (Admin, 90 Jenis Pelanggaran, Kop & Pengaturan) berhasil dikirim dan tersimpan di Google Spreadsheet!',
          gasSynced: true,
          details: syncRes
        });
      } else {
        return res.json({
          success: false,
          message: syncRes?.message || 'Gagal mengirim data ke Google Spreadsheet. Periksa URL deployment Web App.'
        });
      }
    } catch (err: any) {
      return res.status(500).json({ 
        success: false, 
        message: 'Gagal menyinkronkan ke Google Spreadsheet: ' + (err?.message || err) 
      });
    }
  });

  // =========================================================================
  // 2. BACKWARD COMPATIBILITY ENDPOINTS (/api/settings, /api/sheets)
  // =========================================================================

  app.get('/api/settings', (_req, res) => {
    const db = getDatabase();
    return res.json({ 
      success: true, 
      source: 'SERVER_DB', 
      settings: { ...db.pengaturan, gasWebAppUrl: db.gasWebAppUrl },
      gasWebAppUrl: db.gasWebAppUrl 
    });
  });

  app.post('/api/settings', async (req, res) => {
    const settings = req.body.settings || req.body;
    const db = getDatabase();
    db.pengaturan = { ...db.pengaturan, ...settings };
    if (req.body.gasWebAppUrl || settings.gasWebAppUrl) {
      db.gasWebAppUrl = String(req.body.gasWebAppUrl || settings.gasWebAppUrl).trim();
    }
    if (db.gasWebAppUrl) {
      db.pengaturan.gasWebAppUrl = db.gasWebAppUrl;
    }
    saveDatabase(db);

    let gasSynced = false;
    if (db.gasWebAppUrl) {
      const gRes = await forwardToGAS(db.gasWebAppUrl, 'savePengaturan', {
        ...db.pengaturan,
        gasWebAppUrl: db.gasWebAppUrl
      });
      gasSynced = !!gRes?.success;
    }

    return res.json({
      success: true,
      message: 'Pengaturan dan Kop Surat resmi berhasil disimpan online!',
      gasSynced,
      gasWebAppUrl: db.gasWebAppUrl
    });
  });

  // API Proxy untuk membaca tab Google Sheets tanpa terkena CORS browser
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
      return res.json({
        connected: response.ok,
        spreadsheetId: SPREADSHEET_ID,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return res.json({
        connected: false,
        error: err?.message || 'Gagal tersambung ke Google Sheets'
      });
    }
  });

  // =========================================================================
  // 3. VITE INTEGRATION / STATIC ASSETS
  // =========================================================================

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

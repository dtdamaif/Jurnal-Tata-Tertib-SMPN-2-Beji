/**
 * Layanan Integrasi Google Sheets & Google Apps Script
 * SMPN 2 Beji
 * 
 * Mendukung Dual-Strategy:
 * 1. Server-side Proxy (/api/sheets) untuk full-stack environment
 * 2. Client-side JSONP (Google Visualization API) yang bekerja 100% di browser tanpa terkena CORS,
 *    sangat cocok saat dideploy ke GitHub Pages atau static hosting.
 */

import { Murid, Guru, LogPelanggaran, PengaturanLembaga, AdminUser, JenisPelanggaran, normalizeNisn, isSameStudent } from '../types';

export const SPREADSHEET_ID = '1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10';
export const DRIVE_FOLDER_ID = '18tDeAMgEFfYR5vkYJT-yiZiAJ7g4XOdH';

/**
 * Konversi format tanggal GViz Date(yyyy,m,d) ke format YYYY-MM-DD
 */
export function parseGvizDate(str: string): string {
  if (!str) return '';
  const match = str.match(/Date\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const y = match[1];
    const m = String(Number(match[2]) + 1).padStart(2, '0');
    const d = String(match[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str;
}

// Mapping fallback wali kelas & guru pembimbing per kelas jika belum terisi di spreadsheet
export const DEFAULT_WALI_KELAS_MAP: Record<string, { nama: string; nip: string }> = {
  '7A': { nama: 'ACHMAD FAUZI, S.Pd.', nip: '199309232024211022' },
  '7B': { nama: 'AINI MAGFIROH, S,Pd.', nip: '199704202024212026' },
  '7C': { nama: 'AGUS KHOSYIUL UMAM, S.S.', nip: '198207262023211004' },
  '7D': { nama: 'ANGGITA ROSALINA DEWANTY, S.Pd.', nip: '199507112022212002' },
  '7E': { nama: 'AWIDATUL ISLAMIAH, S.Pd.', nip: '199507112023212017' },
  '7F': { nama: 'DELLANIA ZULKARNAIN, S.Pd.', nip: '199410052023212018' },
  '7G': { nama: 'DIBYARATNA SYARQIY, M.Pd.', nip: '199509272019032003' },
  '7H': { nama: 'DIDIK WIDIANTO, M.Pd.', nip: '196807021996021001' },
  '8A': { nama: 'ENDANG SRI REJEKI PADANGSIH, S.Pd.', nip: '197212111998022001' },
  '8B': { nama: 'FARIDA, S.Pd.', nip: '199312112023212020' },
  '8C': { nama: 'IDRIS AFANDI, S.Pd.', nip: '199305252024211012' },
  '8D': { nama: 'IKHA KHURNIA LISTANTI, M.Pd.', nip: '198703052022212005' },
  '8E': { nama: 'AHMAD FAIZ, S.Kom.', nip: '198502082022211006' },
  '8F': { nama: 'ILZAM FARUQIE, S.Pd.', nip: '199008152024211015' },
  '8G': { nama: 'IMAM WAHYUDI, S.Pd.', nip: '197506102008011011' },
  '8H': { nama: 'INDAH DWI LESTARI, S.Pd.', nip: '198904122022212011' },
  '9A': { nama: 'JUMADI, S.Pd.', nip: '196904151998021002' },
  '9B': { nama: 'KHOIRUL ANAM, S.Pd.', nip: '197605202008011012' },
  '9C': { nama: 'LAILATUL MAGHFIROH, S.Pd.', nip: '198402162022212019' },
  '9D': { nama: 'M. NURUL HUDA, S.Pd.', nip: '198801142023211011' },
  '9E': { nama: 'MIFTAHUL JANNAH, S.Pd.', nip: '199203172024212021' },
  '9F': { nama: 'MOCH. ROFI\'I, S.Pd.', nip: '197802112008011015' },
  '9G': { nama: 'MOH. SYAIFUDDIN, S.Pd.', nip: '198005082010011016' },
  '9H': { nama: 'NANIK SUMARNI, S.Pd.', nip: '197103141998022003' }
};

export interface SpreadsheetConnectionStatus {
  connected: boolean;
  lastSyncTime: string | null;
  totalMurid: number;
  totalGuru: number;
  totalLogs: number;
  source: 'PROXY' | 'JSONP' | 'CACHE';
  error?: string | null;
}

/**
 * Fetch data via JSONP (Bekerja 100% di browser tanpa batasan CORS!)
 * Google Visualization API mendukung param tqx=responseHandler:callbackName
 */
function fetchGvizSheetJsonp(sheetName: string, timeoutMs = 12000): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('JSONP hanya dapat dijalankan di browser'));
    }

    const callbackName = 'gviz_cb_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const script = document.createElement('script');
    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try {
        delete (window as any)[callbackName];
      } catch {
        (window as any)[callbackName] = undefined;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    (window as any)[callbackName] = (response: any) => {
      cleanup();
      if (response && response.table && Array.isArray(response.table.rows)) {
        resolve(response.table.rows);
      } else if (response && response.status === 'error') {
        const errMsg = response.errors?.[0]?.message || 'Google Sheets query error';
        reject(new Error(errMsg));
      } else {
        resolve([]);
      }
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Batas waktu (timeout) terlampaui saat mengambil sheet "${sheetName}"`));
    }, timeoutMs);

    script.onerror = () => {
      cleanup();
      reject(new Error(`Gagal memuat data dari Google Spreadsheet tab "${sheetName}"`));
    };

    script.src = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=${encodeURIComponent(sheetName)}&tq=`;
    document.head.appendChild(script);
  });
}

/**
 * Helper fleksibel untuk mengambil data sheet Google Spreadsheet
 * 1. Coba via API Proxy lokal (/api/sheets?sheet=...) jika tersedia
 * 2. Fallback ke JSONP jika /api/sheets gagal atau saat dideploy secara statis (GitHub Pages)
 */
export async function fetchGvizSheet(sheetName: string): Promise<{ rows: any[]; source: 'PROXY' | 'JSONP' }> {
  // Strategi 1: Coba API Proxy Server
  try {
    const proxyRes = await fetch(`/api/sheets?sheet=${encodeURIComponent(sheetName)}`, {
      cache: 'no-cache'
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.rows && Array.isArray(data.rows)) {
        return { rows: data.rows, source: 'PROXY' };
      }
    }
  } catch {
    // Abaikan dan lanjut ke JSONP
  }

  // Strategi 2: Client-side JSONP (Bebas CORS)
  try {
    const rows = await fetchGvizSheetJsonp(sheetName);
    return { rows, source: 'JSONP' };
  } catch (err: any) {
    throw new Error(`Koneksi Spreadsheet gagal untuk tab "${sheetName}": ${err?.message || err}`);
  }
}

/**
 * Tarik seluruh data Murid langsung dari Google Spreadsheet tab "Murid" (882 Murid)
 */
export async function fetchLiveMurid(knownGuru: Guru[] = []): Promise<{ muridList: Murid[]; source: 'PROXY' | 'JSONP' }> {
  try {
    const { rows, source } = await fetchGvizSheet('Murid');
    const muridList: Murid[] = [];
    const usedIds = new Set<string>();

    // Buat lookup guru wali berdasarkan kelas
    const waliKelasMap: Record<string, string> = {};
    knownGuru.forEach(g => {
      if (g.kelasWali && g.kelasWali.trim()) {
        waliKelasMap[g.kelasWali.trim().toUpperCase()] = g.nama;
      }
    });

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i]?.c || [];
      const rawId = cells[0] ? String(cells[0].f || cells[0].v || '').trim() : '';
      const rawNisn = normalizeNisn(cells[1] ? String(cells[1].f || cells[1].v || '').trim() : '');
      const rawNis = cells[2] ? String(cells[2].f || cells[2].v || '').trim() : '';
      const rawNama = cells[3] ? String(cells[3].f || cells[3].v || '').trim() : '';
      const rawKelas = cells[4] ? String(cells[4].f || cells[4].v || '').trim().toUpperCase() : '';
      const rawJk = cells[5] ? String(cells[5].f || cells[5].v || '').trim().toUpperCase() : 'L';
      const rawWali = cells[6] ? String(cells[6].f || cells[6].v || '').trim() : '';
      const rawGuruWali = cells[7] ? String(cells[7].f || cells[7].v || '').trim() : '';

      // Skip baris jika merupakan header teks
      if (rawNisn.toUpperCase() === 'NISN' || rawNama.toUpperCase() === 'NAMA' || (!rawNama && !rawNisn)) {
        continue;
      }

      // Cari default wali kelas jika kolom di sheet masih kosong
      const fallbackWali = DEFAULT_WALI_KELAS_MAP[rawKelas]?.nama || 'Guru SMPN 2 Beji';
      const finalWaliKelas = rawWali || waliKelasMap[rawKelas] || fallbackWali;
      const finalGuruWali = rawGuruWali || finalWaliKelas;

      // Hasilkan ID unik agar tidak ada duplikasi ID (seperti MUR-6212)
      let finalId = rawId;
      if (!finalId) {
        if (rawNisn) {
          finalId = `MUR-${rawNisn}`;
        } else if (rawNis) {
          finalId = `MUR-${rawNis}`;
        } else {
          finalId = `MUR-${i + 1}`;
        }
      }
      if (usedIds.has(finalId)) {
        finalId = `${finalId}_${i + 1}`;
      }
      usedIds.add(finalId);

      muridList.push({
        id: finalId,
        nisn: rawNisn,
        nis: rawNis,
        nama: rawNama,
        kelas: rawKelas || '7A',
        jenisKelamin: rawJk === 'P' ? 'P' : 'L',
        waliKelas: finalWaliKelas,
        guruWali: finalGuruWali
      });
    }

    return { muridList, source };
  } catch (error) {
    console.error('Error fetching live Murid from spreadsheet:', error);
    throw error;
  }
}

/**
 * Tarik seluruh data Guru langsung dari Google Spreadsheet tab "Guru" (45 Guru & Tendik)
 */
export async function fetchLiveGuru(): Promise<{ guruList: Guru[]; source: 'PROXY' | 'JSONP' }> {
  try {
    const { rows, source } = await fetchGvizSheet('Guru');
    const guruList: Guru[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i]?.c || [];
      const rawId = cells[0] ? String(cells[0].f || cells[0].v || '').trim() : '';
      const rawNip = cells[1] ? String(cells[1].f || cells[1].v || '').trim() : '';
      const rawPass = cells[2] ? String(cells[2].f || cells[2].v || '').trim() : '';
      const rawNama = cells[3] ? String(cells[3].f || cells[3].v || '').trim() : '';
      const rawJabatan = cells[4] ? String(cells[4].f || cells[4].v || '').trim() : '';
      const rawKelas = cells[5] ? String(cells[5].f || cells[5].v || '').trim().toUpperCase() : '';
      const rawNoHp = cells[6] ? String(cells[6].f || cells[6].v || '').trim() : '';
      const rawStatus = cells[7] ? String(cells[7].f || cells[7].v || '').trim() : 'Aktif';

      // Skip baris header
      if (rawNip.toUpperCase() === 'NIP' || rawNama.toUpperCase() === 'NAMA' || (!rawNama && !rawNip)) {
        continue;
      }

      // Jika Kepala Sekolah (baris 1) NIP kosong di sheet, beri NIP identitas resmi
      let cleanNip = rawNip;
      if (!cleanNip) {
        if (rawJabatan.toLowerCase().includes('kepala sekolah')) {
          cleanNip = '196805121994031005';
        } else {
          cleanNip = `guru_${i}`;
        }
      }

      guruList.push({
        id: rawId || `GUR-${i + 1}`,
        nip: cleanNip,
        nama: rawNama,
        jabatan: rawJabatan || 'Guru Mata Pelajaran',
        kelasWali: rawKelas || undefined,
        noHp: rawNoHp || undefined,
        status: rawStatus === 'Nonaktif' ? 'Nonaktif' : 'Aktif'
      });
    }

    return { guruList, source };
  } catch (error) {
    console.error('Error fetching live Guru from spreadsheet:', error);
    throw error;
  }
}

/**
 * Tarik catatan pelanggaran dari Google Spreadsheet tab "Log_Pelanggaran"
 */
export async function fetchLiveLogs(knownMurid: Murid[] = []): Promise<{ logsList: LogPelanggaran[]; source: 'PROXY' | 'JSONP' }> {
  try {
    const { rows, source } = await fetchGvizSheet('Log_Pelanggaran');
    const logsList: LogPelanggaran[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i]?.c || [];
      const rawId = cells[0] ? String(cells[0].f || cells[0].v || '').trim() : '';
      let rawTgl = cells[1] ? String(cells[1].f || cells[1].v || '').trim() : '';
      const rawHari = cells[2] ? String(cells[2].f || cells[2].v || '').trim() : '';
      const rawKelas = cells[3] ? String(cells[3].f || cells[3].v || '').trim() : '';
      let rawNisn = cells[4] ? String(cells[4].f || cells[4].v || '').trim() : '';
      const rawNama = cells[5] ? String(cells[5].f || cells[5].v || '').trim() : '';
      const rawPelJSON = cells[6] ? String(cells[6].f || cells[6].v || '').trim() : '';
      const rawTotalPoin = cells[7] ? Number(cells[7].v || 0) : 0;
      const rawFotoUrl = cells[8] ? String(cells[8].f || cells[8].v || '').trim() : '';
      const rawCatatan = cells[9] ? String(cells[9].f || cells[9].v || '').trim() : '';
      const rawGuruNip = cells[10] ? String(cells[10].f || cells[10].v || '').trim() : '';
      const rawGuruNama = cells[11] ? String(cells[11].f || cells[11].v || '').trim() : '';
      const rawTimestamp = cells[12] ? String(cells[12].f || cells[12].v || '').trim() : '';

      // Skip header row
      if (rawId.toUpperCase() === 'ID' || rawTgl.toUpperCase() === 'TANGGAL' || !rawNama) {
        continue;
      }

      // Format tanggal dan normalisasi 10-digit NISN
      rawTgl = parseGvizDate(rawTgl);
      rawNisn = normalizeNisn(rawNisn);

      // Cocokkan dengan murid terdaftar jika ada untuk memastikan konsistensi 100%
      if (knownMurid.length > 0) {
        const found = knownMurid.find(m => 
          (rawNisn && normalizeNisn(m.nisn) === rawNisn) ||
          (m.nama && rawNama && m.nama.trim().toLowerCase() === rawNama.trim().toLowerCase())
        );
        if (found) {
          rawNisn = normalizeNisn(found.nisn);
        }
      }

      let parsedPelanggaran: any[] = [];
      try {
        if (rawPelJSON) {
          parsedPelanggaran = JSON.parse(rawPelJSON);
        }
      } catch {
        parsedPelanggaran = [{ kode: 'P-01', nama: rawPelJSON || 'Pelanggaran', poin: rawTotalPoin }];
      }

      logsList.push({
        id: rawId || `LOG-${Date.now()}-${i}`,
        tanggal: rawTgl,
        hari: rawHari,
        kelas: rawKelas,
        nisn: rawNisn,
        namaMurid: rawNama,
        pelanggaranList: parsedPelanggaran,
        totalPoin: rawTotalPoin,
        fotoBuktiUrl: rawFotoUrl,
        catatan: rawCatatan,
        guruNip: rawGuruNip,
        guruNama: rawGuruNama,
        timestamp: rawTimestamp || new Date().toISOString()
      });
    }

    return { logsList, source };
  } catch (error) {
    console.warn('Log_Pelanggaran sheet empty or note:', error);
    return { logsList: [], source: 'JSONP' };
  }
}

/**
 * Tarik data Admin langsung dari Google Spreadsheet tab "Admin" (jika tersedia data)
 */
export async function fetchLiveAdmins(): Promise<{ adminsList: AdminUser[]; source: 'PROXY' | 'JSONP' }> {
  try {
    const { rows, source } = await fetchGvizSheet('Admin');
    const adminsList: AdminUser[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i]?.c || [];
      const rawId = cells[0] ? String(cells[0].f || cells[0].v || '').trim() : '';
      const rawUser = cells[1] ? String(cells[1].f || cells[1].v || '').trim() : '';
      const rawPass = cells[2] ? String(cells[2].f || cells[2].v || '').trim() : '';
      const rawNama = cells[3] ? String(cells[3].f || cells[3].v || '').trim() : '';
      const rawRole = cells[4] ? String(cells[4].f || cells[4].v || '').trim() : 'Super Admin';
      const rawEmail = cells[5] ? String(cells[5].f || cells[5].v || '').trim() : '';
      const rawStatus = cells[6] ? String(cells[6].f || cells[6].v || '').trim() : 'Aktif';

      if (rawId.toUpperCase() === 'ID' || rawUser.toUpperCase() === 'USERNAME' || !rawUser) {
        continue;
      }

      adminsList.push({
        id: rawId || `ADM-${i + 1}`,
        username: rawUser,
        password: rawPass || '@smpn2beji',
        nama: rawNama || rawUser,
        role: rawRole === 'Admin BK' ? 'Admin BK' : 'Super Admin',
        email: rawEmail || `${rawUser}@smpn2beji.sch.id`,
        status: rawStatus === 'Nonaktif' ? 'Nonaktif' : 'Aktif'
      });
    }

    return { adminsList, source };
  } catch {
    return { adminsList: [], source: 'JSONP' };
  }
}

/**
 * Tarik master aturan jenis pelanggaran dari tab "Ref_Pelanggaran"
 */
export async function fetchLiveRefPelanggaran(): Promise<{ refList: JenisPelanggaran[]; source: 'PROXY' | 'JSONP' }> {
  try {
    const { rows, source } = await fetchGvizSheet('Ref_Pelanggaran');
    const refList: JenisPelanggaran[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i]?.c || [];
      const rawId = cells[0] ? String(cells[0].f || cells[0].v || '').trim() : '';
      const rawKode = cells[1] ? String(cells[1].f || cells[1].v || '').trim() : '';
      const rawKomp = cells[2] ? String(cells[2].f || cells[2].v || '').trim() : 'Kepribadian';
      const rawSub = cells[3] ? String(cells[3].f || cells[3].v || '').trim() : 'Ketertiban';
      const rawNama = cells[4] ? String(cells[4].f || cells[4].v || '').trim() : '';
      const rawPoin = cells[5] ? Number(cells[5].v || 0) : 0;

      if (rawId.toUpperCase() === 'ID' || rawKode.toUpperCase() === 'KODE' || !rawKode || !rawNama) {
        continue;
      }

      refList.push({
        id: rawId || `PEL-${rawKode}`,
        kode: rawKode,
        komponen: rawKomp as any,
        subKomponen: rawSub,
        namaPelanggaran: rawNama,
        poin: rawPoin
      });
    }

    return { refList, source };
  } catch {
    return { refList: [], source: 'JSONP' };
  }
}

/**
 * Uji Coba Koneksi ke URL Google Apps Script Web App
 */
export async function testGasConnection(url: string): Promise<{ success: boolean; message: string }> {
  if (!url || !url.trim().startsWith('http')) {
    return { success: false, message: 'URL Web App tidak boleh kosong' };
  }

  // 1. Coba melalui endpoint server proxy
  try {
    const res = await fetch('/api/db/test-gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // 2. Fallback: tes langsung dari browser
  try {
    const pingUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
    const res = await fetch(pingUrl, { mode: 'cors' });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || 'Google Apps Script Web App aktif!' };
    }
  } catch (err: any) {
    return { success: false, message: 'Gagal terhubung ke GAS: ' + (err?.message || err) };
  }

  return { success: false, message: 'URL Google Apps Script tidak merespon' };
}

/**
 * Uji Coba Koneksi ke Google Spreadsheet
 */
export async function testSpreadsheetConnection(): Promise<{
  success: boolean;
  totalMurid: number;
  totalGuru: number;
  source: 'PROXY' | 'JSONP';
  message: string;
}> {
  const [gurusRes, muridsRes] = await Promise.all([
    fetchLiveGuru(),
    fetchLiveMurid()
  ]);

  return {
    success: true,
    totalMurid: muridsRes.muridList.length,
    totalGuru: gurusRes.guruList.length,
    source: muridsRes.source,
    message: `Berhasil terhubung ke Google Spreadsheet! Memuat ${muridsRes.muridList.length} Murid & ${gurusRes.guruList.length} Guru via ${muridsRes.source}.`
  };
}

/**
 * Kirim Data Pelanggaran ke Google Apps Script Web App (jika URL telah diatur)
 */
export async function sendViolationToGAS(
  webAppUrl: string,
  payload: LogPelanggaran,
  fileObj?: { base64: string; mimeType: string; filename: string }
): Promise<{ success: boolean; message: string; fotoUrl?: string }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script Web App belum dikonfigurasi. Data tersimpan di penyimpanan lokal browser.'
    };
  }

  try {
    const postBody = {
      action: 'submitPelanggaran',
      payload: payload,
      fileObj: fileObj || null
    };

    // Google Apps Script redirect mode CORS
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // GAS accepts text/plain without CORS preflight block
      },
      body: JSON.stringify(postBody)
    });

    const result = await response.json();
    return result;
  } catch (err: any) {
    console.error('Error posting to Google Apps Script Web App:', err);
    return {
      success: false,
      message: 'Gagal mengirim ke URL Apps Script: ' + (err?.message || err)
    };
  }
}

/**
 * Tarik Pengaturan Lembaga & Kop Surat Resmi Online
 * 1. Coba dari server online /api/settings atau /api/db
 * 2. Coba dari Google Spreadsheet tab "Pengaturan" (GVIZ)
 */
export async function fetchLivePengaturan(): Promise<{ 
  pengaturan?: PengaturanLembaga; 
  gasWebAppUrl?: string;
  source: 'SERVER' | 'SPREADSHEET' | 'NONE' 
}> {
  // 1. Coba dari server endpoint /api/settings
  try {
    const res = await fetch('/api/settings', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings && (data.settings.namaSekolah || data.settings.npsn)) {
        const foundUrl = data.gasWebAppUrl || data.settings.gasWebAppUrl || '';
        return { 
          pengaturan: data.settings as PengaturanLembaga, 
          gasWebAppUrl: foundUrl,
          source: 'SERVER' 
        };
      }
    }
  } catch {
    // Lanjut ke pemeriksaan Google Spreadsheet
  }

  // 2. Coba dari tab "Pengaturan" di Google Sheets
  try {
    const { rows } = await fetchGvizSheet('Pengaturan');
    if (rows && rows.length > 0) {
      const parsed: Record<string, any> = {};
      rows.forEach(r => {
        const k = r.c?.[0] ? String(r.c[0].f || r.c[0].v || '').trim() : '';
        const v = r.c?.[1] ? String(r.c[1].f || r.c[1].v || '').trim() : '';
        if (k && k !== 'Key') {
          parsed[k] = v;
        }
      });
      if (parsed.namaSekolah || parsed.npsn || parsed.gasWebAppUrl) {
        return { 
          pengaturan: parsed as PengaturanLembaga, 
          gasWebAppUrl: parsed.gasWebAppUrl || '',
          source: 'SPREADSHEET' 
        };
      }
    }
  } catch (err) {
    console.warn('Note: tab Pengaturan spreadsheet belum berisi data kustom:', err);
  }

  return { source: 'NONE' };
}

/**
 * Simpan Pengaturan Lembaga & Kop Surat Resmi Online
 * 1. Simpan ke Server (/api/settings dan /api/db/pengaturan)
 * 2. Simpan URL Web App ke (/api/db/gas-url)
 * 3. Simpan ke Google Apps Script Web App (jika URL terisi) untuk update sheet "Pengaturan"
 */
export async function saveOnlinePengaturan(
  settings: PengaturanLembaga,
  gasWebAppUrl?: string
): Promise<{ success: boolean; message: string; gasSynced?: boolean; gasWebAppUrl?: string }> {
  let serverSaved = false;
  let gasSynced = false;
  const activeGasUrl = (gasWebAppUrl || settings.gasWebAppUrl || '').trim();

  // 1. Simpan ke Cloud Server (/api/settings)
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        settings: { ...settings, gasWebAppUrl: activeGasUrl }, 
        gasWebAppUrl: activeGasUrl 
      })
    });
    if (res.ok) {
      const resJson = await res.json();
      serverSaved = resJson.success ?? true;
      gasSynced = resJson.gasSynced ?? false;
    }
  } catch (err: any) {
    console.warn('Server save warning:', err);
  }

  // 2. Simpan URL Web App secara terpisah ke /api/db/gas-url agar selalu sinkron online
  if (activeGasUrl) {
    try {
      await fetch('/api/db/gas-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: activeGasUrl })
      });
    } catch (urlErr) {
      console.warn('Sync /api/db/gas-url note:', urlErr);
    }
  }

  // 3. Jika ada activeGasUrl dan belum ter-sync lewat server, coba kirim langsung dari client
  if (activeGasUrl && activeGasUrl.startsWith('http') && !gasSynced) {
    try {
      const gasRes = await fetch(activeGasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'savePengaturan',
          payload: { ...settings, gasWebAppUrl: activeGasUrl }
        })
      });
      if (gasRes.ok) {
        const gasJson = await gasRes.json();
        gasSynced = gasJson.success ?? true;
      }
    } catch (gasErr) {
      console.warn('Client direct GAS settings save note:', gasErr);
    }
  }

  // Simpan ke localStorage sebagai cache lokal
  try {
    localStorage.setItem('smpn2beji_pengaturan', JSON.stringify({ ...settings, gasWebAppUrl: activeGasUrl }));
    if (activeGasUrl) {
      localStorage.setItem('smpn2beji_gas_url', activeGasUrl);
    }
  } catch {}

  if (serverSaved || gasSynced) {
    const detail = gasSynced 
      ? 'Tersimpan online di Cloud Server dan Google Spreadsheet!' 
      : 'Tersimpan online di Cloud Server untuk semua komputer.';
    return {
      success: true,
      message: `Berhasil! Pengaturan dan URL Web App telah ${detail}`,
      gasSynced,
      gasWebAppUrl: activeGasUrl
    };
  }

  return {
    success: true,
    message: 'Pengaturan dan Kop tersimpan di penyimpanan browser lokal.',
    gasSynced: false,
    gasWebAppUrl: activeGasUrl
  };
}

/**
 * =========================================================================
 * LAYANAN DATABASE TERPUSAT & SINKRONISASI ANTAR KOMPUTER & SPREADSHEET
 * =========================================================================
 */

export interface CentralDbPayload {
  admins?: AdminUser[];
  refPelanggaran?: JenisPelanggaran[];
  logs?: LogPelanggaran[];
  muridList?: Murid[];
  guruList?: Guru[];
  pengaturan?: PengaturanLembaga;
  gasWebAppUrl?: string;
}

/**
 * Tarik seluruh data dari database terpusat Cloud Server (/api/db)
 * Ini memastikan saat dibuka dari komputer lain, semua data (admin, pelanggaran, log, murid, guru, kop)
 * langsung sinkron dan muncul dengan data terbaru!
 */
export async function fetchCentralDatabase(): Promise<{
  admins: AdminUser[];
  refPelanggaran: JenisPelanggaran[];
  logs: LogPelanggaran[];
  muridList: Murid[];
  guruList: Guru[];
  pengaturan?: PengaturanLembaga;
  gasWebAppUrl: string;
  source: 'SERVER' | 'CACHE';
}> {
  try {
    const res = await fetch('/api/db', { cache: 'no-cache' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          admins: json.data.admins || [],
          refPelanggaran: json.data.refPelanggaran || [],
          logs: json.data.logs || [],
          muridList: json.data.muridList || [],
          guruList: json.data.guruList || [],
          pengaturan: json.data.pengaturan,
          gasWebAppUrl: json.data.gasWebAppUrl || '',
          source: 'SERVER'
        };
      }
    }
  } catch (err) {
    console.warn('Central DB fetch from server warning, checking fallback:', err);
  }

  // Fallback ke cache localStorage
  const savedAdmins = localStorage.getItem('smpn2beji_admins');
  const savedRef = localStorage.getItem('smpn2beji_ref');
  const savedLogs = localStorage.getItem('smpn2beji_logs');
  const savedMurid = localStorage.getItem('smpn2beji_murid');
  const savedGuru = localStorage.getItem('smpn2beji_guru');
  const savedPengaturan = localStorage.getItem('smpn2beji_pengaturan');
  const savedGas = localStorage.getItem('smpn2beji_gas_url');

  return {
    admins: savedAdmins ? JSON.parse(savedAdmins) : [],
    refPelanggaran: savedRef ? JSON.parse(savedRef) : [],
    logs: savedLogs ? JSON.parse(savedLogs) : [],
    muridList: savedMurid ? JSON.parse(savedMurid) : [],
    guruList: savedGuru ? JSON.parse(savedGuru) : [],
    pengaturan: savedPengaturan ? JSON.parse(savedPengaturan) : undefined,
    gasWebAppUrl: savedGas || '',
    source: 'CACHE'
  };
}

/**
 * Polling berkala log pelanggaran dari server terpusat untuk sinkronisasi otomatis antar komputer
 */
export async function fetchLivePollLogs(): Promise<{ success: boolean; count: number; logs: LogPelanggaran[]; lastUpdated?: string } | null> {
  try {
    const res = await fetch('/api/db/logs', { cache: 'no-cache' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.logs)) {
        return {
          success: true,
          count: json.count || json.logs.length,
          logs: json.logs,
          lastUpdated: json.lastUpdated
        };
      }
    }
  } catch {
    // Abaikan jika offline / dev
  }
  return null;
}

/**
 * Simpan data siswa & guru ke server terpusat untuk dibagikan ke seluruh komputer
 */
export async function syncStudentsAndTeachersToServer(muridList: Murid[], guruList: Guru[]): Promise<boolean> {
  try {
    const res = await fetch('/api/db/sync-students-teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ muridList, guruList })
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Simpan / Edit Admin Secara Online ke Cloud Server & Google Spreadsheet
 */
export async function saveAdminOnline(admin: AdminUser): Promise<{ success: boolean; message: string; gasSynced?: boolean }> {
  try {
    const res = await fetch('/api/db/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admin)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err: any) {
    console.warn('saveAdminOnline server note:', err);
  }
  return { success: true, message: 'Data admin disimpan di penyimpanan lokal.', gasSynced: false };
}

/**
 * Hapus Admin Secara Online
 */
export async function deleteAdminOnline(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/db/admin/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) return await res.json();
  } catch (err: any) {
    console.warn('deleteAdminOnline server note:', err);
  }
  return { success: true, message: 'Admin dihapus secara lokal.' };
}

/**
 * Simpan / Edit Master Pelanggaran Secara Online
 */
export async function saveRefPelanggaranOnline(pel: JenisPelanggaran): Promise<{ success: boolean; message: string; gasSynced?: boolean }> {
  try {
    const res = await fetch('/api/db/ref-pelanggaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pel)
    });
    if (res.ok) return await res.json();
  } catch (err: any) {
    console.warn('saveRefPelanggaranOnline server note:', err);
  }
  return { success: true, message: 'Data pelanggaran disimpan di penyimpanan lokal.', gasSynced: false };
}

/**
 * Hapus Master Pelanggaran Secara Online
 */
export async function deleteRefPelanggaranOnline(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/db/ref-pelanggaran/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) return await res.json();
  } catch (err: any) {
    console.warn('deleteRefPelanggaranOnline server note:', err);
  }
  return { success: true, message: 'Data pelanggaran dihapus secara lokal.' };
}

/**
 * Simpan Log Pelanggaran dari Guru ke Cloud Server & Google Spreadsheet
 */
export async function saveLogOnline(
  log: LogPelanggaran,
  fileObj?: { base64: string; mimeType: string; filename: string }
): Promise<{ success: boolean; message: string; fotoUrl?: string; gasSynced?: boolean; log?: LogPelanggaran }> {
  const cleanLog: LogPelanggaran = {
    ...log,
    nisn: normalizeNisn(log.nisn)
  };
  try {
    const res = await fetch('/api/db/log-pelanggaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: cleanLog, fileObj })
    });
    if (res.ok) {
      const data = await res.json();
      return { ...data, log: cleanLog };
    }
  } catch (err: any) {
    console.warn('saveLogOnline server note:', err);
  }
  return { success: true, message: 'Log dicatat di penyimpanan lokal.', fotoUrl: cleanLog.fotoBuktiUrl, gasSynced: false, log: cleanLog };
}

/**
 * Simpan URL Web App Google Apps Script ke Cloud Server
 */
export async function saveGasUrlOnline(url: string): Promise<{ success: boolean; message: string; testConnected?: boolean }> {
  try {
    const res = await fetch('/api/db/gas-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (res.ok) return await res.json();
  } catch (err: any) {
    console.warn('saveGasUrlOnline server note:', err);
  }
  return { success: true, message: 'URL disimpan di browser lokal.' };
}

/**
 * Kirim / Ekspor Seluruh Data Awal (Admin, 90 Jenis Pelanggaran, Pengaturan)
 * ke tab Spreadsheet Google Sheets secara langsung!
 */
export async function syncAllToGoogleSheets(gasWebAppUrl?: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/db/sync-all-to-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gasWebAppUrl })
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, message: 'Gagal mengirim ke spreadsheet: ' + (err?.message || err) };
  }
}



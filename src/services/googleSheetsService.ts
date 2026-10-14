/**
 * Layanan Integrasi Google Sheets & Google Apps Script
 * SMPN 2 Beji
 * 
 * Mendukung Dual-Strategy:
 * 1. Server-side Proxy (/api/sheets) untuk full-stack environment
 * 2. Client-side JSONP (Google Visualization API) yang bekerja 100% di browser tanpa terkena CORS,
 *    sangat cocok saat dideploy ke GitHub Pages atau static hosting.
 */

import { Murid, Guru, LogPelanggaran } from '../types';

export const SPREADSHEET_ID = '1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10';
export const DRIVE_FOLDER_ID = '18tDeAMgEFfYR5vkYJT-yiZiAJ7g4XOdH';

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
      const rawNisn = cells[1] ? String(cells[1].f || cells[1].v || '').trim() : '';
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

      muridList.push({
        id: rawId || (rawNis ? `MUR-${rawNis}` : `MUR-${i + 1}`),
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
export async function fetchLiveLogs(): Promise<{ logsList: LogPelanggaran[]; source: 'PROXY' | 'JSONP' }> {
  try {
    const { rows, source } = await fetchGvizSheet('Log_Pelanggaran');
    const logsList: LogPelanggaran[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i]?.c || [];
      const rawId = cells[0] ? String(cells[0].f || cells[0].v || '').trim() : '';
      const rawTgl = cells[1] ? String(cells[1].f || cells[1].v || '').trim() : '';
      const rawHari = cells[2] ? String(cells[2].f || cells[2].v || '').trim() : '';
      const rawKelas = cells[3] ? String(cells[3].f || cells[3].v || '').trim() : '';
      const rawNisn = cells[4] ? String(cells[4].f || cells[4].v || '').trim() : '';
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

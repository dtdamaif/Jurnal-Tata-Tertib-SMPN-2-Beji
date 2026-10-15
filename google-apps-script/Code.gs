/**
 * ====================================================================
 * JURNAL TATA TERTIB SMPN 2 BEJI - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ====================================================================
 * Mengacu pada Aturan Resmi Bab V & Bab VI Tata Tertib SMPN 2 Beji
 * - Spreadsheet ID : 1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10
 * - Drive Folder ID: 18tDeAMgEFfYR5vkYJT-yiZiAJ7g4XOdH
 * - Password Default Admin: @smpn2beji
 * - Password Default Guru : Smpn2Beji
 * ====================================================================
 * 
 * STRUKTUR DATABASE SPREADSHEET (6 LEMBAR / TABS):
 * 1. Sheet "Admin" (7 Kolom):
 *    A: ID | B: Username | C: Password | D: Nama | E: Role | F: Email | G: Status
 * 2. Sheet "Guru" (8 Kolom):
 *    A: ID | B: NIP | C: Password | D: Nama | E: Jabatan | F: KelasWali | G: NoHP | H: Status
 * 3. Sheet "Murid" (8 Kolom):
 *    A: ID | B: NISN | C: NIS | D: Nama | E: Kelas | F: JenisKelamin | G: WaliKelas | H: GuruWali
 * 4. Sheet "Ref_Pelanggaran" (6 Kolom - 90 Aturan Bab V):
 *    A: ID | B: Kode | C: Komponen | D: SubKomponen | E: NamaPelanggaran | F: Poin
 * 5. Sheet "Log_Pelanggaran" (13 Kolom - Rekap Catatan Guru):
 *    A: ID | B: Tanggal | C: Hari | D: Kelas | E: NISN | F: NamaMurid | G: PelanggaranJSON | H: TotalPoin | I: FotoBuktiUrl | J: Catatan | K: GuruNIP | L: GuruNama | M: Timestamp
 * 6. Sheet "Pengaturan" (2 Kolom - Kop Surat & Pejabat Pengesahan):
 *    A: Key | B: Value
 * ====================================================================
 */

// KONFIGURASI SISTEM
const CONFIG = {
  // SPREADSHEET ID: Sesuaikan jika menggunakan spreadsheet baru
  SPREADSHEET_ID: '1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10',
  
  // GOOGLE DRIVE FOLDER ID: Tempat penyimpanan foto bukti pelanggaran
  DRIVE_FOLDER_ID: '18tDeAMgEFfYR5vkYJT-yiZiAJ7g4XOdH',
  
  // KATA SANDI DEFAULT
  ADMIN_DEFAULT_PASS: '@smpn2beji',
  GURU_DEFAULT_PASS: 'Smpn2Beji',
  
  // DAFTAR NAMA SHEET TAB
  SHEETS: {
    ADMIN: 'Admin',
    GURU: 'Guru',
    MURID: 'Murid',
    REF_PELANGGARAN: 'Ref_Pelanggaran',
    LOG_PELANGGARAN: 'Log_Pelanggaran',
    PENGATURAN: 'Pengaturan'
  }
};

/**
 * Entry point GET request (Mendukung Tampilan HTML & Endpoint REST API JSON)
 */
function doGet(e) {
  initDatabase();

  // Endpoint REST API via parameter ?action=...
  if (e && e.parameter && e.parameter.action) {
    const action = e.parameter.action;
    let result = {};
    
    if (action === 'ping') {
      result = { 
        success: true, 
        message: 'Koneksi Google Apps Script Web App Berhasil!', 
        timestamp: new Date().toISOString(),
        spreadsheetId: CONFIG.SPREADSHEET_ID 
      };
    } else if (action === 'getMurid') {
      result = syncMuridFromSpreadsheet();
    } else if (action === 'getGuru') {
      result = syncGuruFromSpreadsheet();
    } else if (action === 'getPengaturan') {
      result = getPengaturanFromSheet();
    } else if (action === 'getAdmins') {
      result = getAdminsFromSheet();
    } else if (action === 'getRef') {
      result = { success: true, data: getRefPelanggaran() };
    } else if (action === 'getLogs') {
      result = getLogsFromSheet();
    } else if (action === 'getLeaderboard') {
      result = { success: true, data: getPublicLeaderboard() };
    } else {
      result = { success: false, message: 'Action API tidak dikenal: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Tampilan Web App standar
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Jurnal Tata Tertib SMPN 2 Beji')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handle POST request (Submit Pelanggaran, Foto Drive, Simpan Pengaturan, Admin, Ref, dsb)
 */
function doPost(e) {
  try {
    let postData;
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        postData = e.parameter;
      }
    } else {
      postData = e.parameter || {};
    }

    const action = postData.action;
    let result = {};

    // 1. Submit Catatan Pelanggaran + Upload Foto ke Drive
    if (action === 'submitPelanggaran') {
      result = submitPelanggaran(postData.payload, postData.fileObj);
    } 
    // 2. Simpan Pengaturan & Kop Surat Resmi ke Sheet "Pengaturan"
    else if (action === 'savePengaturan') {
      result = savePengaturanToSheet(postData.payload);
    } 
    // 3. Ambil Pengaturan dari Sheet "Pengaturan"
    else if (action === 'getPengaturan') {
      result = getPengaturanFromSheet();
    } 
    // 4. Simpan / Edit Akun Admin ke Sheet "Admin"
    else if (action === 'saveAdmin') {
      result = saveAdmin(postData.payload);
    } 
    // 5. Hapus Akun Admin dari Sheet "Admin"
    else if (action === 'deleteAdmin') {
      const adminId = postData.payload ? (postData.payload.id || postData.payload) : postData.id;
      result = deleteAdmin(adminId);
    } 
    // 6. Simpan / Edit Jenis Pelanggaran ke Sheet "Ref_Pelanggaran"
    else if (action === 'saveRefPelanggaran') {
      result = saveRefPelanggaran(postData.payload);
    } 
    // 7. Hapus Jenis Pelanggaran dari Sheet "Ref_Pelanggaran"
    else if (action === 'deleteRefPelanggaran') {
      const pelId = postData.payload ? (postData.payload.id || postData.payload) : postData.id;
      result = deleteRefPelanggaran(pelId);
    } 
    // 8. Simpan / Edit Data Siswa ke Sheet "Murid"
    else if (action === 'saveMurid') {
      result = saveMurid(postData.payload);
    } 
    // 9. Batch Sync Semua Data (Admin, 90 Jenis Pelanggaran, Pengaturan) Sekaligus
    else if (action === 'syncAllToSheets') {
      result = syncAllToSheets(postData.payload);
    } 
    // Default: Action tidak ditemukan
    else {
      result = { success: false, message: 'Action POST tidak dikenal: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: 'Error di server Google Apps Script: ' + err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Inisialisasi otomatis tabel sheet jika belum ada di spreadsheet
 */
function initDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // 1. Sheet Admin
  let sheetAdmin = ss.getSheetByName(CONFIG.SHEETS.ADMIN);
  if (!sheetAdmin) {
    sheetAdmin = ss.insertSheet(CONFIG.SHEETS.ADMIN);
    sheetAdmin.appendRow(['ID', 'Username', 'Password', 'Nama', 'Role', 'Email', 'Status']);
    sheetAdmin.appendRow(['ADM-001', 'admin', CONFIG.ADMIN_DEFAULT_PASS, 'Administrator Kesiswaan', 'Super Admin', 'admin@smpn2beji.sch.id', 'Aktif']);
    sheetAdmin.setFrozenRows(1);
  }

  // 2. Sheet Guru
  let sheetGuru = ss.getSheetByName(CONFIG.SHEETS.GURU);
  if (!sheetGuru) {
    sheetGuru = ss.insertSheet(CONFIG.SHEETS.GURU);
    sheetGuru.appendRow(['ID', 'NIP', 'Password', 'Nama', 'Jabatan', 'KelasWali', 'NoHP', 'Status']);
    sheetGuru.setFrozenRows(1);
  }

  // 3. Sheet Murid
  let sheetMurid = ss.getSheetByName(CONFIG.SHEETS.MURID);
  if (!sheetMurid) {
    sheetMurid = ss.insertSheet(CONFIG.SHEETS.MURID);
    sheetMurid.appendRow(['ID', 'NISN', 'NIS', 'Nama', 'Kelas', 'JenisKelamin', 'WaliKelas', 'GuruWali']);
    sheetMurid.setFrozenRows(1);
  }

  // 4. Sheet Ref_Pelanggaran (90 Klasifikasi Bab V)
  let sheetRef = ss.getSheetByName(CONFIG.SHEETS.REF_PELANGGARAN);
  if (!sheetRef) {
    sheetRef = ss.insertSheet(CONFIG.SHEETS.REF_PELANGGARAN);
    sheetRef.appendRow(['ID', 'Kode', 'Komponen', 'SubKomponen', 'NamaPelanggaran', 'Poin']);
    sheetRef.setFrozenRows(1);
  }

  // 5. Sheet Log_Pelanggaran
  let sheetLog = ss.getSheetByName(CONFIG.SHEETS.LOG_PELANGGARAN);
  if (!sheetLog) {
    sheetLog = ss.insertSheet(CONFIG.SHEETS.LOG_PELANGGARAN);
    sheetLog.appendRow(['ID', 'Tanggal', 'Hari', 'Kelas', 'NISN', 'NamaMurid', 'PelanggaranJSON', 'TotalPoin', 'FotoBuktiUrl', 'Catatan', 'GuruNIP', 'GuruNama', 'Timestamp']);
    sheetLog.setFrozenRows(1);
  }

  // 6. Sheet Pengaturan (Key - Value)
  let sheetSet = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
  if (!sheetSet) {
    sheetSet = ss.insertSheet(CONFIG.SHEETS.PENGATURAN);
    sheetSet.appendRow(['Key', 'Value']);
    sheetSet.setFrozenRows(1);
  }
}

/**
 * ====================================================================
 * MODUL PENGATURAN LEMBAGA & KOP SURAT RESMI
 * ====================================================================
 */

/**
 * Simpan Pengaturan Lembaga & Kop Surat ke Tab "Pengaturan" di Google Sheets
 */
function savePengaturanToSheet(settings) {
  try {
    if (!settings || typeof settings !== 'object') {
      return { success: false, message: 'Data pengaturan tidak valid' };
    }

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEETS.PENGATURAN);
      sheet.appendRow(['Key', 'Value']);
      sheet.setFrozenRows(1);
    }

    const keys = Object.keys(settings);
    const existingData = sheet.getDataRange().getValues();
    const keyRowMap = {};
    for (let i = 1; i < existingData.length; i++) {
      const k = String(existingData[i][0]).trim();
      if (k) keyRowMap[k] = i + 1;
    }

    keys.forEach(k => {
      const val = typeof settings[k] === 'object' ? JSON.stringify(settings[k]) : String(settings[k] !== undefined && settings[k] !== null ? settings[k] : '');
      if (keyRowMap[k]) {
        sheet.getRange(keyRowMap[k], 2).setValue(val);
      } else {
        sheet.appendRow([k, val]);
      }
    });

    return { 
      success: true, 
      message: 'Pengaturan lembaga dan kop surat resmi berhasil disimpan ke Google Spreadsheet tab "Pengaturan"!' 
    };
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan ke Google Spreadsheet: ' + err.toString() };
  }
}

/**
 * Ambil Pengaturan Lembaga & Kop Surat dari Tab "Pengaturan" di Google Sheets
 */
function getPengaturanFromSheet() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
    if (!sheet) return { success: false, message: 'Sheet Pengaturan tidak ditemukan' };
    
    const data = sheet.getDataRange().getValues();
    const settings = {};
    for (let i = 1; i < data.length; i++) {
      const k = String(data[i][0]).trim();
      const v = data[i][1];
      if (k) settings[k] = v;
    }
    return { success: true, data: settings };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * ====================================================================
 * MODUL ADMIN (TAB "Admin")
 * ====================================================================
 */

/**
 * Simpan atau Perbarui Data Admin di Tab "Admin" Google Sheets
 */
function saveAdmin(adminObj) {
  try {
    if (!adminObj || !adminObj.username) {
      return { success: false, message: 'Data admin tidak valid' };
    }

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEETS.ADMIN);
      sheet.appendRow(['ID', 'Username', 'Password', 'Nama', 'Role', 'Email', 'Status']);
      sheet.setFrozenRows(1);
    }
    const data = sheet.getDataRange().getValues();
    
    if (adminObj.id) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === adminObj.id) {
          sheet.getRange(i + 1, 2).setValue(adminObj.username);
          sheet.getRange(i + 1, 3).setValue(adminObj.password || CONFIG.ADMIN_DEFAULT_PASS);
          sheet.getRange(i + 1, 4).setValue(adminObj.nama);
          sheet.getRange(i + 1, 5).setValue(adminObj.role || 'Super Admin');
          sheet.getRange(i + 1, 6).setValue(adminObj.email || '');
          sheet.getRange(i + 1, 7).setValue(adminObj.status || 'Aktif');
          return { success: true, message: 'Data admin [' + adminObj.nama + '] berhasil disimpan ke spreadsheet.' };
        }
      }
    }
    
    const newId = adminObj.id || ('ADM-' + Date.now());
    sheet.appendRow([
      newId,
      adminObj.username,
      adminObj.password || CONFIG.ADMIN_DEFAULT_PASS,
      adminObj.nama,
      adminObj.role || 'Super Admin',
      adminObj.email || '',
      adminObj.status || 'Aktif'
    ]);
    return { success: true, message: 'Admin baru berhasil ditambahkan ke spreadsheet.', id: newId };
  } catch (err) {
    return { success: false, message: 'Gagal saveAdmin: ' + err.toString() };
  }
}

/**
 * Hapus Data Admin dari Tab "Admin" Google Sheets
 */
function deleteAdmin(adminId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN);
    if (!sheet) return { success: false, message: 'Sheet Admin tidak ditemukan' };
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === adminId) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Admin berhasil dihapus dari spreadsheet.' };
      }
    }
    return { success: false, message: 'Data admin tidak ditemukan.' };
  } catch (err) {
    return { success: false, message: 'Gagal deleteAdmin: ' + err.toString() };
  }
}

/**
 * Ambil seluruh Admin dari Sheet "Admin"
 */
function getAdminsFromSheet() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN);
    if (!sheet) return { success: false, message: 'Sheet Admin tidak ditemukan' };
    
    const data = sheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][1]) continue;
      list.push({
        id: data[i][0],
        username: data[i][1],
        password: data[i][2],
        nama: data[i][3],
        role: data[i][4],
        email: data[i][5],
        status: data[i][6]
      });
    }
    return { success: true, count: list.length, data: list };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * ====================================================================
 * MODUL JENIS PELANGGARAN (TAB "Ref_Pelanggaran")
 * ====================================================================
 */

/**
 * Simpan atau Perbarui Master Jenis Pelanggaran di Tab "Ref_Pelanggaran"
 */
function saveRefPelanggaran(pelObj) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEETS.REF_PELANGGARAN);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEETS.REF_PELANGGARAN);
      sheet.appendRow(['ID', 'Kode', 'Komponen', 'SubKomponen', 'NamaPelanggaran', 'Poin']);
      sheet.setFrozenRows(1);
    }

    const data = sheet.getDataRange().getValues();
    if (pelObj.id) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === pelObj.id) {
          sheet.getRange(i + 1, 2).setValue(pelObj.kode);
          sheet.getRange(i + 1, 3).setValue(pelObj.komponen);
          sheet.getRange(i + 1, 4).setValue(pelObj.subKomponen);
          sheet.getRange(i + 1, 5).setValue(pelObj.namaPelanggaran);
          sheet.getRange(i + 1, 6).setValue(Number(pelObj.poin));
          return { success: true, message: 'Jenis pelanggaran [' + pelObj.kode + '] berhasil diperbarui di spreadsheet.' };
        }
      }
    }
    
    const newId = pelObj.id || ('PEL-' + Date.now());
    sheet.appendRow([
      newId, 
      pelObj.kode, 
      pelObj.komponen, 
      pelObj.subKomponen, 
      pelObj.namaPelanggaran, 
      Number(pelObj.poin)
    ]);
    return { success: true, message: 'Jenis pelanggaran baru berhasil ditambahkan ke spreadsheet.', id: newId };
  } catch (err) {
    return { success: false, message: 'Gagal saveRefPelanggaran: ' + err.toString() };
  }
}

/**
 * Hapus Jenis Pelanggaran dari Tab "Ref_Pelanggaran"
 */
function deleteRefPelanggaran(pelId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.REF_PELANGGARAN);
    if (!sheet) return { success: false, message: 'Sheet Ref_Pelanggaran tidak ditemukan' };
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === pelId) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Jenis pelanggaran berhasil dihapus dari spreadsheet.' };
      }
    }
    return { success: false, message: 'Data tidak ditemukan.' };
  } catch (err) {
    return { success: false, message: 'Gagal deleteRefPelanggaran: ' + err.toString() };
  }
}

/**
 * Ambil seluruh Master Referensi Pelanggaran dari Tab "Ref_Pelanggaran"
 */
function getRefPelanggaran() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.REF_PELANGGARAN);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][1]) continue;
    list.push({
      id: data[i][0],
      kode: data[i][1],
      komponen: data[i][2],
      subKomponen: data[i][3],
      namaPelanggaran: data[i][4],
      poin: Number(data[i][5])
    });
  }
  return list;
}

/**
 * ====================================================================
 * MODUL LOG PELANGGARAN & UPLOAD FOTO GOOGLE DRIVE (TAB "Log_Pelanggaran")
 * ====================================================================
 */

/**
 * Upload Foto ke Google Drive Folder & Simpan Catatan Pelanggaran ke Tab "Log_Pelanggaran"
 */
function submitPelanggaran(payload, fileObj) {
  try {
    let fotoUrl = '';
    
    // 1. Upload Foto Bukti ke Google Drive jika tersedia file base64
    if (fileObj && fileObj.base64) {
      try {
        const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
        const decodedBytes = Utilities.base64Decode(fileObj.base64);
        const filename = fileObj.filename || ('bukti_' + Date.now() + '.jpg');
        const blob = Utilities.newBlob(decodedBytes, fileObj.mimeType || 'image/jpeg', filename);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fotoUrl = file.getUrl();
      } catch (driveErr) {
        fotoUrl = '';
      }
    } else if (payload && payload.fotoBuktiUrl) {
      fotoUrl = payload.fotoBuktiUrl;
    }
    
    // 2. Simpan Baris Log ke Google Spreadsheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEETS.LOG_PELANGGARAN);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEETS.LOG_PELANGGARAN);
      sheet.appendRow(['ID', 'Tanggal', 'Hari', 'Kelas', 'NISN', 'NamaMurid', 'PelanggaranJSON', 'TotalPoin', 'FotoBuktiUrl', 'Catatan', 'GuruNIP', 'GuruNama', 'Timestamp']);
      sheet.setFrozenRows(1);
    }

    const newId = payload.id || ('LOG-' + Date.now());
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const pelanggaranJson = typeof payload.pelanggaranList === 'string' 
      ? payload.pelanggaranList 
      : JSON.stringify(payload.pelanggaranList || []);

    sheet.appendRow([
      newId,
      payload.tanggal || '',
      payload.hari || '',
      payload.kelas || '',
      payload.nisn || '',
      payload.namaMurid || '',
      pelanggaranJson,
      Number(payload.totalPoin || 0),
      fotoUrl,
      payload.catatan || '',
      payload.guruNip || '',
      payload.guruNama || '',
      timestamp
    ]);
    
    return { 
      success: true, 
      message: 'Pelanggaran berhasil dicatat ke Google Spreadsheet dan foto tersimpan ke Google Drive!', 
      id: newId, 
      fotoUrl: fotoUrl 
    };
  } catch (error) {
    return { success: false, message: 'Gagal mencatat pelanggaran: ' + error.toString() };
  }
}

/**
 * Ambil seluruh Log Pelanggaran dari Tab "Log_Pelanggaran"
 */
function getLogsFromSheet() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.LOG_PELANGGARAN);
    if (!sheet) return { success: false, message: 'Sheet Log_Pelanggaran tidak ditemukan' };
    
    const data = sheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][5]) continue; // NamaMurid
      let pelList = [];
      try {
        pelList = JSON.parse(data[i][6]);
      } catch {
        pelList = [{ kode: 'P-01', nama: String(data[i][6]), poin: Number(data[i][7] || 0) }];
      }

      list.push({
        id: data[i][0],
        tanggal: data[i][1],
        hari: data[i][2],
        kelas: data[i][3],
        nisn: String(data[i][4]),
        namaMurid: data[i][5],
        pelanggaranList: pelList,
        totalPoin: Number(data[i][7] || 0),
        fotoBuktiUrl: data[i][8] || '',
        catatan: data[i][9] || '',
        guruNip: String(data[i][10] || ''),
        guruNama: data[i][11] || '',
        timestamp: data[i][12] || ''
      });
    }
    return { success: true, count: list.length, data: list };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * ====================================================================
 * MODUL SINKRONISASI BATCH KE SPREADSHEET (KIRIM SEMUA DATA 1-KLIK)
 * ====================================================================
 */

/**
 * Tulis & Sinkronkan Seluruh Data (Admin, 90 Jenis Pelanggaran, Pengaturan) ke Google Spreadsheet
 */
function syncAllToSheets(data) {
  try {
    if (!data) return { success: false, message: 'Data payload kosong' };
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // 1. Simpan Seluruh Admin ke Tab "Admin"
    if (data.admins && Array.isArray(data.admins) && data.admins.length > 0) {
      let sheetAdmin = ss.getSheetByName(CONFIG.SHEETS.ADMIN);
      if (!sheetAdmin) {
        sheetAdmin = ss.insertSheet(CONFIG.SHEETS.ADMIN);
        sheetAdmin.appendRow(['ID', 'Username', 'Password', 'Nama', 'Role', 'Email', 'Status']);
        sheetAdmin.setFrozenRows(1);
      }
      const lastRow = sheetAdmin.getLastRow();
      if (lastRow > 1) {
        sheetAdmin.deleteRows(2, lastRow - 1);
      }
      data.admins.forEach(adm => {
        sheetAdmin.appendRow([
          adm.id || ('ADM-' + Date.now()),
          adm.username,
          adm.password || CONFIG.ADMIN_DEFAULT_PASS,
          adm.nama,
          adm.role || 'Super Admin',
          adm.email || '',
          adm.status || 'Aktif'
        ]);
      });
    }

    // 2. Simpan Seluruh Master Pelanggaran ke Tab "Ref_Pelanggaran"
    if (data.refPelanggaran && Array.isArray(data.refPelanggaran) && data.refPelanggaran.length > 0) {
      let sheetRef = ss.getSheetByName(CONFIG.SHEETS.REF_PELANGGARAN);
      if (!sheetRef) {
        sheetRef = ss.insertSheet(CONFIG.SHEETS.REF_PELANGGARAN);
        sheetRef.appendRow(['ID', 'Kode', 'Komponen', 'SubKomponen', 'NamaPelanggaran', 'Poin']);
        sheetRef.setFrozenRows(1);
      }
      const lastRefRow = sheetRef.getLastRow();
      if (lastRefRow > 1) {
        sheetRef.deleteRows(2, lastRefRow - 1);
      }
      data.refPelanggaran.forEach(pel => {
        sheetRef.appendRow([
          pel.id || ('PEL-' + pel.kode),
          pel.kode,
          pel.komponen,
          pel.subKomponen,
          pel.namaPelanggaran,
          Number(pel.poin)
        ]);
      });
    }

    // 3. Simpan Pengaturan Lembaga & Kop Surat ke Tab "Pengaturan"
    if (data.pengaturan && typeof data.pengaturan === 'object') {
      savePengaturanToSheet(data.pengaturan);
    }

    return { 
      success: true, 
      message: 'Berhasil! Seluruh data (Admin, Master 90 Pelanggaran, dan Kop Surat & Pengaturan) telah tersimpan di Google Spreadsheet!' 
    };
  } catch (err) {
    return { success: false, message: 'Gagal syncAllToSheets: ' + err.toString() };
  }
}

/**
 * ====================================================================
 * MODUL GURU & MURID (READ-ONLY / UPDATE)
 * ====================================================================
 */

function syncGuruFromSpreadsheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.GURU);
  if (!sheet) return { success: false, message: 'Sheet Guru tidak ditemukan.' };
  
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][3]) continue;
    list.push({
      id: data[i][0] || ('GUR-' + i),
      nip: String(data[i][1] || ''),
      nama: data[i][3],
      jabatan: data[i][4],
      kelasWali: data[i][5],
      noHp: String(data[i][6] || ''),
      status: data[i][7] || 'Aktif'
    });
  }
  return { success: true, count: list.length, data: list };
}

function syncMuridFromSpreadsheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MURID);
  if (!sheet) return { success: false, message: 'Sheet Murid tidak ditemukan.' };
  
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][3]) continue;
    list.push({
      id: data[i][0] || ('MUR-' + i),
      nisn: String(data[i][1] || ''),
      nis: String(data[i][2] || ''),
      nama: data[i][3],
      kelas: data[i][4],
      jenisKelamin: data[i][5],
      waliKelas: data[i][6],
      guruWali: data[i][7] || data[i][6]
    });
  }
  return { success: true, count: list.length, data: list };
}

function saveMurid(muridObj) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MURID);
  const data = sheet.getDataRange().getValues();
  
  if (muridObj.id) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === muridObj.id) {
        sheet.getRange(i + 1, 2).setValue(String(muridObj.nisn));
        sheet.getRange(i + 1, 3).setValue(String(muridObj.nis));
        sheet.getRange(i + 1, 4).setValue(muridObj.nama);
        sheet.getRange(i + 1, 5).setValue(muridObj.kelas);
        sheet.getRange(i + 1, 6).setValue(muridObj.jenisKelamin);
        sheet.getRange(i + 1, 7).setValue(muridObj.waliKelas);
        sheet.getRange(i + 1, 8).setValue(muridObj.guruWali || muridObj.waliKelas);
        return { success: true, message: 'Data murid ' + muridObj.nama + ' berhasil diperbarui.' };
      }
    }
  }
  
  const newId = muridObj.id || ('MUR-' + Date.now());
  sheet.appendRow([
    newId, 
    String(muridObj.nisn), 
    String(muridObj.nis), 
    muridObj.nama, 
    muridObj.kelas, 
    muridObj.jenisKelamin, 
    muridObj.waliKelas, 
    muridObj.guruWali || muridObj.waliKelas
  ]);
  return { success: true, message: 'Murid baru berhasil ditambahkan.', id: newId };
}

function getPublicLeaderboard() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheetMurid = ss.getSheetByName(CONFIG.SHEETS.MURID);
  const sheetLog = ss.getSheetByName(CONFIG.SHEETS.LOG_PELANGGARAN);
  
  const muridRows = sheetMurid ? sheetMurid.getDataRange().getValues() : [];
  const logRows = sheetLog ? sheetLog.getDataRange().getValues() : [];
  
  const poinMap = {};
  for (let j = 1; j < logRows.length; j++) {
    const nisn = String(logRows[j][4]);
    const poin = Number(logRows[j][7]) || 0;
    poinMap[nisn] = (poinMap[nisn] || 0) + poin;
  }
  
  const result = [];
  for (let i = 1; i < muridRows.length; i++) {
    const m = muridRows[i];
    const nisn = String(m[1]);
    const total = poinMap[nisn] || 0;
    
    let sanksi = 'Berdisiplin Baik';
    if (total >= 100) sanksi = 'Dikembalikan ke orang tua / dikeluarkan dari sekolah';
    else if (total >= 81) sanksi = 'Panggilan orang tua dan mendapat skors 6 hari';
    else if (total >= 61) sanksi = 'Panggilan orang tua dan mendapat skors 3 hari';
    else if (total >= 41) sanksi = 'Panggilan orang tua';
    else if (total >= 21) sanksi = 'Teguran secara tertulis dan pembinaan';
    else if (total >= 1) sanksi = 'Teguran secara lisan dan pembinaan';
    
    result.push({
      id: m[0],
      nisn: nisn,
      nis: m[2],
      nama: m[3],
      kelas: m[4],
      jenisKelamin: m[5],
      waliKelas: m[6],
      guruWali: m[7] || m[6],
      totalPoin: total,
      sanksiResmi: sanksi
    });
  }
  
  result.sort((a, b) => b.totalPoin - a.totalPoin);
  return result;
}

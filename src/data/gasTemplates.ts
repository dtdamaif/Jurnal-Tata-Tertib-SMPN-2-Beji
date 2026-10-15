export const GAS_CODE_GS = `/**
 * ====================================================================
 * JURNAL TATA TERTIB SMPN 2 BEJI - GOOGLE APPS SCRIPT BACKEND
 * ====================================================================
 * Mengacu pada Aturan Resmi Bab V & Bab VI Tata Tertib SMPN 2 Beji
 * - Spreadsheet ID: 1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10
 * - Drive Folder ID: 18tDeAMgEFfYR5vkYJT-yiZiAJ7g4XOdH
 * - Password Default Admin: @smpn2beji
 * - Password Default Guru: Smpn2Beji
 * ====================================================================
 */

const CONFIG = {
  SPREADSHEET_ID: '1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10',
  DRIVE_FOLDER_ID: '18tDeAMgEFfYR5vkYJT-yiZiAJ7g4XOdH',
  ADMIN_DEFAULT_PASS: '@smpn2beji',
  GURU_DEFAULT_PASS: 'Smpn2Beji',
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
 * Entry point Web App (Mendukung Tampilan HTML & Endpoint REST API JSON)
 */
function doGet(e) {
  initDatabase();

  // Jika dipanggil via REST API (contoh: ?action=getMurid atau ?action=getGuru)
  if (e && e.parameter && e.parameter.action) {
    const action = e.parameter.action;
    let result = {};
    if (action === 'getMurid') result = syncMuridFromSpreadsheet();
    else if (action === 'getGuru') result = syncGuruFromSpreadsheet();
    else if (action === 'getLeaderboard') result = { success: true, data: getPublicLeaderboard() };
    else if (action === 'getRef') result = { success: true, data: getRefPelanggaran() };
    else if (action === 'getPengaturan') result = getPengaturanFromSheet();
    else result = { success: false, message: 'Action API tidak dikenal' };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Jurnal Tata Tertib SMPN 2 Beji')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handle POST request dari Web App / React (Submit Pelanggaran, Foto Drive, Update Data, Pengaturan & Kop)
 */
function doPost(e) {
  try {
    let postData;
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else {
      postData = e.parameter;
    }

    const action = postData.action;
    let result = {};

    if (action === 'submitPelanggaran') {
      result = submitPelanggaran(postData.payload, postData.fileObj);
    } else if (action === 'saveMurid') {
      result = saveMurid(postData.payload);
    } else if (action === 'saveAdmin') {
      result = saveAdmin(postData.payload);
    } else if (action === 'deleteAdmin') {
      result = deleteAdmin(postData.payload ? postData.payload.id : postData.id);
    } else if (action === 'saveRefPelanggaran') {
      result = saveRefPelanggaran(postData.payload);
    } else if (action === 'deleteRefPelanggaran') {
      result = deleteRefPelanggaran(postData.payload ? postData.payload.id : postData.id);
    } else if (action === 'savePengaturan') {
      result = savePengaturanToSheet(postData.payload);
    } else if (action === 'getPengaturan') {
      result = getPengaturanFromSheet();
    } else if (action === 'syncAllToSheets') {
      result = syncAllToSheets(postData.payload);
    } else {
      result = { success: false, message: 'Action POST tidak dikenal: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Error server GAS: ' + err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Inisialisasi otomatis jika sheet belum ada
 * Termasuk 90 Jenis Pelanggaran Resmi Bab V (Pasal 7, 8, 9)
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
    sheetGuru.appendRow(['GUR-001', '197805122005011003', CONFIG.GURU_DEFAULT_PASS, 'Ahmad Fauzi, S.Pd.', 'Wali Kelas 7A & Guru Penjas', '7A', '081234567890', 'Aktif']);
    sheetGuru.setFrozenRows(1);
  }

  // 3. Sheet Murid
  let sheetMurid = ss.getSheetByName(CONFIG.SHEETS.MURID);
  if (!sheetMurid) {
    sheetMurid = ss.insertSheet(CONFIG.SHEETS.MURID);
    sheetMurid.appendRow(['ID', 'NISN', 'NIS', 'Nama', 'Kelas', 'JenisKelamin', 'WaliKelas', 'GuruWali']);
    sheetMurid.appendRow(['MUR-001', '0091234561', '24701', 'Aditya Pratama Putra', '7A', 'L', 'Ahmad Fauzi, S.Pd.', 'Ahmad Fauzi, S.Pd.']);
    sheetMurid.setFrozenRows(1);
  }

  // 4. Sheet Ref_Pelanggaran (Lengkap 90 Klasifikasi Bab V)
  let sheetRef = ss.getSheetByName(CONFIG.SHEETS.REF_PELANGGARAN);
  if (!sheetRef) {
    sheetRef = ss.insertSheet(CONFIG.SHEETS.REF_PELANGGARAN);
    sheetRef.appendRow(['ID', 'Kode', 'Komponen', 'SubKomponen', 'NamaPelanggaran', 'Poin']);
    
    const refs = [
      // KEPRIBADIAN (A 1 - A 45)
      ['A-01', 'A 1', 'Kepribadian', 'Ketertiban', 'Makan dan minum saat berlangsung kegiatan pembelajaran', 2],
      ['A-02', 'A 2', 'Kepribadian', 'Ketertiban', 'Membuang sampah tidak pada tempatnya', 2],
      ['A-03', 'A 3', 'Kepribadian', 'Ketertiban', 'Membuat keributan atau kegaduhan dalam kelas pada saat berlangsung kegiatan pembelajaran', 2],
      ['A-04', 'A 4', 'Kepribadian', 'Ketertiban', 'Mengotori / mencorat – coret benda milik sekolah', 5],
      ['A-05', 'A 5', 'Kepribadian', 'Ketertiban', 'Membawa benda / alat yang tidak ada kaitannya dengan kegiatan pembelajaran', 5],
      ['A-06', 'A 6', 'Kepribadian', 'Ketertiban', 'Membuat keributan atau kegaduhan dalam lingkungan sekolah', 5],
      ['A-07', 'A 7', 'Kepribadian', 'Ketertiban', 'Merusak / menghilangkan barang milik sekolah, Kepala sekolah, Guru, Karyawan, dan sesama murid', 10],
      ['A-08', 'A 8', 'Kepribadian', 'Ketertiban', 'Bertengkar / pertentangan dilingkungan sekolah', 15],
      ['A-09', 'A 9', 'Kepribadian', 'Ketertiban', 'Masuk lingkungan sekolah dengan meloncat pagar', 15],
      ['A-10', 'A 10', 'Kepribadian', 'Ketertiban', 'Keluar lingkungan sekolah dengan meloncat pagar', 15],
      ['A-11', 'A 11', 'Kepribadian', 'Ketertiban', 'Pacaran dilingkungan sekolah', 15],
      ['A-12', 'A 12', 'Kepribadian', 'Ketertiban', 'Membawa hand phone kedalam lingkungan sekolah', 5],
      ['A-13', 'A 13', 'Kepribadian', 'Ketertiban', 'Memakai hand phone dalam lingkungan sekolah', 10],
      ['A-14', 'A 14', 'Kepribadian', 'Ketertiban', 'Memakai hand phone pada saat kegiatan pembelajaran', 15],
      ['A-15', 'A 15', 'Kepribadian', 'Ketertiban', 'Mencontoh pekerjaan teman pada saat dilaksanakan ulangan', 5],
      ['A-16', 'A 16', 'Kepribadian', 'Ketertiban', 'Ngrepek pada saat dilaksanakan ulangan', 10],
      ['A-17', 'A 17', 'Kepribadian', 'Ketertiban', 'Mengambil / mencuri barang milik sekolah, Kepala Sekolah, Guru, karyawan sekolah dan murid', 50],
      ['A-18', 'A 18', 'Kepribadian', 'Ketertiban', 'Bersepeda motor sendiri ke sekolah', 10],
      ['A-19', 'A 19', 'Kepribadian', 'Rokok', 'Membawa rokok', 25],
      ['A-20', 'A 20', 'Kepribadian', 'Rokok', 'Merokok / menghisap rokok di lingkungan sekolah', 50],
      ['A-21', 'A 21', 'Kepribadian', 'Buku & Media Terlarang', 'Membawa buku, majalah, dan kaset terlarang', 25],
      ['A-22', 'A 22', 'Kepribadian', 'Buku & Media Terlarang', 'Memperjualbelikan buku, majalah, dan kaset terlarang', 50],
      ['A-23', 'A 23', 'Kepribadian', 'Senjata', 'Membawa senjata tanpa ijin dilingkungan sekolah', 25],
      ['A-24', 'A 24', 'Kepribadian', 'Senjata', 'Menggunakan senjata untuk mengancam', 50],
      ['A-25', 'A 25', 'Kepribadian', 'Senjata', 'Menggunakan senjata untuk melukai', 100],
      ['A-26', 'A 26', 'Kepribadian', 'Senjata', 'Memperjualbelikan senjata di sekolah', 75],
      ['A-27', 'A 27', 'Kepribadian', 'Obat & Minuman Terlarang', 'Membawa obat dan / atau minuman terlarang dilingkungan sekolah', 75],
      ['A-28', 'A 28', 'Kepribadian', 'Obat & Minuman Terlarang', 'Mengkonsumsi obat dan/atau minuman terlarang didalam/diluar lingkungan sekolah', 100],
      ['A-29', 'A 29', 'Kepribadian', 'Obat & Minuman Terlarang', 'Memperjualbelikan obat dan/atau minuman terlarang didalam/diluar lingkungan sekolah', 100],
      ['A-30', 'A 30', 'Kepribadian', 'Perkelahian', 'Perkelahian antar murid dalam satu sekolah disebabkan dirinya', 50],
      ['A-31', 'A 31', 'Kepribadian', 'Perkelahian', 'Perkelahian antar murid dalam satu sekolah disebabkan orang lain', 25],
      ['A-32', 'A 32', 'Kepribadian', 'Perkelahian', 'Perkelahian disebabkan dirinya dengan murid dari sekolah lain', 75],
      ['A-33', 'A 33', 'Kepribadian', 'Perkelahian', 'Perkelahian disebabkan murid dari sekolah dengan murid dari sekolah lain', 75],
      ['A-34', 'A 34', 'Kepribadian', 'Terhadap Guru & Staf', 'Berkata tidak sopan / mengumpat Kepala Sekolah, Guru, dan Karyawan', 50],
      ['A-35', 'A 35', 'Kepribadian', 'Terhadap Guru & Staf', 'Menghina / melecehkan Kepala Sekolah, Guru, dan Karyawan', 50],
      ['A-36', 'A 36', 'Kepribadian', 'Terhadap Guru & Staf', 'Mengancam Kepala Sekolah, Guru, dan Karyawan', 75],
      ['A-37', 'A 37', 'Kepribadian', 'Terhadap Guru & Staf', 'Memukul Kepala Sekolah, Guru, dan Karyawan', 100],
      ['A-38', 'A 38', 'Kepribadian', 'Pemerasan', 'Melakukan tindakan pemerasan terhadap teman', 75],
      ['A-39', 'A 39', 'Kepribadian', 'Pelecehan Seksual', 'Melakukan pelecehan seksual terhadap teman', 75],
      ['A-40', 'A 40', 'Kepribadian', 'Kriminalitas', 'Terlibat tindakan criminal yang diancam pidana penjara', 75],
      ['A-41', 'A 41', 'Kepribadian', 'Pemalsuan', 'Memalsukan tanda tangan orang tua / wali', 50],
      ['A-42', 'A 42', 'Kepribadian', 'Pemalsuan', 'Memalsukan tanda tangan Kepala Sekolah, Guru, dan Karyawan', 50],
      ['A-43', 'A 43', 'Kepribadian', 'Geng / Anak Nakal', 'Menjadi partisipan gank / kelompok anak – anak nakal didalam/diluar sekolah', 50],
      ['A-44', 'A 44', 'Kepribadian', 'Geng / Anak Nakal', 'Menjadi anggota gank / kelompok anak – anak nakal didalam/diluar sekolah', 75],
      ['A-45', 'A 45', 'Kepribadian', 'Geng / Anak Nakal', 'Menjadi ketua gank / kelompok anak – anak nakal didalam/diluar sekolah', 100],

      // KERAJINAN (B 1 - B 19)
      ['B-01', 'B 1', 'Kerajinan', 'Keterlambatan', 'Terlambat masuk sekolah dibawah 15 menit', 2],
      ['B-02', 'B 2', 'Kerajinan', 'Keterlambatan', 'Terlambat masuk sekolah diatas 16 menit', 5],
      ['B-03', 'B 3', 'Kerajinan', 'Keterlambatan', 'Terlambat masuk karena ijin', 2],
      ['B-04', 'B 4', 'Kerajinan', 'Keterlambatan', 'Terlambat masuk karena diberi tugas oleh guru', 1],
      ['B-05', 'B 5', 'Kerajinan', 'Keterlambatan', 'Terlambat masuk karena alasan yang dibuat - buat', 5],
      ['B-06', 'B 6', 'Kerajinan', 'Keterlambatan', 'Ijin keluar pada saat kegiatan pembelajaran dan tidak kembali', 10],
      ['B-07', 'B 7', 'Kerajinan', 'Keterlambatan', 'Ijin keluar dari lingkungan sekolah dan tidak kembali', 15],
      ['B-08', 'B 8', 'Kerajinan', 'Keterlambatan', 'Pulang tanpa ijin', 15],
      ['B-09', 'B 9', 'Kerajinan', 'Kehadiran', 'Tidak masuk karena sakit tanpa keterangan', 1],
      ['B-10', 'B 10', 'Kerajinan', 'Kehadiran', 'Tidak masuk karena ijin tanpa keterangan', 2],
      ['B-11', 'B 11', 'Kerajinan', 'Kehadiran', 'Tidak masuk tanpa keterangan / alpha', 5],
      ['B-12', 'B 12', 'Kerajinan', 'Kehadiran', 'Keluar kelas tanpa ijin pada saat pembelajaran berlangsung', 5],
      ['B-13', 'B 13', 'Kerajinan', 'Kehadiran', 'Tidak mengikuti kegiatan pembelajaran tetapi masih berada dalam lingkungan sekolah', 5],
      ['B-14', 'B 14', 'Kerajinan', 'Kehadiran', 'Tidak mengikuti kegiatan pembelajaran dan berada diluar sekolah / membolos', 10],
      ['B-15', 'B 15', 'Kerajinan', 'Kehadiran', 'Tidak masuk dengan membuat surat keterangan palsu', 10],
      ['B-16', 'B 16', 'Kerajinan', 'Upacara Bendera', 'Terlambat mengikuti upacara bendera', 2],
      ['B-17', 'B 17', 'Kerajinan', 'Upacara Bendera', 'Tidak mengikuti upacara bendera', 10],
      ['B-18', 'B 18', 'Kerajinan', 'Kegiatan Sekolah', 'Terlambat mengikuti kegiatan sekolah', 2],
      ['B-19', 'B 19', 'Kerajinan', 'Kegiatan Sekolah', 'Tidak mengikuti kegiatan sekolah', 10],

      // KERAPIAN (C 1 - C 26)
      ['C-01', 'C 1', 'Kerapian', 'Pakaian', 'Memakai seragam tidak rapi', 5],
      ['C-02', 'C 2', 'Kerapian', 'Pakaian', 'Salah memakai seragam', 5],
      ['C-03', 'C 3', 'Kerapian', 'Pakaian', 'Memakai jaket dilingkungan sekolah tanpa ijin', 5],
      ['C-04', 'C 4', 'Kerapian', 'Pakaian', 'Memakai pakaian ketat', 5],
      ['C-05', 'C 5', 'Kerapian', 'Pakaian', 'Murid perempuan memakai rok diatas lutut', 5],
      ['C-06', 'C 6', 'Kerapian', 'Pakaian', 'Tidak memakai perlengkapan upacara bendera (topi)', 5],
      ['C-07', 'C 7', 'Kerapian', 'Pakaian', 'Salah dan/atau tidak memakai ikat pinggang', 5],
      ['C-08', 'C 8', 'Kerapian', 'Pakaian', 'Tidak memakai sepatu berwarna hitam', 5],
      ['C-09', 'C 9', 'Kerapian', 'Pakaian', 'Salah dan /atau tidak memakai sepatu', 5],
      ['C-10', 'C 10', 'Kerapian', 'Pakaian', 'Salah dan/atau tidak memakai kaos kaki', 5],
      ['C-11', 'C 11', 'Kerapian', 'Pakaian', 'Tidak memakai kaos dalam dan / atau pakaian dalam', 5],
      ['C-12', 'C 12', 'Kerapian', 'Pakaian', 'Memakai topi yang bukan topi sekolah dilingkungan sekolah', 5],
      ['C-13', 'C 13', 'Kerapian', 'Pakaian', 'Murid perempuan memakai perhiasan berlebihan', 5],
      ['C-14', 'C 14', 'Kerapian', 'Pakaian', 'Murid laki – laki memakai perhiasan (kalung, gelang dll)', 5],
      ['C-15', 'C 15', 'Kerapian', 'Rambut', 'Bercukur tidak rapi', 5],
      ['C-16', 'C 16', 'Kerapian', 'Rambut', 'Murid laki – laki berambut gondrong', 5],
      ['C-17', 'C 17', 'Kerapian', 'Rambut', 'Gundul baik murid laki – laki maupun perempuan', 5],
      ['C-18', 'C 18', 'Kerapian', 'Rambut', 'Rambut dicat / disemir', 10],
      ['C-19', 'C 19', 'Kerapian', 'Kuku', 'Merawat kuku sampai panjang', 5],
      ['C-20', 'C 20', 'Kerapian', 'Kuku', 'Kuku tidak bersih dan tidak rapi', 2],
      ['C-21', 'C 21', 'Kerapian', 'Kuku', 'Mengecat kuku', 10],
      ['C-22', 'C 22', 'Kerapian', 'Kuku', 'Melukis kuku', 10],
      ['C-23', 'C 23', 'Kerapian', 'Kuku', 'Memakai kuku palsu', 10],
      ['C-24', 'C 24', 'Kerapian', 'Tindik', 'Murid laki – laki bertindik', 10],
      ['C-25', 'C 25', 'Kerapian', 'Tato', 'Bertato / menggambari tubuh bersifat sementara', 5],
      ['C-26', 'C 26', 'Kerapian', 'Tato', 'Bertato menggambari anggota tubuh yang bersifat permanen', 25]
    ];
    
    refs.forEach(r => sheetRef.appendRow(r));
    sheetRef.setFrozenRows(1);
  }

  // 5. Sheet Log_Pelanggaran
  let sheetLog = ss.getSheetByName(CONFIG.SHEETS.LOG_PELANGGARAN);
  if (!sheetLog) {
    sheetLog = ss.insertSheet(CONFIG.SHEETS.LOG_PELANGGARAN);
    sheetLog.appendRow(['ID', 'Tanggal', 'Hari', 'Kelas', 'NISN', 'NamaMurid', 'PelanggaranJSON', 'TotalPoin', 'FotoBuktiUrl', 'Catatan', 'GuruNIP', 'GuruNama', 'Timestamp']);
    sheetLog.setFrozenRows(1);
  }

  // 6. Sheet Pengaturan
  let sheetSet = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
  if (!sheetSet) {
    sheetSet = ss.insertSheet(CONFIG.SHEETS.PENGATURAN);
    sheetSet.appendRow(['Key', 'Value']);
    const defaults = [
      ['namaSekolah', 'SMP NEGERI 2 BEJI'],
      ['npsn', '20519123'],
      ['alamat', 'Jl. Raya Cangkringmalang No. 45, Beji'],
      ['desaKecamatan', 'Kecamatan Beji'],
      ['kabupatenKota', 'Kabupaten Pasuruan'],
      ['provinsi', 'Jawa Timur'],
      ['kodePos', '67154'],
      ['telepon', '(0343) 656789'],
      ['email', 'smpn2beji_pas@yahoo.co.id'],
      ['website', 'https://smpn2beji.sch.id'],
      ['logoUrl', 'https://smpn2beji.sch.id/logo.png'],
      ['tahunAjaran', '2024/2025'],
      ['semester', 'Ganjil'],
      ['tempatPengesahan', 'Beji, Pasuruan'],
      ['tanggalPengesahan', '14 Oktober 2024'],
      ['namaKepsek', 'Dra. Hj. Nur Endah Sulistyo, M.Pd.'],
      ['nipKepsek', '196704151992032006'],
      ['namaPelapor', 'Bagus Pratama, S.Pd.'],
      ['nipPelapor', '199201012019031005'],
      ['jabatanPelapor', 'Koordinator Ketertiban & BK']
    ];
    defaults.forEach(d => sheetSet.appendRow(d));
    sheetSet.setFrozenRows(1);
  }
}

/**
 * Autentikasi Admin (Default: @smpn2beji)
 */
function loginAdmin(username, password) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[1]).trim() === username.trim() && String(row[2]).trim() === password.trim()) {
      if (row[6] !== 'Aktif') return { success: false, message: 'Akun Admin Nonaktif.' };
      return { success: true, user: { id: row[0], username: row[1], nama: row[3], role: row[4], email: row[5] } };
    }
  }
  return { success: false, message: 'Username atau kata sandi admin salah!' };
}

/**
 * Autentikasi Guru (Username: NIP, Password default: Smpn2Beji)
 */
function loginGuru(nip, password) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.GURU);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[1]).trim() === String(nip).trim() && String(row[2]).trim() === String(password).trim()) {
      if (row[7] !== 'Aktif') return { success: false, message: 'Akun Guru Nonaktif.' };
      return { success: true, user: { id: row[0], nip: row[1], nama: row[3], jabatan: row[4], kelasWali: row[5] } };
    }
  }
  return { success: false, message: 'NIP atau kata sandi guru tidak cocok!' };
}

/**
 * Leaderboard Publik & Bentuk Sanksi Resmi
 */
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
    
    // Tentukan sanksi resmi
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
      totalPoin: total,
      sanksiResmi: sanksi
    });
  }
  
  result.sort((a, b) => b.totalPoin - a.totalPoin);
  return result;
}

/**
 * Dropdown Dinamis: Ambil Murid Berdasarkan Kelas
 */
function getMuridByKelas(kelas) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MURID);
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][4]).toUpperCase() === String(kelas).toUpperCase()) {
      list.push({ 
        id: data[i][0], 
        nisn: data[i][1], 
        nis: data[i][2], 
        nama: data[i][3], 
        kelas: data[i][4], 
        jenisKelamin: data[i][5],
        waliKelas: data[i][6],
        guruWali: data[i][7] || data[i][6]
      });
    }
  }
  return list;
}

/**
 * Ambil 90 Master Referensi Pelanggaran
 */
function getRefPelanggaran() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.REF_PELANGGARAN);
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
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
 * Upload Foto ke Google Drive Folder & Simpan Data Pelanggaran
 */
function submitPelanggaran(payload, fileObj) {
  try {
    let fotoUrl = '';
    
    if (fileObj && fileObj.base64) {
      const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
      const decodedBytes = Utilities.base64Decode(fileObj.base64);
      const blob = Utilities.newBlob(decodedBytes, fileObj.mimeType || 'image/jpeg', fileObj.filename || ('bukti_' + Date.now() + '.jpg'));
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fotoUrl = file.getUrl();
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.LOG_PELANGGARAN);
    const newId = 'LOG-' + Date.now();
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    
    sheet.appendRow([
      newId,
      payload.tanggal,
      payload.hari,
      payload.kelas,
      payload.nisn,
      payload.namaMurid,
      JSON.stringify(payload.pelanggaranList),
      Number(payload.totalPoin),
      fotoUrl,
      payload.catatan || '',
      payload.guruNip,
      payload.guruNama,
      timestamp
    ]);
    
    return { success: true, message: 'Pelanggaran berhasil dicatat dan foto tersimpan ke Google Drive!', id: newId, fotoUrl: fotoUrl };
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan: ' + error.toString() };
  }
}

/**
 * CRUD Master Jenis Pelanggaran (Ref_Pelanggaran)
 */
function saveRefPelanggaran(pelObj) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.REF_PELANGGARAN);
  const data = sheet.getDataRange().getValues();
  
  if (pelObj.id) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === pelObj.id) {
        sheet.getRange(i + 1, 2).setValue(pelObj.kode);
        sheet.getRange(i + 1, 3).setValue(pelObj.komponen);
        sheet.getRange(i + 1, 4).setValue(pelObj.subKomponen);
        sheet.getRange(i + 1, 5).setValue(pelObj.namaPelanggaran);
        sheet.getRange(i + 1, 6).setValue(Number(pelObj.poin));
        return { success: true, message: 'Jenis pelanggaran [' + pelObj.kode + '] berhasil diperbarui.' };
      }
    }
  }
  
  const newId = 'PEL-' + Date.now();
  sheet.appendRow([newId, pelObj.kode, pelObj.komponen, pelObj.subKomponen, pelObj.namaPelanggaran, Number(pelObj.poin)]);
  return { success: true, message: 'Jenis pelanggaran baru berhasil ditambahkan.', id: newId };
}

function deleteRefPelanggaran(pelId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.REF_PELANGGARAN);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === pelId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Jenis pelanggaran berhasil dihapus.' };
    }
  }
  return { success: false, message: 'Data tidak ditemukan.' };
}

/**
 * Sinkronisasi Data Guru dari Sheet "Guru"
 */
function syncGuruFromSpreadsheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.GURU);
  if (!sheet) return { success: false, message: 'Sheet Guru tidak ditemukan.' };
  
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    list.push({
      id: data[i][0],
      nip: String(data[i][1]),
      nama: data[i][3],
      jabatan: data[i][4],
      kelasWali: data[i][5],
      noHp: String(data[i][6] || ''),
      status: data[i][7]
    });
  }
  return { success: true, count: list.length, data: list };
}

/**
 * Sinkronisasi & Ambil Seluruh Data Murid (Lengkap dengan Kelompok Guru Wali)
 */
function syncMuridFromSpreadsheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MURID);
  if (!sheet) return { success: false, message: 'Sheet Murid tidak ditemukan.' };
  
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    list.push({
      id: data[i][0],
      nisn: String(data[i][1]),
      nis: String(data[i][2]),
      nama: data[i][3],
      kelas: data[i][4],
      jenisKelamin: data[i][5],
      waliKelas: data[i][6],
      guruWali: data[i][7] || data[i][6]
    });
  }
  return { success: true, count: list.length, data: list };
}

/**
 * Simpan atau Perbarui Data Murid (Fitur C)
 */
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
  
  const newId = 'MUR-' + Date.now();
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

/**
 * Simpan Pengaturan Lembaga & Kop Surat ke Tab "Pengaturan" di Google Sheets
 */
function savePengaturanToSheet(settings) {
  try {
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
      const val = typeof settings[k] === 'object' ? JSON.stringify(settings[k]) : String(settings[k] || '');
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
 * Simpan atau Perbarui Data Admin di Tab "Admin" Google Sheets
 */
function saveAdmin(adminObj) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEETS.ADMIN);
      sheet.appendRow(['ID', 'Username', 'Password', 'Nama', 'Role', 'Email', 'status']);
      sheet.setFrozenRows(1);
    }
    const data = sheet.getDataRange().getValues();
    
    if (adminObj.id) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === adminObj.id) {
          sheet.getRange(i + 1, 2).setValue(adminObj.username);
          sheet.getRange(i + 1, 3).setValue(adminObj.password || CONFIG.ADMIN_DEFAULT_PASS);
          sheet.getRange(i + 1, 4).setValue(adminObj.nama);
          sheet.getRange(i + 1, 5).setValue(adminObj.role);
          sheet.getRange(i + 1, 6).setValue(adminObj.email || '');
          sheet.getRange(i + 1, 7).setValue(adminObj.status || 'Aktif');
          return { success: true, message: 'Data admin [' + adminObj.nama + '] berhasil disimpan ke spreadsheet.' };
        }
      }
    }
    
    const newId = 'ADM-' + Date.now();
    sheet.appendRow([
      newId,
      adminObj.username,
      adminObj.password || CONFIG.ADMIN_DEFAULT_PASS,
      adminObj.nama,
      adminObj.role || 'Admin',
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
 * Tulis & Sinkronkan Seluruh Data (Admin, 90 Jenis Pelanggaran, Pengaturan) ke Google Spreadsheet
 */
function syncAllToSheets(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // 1. Simpan Seluruh Admin ke Tab "Admin"
    if (data.admins && Array.isArray(data.admins)) {
      let sheetAdmin = ss.getSheetByName(CONFIG.SHEETS.ADMIN);
      if (!sheetAdmin) {
        sheetAdmin = ss.insertSheet(CONFIG.SHEETS.ADMIN);
        sheetAdmin.appendRow(['ID', 'Username', 'Password', 'Nama', 'Role', 'Email', 'status']);
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
          adm.role || 'Admin',
          adm.email || '',
          adm.status || 'Aktif'
        ]);
      });
    }

    // 2. Simpan Seluruh Master Pelanggaran ke Tab "Ref_Pelanggaran"
    if (data.refPelanggaran && Array.isArray(data.refPelanggaran)) {
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

    // 3. Simpan Pengaturan Lembaga ke Tab "Pengaturan"
    if (data.pengaturan && typeof data.pengaturan === 'object') {
      savePengaturanToSheet(data.pengaturan);
    }

    return { 
      success: true, 
      message: 'Berhasil menyinkronkan seluruh data (Admin, Master Pelanggaran, dan Pengaturan) ke Google Spreadsheet!' 
    };
  } catch (err) {
    return { success: false, message: 'Gagal syncAllToSheets: ' + err.toString() };
  }
}

`;

export const GAS_INDEX_HTML = `<!-- Frontend Index.html siap deploy ke Google Apps Script Web App -->
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jurnal Tata Tertib SMPN 2 Beji</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-100 text-slate-800">
  <header class="bg-blue-950 text-white p-4 shadow-lg sticky top-0 z-40">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <h1 class="font-extrabold text-lg">Jurnal Tata Tertib SMPN 2 Beji</h1>
      <span class="text-xs bg-blue-800 px-3 py-1 rounded-full text-blue-200">Bab V & VI Resmi</span>
    </div>
  </header>
  <main class="max-w-7xl mx-auto p-4 sm:p-6">
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 class="text-xl font-bold mb-2">90 Klasifikasi Pelanggaran & Poin Resmi</h2>
      <p class="text-xs text-slate-500">Sistem terhubung otomatis ke Spreadsheet ID: 1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10</p>
    </div>
  </main>
</body>
</html>
`;

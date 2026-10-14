import { AdminUser, Guru, Murid, JenisPelanggaran, LogPelanggaran, PengaturanLembaga } from '../types';

export const DAFTAR_KELAS = [
  '7A', '7B', '7C', '7D', '7E', '7F', '7G', '7H',
  '8A', '8B', '8C', '8D', '8E', '8F', '8G', '8H',
  '9A', '9B', '9C', '9D', '9E', '9F', '9G', '9H'
];

export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'ADM-001',
    username: 'admin',
    nama: 'Drs. H. Bambang Suprayitno, M.Pd.',
    role: 'Super Admin',
    email: 'admin.tatib@smpn2beji.sch.id',
    status: 'Aktif'
  },
  {
    id: 'ADM-002',
    username: 'admin_bk',
    nama: 'Sri Wahyuni, S.Pd., Kons.',
    role: 'Admin BK',
    email: 'bk@smpn2beji.sch.id',
    status: 'Aktif'
  }
];

export const INITIAL_GURU: Guru[] = [
  {
    id: 'GUR-001',
    nip: '197805122005011003',
    nama: 'Ahmad Fauzi, S.Pd.',
    jabatan: 'Wali Kelas 7A & Guru Penjas',
    kelasWali: '7A',
    noHp: '081234567890',
    status: 'Aktif'
  },
  {
    id: 'GUR-002',
    nip: '198203152008012014',
    nama: 'Dewi Lestari, S.Pd.',
    jabatan: 'Wali Kelas 7B & Guru Bhs. Indonesia',
    kelasWali: '7B',
    noHp: '081234567891',
    status: 'Aktif'
  },
  {
    id: 'GUR-003',
    nip: '198511202010011008',
    nama: 'Hendra Setiawan, M.Pd.',
    jabatan: 'Wali Kelas 8A & Guru Matematika',
    kelasWali: '8A',
    noHp: '081234567892',
    status: 'Aktif'
  },
  {
    id: 'GUR-004',
    nip: '198904082014022003',
    nama: 'Nurul Hidayati, S.Si.',
    jabatan: 'Wali Kelas 8B & Guru IPA',
    kelasWali: '8B',
    noHp: '081234567893',
    status: 'Aktif'
  },
  {
    id: 'GUR-005',
    nip: '197509172002121004',
    nama: 'Subiantoro, S.Pd.',
    jabatan: 'Wali Kelas 9A & Guru IPS',
    kelasWali: '9A',
    noHp: '081234567894',
    status: 'Aktif'
  },
  {
    id: 'GUR-006',
    nip: '199201012019031005',
    nama: 'Bagus Pratama, S.Pd.',
    jabatan: 'Guru Bimbingan Konseling (BK)',
    kelasWali: 'Guru BK',
    noHp: '081234567895',
    status: 'Aktif'
  }
];

/**
 * DAFTAR RESMI KLASIFIKASI & POIN PELANGGARAN SMPN 2 BEJI (BAB V)
 * Total 90 Jenis Pelanggaran:
 * - Komponen 1: Kepribadian (Kode A 1 - A 45)
 * - Komponen 2: Kerajinan (Kode B 1 - B 19)
 * - Komponen 3: Kerapian (Kode C 1 - C 26)
 */
export const INITIAL_PELANGGARAN_REF: JenisPelanggaran[] = [
  // =========================================================================
  // (1) KOMPONEN KEPRIBADIAN (A 1 - A 45)
  // =========================================================================
  // A. Ketertiban
  { id: 'A-01', kode: 'A 1', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Makan dan minum saat berlangsung kegiatan pembelajaran', poin: 2 },
  { id: 'A-02', kode: 'A 2', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Membuang sampah tidak pada tempatnya', poin: 2 },
  { id: 'A-03', kode: 'A 3', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Membuat keributan atau kegaduhan dalam kelas pada saat berlangsung kegiatan pembelajaran', poin: 2 },
  { id: 'A-04', kode: 'A 4', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Mengotori / mencorat – coret benda milik sekolah', poin: 5 },
  { id: 'A-05', kode: 'A 5', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Membawa benda / alat yang tidak ada kaitannya dengan kegiatan pembelajaran', poin: 5 },
  { id: 'A-06', kode: 'A 6', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Membuat keributan atau kegaduhan dalam lingkungan sekolah', poin: 5 },
  { id: 'A-07', kode: 'A 7', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Merusak / menghilangkan barang milik sekolah, Kepala sekolah, Guru, Karyawan, dan sesama murid', poin: 10 },
  { id: 'A-08', kode: 'A 8', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Bertengkar / pertentangan dilingkungan sekolah', poin: 15 },
  { id: 'A-09', kode: 'A 9', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Masuk lingkungan sekolah dengan meloncat pagar', poin: 15 },
  { id: 'A-10', kode: 'A 10', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Keluar lingkungan sekolah dengan meloncat pagar', poin: 15 },
  { id: 'A-11', kode: 'A 11', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Pacaran dilingkungan sekolah', poin: 15 },
  { id: 'A-12', kode: 'A 12', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Membawa hand phone kedalam lingkungan sekolah', poin: 5 },
  { id: 'A-13', kode: 'A 13', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Memakai hand phone dalam lingkungan sekolah', poin: 10 },
  { id: 'A-14', kode: 'A 14', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Memakai hand phone pada saat kegiatan pembelajaran', poin: 15 },
  { id: 'A-15', kode: 'A 15', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Mencontoh pekerjaan teman pada saat dilaksanakan ulangan', poin: 5 },
  { id: 'A-16', kode: 'A 16', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Ngrepek pada saat dilaksanakan ulangan', poin: 10 },
  { id: 'A-17', kode: 'A 17', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Mengambil / mencuri barang milik sekolah, Kepala Sekolah, Guru, karyawan sekolah dan murid', poin: 50 },
  { id: 'A-18', kode: 'A 18', komponen: 'Kepribadian', subKomponen: 'Ketertiban', namaPelanggaran: 'Bersepeda motor sendiri ke sekolah', poin: 10 },

  // B. Rokok
  { id: 'A-19', kode: 'A 19', komponen: 'Kepribadian', subKomponen: 'Rokok', namaPelanggaran: 'Membawa rokok', poin: 25 },
  { id: 'A-20', kode: 'A 20', komponen: 'Kepribadian', subKomponen: 'Rokok', namaPelanggaran: 'Merokok / menghisap rokok di lingkungan sekolah', poin: 50 },

  // C. Buku, majalah, Kaset terlarang
  { id: 'A-21', kode: 'A 21', komponen: 'Kepribadian', subKomponen: 'Buku & Media Terlarang', namaPelanggaran: 'Membawa buku, majalah, dan kaset terlarang', poin: 25 },
  { id: 'A-22', kode: 'A 22', komponen: 'Kepribadian', subKomponen: 'Buku & Media Terlarang', namaPelanggaran: 'Memperjualbelikan buku, majalah, dan kaset terlarang', poin: 50 },

  // D. Senjata
  { id: 'A-23', kode: 'A 23', komponen: 'Kepribadian', subKomponen: 'Senjata', namaPelanggaran: 'Membawa senjata tanpa ijin dilingkungan sekolah', poin: 25 },
  { id: 'A-24', kode: 'A 24', komponen: 'Kepribadian', subKomponen: 'Senjata', namaPelanggaran: 'Menggunakan senjata untuk mengancam', poin: 50 },
  { id: 'A-25', kode: 'A 25', komponen: 'Kepribadian', subKomponen: 'Senjata', namaPelanggaran: 'Menggunakan senjata untuk melukai', poin: 100 },
  { id: 'A-26', kode: 'A 26', komponen: 'Kepribadian', subKomponen: 'Senjata', namaPelanggaran: 'Memperjualbelikan senjata di sekolah', poin: 75 },

  // E. Obat / Minuman terlarang
  { id: 'A-27', kode: 'A 27', komponen: 'Kepribadian', subKomponen: 'Obat / Minuman Terlarang', namaPelanggaran: 'Membawa obat dan / atau minuman terlarang dilingkungan sekolah', poin: 75 },
  { id: 'A-28', kode: 'A 28', komponen: 'Kepribadian', subKomponen: 'Obat / Minuman Terlarang', namaPelanggaran: 'Mengkonsumsi obat dan/atau minuman terlarang didalam/diluar lingkungan sekolah', poin: 100 },
  { id: 'A-29', kode: 'A 29', komponen: 'Kepribadian', subKomponen: 'Obat / Minuman Terlarang', namaPelanggaran: 'Memperjualbelikan obat dan/atau minuman terlarang didalam/diluar lingkungan sekolah', poin: 100 },

  // F. Perkelahian
  { id: 'A-30', kode: 'A 30', komponen: 'Kepribadian', subKomponen: 'Perkelahian', namaPelanggaran: 'Perkelahian antar murid dalam satu sekolah disebabkan dirinya', poin: 50 },
  { id: 'A-31', kode: 'A 31', komponen: 'Kepribadian', subKomponen: 'Perkelahian', namaPelanggaran: 'Perkelahian antar murid dalam satu sekolah disebabkan orang lain', poin: 25 },
  { id: 'A-32', kode: 'A 32', komponen: 'Kepribadian', subKomponen: 'Perkelahian', namaPelanggaran: 'Perkelahian disebabkan dirinya dengan murid dari sekolah lain', poin: 75 },
  { id: 'A-33', kode: 'A 33', komponen: 'Kepribadian', subKomponen: 'Perkelahian', namaPelanggaran: 'Perkelahian disebabkan murid dari sekolah dengan murid dari sekolah lain', poin: 75 },

  // G. Pelanggaran terhadap Kepala Sekolah, Guru, dan Karyawan
  { id: 'A-34', kode: 'A 34', komponen: 'Kepribadian', subKomponen: 'Terhadap Guru & Staf', namaPelanggaran: 'Berkata tidak sopan / mengumpat Kepala Sekolah, Guru, dan Karyawan', poin: 50 },
  { id: 'A-35', kode: 'A 35', komponen: 'Kepribadian', subKomponen: 'Terhadap Guru & Staf', namaPelanggaran: 'Menghina / melecehkan Kepala Sekolah, Guru, dan Karyawan', poin: 50 },
  { id: 'A-36', kode: 'A 36', komponen: 'Kepribadian', subKomponen: 'Terhadap Guru & Staf', namaPelanggaran: 'Mengancam Kepala Sekolah, Guru, dan Karyawan', poin: 75 },
  { id: 'A-37', kode: 'A 37', komponen: 'Kepribadian', subKomponen: 'Terhadap Guru & Staf', namaPelanggaran: 'Memukul Kepala Sekolah, Guru, dan Karyawan', poin: 100 },

  // H. Tindakan pemerasan
  { id: 'A-38', kode: 'A 38', komponen: 'Kepribadian', subKomponen: 'Pemerasan & Bullying', namaPelanggaran: 'Melakukan tindakan pemerasan terhadap teman', poin: 75 },

  // I. Pelecehan seksual
  { id: 'A-39', kode: 'A 39', komponen: 'Kepribadian', subKomponen: 'Pelecehan Seksual', namaPelanggaran: 'Melakukan pelecehan seksual terhadap teman', poin: 75 },

  // J. Tindakan kriminal
  { id: 'A-40', kode: 'A 40', komponen: 'Kepribadian', subKomponen: 'Tindakan Kriminal', namaPelanggaran: 'Terlibat tindakan criminal yang diancam pidana penjara', poin: 75 },

  // K. Pemalsuan tanda tangan
  { id: 'A-41', kode: 'A 41', komponen: 'Kepribadian', subKomponen: 'Pemalsuan', namaPelanggaran: 'Memalsukan tanda tangan orang tua / wali', poin: 50 },
  { id: 'A-42', kode: 'A 42', komponen: 'Kepribadian', subKomponen: 'Pemalsuan', namaPelanggaran: 'Memalsukan tanda tangan Kepala Sekolah, Guru, dan Karyawan', poin: 50 },

  // L. Keterlibatan dalam organisasi anak-anak nakal
  { id: 'A-43', kode: 'A 43', komponen: 'Kepribadian', subKomponen: 'Geng & Organisasi Nakal', namaPelanggaran: 'Menjadi partisipan gank / kelompok anak – anak nakal didalam lingkungan sekolah dan / atau diluar lingkungan sekolah', poin: 50 },
  { id: 'A-44', kode: 'A 44', komponen: 'Kepribadian', subKomponen: 'Geng & Organisasi Nakal', namaPelanggaran: 'Menjadi anggota gank / kelompok anak – anak nakal didalam lingkungan sekolah dan / atau diluar lingkungan sekolah', poin: 75 },
  { id: 'A-45', kode: 'A 45', komponen: 'Kepribadian', subKomponen: 'Geng & Organisasi Nakal', namaPelanggaran: 'Menjadi ketua gank / kelompok anak – anak nakal didalam lingkungan sekolah dan / atau diluar lingkungan sekolah', poin: 100 },

  // =========================================================================
  // (2) KOMPONEN KERAJINAN (B 1 - B 19)
  // =========================================================================
  // A. Keterlambatan
  { id: 'B-01', kode: 'B 1', komponen: 'Kerajinan', subKomponen: 'Keterlambatan', namaPelanggaran: 'Terlambat masuk sekolah dibawah 15 menit', poin: 2 },
  { id: 'B-02', kode: 'B 2', komponen: 'Kerajinan', subKomponen: 'Keterlambatan', namaPelanggaran: 'Terlambat masuk sekolah diatas 16 menit', poin: 5 },
  { id: 'B-03', kode: 'B 3', komponen: 'Kerajinan', subKomponen: 'Keterlambatan', namaPelanggaran: 'Terlambat masuk karena ijin', poin: 2 },
  { id: 'B-04', kode: 'B 4', komponen: 'Kerajinan', subKomponen: 'Keterlambatan', namaPelanggaran: 'Terlambat masuk karena diberi tugas oleh guru', poin: 1 },
  { id: 'B-05', kode: 'B 5', komponen: 'Kerajinan', subKomponen: 'Keterlambatan', namaPelanggaran: 'Terlambat masuk karena alasan yang dibuat - buat', poin: 5 },
  { id: 'B-06', kode: 'B 6', komponen: 'Kerajinan', subKomponen: 'Keterlambatan', namaPelanggaran: 'Ijin keluar pada saat kegiatan pembelajaran dan tidak kembali', poin: 10 },
  { id: 'B-07', kode: 'B 7', komponen: 'Kerajinan', subKomponen: 'Keterlambatan', namaPelanggaran: 'Ijin keluar dari lingkungan sekolah dan tidak kembali', poin: 15 },
  { id: 'B-08', kode: 'B 8', komponen: 'Kerajinan', subKomponen: 'Keterlambatan', namaPelanggaran: 'Pulang tanpa ijin', poin: 15 },

  // B. Kehadiran
  { id: 'B-09', kode: 'B 9', komponen: 'Kerajinan', subKomponen: 'Kehadiran', namaPelanggaran: 'Tidak masuk karena sakit tanpa keterangan', poin: 1 },
  { id: 'B-10', kode: 'B 10', komponen: 'Kerajinan', subKomponen: 'Kehadiran', namaPelanggaran: 'Tidak masuk karena ijin tanpa keterangan', poin: 2 },
  { id: 'B-11', kode: 'B 11', komponen: 'Kerajinan', subKomponen: 'Kehadiran', namaPelanggaran: 'Tidak masuk tanpa keterangan / alpha', poin: 5 },
  { id: 'B-12', kode: 'B 12', komponen: 'Kerajinan', subKomponen: 'Kehadiran', namaPelanggaran: 'Keluar kelas tanpa ijin pada saat pembelajaran berlangsung', poin: 5 },
  { id: 'B-13', kode: 'B 13', komponen: 'Kerajinan', subKomponen: 'Kehadiran', namaPelanggaran: 'Tidak mengikuti kegiatan pembelajaran tetapi masih berada dalam lingkungan sekolah', poin: 5 },
  { id: 'B-14', kode: 'B 14', komponen: 'Kerajinan', subKomponen: 'Kehadiran', namaPelanggaran: 'Tidak mengikuti kegiatan pembelajaran dan berada diluar lingkungan sekolah / membolos', poin: 10 },
  { id: 'B-15', kode: 'B 15', komponen: 'Kerajinan', subKomponen: 'Kehadiran', namaPelanggaran: 'Tidak masuk dengan membuat surat keterangan palsu', poin: 10 },

  // C. Upacara bendera
  { id: 'B-16', kode: 'B 16', komponen: 'Kerajinan', subKomponen: 'Upacara Bendera', namaPelanggaran: 'Terlambat mengikuti upacara bendera', poin: 2 },
  { id: 'B-17', kode: 'B 17', komponen: 'Kerajinan', subKomponen: 'Upacara Bendera', namaPelanggaran: 'Tidak mengikuti upacara bendera', poin: 10 },

  // D. Kegiatan Sekolah yang ditentukan
  { id: 'B-18', kode: 'B 18', komponen: 'Kerajinan', subKomponen: 'Kegiatan Sekolah', namaPelanggaran: 'Terlambat mengikuti kegiatan sekolah', poin: 2 },
  { id: 'B-19', kode: 'B 19', komponen: 'Kerajinan', subKomponen: 'Kegiatan Sekolah', namaPelanggaran: 'Tidak mengikuti kegiatan sekolah', poin: 10 },

  // =========================================================================
  // (3) KOMPONEN KERAPIAN (C 1 - C 26)
  // =========================================================================
  // A. Pakaian
  { id: 'C-01', kode: 'C 1', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Memakai seragam tidak rapi', poin: 5 },
  { id: 'C-02', kode: 'C 2', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Salah memakai seragam', poin: 5 },
  { id: 'C-03', kode: 'C 3', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Memakai jaket dilinglkungan sekolah tanpa ijin', poin: 5 },
  { id: 'C-04', kode: 'C 4', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Memakai pakaian ketat', poin: 5 },
  { id: 'C-05', kode: 'C 5', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Murid perempuan memakai rok diatas lutut', poin: 5 },
  { id: 'C-06', kode: 'C 6', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Tidak memakai perlengkapan upacara bendera (topi)', poin: 5 },
  { id: 'C-07', kode: 'C 7', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Salah dan/atau tidak memakai ikat pinggang', poin: 5 },
  { id: 'C-08', kode: 'C 8', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Tidak memakai sepatu berwarna hitam', poin: 5 },
  { id: 'C-09', kode: 'C 9', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Salah dan /atau tidak memakai sepatu', poin: 5 },
  { id: 'C-10', kode: 'C 10', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Salah dan/atau tidak memakai kaos kaki', poin: 5 },
  { id: 'C-11', kode: 'C 11', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Tidak memakai kaos dalam dan / atau pakaian dalam', poin: 5 },
  { id: 'C-12', kode: 'C 12', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Memakai topi yang bukan topi sekolah dilingkungan sekolah', poin: 5 },
  { id: 'C-13', kode: 'C 13', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Murid perempuan memakai perhiasan berlebihan', poin: 5 },
  { id: 'C-14', kode: 'C 14', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', namaPelanggaran: 'Murid laki – laki memakai perhiasan (kalung, gelang dll)', poin: 5 },

  // B. Rambut
  { id: 'C-15', kode: 'C 15', komponen: 'Kerapian', subKomponen: 'Rambut', namaPelanggaran: 'Bercukur tidak rapi', poin: 5 },
  { id: 'C-16', kode: 'C 16', komponen: 'Kerapian', subKomponen: 'Rambut', namaPelanggaran: 'Murid laki – laki berambut gondrong', poin: 5 },
  { id: 'C-17', kode: 'C 17', komponen: 'Kerapian', subKomponen: 'Rambut', namaPelanggaran: 'Gundul baik murid laki – laki maupun perempuan', poin: 5 },
  { id: 'C-18', kode: 'C 18', komponen: 'Kerapian', subKomponen: 'Rambut', namaPelanggaran: 'Rambut dicat / disemir', poin: 10 },

  // C. Kuku
  { id: 'C-19', kode: 'C 19', komponen: 'Kerapian', subKomponen: 'Kuku', namaPelanggaran: 'Merawat kuku sampai panjang', poin: 5 },
  { id: 'C-20', kode: 'C 20', komponen: 'Kerapian', subKomponen: 'Kuku', namaPelanggaran: 'Kuku tidak bersih dan tidak rapi', poin: 2 },
  { id: 'C-21', kode: 'C 21', komponen: 'Kerapian', subKomponen: 'Kuku', namaPelanggaran: 'Mengecat kuku', poin: 10 },
  { id: 'C-22', kode: 'C 22', komponen: 'Kerapian', subKomponen: 'Kuku', namaPelanggaran: 'Melukis kuku', poin: 10 },
  { id: 'C-23', kode: 'C 23', komponen: 'Kerapian', subKomponen: 'Kuku', namaPelanggaran: 'Memakai kuku palsu', poin: 10 },

  // D. Tindik
  { id: 'C-24', kode: 'C 24', komponen: 'Kerapian', subKomponen: 'Tindik & Aksesoris', namaPelanggaran: 'Murid laki – laki bertindik', poin: 10 },

  // E. Tato / menggambari anggota tubuh
  { id: 'C-25', kode: 'C 25', komponen: 'Kerapian', subKomponen: 'Tato & Tubuh', namaPelanggaran: 'Bertato / menggambari anggota tubuh dengan cat atau yang sejenisnya dan bersifat sementara', poin: 5 },
  { id: 'C-26', kode: 'C 26', komponen: 'Kerapian', subKomponen: 'Tato & Tubuh', namaPelanggaran: 'Bertato menggambari anggota tubuh yang bersifat permanen', poin: 25 }
];

export const INITIAL_MURID: Murid[] = [
  // Kelas 7A
  { id: 'MUR-001', nisn: '0091234561', nis: '24701', nama: 'Aditya Pratama Putra', kelas: '7A', jenisKelamin: 'L', waliKelas: 'Ahmad Fauzi, S.Pd.', guruWali: 'Ahmad Fauzi, S.Pd.' },
  { id: 'MUR-002', nisn: '0091234562', nis: '24702', nama: 'Anindya Putri Kirana', kelas: '7A', jenisKelamin: 'P', waliKelas: 'Ahmad Fauzi, S.Pd.', guruWali: 'Ahmad Fauzi, S.Pd.' },
  { id: 'MUR-003', nisn: '0091234563', nis: '24703', nama: 'Bayu Arya Nugraha', kelas: '7A', jenisKelamin: 'L', waliKelas: 'Ahmad Fauzi, S.Pd.', guruWali: 'Bagus Pratama, S.Pd.' },
  { id: 'MUR-004', nisn: '0091234564', nis: '24704', nama: 'Clarissa Zahra Ramadhani', kelas: '7A', jenisKelamin: 'P', waliKelas: 'Ahmad Fauzi, S.Pd.', guruWali: 'Bagus Pratama, S.Pd.' },
  { id: 'MUR-005', nisn: '0091234565', nis: '24705', nama: 'Dimas Fajar Santoso', kelas: '7A', jenisKelamin: 'L', waliKelas: 'Ahmad Fauzi, S.Pd.', guruWali: 'Ahmad Fauzi, S.Pd.' },

  // Kelas 7B
  { id: 'MUR-006', nisn: '0091234566', nis: '24706', nama: 'Fajar Eka Saputra', kelas: '7B', jenisKelamin: 'L', waliKelas: 'Dewi Lestari, S.Pd.', guruWali: 'Dewi Lestari, S.Pd.' },
  { id: 'MUR-007', nisn: '0091234567', nis: '24707', nama: 'Gita Maharani', kelas: '7B', jenisKelamin: 'P', waliKelas: 'Dewi Lestari, S.Pd.', guruWali: 'Dewi Lestari, S.Pd.' },
  { id: 'MUR-008', nisn: '0091234568', nis: '24708', nama: 'Haikal Maulana Akbar', kelas: '7B', jenisKelamin: 'L', waliKelas: 'Dewi Lestari, S.Pd.', guruWali: 'Bagus Pratama, S.Pd.' },

  // Kelas 8A
  { id: 'MUR-009', nisn: '0081234571', nis: '23801', nama: 'Ilham Rizky Ramadhan', kelas: '8A', jenisKelamin: 'L', waliKelas: 'Hendra Setiawan, M.Pd.', guruWali: 'Hendra Setiawan, M.Pd.' },
  { id: 'MUR-010', nisn: '0081234572', nis: '23802', nama: 'Jessica Amelia', kelas: '8A', jenisKelamin: 'P', waliKelas: 'Hendra Setiawan, M.Pd.', guruWali: 'Hendra Setiawan, M.Pd.' },
  { id: 'MUR-011', nisn: '0081234573', nis: '23803', nama: 'Kevin Andreansyah', kelas: '8A', jenisKelamin: 'L', waliKelas: 'Hendra Setiawan, M.Pd.', guruWali: 'Bagus Pratama, S.Pd.' },
  { id: 'MUR-012', nisn: '0081234574', nis: '23804', nama: 'Larasati Dwi Astuti', kelas: '8A', jenisKelamin: 'P', waliKelas: 'Hendra Setiawan, M.Pd.', guruWali: 'Hendra Setiawan, M.Pd.' },

  // Kelas 8B
  { id: 'MUR-013', nisn: '0081234575', nis: '23805', nama: 'Muhammad Danial Huda', kelas: '8B', jenisKelamin: 'L', waliKelas: 'Nurul Hidayati, S.Si.', guruWali: 'Nurul Hidayati, S.Si.' },
  { id: 'MUR-014', nisn: '0081234576', nis: '23806', nama: 'Nadia Safitri', kelas: '8B', jenisKelamin: 'P', waliKelas: 'Nurul Hidayati, S.Si.', guruWali: 'Nurul Hidayati, S.Si.' },
  { id: 'MUR-015', nisn: '0081234577', nis: '23807', nama: 'Oki Kurniawan', kelas: '8B', jenisKelamin: 'L', waliKelas: 'Nurul Hidayati, S.Si.', guruWali: 'Bagus Pratama, S.Pd.' },

  // Kelas 9A
  { id: 'MUR-016', nisn: '0071234581', nis: '22901', nama: 'Panji Tri Wicaksono', kelas: '9A', jenisKelamin: 'L', waliKelas: 'Subiantoro, S.Pd.', guruWali: 'Subiantoro, S.Pd.' },
  { id: 'MUR-017', nisn: '0071234582', nis: '22902', nama: 'Qori Anggraini', kelas: '9A', jenisKelamin: 'P', waliKelas: 'Subiantoro, S.Pd.', guruWali: 'Subiantoro, S.Pd.' },
  { id: 'MUR-018', nisn: '0071234583', nis: '22903', nama: 'Rendy Syahputra', kelas: '9A', jenisKelamin: 'L', waliKelas: 'Subiantoro, S.Pd.', guruWali: 'Bagus Pratama, S.Pd.' },
  { id: 'MUR-019', nisn: '0071234584', nis: '22904', nama: 'Siti Nur Aisyah', kelas: '9A', jenisKelamin: 'P', waliKelas: 'Subiantoro, S.Pd.', guruWali: 'Subiantoro, S.Pd.' },
  { id: 'MUR-020', nisn: '0071234585', nis: '22905', nama: 'Teguh Prasetyo', kelas: '9A', jenisKelamin: 'L', waliKelas: 'Subiantoro, S.Pd.', guruWali: 'Subiantoro, S.Pd.' }
];

export const INITIAL_LOGS: LogPelanggaran[] = [
  {
    id: 'LOG-2024-001',
    tanggal: '2024-10-10',
    hari: 'Kamis',
    kelas: '9A',
    nisn: '0071234583',
    namaMurid: 'Rendy Syahputra',
    pelanggaranList: [
      { id: 'A-10', kode: 'A 10', komponen: 'Kepribadian', subKomponen: 'Ketertiban', nama: 'Keluar lingkungan sekolah dengan meloncat pagar', poin: 15 },
      { id: 'A-20', kode: 'A 20', komponen: 'Kepribadian', subKomponen: 'Rokok', nama: 'Merokok / menghisap rokok di lingkungan sekolah', poin: 50 }
    ],
    totalPoin: 65,
    fotoBuktiUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    fotoFileName: 'bukti_rendy_merokok.jpg',
    catatan: 'Ditemukan bersama dua siswa di belakang kantin saat jam istirahat kedua.',
    guruNip: '199201012019031005',
    guruNama: 'Bagus Pratama, S.Pd.',
    timestamp: '2024-10-10 10:15:22'
  },
  {
    id: 'LOG-2024-002',
    tanggal: '2024-10-11',
    hari: 'Jumat',
    kelas: '8A',
    nisn: '0081234573',
    namaMurid: 'Kevin Andreansyah',
    pelanggaranList: [
      { id: 'B-02', kode: 'B 2', komponen: 'Kerajinan', subKomponen: 'Keterlambatan', nama: 'Terlambat masuk sekolah diatas 16 menit', poin: 5 },
      { id: 'C-07', kode: 'C 7', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', nama: 'Salah dan/atau tidak memakai ikat pinggang', poin: 5 },
      { id: 'C-16', kode: 'C 16', komponen: 'Kerapian', subKomponen: 'Rambut', nama: 'Murid laki – laki berambut gondrong', poin: 5 },
      { id: 'C-18', kode: 'C 18', komponen: 'Kerapian', subKomponen: 'Rambut', nama: 'Rambut dicat / disemir', poin: 10 }
    ],
    totalPoin: 25,
    fotoBuktiUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
    fotoFileName: 'bukti_kevin_rambut_seragam.jpg',
    catatan: 'Sudah diperingatkan oleh guru piket dan diminta potong rambut akhir pekan ini.',
    guruNip: '198511202010011008',
    guruNama: 'Hendra Setiawan, M.Pd.',
    timestamp: '2024-10-11 07:18:04'
  },
  {
    id: 'LOG-2024-003',
    tanggal: '2024-10-12',
    hari: 'Sabtu',
    kelas: '7A',
    nisn: '0091234565',
    namaMurid: 'Dimas Fajar Santoso',
    pelanggaranList: [
      { id: 'B-01', kode: 'B 1', komponen: 'Kerajinan', subKomponen: 'Keterlambatan', nama: 'Terlambat masuk sekolah dibawah 15 menit', poin: 2 },
      { id: 'C-01', kode: 'C 1', komponen: 'Kerapian', subKomponen: 'Pakaian & Atribut', nama: 'Memakai seragam tidak rapi', poin: 5 }
    ],
    totalPoin: 7,
    fotoBuktiUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80',
    fotoFileName: 'bukti_dimas_terlambat.jpg',
    catatan: 'Ban sepeda bocor di jalan raya Beji.',
    guruNip: '197805122005011003',
    guruNama: 'Ahmad Fauzi, S.Pd.',
    timestamp: '2024-10-12 07:12:18'
  },
  {
    id: 'LOG-2024-004',
    tanggal: '2024-10-14',
    hari: 'Senin',
    kelas: '8B',
    nisn: '0081234577',
    namaMurid: 'Oki Kurniawan',
    pelanggaranList: [
      { id: 'A-14', kode: 'A 14', komponen: 'Kepribadian', subKomponen: 'Ketertiban', nama: 'Memakai hand phone pada saat kegiatan pembelajaran', poin: 15 },
      { id: 'A-34', kode: 'A 34', komponen: 'Kepribadian', subKomponen: 'Terhadap Guru & Staf', nama: 'Berkata tidak sopan / mengumpat Kepala Sekolah, Guru, dan Karyawan', poin: 50 }
    ],
    totalPoin: 65,
    fotoBuktiUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    fotoFileName: 'bukti_oki_main_hp.jpg',
    catatan: 'HP disita sementara dan diserahkan ke wali kelas.',
    guruNip: '198904082014022003',
    guruNama: 'Nurul Hidayati, S.Si.',
    timestamp: '2024-10-14 09:30:11'
  }
];

export const INITIAL_PENGATURAN: PengaturanLembaga = {
  namaSekolah: 'SMP NEGERI 2 BEJI',
  npsn: '20519123',
  alamat: 'Jl. Raya Cangkringmalang No. 45, Beji',
  desaKecamatan: 'Kecamatan Beji',
  kabupatenKota: 'Kabupaten Pasuruan',
  provinsi: 'Jawa Timur',
  kodePos: '67154',
  telepon: '(0343) 656789',
  email: 'smpn2beji_pas@yahoo.co.id',
  website: 'https://smpn2beji.sch.id',
  logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
  
  // Periode & Pengesahan
  tahunAjaran: '2024/2025',
  semester: 'Ganjil',
  tempatPengesahan: 'Beji, Pasuruan',
  tanggalPengesahan: '14 Oktober 2024',
  namaKepsek: 'Dra. Hj. Nur Endah Sulistyo, M.Pd.',
  nipKepsek: '196704151992032006',
  namaPelapor: 'Bagus Pratama, S.Pd.',
  nipPelapor: '199201012019031005',
  jabatanPelapor: 'Koordinator Ketertiban & BK'
};

export const GAS_CONFIG = {
  spreadsheetId: '1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10',
  driveFolderId: '18tDeAMgEFfYR5vkYJT-yiZiAJ7g4XOdH',
  adminDefaultPassword: '@smpn2beji',
  guruDefaultPassword: 'Smpn2Beji'
};

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  nama: string;
  role: 'Super Admin' | 'Admin BK';
  email: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface Guru {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  kelasWali?: string; // misal "7A", "8C", atau "Guru BK"
  noHp?: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface Murid {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  kelas: string; // 7A - 7H, 8A - 8H, 9A - 9H
  jenisKelamin: 'L' | 'P';
  waliKelas: string;
  guruWali?: string; // Kelompok Guru Wali / Guru Pendamping
  totalPoin?: number;
  logs?: LogPelanggaran[];
}

export type KomponenPelanggaran = 'Kepribadian' | 'Kerajinan' | 'Kerapian';

export interface JenisPelanggaran {
  id: string;
  komponen: KomponenPelanggaran;
  subKomponen: string; // contoh: 'Ketertiban', 'Rokok', 'Senjata', 'Keterlambatan', 'Pakaian', dll.
  kode: string; // contoh: 'A 1', 'A 2', 'B 1', 'C 1'
  namaPelanggaran: string;
  poin: number;
}

export interface LogPelanggaran {
  id: string;
  tanggal: string; // YYYY-MM-DD
  hari: string; // Senin, Selasa, dst.
  kelas: string;
  nisn: string;
  namaMurid: string;
  pelanggaranList: {
    id?: string;
    kode: string;
    nama: string;
    poin: number;
    komponen?: KomponenPelanggaran;
    subKomponen?: string;
  }[];
  totalPoin: number;
  fotoBuktiUrl: string;
  fotoFileName?: string;
  catatan?: string;
  guruNip: string;
  guruNama: string;
  timestamp: string;
}

export interface PengaturanLembaga {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  desaKecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  logoUrl: string;
  
  // Data Periode & Pengesahan
  tahunAjaran: string; // contoh "2024/2025" atau "2025/2026"
  semester: 'Ganjil' | 'Genap';
  tempatPengesahan: string; // contoh "Beji, Pasuruan"
  tanggalPengesahan: string; // contoh "14 Oktober 2024"
  namaKepsek: string;
  nipKepsek: string;
  namaPelapor: string; // Koordinator Tatib / BK
  nipPelapor: string;
  jabatanPelapor: string;
}

/**
 * Aturan Sanksi & Pembinaan Resmi SMPN 2 Beji
 */
export function getSanksiByPoin(totalPoin: number) {
  if (totalPoin <= 0) {
    return {
      level: 0,
      rentang: '0',
      sanksi: 'Siswa Berdisiplin Baik (Tanpa Pelanggaran)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      bgCard: 'bg-emerald-50 text-emerald-900 border-emerald-200'
    };
  }
  if (totalPoin <= 20) {
    return {
      level: 1,
      rentang: '1 - 20',
      sanksi: 'Teguran secara lisan dan pembinaan',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      bgCard: 'bg-amber-50 text-amber-900 border-amber-200'
    };
  }
  if (totalPoin <= 40) {
    return {
      level: 2,
      rentang: '21 - 40',
      sanksi: 'Teguran secara tertulis dan pembinaan',
      badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      bgCard: 'bg-yellow-50 text-yellow-900 border-yellow-200'
    };
  }
  if (totalPoin <= 60) {
    return {
      level: 3,
      rentang: '41 - 60',
      sanksi: 'Panggilan orang tua',
      badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
      bgCard: 'bg-orange-50 text-orange-900 border-orange-200'
    };
  }
  if (totalPoin <= 80) {
    return {
      level: 4,
      rentang: '61 - 80',
      sanksi: 'Panggilan orang tua dan mendapat skors 3 hari',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
      bgCard: 'bg-rose-50 text-rose-900 border-rose-200'
    };
  }
  if (totalPoin <= 99) {
    return {
      level: 5,
      rentang: '81 - 99',
      sanksi: 'Panggilan orang tua dan mendapat skors 6 hari',
      badgeColor: 'bg-rose-200 text-rose-950 border-rose-400 font-extrabold',
      bgCard: 'bg-rose-100 text-rose-950 border-rose-300'
    };
  }
  return {
    level: 6,
    rentang: '≥ 100',
    sanksi: 'Dikembalikan kepada orang tua / dikeluarkan dari sekolah',
    badgeColor: 'bg-red-700 text-white border-red-900 font-black animate-pulse',
    bgCard: 'bg-red-50 text-red-900 border-red-300'
  };
}

/**
 * Bab VI Pasal 10: Penilaian Angka, Huruf & Predikat per Komponen
 */
export function getPredikatByPoin(poin: number) {
  if (poin === 0) {
    return { angka: 0, huruf: 'A' as const, predikat: 'Baik Sekali', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (poin <= 25) {
    return { angka: poin, huruf: 'B' as const, predikat: 'Baik', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  }
  if (poin <= 75) {
    return { angka: poin, huruf: 'C' as const, predikat: 'Cukup', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  if (poin <= 99) {
    return { angka: poin, huruf: 'D' as const, predikat: 'Kurang', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  }
  return { angka: poin, huruf: 'E' as const, predikat: 'Sangat kurang', color: 'text-rose-700 bg-rose-50 border-rose-300' };
}

/**
 * Hitung Penilaian 3 Komponen Siswa
 */
export function getPenilaianTigaKomponen(logs: LogPelanggaran[]) {
  let poinKepribadian = 0;
  let poinKerajinan = 0;
  let poinKerapian = 0;

  logs.forEach(log => {
    log.pelanggaranList.forEach(p => {
      const kode = p.kode.trim().toUpperCase();
      if (kode.startsWith('A') || p.komponen === 'Kepribadian') {
        poinKepribadian += p.poin;
      } else if (kode.startsWith('B') || p.komponen === 'Kerajinan') {
        poinKerajinan += p.poin;
      } else if (kode.startsWith('C') || p.komponen === 'Kerapian') {
        poinKerapian += p.poin;
      } else {
        poinKepribadian += p.poin;
      }
    });
  });

  return {
    kepribadian: {
      poin: poinKepribadian,
      ...getPredikatByPoin(poinKepribadian)
    },
    kerajinan: {
      poin: poinKerajinan,
      ...getPredikatByPoin(poinKerajinan)
    },
    kerapian: {
      poin: poinKerapian,
      ...getPredikatByPoin(poinKerapian)
    },
    totalPoin: poinKepribadian + poinKerajinan + poinKerapian
  };
}

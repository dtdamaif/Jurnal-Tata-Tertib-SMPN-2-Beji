# 🏫 Jurnal Tata Tertib SMPN 2 Beji

> **Sistem Informasi Tata Tertib & Pencatatan Pelanggaran Siswa SMPN 2 Beji (Pasuruan, Jawa Timur)**  
> Terintegrasi dengan Google Sheets sebagai Database Backend dan Google Drive sebagai Cloud Storage Bukti Foto Pelanggaran.  
> **Siap di-publish dan dideploy ke Google AI Studio melalui GitHub.**

---

## 📌 Ringkasan Proyek

Aplikasi **Jurnal Tata Tertib SMPN 2 Beji** dikembangkan dengan arsitektur modern berbasis **React 19, TypeScript, Vite, dan Tailwind CSS**. Aplikasi ini memiliki dua mode integrasi:
1. **Google AI Studio Build & Web App**: Aplikasi web responsif berkinerja tinggi yang siap dipublikasikan via GitHub ke Google AI Studio.
2. **Google Apps Script (GAS) Web App**: Skrip mandiri backend (`Code.gs`) dan frontend (`Index.html`) yang dapat langsung disematkan pada Google Workspace sekolah.

---

## 🚀 Konfigurasi Sistem Resmi

* **Judul Web**: Jurnal Tata Tertib SMPN 2 Beji
* **Spreadsheet Database ID**: `1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10`
* **Google Drive Folder ID (Foto Bukti)**: `18tDeAMgEFfYR5vkYJT-yiZiAJ7g4XOdH`
* **Akun Login Default**:
  * **Administrator**: Kata sandi `@smpn2beji`
  * **Guru / Wali Kelas**: Username `[NIP Guru]`, Kata sandi `Smpn2Beji`

---

## 🌟 Fitur Unggulan

### 1. 🏆 Halaman Utama (Publik) — Leaderboard Kedisiplinan
* Peringkat murid berdasarkan akumulasi poin pelanggaran dari tertinggi ke terendah secara otomatis.
* Peringkat visual: *Top 3 Danger Badges*, status sanksi pembinaan resmi, serta kartu penilaian 3 komponen (Kepribadian, Kerajinan, Kerapian).
* Pencarian cepat nama murid, kelas, atau NISN.
* Pratinjau riwayat pelanggaran dan tombol cetak Berita Acara resmi.

### 2. 📝 Portal Guru — Formulir Input Pelanggaran (6 Langkah)
* **Login Khusus Guru**: Autentikasi berbasis NIP dan kata sandi.
* **Form 1**: Pemilihan tanggal kejadian (date picker, *default* hari ini).
* **Form 2**: Deteksi otomatis nama hari (Senin–Sabtu) sesuai tanggal yang dipilih.
* **Form 3**: Dropdown kelas statis (7A–7H, 8A–8H, 9A–9H).
* **Form 4**: Dropdown dinamis nama murid yang hanya memuat murid pada kelas yang dipilih.
* **Form 5**: Pemilihan jenis pelanggaran (*multiple select*) dari 90 katalog resmi Bab V lengkap dengan akumulasi poin instan.
* **Form 6**: Unggah foto bukti langsung ke Google Drive Folder sekolah dengan penyimpanan tautan publik pada spreadsheet.

### 3. 🛡️ Panel Administrator
* **Fitur A (Data Admin)**: Tambah, edit status, peran (Super Admin/Admin BK), dan hapus akun admin.
* **Fitur B (Akun Guru)**: Tambah, edit, dan hapus akun guru serta tombol **`[ 🔄 Tarik Data Guru dari Spreadsheet ]`**.
* **Fitur C (Master Data Murid)**: 
  * Kolom **Kelompok Guru Wali** dan **Wali Kelas**.
  * Filter multi-kategori: Filter berdasarkan **Kelas**, **Kelompok Guru Wali**, dan **Pencarian Nama/NISN**.
  * Tombol **Sinkronisasi dari Spreadsheet** untuk update murid terbaru.
* **Fitur D (Pengaturan Lembaga & Kop Surat)**:
  * Penyesuaian nama sekolah, NPSN, alamat, kontak, dan logo instansi.
  * Form Data Periode & Pengesahan (Tahun ajaran, semester, tempat & tanggal pengesahan, NIP/Nama Kepala Sekolah, dan NIP/Nama Koordinator BK/Pelapor).
* **Fitur E (Laporan & Ekspor Data)**:
  * Filter laporan per Kelas, per Kelompok Guru Wali, dan per Siswa.
  * **Export ke Excel (.xlsx)** via SheetJS dengan kolom lengkap (ID, Tanggal, Kelas, Nama, Wali Kelas, Kelompok Guru Wali, Pelanggaran, Poin, Link Foto Drive, NIP Guru).
  * **Cetak Lembar Berita Acara & Pemanggilan Orang Tua** dengan Kop Surat Resmi Pemerintah Kabupaten Pasuruan Dinas Pendidikan.
* **Master Pelanggaran (Bab V)**:
  * Kelola 90 klasifikasi pelanggaran resmi (Komponen Kepribadian A 1–A 45, Kerajinan B 1–B 19, Kerapian C 1–C 26).
  * Tambah baru, edit uraian/poin, dan hapus aturan.

---

## 📂 Struktur Repositori

```text
├── .aistudio/                     # Metadata & konfigurasi AI Studio
├── google-apps-script/            # Skrip mandiri siap pakai untuk Google Apps Script
│   ├── appsscript.json            # Manifest GAS
│   └── Code.gs                    # Backend GAS (doGet, upload Drive, sync, CRUD)
├── src/
│   ├── components/
│   │   ├── AdminPortalView.tsx    # Panel Admin (Fitur A-E & Master Pelanggaran)
│   │   ├── GasDocsView.tsx        # Dokumentasi & Pusat Salin Skrip GAS
│   │   ├── Header.tsx             # Navbar & identitas institusi
│   │   ├── LeaderboardView.tsx    # Leaderboard publik & profil sanksi siswa
│   │   ├── OfficialPrintModal.tsx # Format cetak resmi Berita Acara + Kop Dinas
│   │   └── TeacherFormView.tsx    # Form input 6-langkah guru piket
│   ├── data/
│   │   ├── gasTemplates.ts        # String template siap deploy Google Apps Script
│   │   └── initialData.ts         # Data awal 90 pelanggaran resmi Bab V & referensi
│   ├── types/
│   │   └── index.ts               # Interface TypeScript & kalkulasi sanksi Bab VI
│   ├── App.tsx                    # State orchestrator & navigasi utama
│   ├── index.css                  # Tailwind CSS setup
│   └── main.tsx                   # React root entry point
├── index.html                     # Entry point HTML & SEO metadata
├── metadata.json                  # Metadata Google AI Studio Build
├── package.json                   # Konfigurasi dependensi dan skrip
├── tsconfig.json                  # Konfigurasi TypeScript
├── vite.config.ts                 # Konfigurasi build Vite & port 3000
├── .env.example                   # Contoh variabel lingkungan
└── README.md                      # Dokumentasi lengkap proyek
```

---

## 🛠️ Panduan Publikasi ke Google AI Studio via GitHub

Untuk mempublikasikan aplikasi ini ke **Google AI Studio**:

### Langkah 1: Push Repositori ke GitHub
Inisialisasi git dan unggah kode ke repositori GitHub pribadi atau organisasi Anda:
```bash
git init
git add .
git commit -m "feat: publikasi jurnal tata tertib smpn 2 beji ke ai studio"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

### Langkah 2: Hubungkan di Google AI Studio
1. Buka [Google AI Studio](https://aistudio.google.com).
2. Masuk dengan akun Google Anda.
3. Pilih menu **Build** > **Import GitHub Repository** (atau klik *New Applet* dan pilih *Connect to GitHub*).
4. Pilih repositori yang baru saja Anda buat.
5. AI Studio secara otomatis membaca konfigurasi:
   - `metadata.json` (Nama & Deskripsi Applet).
   - `package.json` (`npm run dev` pada port 3000 host `0.0.0.0` dan `npm run build`).
   - `index.html` dan Tailwind CSS.

### Langkah 3: Konfigurasi Environment Variables (Opsional)
Pada panel **Settings** / **Secrets** di AI Studio UI:
* `VITE_SPREADSHEET_ID`: `1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10`
* `VITE_DRIVE_FOLDER_ID`: `18tDeAMgEFfYR5vkYJT-yiZiAJ7g4XOdH`

### Langkah 4: Publikasikan (Publish)
* Klik tombol **Share / Publish** di pojok kanan atas AI Studio.
* Aplikasi Anda akan mendapatkan URL publik aktif berbasis Cloud Run yang dapat diakses langsung oleh staf sekolah dan masyarakat.

---

## 💻 Menjalankan Secara Lokal

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server lokal development
npm run dev

# 3. Bangun bundel produksi
npm run build

# 4. Uji pratinjau hasil build
npm run preview
```
Akses aplikasi melalui browser di: `http://localhost:3000`.

---

## 📊 Struktur Tabel Database (Google Sheets)

Buat 6 lembar kerja (*tab sheet*) pada Spreadsheet ID `1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10`:

1. **`Admin`**: `ID`, `Username`, `Password`, `Nama`, `Role`, `Email`, `Status`
2. **`Guru`**: `ID`, `NIP`, `Password`, `Nama`, `Jabatan`, `KelasWali`, `NoHP`, `Status`
3. **`Murid`**: `ID`, `NISN`, `NIS`, `Nama`, `Kelas`, `JenisKelamin`, `WaliKelas`, `GuruWali`
4. **`Ref_Pelanggaran`**: `ID`, `Kode`, `Komponen`, `SubKomponen`, `NamaPelanggaran`, `Poin`
5. **`Log_Pelanggaran`**: `ID`, `Tanggal`, `Hari`, `Kelas`, `NISN`, `NamaMurid`, `PelanggaranJSON`, `TotalPoin`, `FotoBuktiUrl`, `Catatan`, `GuruNIP`, `GuruNama`, `Timestamp`
6. **`Pengaturan`**: `Key`, `Value`

---

## 📜 Kepatuhan Aturan Resmi

Sistem mengacu langsung pada Dokumen Tata Tertib SMPN 2 Beji:
* **Bab V (Pasal 7, 8, 9)**: 90 Klasifikasi Pelanggaran (Komponen Kepribadian, Kerajinan, dan Kerapian).
* **Bab VI (Pasal 10)**: Rentang Skor & Konversi Predikat Nilai Karakter (A: 0, B: 1–25, C: 26–75, D: 76–99, E: ≥100).
* **Ketentuan Poin Sanksi**:
  * `1 – 20 poin`: Teguran lisan & pembinaan.
  * `21 – 40 poin`: Teguran tertulis & pembinaan.
  * `41 – 60 poin`: Panggilan orang tua.
  * `61 – 80 poin`: Panggilan orang tua & skors 3 hari.
  * `81 – 99 poin`: Panggilan orang tua & skors 6 hari.
  * `≥ 100 poin`: Dikembalikan kepada orang tua / dikeluarkan dari sekolah.

---

## 📄 Lisensi
Hak Cipta © 2024–2026 SMPN 2 Beji, Pasuruan, Jawa Timur.  
Dikembangkan untuk ketertiban dan penguatan karakter peserta didik Indonesia.

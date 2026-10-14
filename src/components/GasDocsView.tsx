import React, { useState } from 'react';
import { 
  Code2, Copy, Check, Table, FileCode, Server, 
  ExternalLink, Sparkles, FolderKey, KeyRound, Shield
} from 'lucide-react';
import { GAS_CODE_GS, GAS_INDEX_HTML } from '../data/gasTemplates';
import { GAS_CONFIG } from '../data/initialData';

export const GasDocsView: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<'gs' | 'html' | null>(null);
  const [activeTab, setActiveTab] = useState<'struktur' | 'codegs' | 'indexhtml' | 'panduan'>('struktur');

  const copyToClipboard = (text: string, type: 'gs' | 'html') => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-blue-800/50">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            Dokumentasi & Sumber Kode Siap Pasang
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Google Apps Script & Database Spreadsheet
          </h2>
          <p className="mt-2 text-sm text-blue-200/90 leading-relaxed">
            Semua kode backend (<code>Code.gs</code>) dan frontend (<code>Index.html</code>) telah disesuaikan khusus dengan Spreadsheet ID dan Drive Folder ID SMPN 2 Beji. Anda dapat langsung menyalin kode ke editor Apps Script.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono">
            <span className="px-3 py-1 bg-white/10 rounded-lg border border-white/10 text-yellow-300">
              Spreadsheet ID: {GAS_CONFIG.spreadsheetId}
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-lg border border-white/10 text-emerald-300">
              Drive Folder: {GAS_CONFIG.driveFolderId}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs for docs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveTab('struktur')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'struktur'
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>1. Struktur Database</span>
        </button>

        <button
          onClick={() => setActiveTab('codegs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'codegs'
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Server className="w-4 h-4 text-emerald-400" />
          <span>2. Kode Backend (Code.gs)</span>
        </button>

        <button
          onClick={() => setActiveTab('indexhtml')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'indexhtml'
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-4 h-4 text-amber-400" />
          <span>3. Kode Frontend (Index.html)</span>
        </button>

        <button
          onClick={() => setActiveTab('panduan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'panduan'
              ? 'bg-blue-700 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Panduan Deploy GAS</span>
        </button>
      </div>

      {/* 1. STRUKTUR DATABASE */}
      {activeTab === 'struktur' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              1. Struktur Tabel Spreadsheet Database
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Buat 6 lembar (sheet tab) berikut pada Google Spreadsheet ID: <code className="font-bold text-blue-700">{GAS_CONFIG.spreadsheetId}</code>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Sheet 1: Admin */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Sheet: "Admin"</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">7 Kolom</span>
              </div>
              <p className="text-xs text-slate-500">Menyimpan data otentikasi administrator.</p>
              <div className="bg-white p-2.5 rounded-lg border font-mono text-[11px] text-slate-700">
                A: ID | B: Username | C: Password | D: Nama | E: Role | F: Email | G: Status
              </div>
              <div className="text-[11px] text-slate-400 italic">
                * Password default baris 1: <code>@smpn2beji</code>
              </div>
            </div>

            {/* Sheet 2: Guru */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Sheet: "Guru"</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">8 Kolom</span>
              </div>
              <p className="text-xs text-slate-500">Menyimpan data guru wali dan guru piket.</p>
              <div className="bg-white p-2.5 rounded-lg border font-mono text-[11px] text-slate-700">
                A: ID | B: NIP | C: Password | D: Nama | E: Jabatan | F: KelasWali | G: NoHP | H: Status
              </div>
              <div className="text-[11px] text-slate-400 italic">
                * Password default guru: <code>Smpn2Beji</code>
              </div>
            </div>

            {/* Sheet 3: Murid */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Sheet: "Murid"</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">7 Kolom</span>
              </div>
              <p className="text-xs text-slate-500">Master siswa kelas 7A-7H, 8A-8H, 9A-9H.</p>
              <div className="bg-white p-2.5 rounded-lg border font-mono text-[11px] text-slate-700">
                A: ID | B: NISN | C: NIS | D: Nama | E: Kelas | F: JenisKelamin | G: WaliKelas
              </div>
            </div>

            {/* Sheet 4: Ref_Pelanggaran */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Sheet: "Ref_Pelanggaran" (Master Bab V)</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">6 Kolom</span>
              </div>
              <p className="text-xs text-slate-500">Katalog jenis pelanggaran, komponen Bab V, dan bobot poin.</p>
              <div className="bg-white p-2.5 rounded-lg border font-mono text-[11px] text-slate-700">
                A: ID | B: Kode | C: Komponen | D: SubKomponen | E: NamaPelanggaran | F: Poin
              </div>
            </div>

            {/* Sheet 5: Log_Pelanggaran */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Sheet: "Log_Pelanggaran" (Rekap Transaksi Utama)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">13 Kolom</span>
              </div>
              <p className="text-xs text-slate-500">Mencatat setiap pelanggaran yang disubmit guru dan link foto Google Drive.</p>
              <div className="bg-white p-2.5 rounded-lg border font-mono text-[11px] text-slate-700 overflow-x-auto">
                A: ID | B: Tanggal | C: Hari | D: Kelas | E: NISN | F: NamaMurid | G: PelanggaranJSON | H: TotalPoin | I: FotoBuktiUrl | J: Catatan | K: GuruNIP | L: GuruNama | M: Timestamp
              </div>
            </div>

            {/* Sheet 6: Pengaturan */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Sheet: "Pengaturan" (Key - Value)</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">2 Kolom</span>
              </div>
              <p className="text-xs text-slate-500">Menyimpan kop surat dinas dan identitas pejabat pengesahan.</p>
              <div className="bg-white p-2.5 rounded-lg border font-mono text-[11px] text-slate-700">
                A: Key | B: Value (namaSekolah, alamat, logoUrl, tahunAjaran, namaKepsek, nipKepsek, namaPelapor, nipPelapor, dll)
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. KODE BACKEND (Code.gs) */}
      {activeTab === 'codegs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-600" />
                2. Script Backend (Code.gs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Salin seluruh isi skrip ini ke file <code>Code.gs</code> di Google Apps Script editor.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(GAS_CODE_GS, 'gs')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              {copiedCode === 'gs' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode === 'gs' ? 'Tersalin ke Clipboard!' : 'Salin Kode Code.gs'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-emerald-300 rounded-2xl text-xs font-mono overflow-x-auto max-h-[500px] border border-slate-800 leading-relaxed">
            {GAS_CODE_GS}
          </pre>
        </div>
      )}

      {/* 3. KODE FRONTEND (Index.html) */}
      {activeTab === 'indexhtml' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-600" />
                3. Script Frontend Web App (Index.html)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Salin seluruh isi skrip ini ke file <code>Index.html</code> di Google Apps Script editor.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(GAS_INDEX_HTML, 'html')}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              {copiedCode === 'html' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode === 'html' ? 'Tersalin ke Clipboard!' : 'Salin Kode Index.html'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-blue-200 rounded-2xl text-xs font-mono overflow-x-auto max-h-[500px] border border-slate-800 leading-relaxed">
            {GAS_INDEX_HTML}
          </pre>
        </div>
      )}

      {/* 4. PANDUAN DEPLOY GOOGLE APPS SCRIPT */}
      {activeTab === 'panduan' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-blue-600" />
            Langkah-Langkah Penerapan (Deployment) ke Google Apps Script
          </h3>

          <ol className="space-y-4 text-xs sm:text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <strong>Buka Google Spreadsheet:</strong>
                <p className="text-slate-500 text-xs mt-0.5">
                  Buka Spreadsheet dengan ID <code>{GAS_CONFIG.spreadsheetId}</code>.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <strong>Buka Apps Script Editor:</strong>
                <p className="text-slate-500 text-xs mt-0.5">
                  Klik menu <em>Extensions (Ekstensi) &rarr; Apps Script</em> di bilah atas Google Sheets.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <strong>Pasang Kode:</strong>
                <p className="text-slate-500 text-xs mt-0.5">
                  Tempel kode <code>Code.gs</code> pada file skrip utama. Kemudian klik tanda <code>+</code> &rarr; <em>HTML</em>, beri nama <code>Index</code>, dan tempel kode <code>Index.html</code>.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">4</span>
              <div>
                <strong>Jalankan Inisialisasi Pertama Kali:</strong>
                <p className="text-slate-500 text-xs mt-0.5">
                  Pilih fungsi <code>initDatabase</code> lalu klik tombol <strong>Run (Jalankan)</strong>. Berikan izin akses (Otorisasi) Google Drive & Spreadsheet saat diminta. Fungsi ini akan otomatis membuat semua sheet dan header kolom jika belum ada.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">5</span>
              <div>
                <strong>Deploy Sebagai Web App:</strong>
                <p className="text-slate-500 text-xs mt-0.5">
                  Klik tombol biru <strong>Deploy (Terapkan) &rarr; New deployment (Penerapan baru)</strong>.
                  Pilih jenis <em>Web app</em>. Isi kolom:
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border mt-2 font-mono text-xs text-slate-800 space-y-1">
                  <div>Execute as: <strong>Me (email Anda)</strong></div>
                  <div>Who has access: <strong>Anyone (Siapa saja)</strong></div>
                </div>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">6</span>
              <div>
                <strong className="text-emerald-700">Selesai! Web App Siap Digunakan:</strong>
                <p className="text-slate-500 text-xs mt-0.5">
                  Salin Web App URL yang diberikan. URL tersebut dapat langsung dibuka oleh publik (Leaderboard), guru (Input Pelanggaran), dan admin sekolah!
                </p>
              </div>
            </li>
          </ol>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, Lock, UserCog, GraduationCap, Users, Settings, 
  FileSpreadsheet, Plus, Trash2, Edit2, RotateCw, Download, 
  Printer, LogOut, CheckCircle2, AlertCircle, Eye, Search, 
  FileText, Building2, Calendar, FileBadge, BookOpen, Layers
} from 'lucide-react';
import { AdminUser, Guru, Murid, LogPelanggaran, PengaturanLembaga, JenisPelanggaran, KomponenPelanggaran } from '../types';
import { DAFTAR_KELAS, GAS_CONFIG } from '../data/initialData';

interface AdminPortalViewProps {
  admins: AdminUser[];
  guruList: Guru[];
  muridList: Murid[];
  logs: LogPelanggaran[];
  pengaturan: PengaturanLembaga;
  currentAdmin: AdminUser | null;
  refPelanggaranList: JenisPelanggaran[];
  onLoginAdmin: (password: string) => boolean;
  onLogoutAdmin: () => void;
  onSaveAdmin: (admin: AdminUser) => void;
  onDeleteAdmin: (id: string) => void;
  onSaveGuru: (guru: Guru) => void;
  onDeleteGuru: (id: string) => void;
  onSaveMurid: (murid: Murid) => void;
  onDeleteMurid: (id: string) => void;
  onSavePelanggaran: (pelanggaran: JenisPelanggaran) => void;
  onDeletePelanggaran: (id: string) => void;
  onResetDefaultPelanggaran?: () => void;
  onSyncSpreadsheet: () => void;
  onSyncGuruSpreadsheet: () => void;
  onSavePengaturan: (newSettings: PengaturanLembaga) => void;
  onOpenReportPrint?: (murid: Murid) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  admins,
  guruList,
  muridList,
  logs,
  pengaturan,
  currentAdmin,
  refPelanggaranList,
  onLoginAdmin,
  onLogoutAdmin,
  onSaveAdmin,
  onDeleteAdmin,
  onSaveGuru,
  onDeleteGuru,
  onSaveMurid,
  onDeleteMurid,
  onSavePelanggaran,
  onDeletePelanggaran,
  onResetDefaultPelanggaran,
  onSyncSpreadsheet,
  onSyncGuruSpreadsheet,
  onSavePengaturan,
  onOpenReportPrint
}) => {
  // Admin Login State
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Sub Tab Fitur A - E + Master Pelanggaran
  const [subTab, setSubTab] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'PELANGGARAN'>('A');

  // Modals for CRUD
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  const [guruModalOpen, setGuruModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);

  const [muridModalOpen, setMuridModalOpen] = useState(false);
  const [editingMurid, setEditingMurid] = useState<Murid | null>(null);

  // Master Pelanggaran state
  const [pelanggaranModalOpen, setPelanggaranModalOpen] = useState(false);
  const [editingPelanggaran, setEditingPelanggaran] = useState<JenisPelanggaran | null>(null);
  const [pelFilterKomponen, setPelFilterKomponen] = useState<'Semua' | KomponenPelanggaran>('Semua');
  const [pelFilterSub, setPelFilterSub] = useState('Semua');
  const [pelSearch, setPelSearch] = useState('');
  const [pelanggaranSuccessMsg, setPelanggaranSuccessMsg] = useState('');

  // Sync animation state (Murid)
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  // Sync animation state (Guru)
  const [isSyncingGuru, setIsSyncingGuru] = useState(false);
  const [syncGuruSuccessMsg, setSyncGuruSuccessMsg] = useState('');

  // Fitur C: Master Murid Filter States
  const [muridFilterKelas, setMuridFilterKelas] = useState('Semua');
  const [muridFilterWali, setMuridFilterWali] = useState('Semua');
  const [muridSearchQuery, setMuridSearchQuery] = useState('');

  // Fitur D: Pengaturan State Form
  const [settingsForm, setSettingsForm] = useState<PengaturanLembaga>(pengaturan);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Fitur E: Laporan Filters
  const [laporanKelasFilter, setLaporanKelasFilter] = useState('Semua');
  const [laporanWaliFilter, setLaporanWaliFilter] = useState('Semua');
  const [laporanMuridQuery, setLaporanMuridQuery] = useState('');

  // Handle Admin Login
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    const success = onLoginAdmin(adminPasswordInput);
    if (!success) {
      setAdminLoginError('Password Admin salah! (Default: @smpn2beji)');
    }
  };

  // Trigger Spreadsheet Sync Murid
  const handleTriggerSync = () => {
    setIsSyncing(true);
    setSyncSuccessMsg('');
    setTimeout(() => {
      onSyncSpreadsheet();
      setIsSyncing(false);
      setSyncSuccessMsg('Data Murid berhasil disinkronisasi dari Spreadsheet (ID: 1vzxldrnNQ...)!');
      setTimeout(() => setSyncSuccessMsg(''), 4000);
    }, 1200);
  };

  // Trigger Spreadsheet Sync Guru
  const handleTriggerSyncGuru = () => {
    setIsSyncingGuru(true);
    setSyncGuruSuccessMsg('');
    setTimeout(() => {
      onSyncGuruSpreadsheet();
      setIsSyncingGuru(false);
      setSyncGuruSuccessMsg('Data Guru berhasil ditarik dan disinkronkan dari Spreadsheet (Tab: Guru, ID: 1vzxldrnNQ...)!');
      setTimeout(() => setSyncGuruSuccessMsg(''), 4000);
    }, 1200);
  };

  // Unique list of Guru Wali for filtering
  const daftarSemuaGuruWali = Array.from(new Set([
    ...guruList.map(g => g.nama),
    ...muridList.map(m => m.guruWali || m.waliKelas)
  ])).filter(Boolean).sort();

  // Filtered Murid List for Fitur C
  const filteredMuridList = muridList.filter(m => {
    const matchKelas = muridFilterKelas === 'Semua' || m.kelas === muridFilterKelas;
    const matchWali = muridFilterWali === 'Semua' || (m.guruWali === muridFilterWali || m.waliKelas === muridFilterWali);
    const q = muridSearchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      m.nama.toLowerCase().includes(q) || 
      m.nisn.includes(q) || 
      m.nis.includes(q) ||
      (m.guruWali && m.guruWali.toLowerCase().includes(q)) ||
      m.waliKelas.toLowerCase().includes(q);
    return matchKelas && matchWali && matchQuery;
  });

  // Filtered Logs for Fitur E Laporan
  const filteredLogs = logs.filter(l => {
    const matchKelas = laporanKelasFilter === 'Semua' || l.kelas === laporanKelasFilter;
    
    // Find murid to check wali kelas & kelompok guru wali
    const m = muridList.find(item => item.nisn === l.nisn);
    const matchWali = laporanWaliFilter === 'Semua' || (m && (m.guruWali === laporanWaliFilter || m.waliKelas === laporanWaliFilter));

    const matchQuery = 
      !laporanMuridQuery ||
      l.namaMurid.toLowerCase().includes(laporanMuridQuery.toLowerCase()) ||
      l.nisn.includes(laporanMuridQuery);

    return matchKelas && matchWali && matchQuery;
  });

  // Export to Excel (.xlsx) using SheetJS
  const handleExportExcel = () => {
    const dataToExport = filteredLogs.map((l, index) => {
      const studentObj = muridList.find(m => m.nisn === l.nisn);
      return {
        'No': index + 1,
        'ID Log': l.id,
        'Tanggal': l.tanggal,
        'Hari': l.hari,
        'Kelas': l.kelas,
        'NISN': l.nisn,
        'Nama Siswa': l.namaMurid,
        'Wali Kelas': studentObj ? studentObj.waliKelas : '-',
        'Kelompok Guru Wali': studentObj ? (studentObj.guruWali || studentObj.waliKelas) : '-',
        'Pelanggaran': l.pelanggaranList.map(p => `${p.nama} (+${p.poin})`).join('; '),
        'Total Poin': l.totalPoin,
        'Foto Bukti Link': l.fotoBuktiUrl,
        'Catatan': l.catatan || '-',
        'Guru Pelapor': l.guruNama,
        'NIP Pelapor': l.guruNip,
        'Waktu Catat': l.timestamp
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pelanggaran');

    // Auto-fit column width
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 8 },
      { wch: 14 }, { wch: 25 }, { wch: 22 }, { wch: 24 }, { wch: 45 },
      { wch: 10 }, { wch: 30 }, { wch: 30 }, { wch: 22 }, { wch: 20 }, { wch: 20 }
    ];

    XLSX.writeFile(workbook, `Laporan_Pelanggaran_SMPN2Beji_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // IF NOT LOGGED IN: SHOW ADMIN LOGIN FORM
  if (!currentAdmin) {
    return (
      <div className="max-w-md mx-auto my-12">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          <div className="bg-gradient-to-r from-indigo-950 to-blue-900 p-6 text-white text-center">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-400/30 text-yellow-300">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black">Panel Administrator</h2>
            <p className="text-xs text-indigo-200 mt-1">
              Khusus Kesiswaan & Tim Bimbingan Konseling (BK)
            </p>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="p-6 sm:p-8 space-y-5">
            {adminLoginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi Administrator
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Password default: @smpn2beji"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Default password: <code className="font-bold text-indigo-700">@smpn2beji</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-indigo-700/25 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Buka Akses Panel Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminPasswordInput(GAS_CONFIG.adminDefaultPassword);
                onLoginAdmin(GAS_CONFIG.adminDefaultPassword);
              }}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors"
            >
              Uji Coba Masuk Cepat (Password Default)
            </button>
          </form>

        </div>
      </div>
    );
  }

  // IF LOGGED IN: SHOW ADMIN DASHBOARD
  return (
    <div className="space-y-6">
      
      {/* Admin Session Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-indigo-800/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-indigo-600/30 rounded-xl flex items-center justify-center border border-indigo-400/40 text-yellow-300">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-lg text-white">{currentAdmin.nama}</h2>
              <span className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-300 text-[10px] font-bold rounded-full border border-yellow-400/30">
                {currentAdmin.role}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Username: @{currentAdmin.username} &bull; Email: {currentAdmin.email}
            </p>
          </div>
        </div>

        <button
          onClick={onLogoutAdmin}
          className="px-4 py-2 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Admin</span>
        </button>
      </div>

      {/* Fitur Navigation Tabs (Fitur A - E) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        
        <button
          onClick={() => setSubTab('A')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'A'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>Fitur A: Data Admin</span>
        </button>

        <button
          onClick={() => setSubTab('B')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'B'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Fitur B: Akun Guru</span>
        </button>

        <button
          onClick={() => setSubTab('C')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'C'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Fitur C: Master Murid & Sinkron</span>
        </button>

        <button
          onClick={() => setSubTab('D')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'D'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Fitur D: Pengaturan & Kop</span>
        </button>

        <button
          onClick={() => setSubTab('E')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'E'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Fitur E: Laporan & Export Excel</span>
        </button>

        <button
          onClick={() => setSubTab('PELANGGARAN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            subTab === 'PELANGGARAN'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Master Pelanggaran</span>
        </button>

      </div>

      {/* ========================================================= */}
      {/* FITUR A: KELOLA DATA ADMIN */}
      {/* ========================================================= */}
      {subTab === 'A' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-600" />
                Fitur A: Kelola Data Administrator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar admin yang berhak mengelola pengaturan, master data murid, dan laporan.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAdmin(null);
                setAdminModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Admin Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{a.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">@{a.username}</td>
                    <td className="py-3 px-4 text-slate-800">{a.nama}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs">
                        {a.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{a.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        a.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingAdmin(a);
                            setAdminModalOpen(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Edit Admin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (admins.length <= 1) {
                              alert('Tidak dapat menghapus admin satu-satunya!');
                              return;
                            }
                            if (confirm(`Yakin ingin menghapus admin ${a.nama}?`)) {
                              onDeleteAdmin(a.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Hapus Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FITUR B: KELOLA AKUN GURU */}
      {/* ========================================================= */}
      {subTab === 'B' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Fitur B: Kelola Akun Guru & Wali Kelas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Akun guru digunakan saat mengakses formulir input pelanggaran (Username: NIP, Password default: Smpn2Beji).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerSyncGuru}
                disabled={isSyncingGuru}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCw className={`w-4 h-4 ${isSyncingGuru ? 'animate-spin' : ''}`} />
                <span>{isSyncingGuru ? 'Menghubungkan Spreadsheet...' : 'Tarik Data Guru dari Spreadsheet'}</span>
              </button>

              <button
                onClick={() => {
                  setEditingGuru(null);
                  setGuruModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Guru Baru</span>
              </button>
            </div>
          </div>

          {syncGuruSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{syncGuruSuccessMsg}</span>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">NIP</th>
                  <th className="py-3 px-4">Nama Lengkap & Gelar</th>
                  <th className="py-3 px-4">Jabatan</th>
                  <th className="py-3 px-4">Kelas Binaan / Wali</th>
                  <th className="py-3 px-4">No. HP</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guruList.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{g.nip}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{g.nama}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{g.jabatan}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md text-xs">
                        {g.kelasWali || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{g.noHp || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        g.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingGuru(g);
                            setGuruModalOpen(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Edit Guru"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus akun guru ${g.nama}?`)) {
                              onDeleteGuru(g.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FITUR C: MASTER DATA MURID & SINKRONISASI SPREADSHEET */}
      {/* ========================================================= */}
      {subTab === 'C' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Fitur C: Master Data Murid & Sinkronisasi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {muridList.length} peserta didik kelas 7A-7H, 8A-8H, 9A-9H terdaftar.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* TOMBOL SINKRONISASI DARI SPREADSHEET */}
              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menghubungkan Spreadsheet...' : 'Sinkronisasi dari Spreadsheet'}</span>
              </button>

              <button
                onClick={() => {
                  setEditingMurid(null);
                  setMuridModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Murid</span>
              </button>
            </div>
          </div>

          {syncSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* Filter Bar: Filter Kelas, Kelompok Guru Wali, & Pencarian */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Filter Berdasarkan Kelas & Kelompok Guru Wali
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Menampilkan <strong className="text-indigo-700 font-bold">{filteredMuridList.length}</strong> dari {muridList.length} murid
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Filter 1: Kelas */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Kelas</label>
                <select
                  value={muridFilterKelas}
                  onChange={(e) => setMuridFilterKelas(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Semua">Semua Kelas (7A - 9H)</option>
                  {DAFTAR_KELAS.map(k => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Kelompok Guru Wali */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Kelompok Guru Wali</label>
                <select
                  value={muridFilterWali}
                  onChange={(e) => setMuridFilterWali(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Semua">Semua Kelompok Guru Wali</option>
                  {daftarSemuaGuruWali.map(wali => (
                    <option key={wali} value={wali}>{wali}</option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Pencarian Murid */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Nama Siswa / NISN / NIS</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={muridSearchQuery}
                    onChange={(e) => setMuridSearchQuery(e.target.value)}
                    placeholder="Ketik nama, NISN, atau wali..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>

            {(muridFilterKelas !== 'Semua' || muridFilterWali !== 'Semua' || muridSearchQuery) && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMuridFilterKelas('Semua');
                    setMuridFilterWali('Semua');
                    setMuridSearchQuery('');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                >
                  Reset Filter Murid
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3">NISN</th>
                  <th className="py-3 px-3">NIS</th>
                  <th className="py-3 px-3">Nama Siswa</th>
                  <th className="py-3 px-3 text-center">Kelas</th>
                  <th className="py-3 px-3 text-center">L/P</th>
                  <th className="py-3 px-3">Wali Kelas</th>
                  <th className="py-3 px-3">Kelompok Guru Wali</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMuridList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada data murid yang sesuai dengan filter kelas atau kelompok guru wali.
                    </td>
                  </tr>
                ) : (
                  filteredMuridList.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{m.nisn}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{m.nis}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{m.nama}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md text-xs">
                          {m.kelas}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-600">
                        {m.jenisKelamin}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-xs">{m.waliKelas}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-md text-xs flex items-center gap-1 w-fit">
                          <Users className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{m.guruWali || m.waliKelas}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingMurid(m);
                              setMuridModalOpen(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Edit Murid"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus murid ${m.nama}?`)) {
                                onDeleteMurid(m.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus Murid"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FITUR D: PENGATURAN LEMBAGA, KOP SURAT RESMI & PENGESAHAN */}
      {/* ========================================================= */}
      {subTab === 'D' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Fitur D: Pengaturan Lembaga, Kop Surat Resmi, & Data Pengesahan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi kop surat resmi dinas dan data pengesahan untuk pencetakan Berita Acara & Surat Panggilan Siswa.
              </p>
            </div>
          </div>

          {savedSettingsNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Lembaga, Kop Surat, dan Pengesahan berhasil disimpan ke database!</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSavePengaturan(settingsForm);
              setSavedSettingsNotice(true);
              setTimeout(() => setSavedSettingsNotice(false), 4000);
            }}
            className="space-y-6"
          >
            {/* Bagian 1: Identitas Sekolah & Logo */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                Identitas Sekolah & Kop Surat
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Satuan Pendidikan</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.namaSekolah}
                    onChange={(e) => setSettingsForm({ ...settingsForm, namaSekolah: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NPSN</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.npsn}
                    onChange={(e) => setSettingsForm({ ...settingsForm, npsn: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  required
                  value={settingsForm.alamat}
                  onChange={(e) => setSettingsForm({ ...settingsForm, alamat: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.desaKecamatan}
                    onChange={(e) => setSettingsForm({ ...settingsForm, desaKecamatan: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kabupaten/Kota</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.kabupatenKota}
                    onChange={(e) => setSettingsForm({ ...settingsForm, kabupatenKota: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={settingsForm.kodePos}
                    onChange={(e) => setSettingsForm({ ...settingsForm, kodePos: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Telepon Sekolah</label>
                  <input
                    type="text"
                    value={settingsForm.telepon}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telepon: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="text"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Website / Domain</label>
                  <input
                    type="text"
                    value={settingsForm.website}
                    onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL Logo Sekolah / Lambang</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={settingsForm.logoUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                  {settingsForm.logoUrl && (
                    <img 
                      src={settingsForm.logoUrl} 
                      alt="Logo Preview" 
                      className="w-10 h-10 object-contain rounded border border-slate-200"
                    />
                  )}
                </div>
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* Bagian 2: Data Periode & Pengesahan Surat */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                Data Periode Akademik & Pejabat Pengesahan
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.tahunAjaran}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tahunAjaran: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={settingsForm.semester}
                    onChange={(e) => setSettingsForm({ ...settingsForm, semester: e.target.value as 'Ganjil' | 'Genap' })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 bg-white"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Pengesahan</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.tempatPengesahan}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tempatPengesahan: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pengesahan Surat</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.tanggalPengesahan}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tanggalPengesahan: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Pejabat 1: Kepala Sekolah */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Sekolah (Beserta Gelar)</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.namaKepsek}
                    onChange={(e) => setSettingsForm({ ...settingsForm, namaKepsek: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.nipKepsek}
                    onChange={(e) => setSettingsForm({ ...settingsForm, nipKepsek: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 bg-white"
                  />
                </div>
              </div>

              {/* Pejabat 2: Pelapor / Koordinator BK */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pelapor / Koordinator BK</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.namaPelapor}
                    onChange={(e) => setSettingsForm({ ...settingsForm, namaPelapor: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIP Pelapor</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.nipPelapor}
                    onChange={(e) => setSettingsForm({ ...settingsForm, nipPelapor: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan Pelapor</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.jabatanPelapor}
                    onChange={(e) => setSettingsForm({ ...settingsForm, jabatanPelapor: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Seluruh Pengaturan Lembaga</span>
            </button>
          </form>

        </div>
      )}

      {/* ========================================================= */}
      {/* FITUR E: LAPORAN & DOWNLOAD / EXPORT EXCEL (.XLSX) */}
      {/* ========================================================= */}
      {subTab === 'E' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Fitur E: Laporan Pelanggaran Siswa & Ekspor Data
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dapat difilter berdasarkan Kelas, Kelompok Guru Wali, atau Per Murid. Terdapat tombol Download Excel (.xlsx) dan Cetak Resmi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download / Export Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Filter Controls (Kelas, Kelompok Wali, Per Murid) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Filter 1: Berdasarkan Kelas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filter Berdasarkan Kelas
              </label>
              <select
                value={laporanKelasFilter}
                onChange={(e) => setLaporanKelasFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-600"
              >
                <option value="Semua">Semua Kelas (7A - 9H)</option>
                {DAFTAR_KELAS.map(k => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))}
              </select>
            </div>

            {/* Filter 2: Berdasarkan Kelompok Guru Wali */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filter Kelompok Guru Wali
              </label>
              <select
                value={laporanWaliFilter}
                onChange={(e) => setLaporanWaliFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-600"
              >
                <option value="Semua">Semua Kelompok Guru Wali</option>
                {daftarSemuaGuruWali.map(wali => (
                  <option key={wali} value={wali}>
                    {wali}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Per Murid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filter Per Murid (Nama / NISN)
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={laporanMuridQuery}
                  onChange={(e) => setLaporanMuridQuery(e.target.value)}
                  placeholder="Ketik nama atau NISN murid..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

          </div>

          {/* Laporan Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3">Tanggal / Hari</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3">Nama Murid (NISN)</th>
                  <th className="py-3 px-3">Pelanggaran Terpilih</th>
                  <th className="py-3 px-3 text-center">Poin</th>
                  <th className="py-3 px-3">Guru Pelapor</th>
                  <th className="py-3 px-3 text-center">Foto Bukti</th>
                  <th className="py-3 px-3 text-center">Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada rekaman pelanggaran sesuai filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(l => {
                    const studentObj = muridList.find(m => m.nisn === l.nisn);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{l.hari}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{l.tanggal}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md text-xs">
                            {l.kelas}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{l.namaMurid}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NISN: {l.nisn}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-0.5 max-w-xs">
                            {l.pelanggaranList.map((p, idx) => (
                              <div key={idx} className="text-xs text-slate-700 flex items-center gap-1.5">
                                <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-600 px-1 rounded">
                                  {p.kode}
                                </span>
                                <span className="truncate">{p.nama}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                            l.totalPoin >= 50 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'
                          }`}>
                            +{l.totalPoin}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600">
                          <div className="font-semibold">{l.guruNama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{l.guruNip}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {l.fotoBuktiUrl ? (
                            <a
                              href={l.fotoBuktiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline font-semibold"
                            >
                              Lihat Foto
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {studentObj && onOpenReportPrint && (
                            <button
                              onClick={() => onOpenReportPrint(studentObj)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                              title="Cetak Berita Acara Pelanggaran Siswa"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MASTER PELANGGARAN: JENIS-JENIS PELANGGARAN & POIN (CRUD) */}
      {/* ========================================================= */}
      {subTab === 'PELANGGARAN' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Master Data Jenis Pelanggaran & Poin (Bab V)
                </h3>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-bold rounded-full">
                  {refPelanggaranList.length} Aturan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola katalog tata tertib SMPN 2 Beji. Anda dapat menambah pelanggaran baru, mengubah uraian & bobot poin, atau menghapus data.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onResetDefaultPelanggaran && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Kembalikan seluruh daftar pelanggaran ke 90 aturan standar resmi Bab V SMPN 2 Beji?')) {
                      onResetDefaultPelanggaran();
                      setPelanggaranSuccessMsg('Daftar pelanggaran berhasil dikembalikan ke standar Bab V.');
                      setTimeout(() => setPelanggaranSuccessMsg(''), 3000);
                    }
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  title="Reset ke 90 aturan default Bab V"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Reset Default (90)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditingPelanggaran(null);
                  setPelanggaranModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jenis Pelanggaran</span>
              </button>
            </div>
          </div>

          {/* Alert Success */}
          {pelanggaranSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pelanggaranSuccessMsg}</span>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Pelanggaran</span>
              <span className="text-xl font-black text-slate-900">{refPelanggaranList.length}</span>
              <span className="text-[10px] text-slate-500 block">Jenis Terdaftar</span>
            </div>
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
              <span className="text-[10px] text-blue-600 font-bold uppercase block">(1) Kepribadian</span>
              <span className="text-xl font-black text-blue-900">
                {refPelanggaranList.filter(p => p.komponen === 'Kepribadian').length}
              </span>
              <span className="text-[10px] text-blue-500 block">Kode A 1 - A 45...</span>
            </div>
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">(2) Kerajinan</span>
              <span className="text-xl font-black text-emerald-900">
                {refPelanggaranList.filter(p => p.komponen === 'Kerajinan').length}
              </span>
              <span className="text-[10px] text-emerald-500 block">Kode B 1 - B 19...</span>
            </div>
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
              <span className="text-[10px] text-purple-600 font-bold uppercase block">(3) Kerapian</span>
              <span className="text-xl font-black text-purple-900">
                {refPelanggaranList.filter(p => p.komponen === 'Kerapian').length}
              </span>
              <span className="text-[10px] text-purple-500 block">Kode C 1 - C 26...</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 mr-1">Filter Komponen:</span>
              {(['Semua', 'Kepribadian', 'Kerajinan', 'Kerapian'] as const).map(komp => (
                <button
                  key={komp}
                  type="button"
                  onClick={() => {
                    setPelFilterKomponen(komp);
                    setPelFilterSub('Semua');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    pelFilterKomponen === komp
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {komp === 'Semua' ? 'Semua Komponen' : komp}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Sub-Komponen</label>
                <select
                  value={pelFilterSub}
                  onChange={(e) => setPelFilterSub(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Semua">Semua Sub-Komponen</option>
                  {Array.from(new Set(
                    (pelFilterKomponen === 'Semua'
                      ? refPelanggaranList 
                      : refPelanggaranList.filter(p => p.komponen === pelFilterKomponen)
                    ).map(p => p.subKomponen)
                  )).sort().map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Kode / Kata Kunci</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={pelSearch}
                    onChange={(e) => setPelSearch(e.target.value)}
                    placeholder="Contoh: A 1, rokok, HP, seragam, senjata..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Master Pelanggaran */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3 text-center w-20">Kode</th>
                  <th className="py-3 px-3 w-40">Komponen / Sub</th>
                  <th className="py-3 px-3">Uraian Bentuk Pelanggaran</th>
                  <th className="py-3 px-3 text-center w-28">Bobot Poin</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refPelanggaranList
                  .filter(p => {
                    const matchKomponen = pelFilterKomponen === 'Semua' || p.komponen === pelFilterKomponen;
                    const matchSub = pelFilterSub === 'Semua' || p.subKomponen === pelFilterSub;
                    const q = pelSearch.toLowerCase().trim();
                    const matchQ = !q || p.kode.toLowerCase().includes(q) || p.namaPelanggaran.toLowerCase().includes(q) || p.subKomponen.toLowerCase().includes(q);
                    return matchKomponen && matchSub && matchQ;
                  })
                  .map((p, idx) => {
                    const isA = p.kode.trim().toUpperCase().startsWith('A') || p.komponen === 'Kepribadian';
                    const isB = p.kode.trim().toUpperCase().startsWith('B') || p.komponen === 'Kerajinan';
                    
                    return (
                      <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-mono font-black text-xs border ${
                            isA 
                              ? 'bg-blue-100 text-blue-900 border-blue-300' 
                              : isB 
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                              : 'bg-purple-100 text-purple-900 border-purple-300'
                          }`}>
                            {p.kode}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 text-xs">{p.komponen}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{p.subKomponen}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 leading-relaxed">{p.namaPelanggaran}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full font-mono font-black text-xs ${
                            p.poin >= 100 
                              ? 'bg-red-700 text-white shadow-xs' 
                              : p.poin >= 50 
                              ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                              : p.poin >= 20 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            +{p.poin} Poin
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPelanggaran(p);
                                setPelanggaranModalOpen(true);
                              }}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                              title="Edit Jenis Pelanggaran"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus pelanggaran [${p.kode}] "${p.namaPelanggaran}"?`)) {
                                  onDeletePelanggaran(p.id);
                                  setPelanggaranSuccessMsg(`Pelanggaran [${p.kode}] berhasil dihapus.`);
                                  setTimeout(() => setPelanggaranSuccessMsg(''), 3000);
                                }
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                              title="Hapus Jenis Pelanggaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL EDIT / TAMBAH ADMIN */}
      {/* ========================================================= */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <h4 className="font-bold text-slate-900 text-base mb-4">
              {editingAdmin ? 'Edit Data Admin' : 'Tambah Admin Baru'}
            </h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const newAdmin: AdminUser = {
                  id: editingAdmin ? editingAdmin.id : 'ADM-' + ('00' + (admins.length + 1)).slice(-3),
                  username: (form.elements.namedItem('username') as HTMLInputElement).value,
                  nama: (form.elements.namedItem('nama') as HTMLInputElement).value,
                  role: (form.elements.namedItem('role') as HTMLSelectElement).value as any,
                  email: (form.elements.namedItem('email') as HTMLInputElement).value,
                  status: (form.elements.namedItem('status') as HTMLSelectElement).value as any
                };
                onSaveAdmin(newAdmin);
                setAdminModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <input
                  name="username"
                  defaultValue={editingAdmin?.username || ''}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  name="nama"
                  defaultValue={editingAdmin?.nama || ''}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peran / Jabatan</label>
                <select
                  name="role"
                  defaultValue={editingAdmin?.role || 'Super Admin'}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin BK">Admin BK</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editingAdmin?.email || ''}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editingAdmin?.status || 'Aktif'}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Data Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL EDIT / TAMBAH GURU */}
      {/* ========================================================= */}
      {guruModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <h4 className="font-bold text-slate-900 text-base mb-4">
              {editingGuru ? 'Edit Akun Guru' : 'Tambah Akun Guru Baru'}
            </h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const newGuru: Guru = {
                  id: editingGuru ? editingGuru.id : 'GUR-' + ('00' + (guruList.length + 1)).slice(-3),
                  nip: (form.elements.namedItem('nip') as HTMLInputElement).value,
                  nama: (form.elements.namedItem('nama') as HTMLInputElement).value,
                  jabatan: (form.elements.namedItem('jabatan') as HTMLInputElement).value,
                  kelasWali: (form.elements.namedItem('kelasWali') as HTMLInputElement).value,
                  noHp: (form.elements.namedItem('noHp') as HTMLInputElement).value,
                  status: (form.elements.namedItem('status') as HTMLSelectElement).value as any
                };
                onSaveGuru(newGuru);
                setGuruModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIP (Username Login)</label>
                <input
                  name="nip"
                  defaultValue={editingGuru?.nip || ''}
                  required
                  placeholder="19780512..."
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  name="nama"
                  defaultValue={editingGuru?.nama || ''}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan</label>
                <input
                  name="jabatan"
                  defaultValue={editingGuru?.jabatan || 'Wali Kelas & Guru'}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Binaan / Wali (Misal: 7A, 8B)</label>
                <input
                  name="kelasWali"
                  defaultValue={editingGuru?.kelasWali || ''}
                  placeholder="7A"
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WhatsApp</label>
                <input
                  name="noHp"
                  defaultValue={editingGuru?.noHp || ''}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editingGuru?.status || 'Aktif'}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setGuruModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Akun Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL EDIT / TAMBAH MURID */}
      {/* ========================================================= */}
      {muridModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <h4 className="font-bold text-slate-900 text-base mb-4">
              {editingMurid ? 'Edit Data Murid' : 'Tambah Murid Baru'}
            </h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const waliKelasVal = (form.elements.namedItem('waliKelas') as HTMLInputElement).value;
                const guruWaliVal = (form.elements.namedItem('guruWali') as HTMLInputElement).value || waliKelasVal;
                const newMurid: Murid = {
                  id: editingMurid ? editingMurid.id : 'MUR-' + ('000' + (muridList.length + 1)).slice(-4),
                  nisn: (form.elements.namedItem('nisn') as HTMLInputElement).value,
                  nis: (form.elements.namedItem('nis') as HTMLInputElement).value,
                  nama: (form.elements.namedItem('nama') as HTMLInputElement).value,
                  kelas: (form.elements.namedItem('kelas') as HTMLSelectElement).value,
                  jenisKelamin: (form.elements.namedItem('jenisKelamin') as HTMLSelectElement).value as 'L' | 'P',
                  waliKelas: waliKelasVal,
                  guruWali: guruWaliVal
                };
                onSaveMurid(newMurid);
                setMuridModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NISN (10 Digit)</label>
                <input
                  name="nisn"
                  defaultValue={editingMurid?.nisn || ''}
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIS</label>
                <input
                  name="nis"
                  defaultValue={editingMurid?.nis || ''}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  name="nama"
                  defaultValue={editingMurid?.nama || ''}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    name="kelas"
                    defaultValue={editingMurid?.kelas || '7A'}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-bold"
                  >
                    {DAFTAR_KELAS.map(k => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    name="jenisKelamin"
                    defaultValue={editingMurid?.jenisKelamin || 'L'}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wali Kelas</label>
                  <input
                    name="waliKelas"
                    defaultValue={editingMurid?.waliKelas || ''}
                    required
                    placeholder="Ahmad Fauzi, S.Pd."
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelompok Guru Wali</label>
                  <input
                    name="guruWali"
                    defaultValue={editingMurid?.guruWali || editingMurid?.waliKelas || ''}
                    placeholder="Nama Guru Wali..."
                    list="guruWaliModalOptions"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                  <datalist id="guruWaliModalOptions">
                    {daftarSemuaGuruWali.map(gw => (
                      <option key={gw} value={gw} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMuridModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Data Murid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL EDIT / TAMBAH JENIS PELANGGARAN */}
      {/* ========================================================= */}
      {pelanggaranModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                {editingPelanggaran ? 'Edit Jenis Pelanggaran' : 'Tambah Jenis Pelanggaran Baru'}
              </h4>
              <button
                type="button"
                onClick={() => setPelanggaranModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const newId = editingPelanggaran ? editingPelanggaran.id : 'PEL-' + Date.now();
                const kode = (form.elements.namedItem('kode') as HTMLInputElement).value.trim();
                const komponen = (form.elements.namedItem('komponen') as HTMLSelectElement).value as KomponenPelanggaran;
                const subKomponen = (form.elements.namedItem('subKomponen') as HTMLInputElement).value.trim() || 'Umum';
                const namaPelanggaran = (form.elements.namedItem('namaPelanggaran') as HTMLTextAreaElement).value.trim();
                const poin = Number((form.elements.namedItem('poin') as HTMLInputElement).value) || 0;

                const newPel: JenisPelanggaran = {
                  id: newId,
                  kode: kode,
                  komponen: komponen,
                  subKomponen: subKomponen,
                  namaPelanggaran: namaPelanggaran,
                  poin: poin
                };

                onSavePelanggaran(newPel);
                setPelanggaranModalOpen(false);
                setPelanggaranSuccessMsg(`Pelanggaran [${kode}] berhasil ${editingPelanggaran ? 'diperbarui' : 'ditambahkan'}.`);
                setTimeout(() => setPelanggaranSuccessMsg(''), 3000);
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Pelanggaran *
                  </label>
                  <input
                    name="kode"
                    defaultValue={editingPelanggaran?.kode || ''}
                    required
                    placeholder="Contoh: A 46, B 20, C 27"
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-indigo-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">A (Kepribadian), B (Kerajinan), C (Kerapian)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Komponen (Bab V) *
                  </label>
                  <select
                    name="komponen"
                    defaultValue={editingPelanggaran?.komponen || 'Kepribadian'}
                    className="w-full px-3 py-2 border rounded-xl bg-white font-bold text-slate-800"
                  >
                    <option value="Kepribadian">(1) Kepribadian (Kode A)</option>
                    <option value="Kerajinan">(2) Kerajinan (Kode B)</option>
                    <option value="Kerapian">(3) Kerapian (Kode C)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sub-Komponen / Topik *
                </label>
                <input
                  name="subKomponen"
                  defaultValue={editingPelanggaran?.subKomponen || ''}
                  required
                  list="subKomponenSuggestions"
                  placeholder="Contoh: Ketertiban, Rokok, Senjata, Keterlambatan, Pakaian..."
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                />
                <datalist id="subKomponenSuggestions">
                  <option value="Ketertiban" />
                  <option value="Rokok" />
                  <option value="Buku & Media Terlarang" />
                  <option value="Senjata" />
                  <option value="Obat / Minuman Terlarang" />
                  <option value="Perkelahian" />
                  <option value="Terhadap Guru & Staf" />
                  <option value="Pemerasan & Bullying" />
                  <option value="Pelecehan Seksual" />
                  <option value="Tindakan Kriminal" />
                  <option value="Pemalsuan" />
                  <option value="Geng & Organisasi Nakal" />
                  <option value="Keterlambatan" />
                  <option value="Kehadiran" />
                  <option value="Upacara Bendera" />
                  <option value="Kegiatan Sekolah" />
                  <option value="Pakaian & Atribut" />
                  <option value="Rambut" />
                  <option value="Kuku" />
                  <option value="Tindik & Aksesoris" />
                  <option value="Tato & Tubuh" />
                </datalist>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama / Uraian Pelanggaran *
                </label>
                <textarea
                  name="namaPelanggaran"
                  defaultValue={editingPelanggaran?.namaPelanggaran || ''}
                  required
                  rows={2}
                  placeholder="Deskripsikan bentuk pelanggaran secara jelas..."
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bobot Poin Pelanggaran (Angka) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="inputPoinModal"
                    name="poin"
                    type="number"
                    min="1"
                    max="100"
                    defaultValue={editingPelanggaran?.poin || 5}
                    required
                    className="w-32 px-3 py-2 border rounded-xl font-mono font-black text-rose-600 bg-white"
                  />
                  <span className="text-slate-500 font-medium">Poin sanksi</span>
                </div>
                
                {/* Quick Select Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 mr-1">Pilihan Cepat:</span>
                  {[1, 2, 5, 10, 15, 20, 25, 50, 75, 100].map(pt => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('inputPoinModal') as HTMLInputElement;
                        if (el) el.value = String(pt);
                      }}
                      className="px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold bg-slate-50 hover:bg-slate-200 text-slate-700"
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPelanggaranModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20"
                >
                  {editingPelanggaran ? 'Simpan Perubahan' : 'Tambahkan Pelanggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

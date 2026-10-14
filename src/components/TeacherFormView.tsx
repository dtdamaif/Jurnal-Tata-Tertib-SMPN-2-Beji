import React, { useState, useEffect, useMemo } from 'react';
import { 
  LogIn, UserCheck, Calendar, Clock, Users, 
  CheckSquare, Camera, UploadCloud, X, AlertCircle, CheckCircle2, 
  FileText, Send, LogOut, Search, ShieldAlert, Award
} from 'lucide-react';
import { Guru, Murid, JenisPelanggaran, LogPelanggaran, KomponenPelanggaran, getSanksiByPoin } from '../types';
import { DAFTAR_KELAS, GAS_CONFIG } from '../data/initialData';

interface TeacherFormViewProps {
  guruList: Guru[];
  muridList: Murid[];
  refPelanggaranList: JenisPelanggaran[];
  currentGuru: Guru | null;
  onLoginGuru: (nip: string, pass: string) => boolean;
  onLogoutGuru: () => void;
  onSubmitPelanggaran: (newLog: LogPelanggaran, fileObj?: { base64: string; mimeType: string; filename: string }) => void;
}

export const TeacherFormView: React.FC<TeacherFormViewProps> = ({
  guruList,
  muridList,
  refPelanggaranList,
  currentGuru,
  onLoginGuru,
  onLogoutGuru,
  onSubmitPelanggaran
}) => {
  // Login State
  const [inputNip, setInputNip] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // 6 FORM FIELDS
  // Form 1: Tanggal (default today YYYY-MM-DD)
  const [tanggal, setTanggal] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Form 2: Hari (Otomatis)
  const [hari, setHari] = useState('');

  // Form 3: Kelas (Statis 7A-7H, 8A-8H, 9A-9H)
  const [kelas, setKelas] = useState('');

  // Form 4: Nama Murid (Dinamis dari kelas)
  const [selectedNisn, setSelectedNisn] = useState('');

  // Form 5: Jenis Pelanggaran (Multiple Select & Akumulasi Poin)
  const [selectedPelanggaranIds, setSelectedPelanggaranIds] = useState<string[]>([]);
  const [komponenFilter, setKomponenFilter] = useState<'Semua' | KomponenPelanggaran>('Semua');
  const [subKomponenFilter, setSubKomponenFilter] = useState('Semua');
  const [searchPelanggaran, setSearchPelanggaran] = useState('');

  // Form 6: Upload Foto Bukti (Google Drive Folder)
  const [fotoBase64, setFotoBase64] = useState<string>('');
  const [fotoFileName, setFotoFileName] = useState<string>('');
  const [catatan, setCatatan] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Auto calculate hari when tanggal changes
  useEffect(() => {
    if (!tanggal) return;
    const dateObj = new Date(tanggal + 'T00:00:00');
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    setHari(namaHari[dateObj.getDay()]);
  }, [tanggal]);

  // Reset selected student when class changes
  const handleKelasChange = (newKelas: string) => {
    setKelas(newKelas);
    setSelectedNisn('');
  };

  // Dinamis list murid berdasarkan kelas
  const muridByKelas = useMemo(() => {
    if (!kelas) return [];
    return muridList.filter(m => m.kelas === kelas);
  }, [muridList, kelas]);

  // Selected student object
  const currentMurid = useMemo(() => {
    return muridList.find(m => m.nisn === selectedNisn) || null;
  }, [muridList, selectedNisn]);

  // Subkomponen options according to active Komponen filter
  const availableSubKomponen = useMemo(() => {
    const filtered = komponenFilter === 'Semua' 
      ? refPelanggaranList 
      : refPelanggaranList.filter(p => p.komponen === komponenFilter);
    return Array.from(new Set(filtered.map(p => p.subKomponen)));
  }, [refPelanggaranList, komponenFilter]);

  // Total Poin Pelanggaran terakumulasi dari Form 5
  const { totalPoin, selectedItems } = useMemo(() => {
    const items = refPelanggaranList.filter(p => selectedPelanggaranIds.includes(p.id));
    const total = items.reduce((sum, item) => sum + item.poin, 0);
    return { totalPoin: total, selectedItems: items };
  }, [refPelanggaranList, selectedPelanggaranIds]);

  // Sanksi & Pembinaan yang akan dikenakan
  const sanksiPreview = useMemo(() => {
    return getSanksiByPoin(totalPoin);
  }, [totalPoin]);

  // Handle Multi-Select Checkbox
  const togglePelanggaran = (id: string) => {
    setSelectedPelanggaranIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Filtered pelanggaran list
  const filteredRefPelanggaran = useMemo(() => {
    return refPelanggaranList.filter(p => {
      const matchKomponen = komponenFilter === 'Semua' || p.komponen === komponenFilter;
      const matchSub = subKomponenFilter === 'Semua' || p.subKomponen === subKomponenFilter;
      const query = searchPelanggaran.toLowerCase().trim();
      const matchQuery = !query || 
        p.namaPelanggaran.toLowerCase().includes(query) ||
        p.kode.toLowerCase().includes(query) ||
        p.subKomponen.toLowerCase().includes(query);
      return matchKomponen && matchSub && matchQuery;
    });
  }, [refPelanggaranList, komponenFilter, subKomponenFilter, searchPelanggaran]);

  // Handle File Upload & Base64 Converter
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 5 MB!');
      return;
    }

    setFotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFotoBase64('');
    setFotoFileName('');
  };

  // Handle Login Submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = onLoginGuru(inputNip, inputPass);
    if (!success) {
      setLoginError('NIP atau Password salah! Periksa kembali atau gunakan tombol akun pengujian.');
    }
  };

  // Quick Login Helper for Testing
  const quickLoginAs = (guru: Guru) => {
    setInputNip(guru.nip);
    setInputPass(GAS_CONFIG.guruDefaultPassword);
    onLoginGuru(guru.nip, GAS_CONFIG.guruDefaultPassword);
  };

  // Submit Form Pelanggaran
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGuru) {
      alert('Sesi guru berakhir. Harap login kembali.');
      return;
    }
    if (!tanggal || !hari || !kelas || !selectedNisn) {
      alert('Harap lengkapi Tanggal, Kelas, dan Nama Murid!');
      return;
    }
    if (selectedPelanggaranIds.length === 0) {
      alert('Pilih setidaknya 1 (satu) jenis pelanggaran di Form 5!');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Mock upload URL to the specific Google Drive Folder ID
      const driveFileUrl = fotoBase64 
        ? fotoBase64 
        : `https://drive.google.com/file/d/${GAS_CONFIG.driveFolderId}/view`;

      const newLog: LogPelanggaran = {
        id: 'LOG-' + Date.now(),
        tanggal: tanggal,
        hari: hari,
        kelas: kelas,
        nisn: selectedNisn,
        namaMurid: currentMurid ? currentMurid.nama : 'Murid',
        pelanggaranList: selectedItems.map(item => ({
          id: item.id,
          kode: item.kode,
          nama: item.namaPelanggaran,
          poin: item.poin,
          komponen: item.komponen,
          subKomponen: item.subKomponen
        })),
        totalPoin: totalPoin,
        fotoBuktiUrl: driveFileUrl,
        fotoFileName: fotoFileName || 'bukti_pelanggaran.jpg',
        catatan: catatan,
        guruNip: currentGuru.nip,
        guruNama: currentGuru.nama,
        timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      };

      const filePayload = fotoBase64 ? {
        base64: fotoBase64.includes(',') ? fotoBase64.split(',')[1] : fotoBase64,
        mimeType: 'image/jpeg',
        filename: fotoFileName || `bukti_${selectedNisn}_${Date.now()}.jpg`
      } : undefined;

      onSubmitPelanggaran(newLog, filePayload);
      setIsSubmitting(false);
      setSuccessMessage(`Berhasil mencatat pelanggaran untuk ${newLog.namaMurid} (+${totalPoin} Poin)! Sanksi: "${sanksiPreview.sanksi}". Data tersimpan ke Spreadsheet.`);

      // Reset form fields
      setSelectedPelanggaranIds([]);
      setFotoBase64('');
      setFotoFileName('');
      setCatatan('');
    }, 700);
  };

  // IF NOT LOGGED IN: SHOW GURU LOGIN FORM
  if (!currentGuru) {
    return (
      <div className="max-w-lg mx-auto my-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white text-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 backdrop-blur-sm shadow-inner">
              <LogIn className="w-7 h-7 text-yellow-300" />
            </div>
            <h2 className="text-xl font-black">Portal Pendidik / Guru Piket</h2>
            <p className="text-xs text-blue-200 mt-1">
              SMP Negeri 2 Beji &bull; Sistem Pencatatan Pelanggaran Siswa
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username (NIP Guru)
                </label>
                <input
                  type="text"
                  required
                  value={inputNip}
                  onChange={(e) => setInputNip(e.target.value)}
                  placeholder="Contoh: 197805122005011003"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  value={inputPass}
                  onChange={(e) => setInputPass(e.target.value)}
                  placeholder="Default: Smpn2Beji"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Password bawaan sistem: <code className="font-bold text-blue-700">Smpn2Beji</code>
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-700/25 transition-all text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Form Input Pelanggaran</span>
              </button>
            </form>

            {/* Quick Demo Login Option */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 text-center">
                Pilih Cepat Akun Guru (Uji Coba Sistem)
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {guruList.slice(0, 4).map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => quickLoginAs(g)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{g.nama}</div>
                      <div className="text-[10px] text-slate-400">NIP: {g.nip} &bull; {g.jabatan}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md">
                      Pilih
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // IF LOGGED IN: SHOW 6-STEP VIOLATION FORM
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Teacher Session Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 text-yellow-300">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg">{currentGuru.nama}</h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-400/30">
                Pendidik Aktif
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              NIP: {currentGuru.nip} &bull; {currentGuru.jabatan}
            </p>
          </div>
        </div>

        <button
          onClick={onLogoutGuru}
          className="px-3.5 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sesi</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Pencatatan Berhasil Disimpan!</strong>
              <span>{successMessage}</span>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 6-Step Input Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Formulir Catatan Pelanggaran Siswa (Bab V)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mengacu pada Tata Tertib Resmi SMPN 2 Beji. Sistem mengkalkulasi poin secara otomatis dan menghubungkan ke tingkat sanksi pembinaan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7">
          
          {/* SECTION 1 & 2: DATE & DAY */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wide">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Waktu Kejadian (Form 1 & 2)</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Form 1: Pilih Tanggal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <span className="text-blue-700">Form 1:</span> Pilih Tanggal Kejadian *
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              {/* Form 2: Hari (Otomatis) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <span className="text-blue-700">Form 2:</span> Hari Kejadian (Otomatis Terisi)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    readOnly
                    value={hari ? `${hari}` : 'Menunggu tanggal...'}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 & 4: KELAS & NAMA MURID */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wide">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Identitas Pelanggar (Form 3 & 4)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Form 3: Pilih Kelas (Dropdown statis 7A-7H, 8A-8H, 9A-9H) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <span className="text-blue-700">Form 3:</span> Pilih Kelas (7A - 9H) *
                </label>
                <select
                  required
                  value={kelas}
                  onChange={(e) => handleKelasChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 bg-white font-medium"
                >
                  <option value="">-- Pilih Kelas Siswa --</option>
                  <optgroup label="Tingkat VII (Kelas 7)">
                    {DAFTAR_KELAS.filter(k => k.startsWith('7')).map(k => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Tingkat VIII (Kelas 8)">
                    {DAFTAR_KELAS.filter(k => k.startsWith('8')).map(k => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Tingkat IX (Kelas 9)">
                    {DAFTAR_KELAS.filter(k => k.startsWith('9')).map(k => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Form 4: Pilih Nama Murid (Dropdown dinamis sesuai kelas terpilih) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <span className="text-blue-700">Form 4:</span> Pilih Nama Murid (Dinamis Sesuai Kelas) *
                </label>
                <select
                  required
                  disabled={!kelas}
                  value={selectedNisn}
                  onChange={(e) => setSelectedNisn(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-blue-600 bg-white font-medium ${
                    !kelas ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'border-slate-300'
                  }`}
                >
                  <option value="">
                    {!kelas ? '-- Silakan Pilih Kelas Terlebih Dahulu --' : `-- Pilih Nama Murid (${muridByKelas.length} terdaftar) --`}
                  </option>
                  {muridByKelas.map(m => (
                    <option key={m.nisn} value={m.nisn}>
                      {m.nama} (NISN: {m.nisn} - {m.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'})
                    </option>
                  ))}
                </select>
                {currentMurid && (
                  <p className="text-[11px] text-blue-700 mt-1 font-medium">
                    Wali Kelas: {currentMurid.waliKelas} &bull; NIS: {currentMurid.nis}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 5: JENIS PELANGGARAN SESUAI BAB V PASAL 7, 8, 9 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wide">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span><span className="text-blue-700">Form 5:</span> Pilih Jenis Pelanggaran (Multiple Select - 90 Klasifikasi) *</span>
              </div>
              
              {/* Point Accumulation Live Counter & Sanksi Preview */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-600 font-semibold">Total Poin:</span>
                  <span className={`text-base font-black ${
                    totalPoin >= 100 ? 'text-red-700' : totalPoin >= 60 ? 'text-rose-600' : totalPoin > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {totalPoin} Poin
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({selectedPelanggaranIds.length} dipilih)
                  </span>
                </div>
              </div>
            </div>

            {/* Sanksi Preview Notification */}
            {totalPoin > 0 && (
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${sanksiPreview.bgCard}`}>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Tingkat Sanksi (Rentang {sanksiPreview.rentang} Poin): </strong>
                    {sanksiPreview.sanksi}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/60">
                  Level {sanksiPreview.level}
                </span>
              </div>
            )}

            {/* Komponen Filter Tabs: (1) Kepribadian (2) Kerajinan (3) Kerapian */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 text-xs font-bold">Komponen:</span>
              <button
                type="button"
                onClick={() => { setKomponenFilter('Semua'); setSubKomponenFilter('Semua'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  komponenFilter === 'Semua'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white border text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semua Komponen (90)
              </button>

              <button
                type="button"
                onClick={() => { setKomponenFilter('Kepribadian'); setSubKomponenFilter('Semua'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  komponenFilter === 'Kepribadian'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white border text-slate-600 hover:bg-slate-100'
                }`}
              >
                (1) Kepribadian (A 1 - A 45)
              </button>

              <button
                type="button"
                onClick={() => { setKomponenFilter('Kerajinan'); setSubKomponenFilter('Semua'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  komponenFilter === 'Kerajinan'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white border text-slate-600 hover:bg-slate-100'
                }`}
              >
                (2) Kerajinan (B 1 - B 19)
              </button>

              <button
                type="button"
                onClick={() => { setKomponenFilter('Kerapian'); setSubKomponenFilter('Semua'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  komponenFilter === 'Kerapian'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white border text-slate-600 hover:bg-slate-100'
                }`}
              >
                (3) Kerapian (C 1 - C 26)
              </button>
            </div>

            {/* Sub-komponen and Search Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <select
                  value={subKomponenFilter}
                  onChange={(e) => setSubKomponenFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Semua">Semua Sub-Komponen</option>
                  {availableSubKomponen.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchPelanggaran}
                  onChange={(e) => setSearchPelanggaran(e.target.value)}
                  placeholder="Cari kode (A 1, B 2, C 16) atau kata..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Checklist Box of 90 Items */}
            <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 divide-y divide-slate-100">
              {filteredRefPelanggaran.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada jenis pelanggaran yang cocok dengan pencarian / filter.
                </div>
              ) : (
                filteredRefPelanggaran.map(pel => {
                  const isChecked = selectedPelanggaranIds.includes(pel.id);
                  return (
                    <label
                      key={pel.id}
                      className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePelanggaran(pel.id)}
                        className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] font-black px-1.5 py-0.5 rounded border ${
                            pel.kode.startsWith('A') 
                              ? 'bg-blue-100 text-blue-800 border-blue-300' 
                              : pel.kode.startsWith('B') 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                              : 'bg-purple-100 text-purple-800 border-purple-300'
                          }`}>
                            {pel.kode}
                          </span>
                          <span className="font-bold text-slate-800">{pel.namaPelanggaran}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Komponen {pel.komponen}</span>
                          <span>&bull;</span>
                          <span>Sub: {pel.subKomponen}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                        pel.poin >= 50 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        +{pel.poin}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

          </div>

          {/* SECTION 6: UPLOAD FOTO BUKTI & GOOGLE DRIVE INTEGRATION */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wide">
                <Camera className="w-4 h-4 text-blue-600" />
                <span><span className="text-blue-700">Form 6:</span> Upload Foto Bukti Pelanggaran</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                Drive ID: {GAS_CONFIG.driveFolderId.slice(0, 10)}...
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Dokumentasikan bukti nyata (seragam, rambut, keterlambatan, dll). Foto otomatis diunggah ke Google Drive Folder sekolah dan link-nya disimpan di baris data Spreadsheet.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-blue-500 transition-colors bg-white">
              {!fotoBase64 ? (
                <div>
                  <input
                    type="file"
                    id="fotoPelanggaran"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="fotoPelanggaran"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2 py-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-700 underline">Pilih foto dari galeri / kamera</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Mendukung format JPG, PNG (Maks 5 MB)</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <img
                      src={fotoBase64}
                      alt="Preview Bukti"
                      className="max-h-48 rounded-xl border border-slate-200 shadow-sm mx-auto object-cover"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md"
                      title="Hapus foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 font-medium flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>File siap diunggah: <strong>{fotoFileName}</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CATATAN KRONOLOGI TAMBAHAN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan Kronologi / Tindakan Sementara (Opsional)
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Siswa melanggar aturan A 10 (keluar loncat pagar) dan A 20 (merokok di kantin belakang)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                isSubmitting 
                  ? 'bg-slate-400 cursor-wait' 
                  : 'bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 shadow-blue-700/25 active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengunggah Foto ke Drive & Menyimpan ke Spreadsheet...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Simpan Catatan Pelanggaran ({totalPoin} Poin)</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

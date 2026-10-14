import React, { useState, useMemo } from 'react';
import { 
  Trophy, Search, Filter, AlertTriangle, CheckCircle, 
  Eye, FileText, ChevronRight, User, ShieldAlert, Sparkles, X, Calendar, Award, BookOpen
} from 'lucide-react';
import { 
  Murid, LogPelanggaran, PengaturanLembaga, getSanksiByPoin, 
  getPenilaianTigaKomponen 
} from '../types';
import { DAFTAR_KELAS } from '../data/initialData';

interface LeaderboardViewProps {
  muridList: Murid[];
  logs: LogPelanggaran[];
  pengaturan: PengaturanLembaga;
  onOpenReportPrint?: (murid: Murid) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  muridList,
  logs,
  pengaturan,
  onOpenReportPrint
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('Semua');
  const [selectedMuridDetail, setSelectedMuridDetail] = useState<Murid | null>(null);

  // Hitung akumulasi poin per murid
  const leaderboardData = useMemo(() => {
    const poinMap: { [nisn: string]: number } = {};
    const historyMap: { [nisn: string]: LogPelanggaran[] } = {};

    logs.forEach(log => {
      poinMap[log.nisn] = (poinMap[log.nisn] || 0) + log.totalPoin;
      if (!historyMap[log.nisn]) historyMap[log.nisn] = [];
      historyMap[log.nisn].push(log);
    });

    const combined = muridList.map(m => {
      const total = poinMap[m.nisn] || 0;
      return {
        ...m,
        totalPoin: total,
        logs: historyMap[m.nisn] || []
      };
    });

    // Urutkan dari poin tertinggi ke terendah (Descending)
    return combined.sort((a, b) => (b.totalPoin || 0) - (a.totalPoin || 0));
  }, [muridList, logs]);

  // Filter berdasarkan pencarian & kelas
  const filteredData = useMemo(() => {
    return leaderboardData.filter(item => {
      const matchKelas = selectedKelas === 'Semua' || item.kelas === selectedKelas;
      const matchQuery = 
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nisn.includes(searchQuery) ||
        item.nis.includes(searchQuery);
      return matchKelas && matchQuery;
    });
  }, [leaderboardData, selectedKelas, searchQuery]);

  // Statistik Ringkas berdasarkan aturan resmi
  const stats = useMemo(() => {
    const totalSiswa = muridList.length;
    const siswaMelanggar = leaderboardData.filter(m => (m.totalPoin || 0) > 0).length;
    const kasusOrtuSkors = leaderboardData.filter(m => (m.totalPoin || 0) >= 41).length;
    const totalPoinAkumulasi = logs.reduce((sum, l) => sum + l.totalPoin, 0);

    return { totalSiswa, siswaMelanggar, kasusOrtuSkors, totalPoinAkumulasi };
  }, [muridList, leaderboardData, logs]);

  // Detail perhitungan 3 komponen siswa terpilih (Bab VI)
  const muridDetailPenilaian = useMemo(() => {
    if (!selectedMuridDetail) return null;
    return getPenilaianTigaKomponen(selectedMuridDetail.logs || []);
  }, [selectedMuridDetail]);

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-blue-700/40">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-12 top-6 hidden lg:block opacity-15 text-yellow-400">
          <Trophy className="w-56 h-56" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-bold mb-3 border border-yellow-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            Papan Peringkat Kedisiplinan Terbuka & Sanksi Resmi
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Leaderboard Pelanggaran Tata Tertib
          </h2>
          <p className="mt-2 text-sm text-blue-200/90 leading-relaxed">
            Data pemantauan ketertiban peserta didik {pengaturan.namaSekolah} sesuai Tata Tertib Bab V & Bab VI. Diurutkan otomatis dari akumulasi poin tertinggi ke terendah.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-xs text-blue-200 font-medium">Total Terdata</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{stats.totalSiswa}</div>
            <span className="text-[10px] text-blue-300">Peserta Didik (7A-9H)</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-xs text-blue-200 font-medium">Ada Catatan Poin</span>
            <div className="text-xl sm:text-2xl font-black text-yellow-300 mt-0.5">{stats.siswaMelanggar}</div>
            <span className="text-[10px] text-yellow-200/80">Perlu Pembinaan</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-xs text-blue-200 font-medium">Panggilan Ortu / Skors</span>
            <div className="text-xl sm:text-2xl font-black text-rose-400 mt-0.5">{stats.kasusOrtuSkors}</div>
            <span className="text-[10px] text-rose-300">Poin &ge; 41</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-xs text-blue-200 font-medium">Total Poin Masuk</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">{stats.totalPoinAkumulasi}</div>
            <span className="text-[10px] text-amber-200/80">Akumulasi Semua Siswa</span>
          </div>
        </div>
      </div>

      {/* Referensi Rentang Sanksi Resmi (Accordion / Legend) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Pedoman Sanksi & Pembinaan Resmi SMPN 2 Beji
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
            <strong className="block font-mono text-amber-700">1 - 20 Poin</strong>
            Teguran lisan & pembinaan
          </div>
          <div className="p-2 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-950">
            <strong className="block font-mono text-yellow-700">21 - 40 Poin</strong>
            Teguran tertulis & pembinaan
          </div>
          <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-950">
            <strong className="block font-mono text-orange-700">41 - 60 Poin</strong>
            Panggilan orang tua
          </div>
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
            <strong className="block font-mono text-rose-700">61 - 80 Poin</strong>
            Panggilan ortu + skors 3 hari
          </div>
          <div className="p-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-950">
            <strong className="block font-mono text-rose-800">81 - 99 Poin</strong>
            Panggilan ortu + skors 6 hari
          </div>
          <div className="p-2 rounded-xl bg-red-100 border border-red-300 text-red-950 font-bold">
            <strong className="block font-mono text-red-700">100 Poin</strong>
            Dikembalikan ke orang tua / Drop Out
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau NISN murid..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Kelas */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter Kelas:</label>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
          >
            <option value="Semua">Semua Kelas (7A - 9H)</option>
            {DAFTAR_KELAS.map(k => (
              <option key={k} value={k}>Kelas {k}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-4 text-center w-20">Peringkat</th>
                <th className="py-4 px-4">Nama Peserta Didik</th>
                <th className="py-4 px-4 text-center">Kelas</th>
                <th className="py-4 px-4">Wali Kelas</th>
                <th className="py-4 px-4 text-center">Total Poin</th>
                <th className="py-4 px-4">Bentuk Sanksi / Pembinaan Resmi</th>
                <th className="py-4 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Tidak ada murid yang sesuai dengan filter.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const points = item.totalPoin || 0;
                  const sanksi = getSanksiByPoin(points);
                  
                  // Rank badge
                  let rankContent = (
                    <span className="font-mono font-bold text-slate-500 text-xs">
                      #{index + 1}
                    </span>
                  );
                  if (index === 0 && points > 0) {
                    rankContent = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-sm ring-2 ring-amber-300/60">
                        1 🥇
                      </span>
                    );
                  } else if (index === 1 && points > 0) {
                    rankContent = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-300 text-slate-800 font-black text-xs shadow-sm">
                        2 🥈
                      </span>
                    );
                  } else if (index === 2 && points > 0) {
                    rankContent = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-600 text-white font-black text-xs shadow-sm">
                        3 🥉
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        points >= 61 ? 'bg-rose-50/40' : points >= 41 ? 'bg-orange-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        {rankContent}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {item.nama}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {item.jenisKelamin === 'L' ? 'L' : 'P'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          NISN: {item.nisn} &bull; NIS: {item.nis}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg border border-blue-200/80">
                          {item.kelas}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {item.waliKelas || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-xl font-black text-sm ${
                          points >= 100 
                            ? 'bg-red-700 text-white shadow-sm' 
                            : points >= 61 
                            ? 'bg-rose-600 text-white' 
                            : points >= 41 
                            ? 'bg-orange-500 text-white' 
                            : points >= 21 
                            ? 'bg-yellow-200 text-yellow-950 font-bold' 
                            : points > 0 
                            ? 'bg-amber-100 text-amber-900' 
                            : 'text-slate-400 font-medium'
                        }`}>
                          {points} Poin
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${sanksi.badgeColor}`}>
                          {points >= 41 && <ShieldAlert className="w-3.5 h-3.5 shrink-0" />}
                          {points <= 0 && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                          <span>{sanksi.sanksi}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedMuridDetail(item)}
                          className="px-2.5 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors text-xs font-semibold inline-flex items-center gap-1"
                          title="Lihat Evaluasi 3 Komponen & Riwayat"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Rapor & Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL RIWAYAT PELANGGARAN & RAPOR KEDISIPLINAN BAB VI */}
      {selectedMuridDetail && muridDetailPenilaian && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-yellow-300 uppercase">
                  Buku Catatan Kedisiplinan & Rapor Tata Tertib
                </span>
                <h3 className="text-xl font-black">{selectedMuridDetail.nama}</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Kelas {selectedMuridDetail.kelas} &bull; NISN: {selectedMuridDetail.nisn} &bull; Wali: {selectedMuridDetail.waliKelas}
                </p>
              </div>
              <button
                onClick={() => setSelectedMuridDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Points & Sanksi Callout */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500 font-medium">Total Akumulasi Poin:</span>
                <div className="text-2xl font-black text-rose-600">
                  {selectedMuridDetail.totalPoin || 0} Poin
                </div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  Sanksi: {getSanksiByPoin(selectedMuridDetail.totalPoin || 0).sanksi}
                </div>
              </div>
              <div>
                {onOpenReportPrint && (
                  <button
                    onClick={() => {
                      onOpenReportPrint(selectedMuridDetail);
                      setSelectedMuridDetail(null);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Cetak Berita Acara & Rapor
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* BAB VI: PENILAIAN 3 KOMPONEN (PASAL 10) */}
              <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" />
                    Bab VI Pasal 10: Penilaian 3 Komponen Kedisiplinan
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Standar SMPN 2 Beji</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Komponen 1: Kelakuan / Kepribadian */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 block">1. Kepribadian</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-black text-slate-800 font-mono">
                        {muridDetailPenilaian.kepribadian.huruf}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({muridDetailPenilaian.kepribadian.poin} Poin)</span>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${muridDetailPenilaian.kepribadian.color}`}>
                      {muridDetailPenilaian.kepribadian.predikat}
                    </span>
                  </div>

                  {/* Komponen 2: Kerajinan */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 block">2. Kerajinan</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-black text-slate-800 font-mono">
                        {muridDetailPenilaian.kerajinan.huruf}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({muridDetailPenilaian.kerajinan.poin} Poin)</span>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${muridDetailPenilaian.kerajinan.color}`}>
                      {muridDetailPenilaian.kerajinan.predikat}
                    </span>
                  </div>

                  {/* Komponen 3: Kerapian */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 block">3. Kerapian</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-black text-slate-800 font-mono">
                        {muridDetailPenilaian.kerapian.huruf}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({muridDetailPenilaian.kerapian.poin} Poin)</span>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${muridDetailPenilaian.kerapian.color}`}>
                      {muridDetailPenilaian.kerapian.predikat}
                    </span>
                  </div>

                </div>

                <div className="text-[10px] text-slate-400 leading-tight">
                  Keterangan Predikat: 0 = A (Baik Sekali), 1-25 = B (Baik), 26-75 = C (Cukup), 76-99 = D (Kurang), &ge; 100 = E (Sangat Kurang).
                </div>
              </div>

              {/* TIMELINE CATATAN PELANGGARAN */}
              <div>
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide mb-3">
                  Riwayat Kasus Pelanggaran Siswa:
                </h4>

                {(!selectedMuridDetail.logs || selectedMuridDetail.logs.length === 0) ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <h5 className="font-bold text-slate-800 text-sm">Tidak Ada Catatan Pelanggaran</h5>
                    <p className="text-xs text-slate-500 mt-1">Siswa ini memiliki rekam jejak tata tertib yang sangat baik.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMuridDetail.logs.map((log: LogPelanggaran, lIdx: number) => (
                      <div 
                        key={log.id || lIdx} 
                        className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-colors shadow-xs space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {log.hari}, {log.tanggal}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {log.timestamp}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-700 font-black text-xs rounded-lg">
                            +{log.totalPoin} Poin
                          </span>
                        </div>

                        {/* Violation list */}
                        <div>
                          <ul className="space-y-1">
                            {log.pelanggaranList.map((p, pIdx: number) => (
                              <li key={pIdx} className="text-xs text-slate-800 flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                                <span className="font-mono text-[10px] font-black text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                                  {p.kode}
                                </span>
                                <span className="flex-1 font-medium">{p.nama}</span>
                                <span className="font-bold text-rose-600 font-mono">+{p.poin}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Catatan kronologi */}
                        {log.catatan && (
                          <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/70 p-2.5 rounded-xl">
                            <span className="font-semibold text-amber-900">Kronologi: </span>
                            {log.catatan}
                          </div>
                        )}

                        {/* Foto Bukti Google Drive */}
                        {log.fotoBuktiUrl && (
                          <div className="pt-1">
                            <span className="text-[11px] font-bold text-slate-600 block mb-1">Bukti Foto (Google Drive):</span>
                            <div className="flex items-center gap-3">
                              <img 
                                src={log.fotoBuktiUrl} 
                                alt="Bukti" 
                                className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm"
                              />
                              <a 
                                href={log.fotoBuktiUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1"
                              >
                                Buka Foto di Drive
                                <ChevronRight className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Reporting Guru */}
                        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <span>Guru Pelapor: <strong className="text-slate-600">{log.guruNama}</strong></span>
                          <span>NIP: {log.guruNip}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedMuridDetail(null)}
                className="px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

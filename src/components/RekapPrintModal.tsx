import React, { useState } from 'react';
import { Printer, X, School, Users, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Murid, LogPelanggaran, PengaturanLembaga, getSanksiByPoin } from '../types';

export interface RekapItem {
  murid: Murid;
  studentLogs: LogPelanggaran[];
  totalPoin: number;
  totalKasus: number;
  ringkasanPelanggaran: string;
  sanksi: ReturnType<typeof getSanksiByPoin>;
}

interface RekapPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengaturan: PengaturanLembaga;
  filterKelas: string;
  filterWali: string;
  hanyaSiswaBerpoin: boolean;
  rekapItems: RekapItem[];
}

export const RekapPrintModal: React.FC<RekapPrintModalProps> = ({
  isOpen,
  onClose,
  pengaturan,
  filterKelas,
  filterWali,
  hanyaSiswaBerpoin,
  rekapItems
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  if (!isOpen) return null;

  const totalSiswaMelanggar = rekapItems.filter(r => r.totalPoin > 0).length;
  const grandTotalPoin = rekapItems.reduce((sum, r) => sum + r.totalPoin, 0);
  const totalKasusBerat = rekapItems.filter(r => r.totalPoin >= 41).length;

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Dynamic Print Stylesheet to ensure pristine paper output */}
      <style>{`
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 10mm 8mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * {
            visibility: hidden;
          }
          #printRekapArea, #printRekapArea * {
            visibility: visible;
          }
          #printRekapArea {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .print\\:hidden, .no-print {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #1e293b !important;
            padding: 4px 6px !important;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className={`bg-white w-full ${orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'} rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-4 flex flex-col max-h-[94vh]`}>
        
        {/* Top Control Header Bar (Hidden during printing) */}
        <div className="bg-slate-900 text-white p-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-yellow-300">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                Pratinjau Cetak Laporan Rekapitulasi Pelanggaran Siswa
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  {hanyaSiswaBerpoin ? 'Siswa Berpoin Saja (>0)' : 'Seluruh Siswa'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Format resmi Kop Surat Lembaga &bull; Filter: {filterKelas === 'Semua' ? 'Semua Kelas' : `Kelas ${filterKelas}`} &bull; {filterWali === 'Semua' ? 'Semua Guru Wali' : `Wali: ${filterWali}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Orientation Switcher */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  orientation === 'portrait' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Portrait (Tegak)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  orientation === 'landscape' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Landscape (Mendatar)
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Content */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-slate-100">
          
          <div 
            id="printRekapArea" 
            className="bg-white p-8 sm:p-10 shadow-sm border border-slate-200 text-black font-serif leading-relaxed text-xs space-y-4 mx-auto max-w-full"
            style={{ width: orientation === 'landscape' ? '100%' : '100%' }}
          >
            
            {/* KOP SURAT RESMI LEMBAGA */}
            <div className="flex items-center justify-between border-b-4 border-double border-black pb-3 gap-4">
              <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                {pengaturan.logoUrl ? (
                  <img 
                    src={pengaturan.logoUrl} 
                    alt="Logo Sekolah" 
                    className="max-h-20 max-w-20 object-contain"
                  />
                ) : (
                  <School className="w-16 h-16 text-black" />
                )}
              </div>
              
              <div className="text-center flex-1 space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase font-sans">
                  PEMERINTAH KABUPATEN PASURUAN
                </h4>
                <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase font-sans">
                  DINAS PENDIDIKAN
                </h4>
                <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase font-sans text-black">
                  {pengaturan.namaSekolah}
                </h2>
                <p className="text-[11px] italic font-sans text-slate-700">
                  {pengaturan.alamat}, {pengaturan.desaKecamatan}, {pengaturan.kabupatenKota}, Kode Pos: {pengaturan.kodePos}
                </p>
                <p className="text-[11px] font-sans text-slate-700">
                  Telp: {pengaturan.telepon} &bull; Email: {pengaturan.email} &bull; Web: {pengaturan.website}
                </p>
              </div>

              <div className="w-20 h-20 shrink-0 hidden sm:flex items-center justify-center font-sans">
                <div className="w-16 h-16 rounded-full border border-black flex flex-col items-center justify-center text-[9px] font-bold text-center p-1 leading-tight">
                  <span>NPSN:</span>
                  <span>{pengaturan.npsn}</span>
                </div>
              </div>
            </div>

            {/* JUDUL DOKUMEN LAPORAN */}
            <div className="text-center space-y-1 pt-1 font-sans">
              <h3 className="text-sm sm:text-base font-bold underline uppercase tracking-wide">
                LAPORAN REKAPITULASI PELANGGARAN TATA TERTIB & POIN DISIPLIN SISWA
              </h3>
              <p className="text-xs font-semibold text-slate-700">
                TAHUN PELAJARAN {pengaturan.tahunAjaran} &bull; SEMESTER {pengaturan.semester.toUpperCase()}
              </p>
            </div>

            {/* KOTAK INFORMASI FILTER & KRITERIA REKAP */}
            <div className="font-sans text-xs bg-slate-50 border border-slate-300 p-3 rounded-lg space-y-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Filter Kelas:</span>
                  <span className="font-bold text-slate-900">
                    {filterKelas === 'Semua' ? 'Seluruh Kelas (7A - 9H)' : `Kelas ${filterKelas}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Kelompok Guru Wali:</span>
                  <span className="font-bold text-slate-900 truncate block">
                    {filterWali === 'Semua' ? 'Seluruh Kelompok Guru Wali' : filterWali}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Kriteria Rekapitulasi:</span>
                  <span className="font-bold text-indigo-900">
                    {hanyaSiswaBerpoin ? 'Siswa Berpoin Saja (> 0 Poin)' : 'Semua Siswa Terdaftar'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Tanggal Cetak:</span>
                  <span className="font-mono text-slate-800">{currentDateStr}</span>
                </div>
              </div>

              {hanyaSiswaBerpoin && (
                <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200">
                  * Keterangan: Daftar ini <strong>hanya mencantumkan siswa yang memiliki catatan poin pelanggaran (&gt; 0 Poin)</strong>. Siswa dengan 0 poin (berdisiplin baik) tidak dicantumkan dalam rekap ini.
                </p>
              )}
            </div>

            {/* RINGKASAN REKAP DATA SINGKAT */}
            <div className="font-sans grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 border border-slate-300 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Siswa Melanggar</span>
                <span className="text-base font-black text-slate-900">{totalSiswaMelanggar} Siswa</span>
              </div>
              <div className="p-2 border border-slate-300 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Akumulasi Poin</span>
                <span className="text-base font-black text-rose-700">{grandTotalPoin} Poin</span>
              </div>
              <div className="p-2 border border-slate-300 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Kasus Butuh Panggilan Ortu / Skors (&ge;41)</span>
                <span className="text-base font-black text-amber-700">{totalKasusBerat} Siswa</span>
              </div>
            </div>

            {/* TABEL REKAPITULASI POIN SISWA */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border border-slate-400">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-400">
                  <tr>
                    <th className="border border-slate-400 p-2 text-center w-8">No</th>
                    <th className="border border-slate-400 p-2 text-center w-24">NISN / NIS</th>
                    <th className="border border-slate-400 p-2">Nama Siswa</th>
                    <th className="border border-slate-400 p-2 text-center w-10">L/P</th>
                    <th className="border border-slate-400 p-2 text-center w-14">Kelas</th>
                    <th className="border border-slate-400 p-2">Kelompok Guru Wali</th>
                    <th className="border border-slate-400 p-2 text-center w-12">Kasus</th>
                    <th className="border border-slate-400 p-2">Rincian Pelanggaran</th>
                    <th className="border border-slate-400 p-2 text-center w-14">Total Poin</th>
                    <th className="border border-slate-400 p-2">Ketentuan Sanksi & Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {rekapItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="border border-slate-400 p-6 text-center text-slate-500 italic">
                        {hanyaSiswaBerpoin
                          ? 'Tidak ada siswa yang memiliki catatan poin pelanggaran pada filter kelas / guru wali ini (Semua siswa berpoin 0).'
                          : 'Tidak ada data siswa ditemukan untuk kriteria filter ini.'}
                      </td>
                    </tr>
                  ) : (
                    rekapItems.map((item, idx) => (
                      <tr key={`${item.murid.id || item.murid.nisn || 'rek'}_${idx}`} className="hover:bg-slate-50">
                        <td className="border border-slate-400 p-2 text-center font-bold text-slate-700">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-400 p-2 text-center font-mono text-[10px]">
                          <div>{item.murid.nisn}</div>
                          <div className="text-slate-500">{item.murid.nis}</div>
                        </td>
                        <td className="border border-slate-400 p-2">
                          <div className="font-bold text-slate-900">{item.murid.nama}</div>
                        </td>
                        <td className="border border-slate-400 p-2 text-center font-bold text-slate-700">
                          {item.murid.jenisKelamin}
                        </td>
                        <td className="border border-slate-400 p-2 text-center font-bold">
                          {item.murid.kelas}
                        </td>
                        <td className="border border-slate-400 p-2 text-[11px] text-slate-700">
                          {item.murid.guruWali || item.murid.waliKelas || '-'}
                        </td>
                        <td className="border border-slate-400 p-2 text-center font-bold">
                          {item.totalKasus}x
                        </td>
                        <td className="border border-slate-400 p-2 text-[10px] text-slate-700 max-w-xs leading-snug">
                          {item.ringkasanPelanggaran}
                        </td>
                        <td className="border border-slate-400 p-2 text-center font-mono font-black text-sm text-rose-700 bg-rose-50/30">
                          +{item.totalPoin}
                        </td>
                        <td className="border border-slate-400 p-2 text-[11px]">
                          <span className="font-semibold text-slate-900">
                            {item.sanksi.sanksi}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            (Rentang: {item.sanksi.rentang} Poin)
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td colSpan={8} className="border border-slate-400 p-2 text-right">
                      Total Akumulasi Poin Pelanggaran:
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-mono font-black text-sm text-rose-700">
                      {grandTotalPoin}
                    </td>
                    <td className="border border-slate-400 p-2 text-[10px] text-slate-600">
                      {rekapItems.length} Siswa Terdaftar dalam Rekap
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* PEDOMAN TINDAK LANJUT RESMI */}
            <div className="font-sans text-[11px] bg-slate-50 border border-slate-300 p-3 rounded space-y-1">
              <span className="font-bold text-slate-900 block uppercase text-[10px]">
                Pedoman Pembinaan & Tindak Lanjut Tata Tertib (Bab V Aturan Disiplin):
              </span>
              <p className="text-slate-700">
                Laporan rekapitulasi ini digunakan sebagai dasar evaluasi kedisiplinan dan pembinaan peserta didik oleh Tim Bimbingan Konseling (BK), Wali Kelas, dan Kelompok Guru Wali guna menumbuhkan karakter profil pelajar berintegritas di lingkungan {pengaturan.namaSekolah}.
              </p>
            </div>

            {/* BAGIAN TANDA TANGAN RESMI PENGESAHAN */}
            <div className="pt-6 font-sans text-xs">
              <div className="flex justify-between items-start">
                
                {/* TTD Kiri: Koordinator Tatib & BK / Guru Wali */}
                <div className="text-center w-72 space-y-1">
                  <p>Mengetahui,</p>
                  <p className="font-bold">{pengaturan.jabatanPelapor}</p>
                  <div className="h-16 flex items-center justify-center italic text-slate-400 text-[10px]">
                    (Tanda Tangan)
                  </div>
                  <p className="font-bold underline text-slate-900">{pengaturan.namaPelapor}</p>
                  <p className="text-slate-600 font-mono text-[11px]">NIP. {pengaturan.nipPelapor}</p>
                </div>

                {/* TTD Kanan: Kepala Sekolah */}
                <div className="text-center w-72 space-y-1">
                  <p>{pengaturan.tempatPengesahan}, {pengaturan.tanggalPengesahan || currentDateStr}</p>
                  <p className="font-bold">Kepala {pengaturan.namaSekolah}</p>
                  <div className="h-16 flex items-center justify-center italic text-slate-400 text-[10px]">
                    (Tanda Tangan & Cap Lembaga)
                  </div>
                  <p className="font-bold underline text-slate-900">{pengaturan.namaKepsek}</p>
                  <p className="text-slate-600 font-mono text-[11px]">NIP. {pengaturan.nipKepsek}</p>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 px-6 flex items-center justify-between shrink-0 print:hidden text-xs">
          <span className="text-slate-500">
            * Gunakan pengaturan cetak <strong>Ukuran Kertas A4</strong> dan centang <em>"Background graphics"</em> pada dialog printer browser.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Tutup Pratinjau
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

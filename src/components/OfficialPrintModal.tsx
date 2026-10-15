import React from 'react';
import { Printer, X, School, Award, ShieldAlert } from 'lucide-react';
import { Murid, LogPelanggaran, PengaturanLembaga, getSanksiByPoin, getPenilaianTigaKomponen, isSameStudent } from '../types';

interface OfficialPrintModalProps {
  murid: Murid;
  logs: LogPelanggaran[];
  pengaturan: PengaturanLembaga;
  onClose: () => void;
}

export const OfficialPrintModal: React.FC<OfficialPrintModalProps> = ({
  murid,
  logs,
  pengaturan,
  onClose
}) => {
  const studentLogs = logs.filter(l => isSameStudent(l, murid));
  const totalPoin = studentLogs.reduce((sum, l) => sum + l.totalPoin, 0);
  const sanksi = getSanksiByPoin(totalPoin);
  const evaluasiKomponen = getPenilaianTigaKomponen(studentLogs);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-6">
        
        {/* Top Control Bar (Hidden during print) */}
        <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">
              Pratinjau Cetak Berita Acara & Rapor Kedisiplinan Resmi
            </span>
            <span className="text-slate-400 text-xs">({murid.nama} - Kelas {murid.kelas})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div id="printArea" className="p-8 sm:p-12 text-black bg-white space-y-5 font-serif leading-relaxed text-sm">
          
          {/* KOP SURAT RESMI LEMBAGA */}
          <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 gap-4">
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
              <h4 className="text-sm font-bold tracking-wider uppercase font-sans">PEMERINTAH KABUPATEN PASURUAN</h4>
              <h4 className="text-sm font-bold tracking-wider uppercase font-sans">DINAS PENDIDIKAN</h4>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-sans">
                {pengaturan.namaSekolah}
              </h2>
              <p className="text-xs italic font-sans text-slate-700">
                {pengaturan.alamat}, {pengaturan.desaKecamatan}, {pengaturan.kabupatenKota}, Kode Pos: {pengaturan.kodePos}
              </p>
              <p className="text-xs font-sans text-slate-700">
                Telp: {pengaturan.telepon} &bull; Email: {pengaturan.email} &bull; Web: {pengaturan.website}
              </p>
            </div>

            <div className="w-20 h-20 shrink-0 hidden sm:flex items-center justify-center font-sans">
              <div className="w-16 h-16 rounded-full border border-black flex flex-col items-center justify-center text-[10px] font-bold text-center p-1 leading-tight">
                <span>NPSN:</span>
                <span>{pengaturan.npsn}</span>
              </div>
            </div>
          </div>

          {/* JUDUL SURAT RESMI */}
          <div className="text-center space-y-1 pt-1 font-sans">
            <h3 className="text-base sm:text-lg font-bold underline uppercase tracking-wide">
              SURAT PEMBERITAHUAN PELANGGARAN TATA TERTIB & EVALUASI SISWA
            </h3>
            <p className="text-xs text-slate-600">
              Nomor: 421.3 / {String(studentLogs.length + 10).padStart(3, '0')} / SMPN2BEJI / {new Date().getFullYear()}
            </p>
          </div>

          <p className="text-justify font-sans text-xs">
            Berdasarkan Buku Tata Tertib Siswa {pengaturan.namaSekolah} Bab V (Klasifikasi dan Poin Pelanggaran) serta Bab VI (Penilaian Kelakuan, Kerajinan, dan Kerapian), bersama ini disampaikan rekapitulasi poin dan status penanganan atas peserta didik:
          </p>

          {/* IDENTITAS SISWA */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 font-sans text-xs space-y-1">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-600">Nama Lengkap Peserta Didik</span>
              <span className="col-span-2 font-bold text-black">: {murid.nama}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-600">NISN / NIS</span>
              <span className="col-span-2 font-mono text-black">: {murid.nisn} / {murid.nis}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-600">Kelas / Jenis Kelamin</span>
              <span className="col-span-2 font-bold text-black">: Kelas {murid.kelas} ({murid.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'})</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-600">Guru Wali Kelas</span>
              <span className="col-span-2 text-black">: {murid.waliKelas}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-slate-600">Total Akumulasi Poin Pelanggaran</span>
              <span className="col-span-2 font-black text-rose-700">: {totalPoin} Poin</span>
            </div>
          </div>

          {/* BAB VI PASAL 10: PENILAIAN 3 KOMPONEN */}
          <div className="font-sans text-xs space-y-1.5">
            <h5 className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
              <span>A. Penilaian 3 Komponen Kedisiplinan Siswa (Bab VI Pasal 10):</span>
            </h5>
            <table className="w-full border-collapse border border-slate-400 text-center">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <th className="border border-slate-400 p-1.5 w-10">No</th>
                  <th className="border border-slate-400 p-1.5 text-left">Komponen Penilaian</th>
                  <th className="border border-slate-400 p-1.5 w-24">Jumlah Poin</th>
                  <th className="border border-slate-400 p-1.5 w-24">Nilai Huruf</th>
                  <th className="border border-slate-400 p-1.5 w-32">Predikat</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-400 p-1.5">1</td>
                  <td className="border border-slate-400 p-1.5 text-left font-medium">Kelakuan / Kepribadian</td>
                  <td className="border border-slate-400 p-1.5 font-mono">{evaluasiKomponen.kepribadian.poin}</td>
                  <td className="border border-slate-400 p-1.5 font-bold font-mono text-base">{evaluasiKomponen.kepribadian.huruf}</td>
                  <td className="border border-slate-400 p-1.5 font-semibold">{evaluasiKomponen.kepribadian.predikat}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5">2</td>
                  <td className="border border-slate-400 p-1.5 text-left font-medium">Kerajinan</td>
                  <td className="border border-slate-400 p-1.5 font-mono">{evaluasiKomponen.kerajinan.poin}</td>
                  <td className="border border-slate-400 p-1.5 font-bold font-mono text-base">{evaluasiKomponen.kerajinan.huruf}</td>
                  <td className="border border-slate-400 p-1.5 font-semibold">{evaluasiKomponen.kerajinan.predikat}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5">3</td>
                  <td className="border border-slate-400 p-1.5 text-left font-medium">Kerapian</td>
                  <td className="border border-slate-400 p-1.5 font-mono">{evaluasiKomponen.kerapian.poin}</td>
                  <td className="border border-slate-400 p-1.5 font-bold font-mono text-base">{evaluasiKomponen.kerapian.huruf}</td>
                  <td className="border border-slate-400 p-1.5 font-semibold">{evaluasiKomponen.kerapian.predikat}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABEL RINCIAN PELANGGARAN */}
          <div className="font-sans text-xs space-y-1.5">
            <h5 className="font-bold text-slate-900 uppercase text-[11px]">
              B. Rincian Pelanggaran Berdasarkan Klasifikasi Bab V:
            </h5>
            <table className="w-full border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-400 p-1.5 text-left w-24">Hari / Tanggal</th>
                  <th className="border border-slate-400 p-1.5 text-left">Kode & Uraian Bentuk Pelanggaran</th>
                  <th className="border border-slate-400 p-1.5 text-center w-14">Bobot</th>
                  <th className="border border-slate-400 p-1.5 text-left w-36">Guru Pelapor</th>
                </tr>
              </thead>
              <tbody>
                {studentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-slate-400 p-3 text-center text-slate-500 italic">
                      Tidak ada catatan pelanggaran aktif.
                    </td>
                  </tr>
                ) : (
                  studentLogs.map((l, i) => (
                    <tr key={`${l.id || 'log'}_${i}`}>
                      <td className="border border-slate-400 p-1.5 text-center">{i + 1}</td>
                      <td className="border border-slate-400 p-1.5 whitespace-nowrap">
                        {l.hari}, {l.tanggal}
                      </td>
                      <td className="border border-slate-400 p-1.5">
                        {l.pelanggaranList.map((p, idx) => (
                          <div key={`${p.id || p.kode || 'p'}_${idx}`} className="font-medium">
                            <span className="font-bold font-mono text-[10px] bg-slate-100 px-1 rounded mr-1">
                              [{p.kode}]
                            </span>
                            {p.nama}
                          </div>
                        ))}
                        {l.catatan && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Catatan: {l.catatan}
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-bold font-mono">
                        +{l.totalPoin}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-[11px]">
                        {l.guruNama}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={3} className="border border-slate-400 p-1.5 text-right">
                    Total Poin Akumulasi Pelanggaran:
                  </td>
                  <td className="border border-slate-400 p-1.5 text-center text-rose-700 font-black">
                    {totalPoin}
                  </td>
                  <td className="border border-slate-400 p-1.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* KETENTUAN SANKSI & PEMBINAAN RESMI */}
          <div className="font-sans text-xs bg-slate-50 border border-slate-300 p-3 rounded-lg space-y-1">
            <span className="font-bold text-slate-900 block uppercase text-[11px]">
              C. Ketentuan Sanksi dan Tindak Lanjut Sekolah (Rentang {sanksi.rentang} Poin):
            </span>
            <p className="font-bold text-rose-800 text-xs">
              &bull; Bentuk Sanksi yang Dikenakan: {sanksi.sanksi}
            </p>
            <p className="text-[11px] text-slate-600">
              Sanksi diberikan sesuai Tata Tertib Sekolah SMP Negeri 2 Beji untuk menumbuhkan kesadaran dan disiplin diri peserta didik.
            </p>
          </div>

          {/* TANDA TANGAN RESMI PENGESAHAN */}
          <div className="pt-4 font-sans text-xs">
            <div className="flex justify-between items-start">
              
              {/* TTD Kiri: Guru Pelapor / Koordinator BK */}
              <div className="text-center w-64 space-y-1">
                <p>Mengetahui,</p>
                <p className="font-bold">{pengaturan.jabatanPelapor}</p>
                <div className="h-16 flex items-center justify-center italic text-slate-400 text-[10px]">
                  (Tanda Tangan)
                </div>
                <p className="font-bold underline text-slate-900">{pengaturan.namaPelapor}</p>
                <p className="text-slate-600 font-mono text-[11px]">NIP. {pengaturan.nipPelapor}</p>
              </div>

              {/* TTD Kanan: Kepala Sekolah */}
              <div className="text-center w-64 space-y-1">
                <p>{pengaturan.tempatPengesahan}, {pengaturan.tanggalPengesahan}</p>
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
    </div>
  );
};

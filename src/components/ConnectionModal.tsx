import React, { useState } from 'react';
import { 
  Database, FolderHeart, ExternalLink, CheckCircle2, RotateCw, 
  X, AlertCircle, Save, Info, Sparkles, KeyRound, Globe
} from 'lucide-react';
import { SPREADSHEET_ID, DRIVE_FOLDER_ID } from '../services/googleSheetsService';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLiveConnected: boolean;
  lastSyncTime: string | null;
  totalMurid: number;
  totalGuru: number;
  gasWebAppUrl: string;
  onSaveGasWebAppUrl: (url: string) => void;
  onTriggerSyncAll: () => Promise<void>;
  isSyncing: boolean;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  isLiveConnected,
  lastSyncTime,
  totalMurid,
  totalGuru,
  gasWebAppUrl,
  onSaveGasWebAppUrl,
  onTriggerSyncAll,
  isSyncing
}) => {
  const [inputUrl, setInputUrl] = useState(gasWebAppUrl);
  const [savedNotice, setSavedNotice] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGasWebAppUrl(inputUrl.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleSync = async () => {
    setSyncNotice(null);
    try {
      await onTriggerSyncAll();
      setSyncNotice('Berhasil memperbarui data langsung dari Google Spreadsheet!');
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      setSyncNotice('Gagal menyinkronkan: ' + (err?.message || err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Status Koneksi Google Sheets & Drive
              </h3>
              <p className="text-xs text-slate-500">
                Integrasi real-time database SMPN 2 Beji
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Card */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-bold text-xs text-emerald-900">
                Status: TERHUBUNG KE GOOGLE SHEETS
              </span>
            </div>
            {lastSyncTime && (
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                Sinkron: {lastSyncTime}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Data Murid Live</span>
              <span className="text-xl font-black text-slate-900">{totalMurid}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">Siswa Aktif Terbaca</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Data Guru Live</span>
              <span className="text-xl font-black text-slate-900">{totalGuru}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">Akun Guru Terbaca</span>
            </div>
          </div>

          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Aplikasi membaca data langsung dari Spreadsheet ID <code className="font-mono font-bold bg-emerald-100 px-1 rounded">{SPREADSHEET_ID.slice(0, 12)}...</code>. Seluruh murid dan guru sinkron secara instan.
          </p>
        </div>

        {/* Action Button: Re-Sync */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menghubungkan ke Spreadsheet...' : 'Tarik Ulang Data dari Spreadsheet Sekarang'}</span>
          </button>

          <a
            href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Buka Google Spreadsheet di tab baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buka Sheets</span>
          </a>

          <a
            href={`https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Buka Google Drive Folder Foto"
          >
            <FolderHeart className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Drive Folder</span>
          </a>
        </div>

        {syncNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Setting: Google Apps Script Web App URL */}
        <form onSubmit={handleSave} className="border-t border-slate-100 pt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                URL Web App Google Apps Script (Untuk Tulis & Upload Foto Drive)
              </label>
              {gasWebAppUrl && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                  Terkonfigurasi
                </span>
              )}
            </div>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Digunakan saat guru piket mengirim formulir pelanggaran agar baris tersimpan di Sheet <code className="text-slate-600 font-bold">Log_Pelanggaran</code> dan foto otomatis terunggah ke Google Drive.
            </p>
          </div>

          {savedNotice && (
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>URL Web App berhasil disimpan ke konfigurasi!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Pengaturan URL</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

import React from 'react';
import { ShieldCheck, Trophy, Edit3, Lock, Code2, School, FolderHeart, Database } from 'lucide-react';
import { PengaturanLembaga } from '../types';

interface HeaderProps {
  activeTab: 'publik' | 'guru' | 'admin' | 'gas';
  setActiveTab: (tab: 'publik' | 'guru' | 'admin' | 'gas') => void;
  pengaturan: PengaturanLembaga;
  isGuruLoggedIn: boolean;
  isAdminLoggedIn: boolean;
  onGuruLogout: () => void;
  onAdminLogout: () => void;
  isLiveConnected?: boolean;
  totalMurid?: number;
  totalGuru?: number;
  onOpenConnectionModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  pengaturan,
  isGuruLoggedIn,
  isAdminLoggedIn,
  onGuruLogout,
  onAdminLogout,
  isLiveConnected = true,
  totalMurid = 882,
  totalGuru = 46,
  onOpenConnectionModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-xl border-b border-blue-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Info Bar */}
        <div className="py-1.5 border-b border-blue-800/40 text-[11px] flex flex-wrap items-center justify-between text-blue-200 gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenConnectionModal}
              className="flex items-center gap-1.5 font-mono text-[10px] bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-600/50 transition-colors cursor-pointer"
              title="Klik untuk melihat status koneksi Google Sheets & Server"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Google Sheets & Cloud Server: {totalMurid} Murid &bull; {totalGuru} Guru</span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Auto-Sync Multi-Komputer Aktif
            </span>
            <span className="hidden lg:flex items-center gap-1 font-mono text-[10px] bg-blue-900/80 px-2 py-0.5 rounded border border-blue-700/50">
              <FolderHeart className="w-3 h-3 text-amber-400" />
              Drive Foto: 18tDeAMgEF...
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span>T.A. {pengaturan.tahunAjaran} ({pengaturan.semester})</span>
            <span className="text-blue-400">&bull;</span>
            <span className="text-emerald-300 font-medium">Sistem Tata Tertib Terintegrasi</span>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & School Title */}
          <div 
            onClick={() => setActiveTab('publik')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 p-0.5 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-blue-950 rounded-[14px] flex items-center justify-center overflow-hidden">
                <School className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white group-hover:text-yellow-300 transition-colors">
                  {pengaturan.namaSekolah}
                </h1>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-blue-800 text-blue-200 border border-blue-700">
                  Resmi
                </span>
              </div>
              <p className="text-xs text-blue-200/90 font-medium tracking-wide">
                Jurnal Tata Tertib & Buku Saku Kedisiplinan Siswa
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('publik')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'publik'
                  ? 'bg-amber-400 text-blue-950 shadow-md shadow-amber-400/20 font-bold'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Trophy className={`w-4 h-4 ${activeTab === 'publik' ? 'text-blue-950' : 'text-amber-400'}`} />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('guru')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'guru'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              <span>Input Guru</span>
              {isGuruLoggedIn && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md font-bold'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4 text-indigo-300" />
              <span>Panel Admin</span>
              {isAdminLoggedIn && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('gas')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                activeTab === 'gas'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'border-blue-700/60 text-blue-200 hover:bg-blue-800/40 hover:text-white'
              }`}
              title="Lihat Struktur Database & Skrip GAS"
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Skrip GAS & Database</span>
              <span className="sm:hidden">GAS</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};

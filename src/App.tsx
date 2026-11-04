import { useState, useEffect } from 'react';
import { 
  Tv, Layers, Upload, Crown, Network, 
  Scale, ShieldCheck, HelpCircle, CheckCircle2,
  FileText, Globe, Radio
} from 'lucide-react';

import { BroadcastItem } from './types/broadcast';
import { PRELOADED_IPTV_CHANNELS } from './data/iptvChannels';
import { parseM3uContent } from './utils/m3uParser';
import TvViewerConsole from './components/TvViewerConsole';
import EpgGrid from './components/EpgGrid';
import M3uXmltvManager from './components/M3uXmltvManager';
import BroadcastStandardsMonitor from './components/BroadcastStandardsMonitor';
import FederationMatrix from './components/FederationMatrix';
import ConstitutionViewer from './components/ConstitutionViewer';
import PublicGovernanceCenter from './components/PublicGovernanceCenter';
import TurbiflyDomainHub from './components/TurbiflyDomainHub';

type NavigationTab = 
  | 'tv' 
  | 'epg' 
  | 'ingest' 
  | 'standards' 
  | 'federation' 
  | 'charter';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('tv');
  
  // Channels collection with local storage persistence and robust validation
  const [channels, setChannels] = useState<BroadcastItem[]>(() => {
    try {
      const saved = localStorage.getItem('freetv_channels_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((c: any) => c && typeof c === 'object' && typeof c.id === 'string' && typeof c.videoUrl === 'string');
          if (valid.length > 0) return valid;
        }
      }
      const savedOld = localStorage.getItem('open_iptv_user_imported_v2');
      if (savedOld) {
        const parsedOld = JSON.parse(savedOld);
        if (Array.isArray(parsedOld) && parsedOld.length > 0) {
          const validOld = parsedOld.filter((c: any) => c && typeof c === 'object' && typeof c.id === 'string' && typeof c.videoUrl === 'string');
          if (validOld.length > 0) return validOld;
        }
      }
    } catch {}
    return PRELOADED_IPTV_CHANNELS;
  });

  const [activeChannel, setActiveChannel] = useState<BroadcastItem>(() => {
    return channels[0] || PRELOADED_IPTV_CHANNELS[0];
  });

  // Automatically fetch Free-TV IPTV playlist from requested link on mount
  useEffect(() => {
    const loaded = localStorage.getItem('freetv_playlist_loaded_v2');
    if (!loaded) {
      fetch('https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8')
        .then(res => res.text())
        .then(text => {
          const res = parseM3uContent(text, 'comm-freetv', 2000);
          if (res.channels.length > 0) {
            setChannels(res.channels);
            setActiveChannel(res.channels[0]);
            localStorage.setItem('freetv_playlist_loaded_v2', 'true');
            localStorage.setItem('freetv_channels_v3', JSON.stringify(res.channels.slice(0, 500)));
          }
        })
        .catch(err => console.error('Failed to load Free-TV playlist:', err));
    }
  }, []);

  // Always keep activeChannel synchronized with fresh stream endpoints
  useEffect(() => {
    if (!activeChannel) return;
    const fresh = channels.find((c) => c && c.id === activeChannel.id);
    if (fresh && (
      fresh.youtubeId !== activeChannel.youtubeId || 
      fresh.youtubeChannelId !== activeChannel.youtubeChannelId ||
      fresh.videoUrl !== activeChannel.videoUrl ||
      fresh.hlsUrl !== activeChannel.hlsUrl
    )) {
      setActiveChannel(fresh);
    }
  }, [channels, activeChannel]);

  const [isEpgModalOpen, setIsEpgModalOpen] = useState<boolean>(false);
  const [isM3uModalOpen, setIsM3uModalOpen] = useState<boolean>(false);
  const [isTurbiflyModalOpen, setIsTurbiflyModalOpen] = useState<boolean>(false);

  // Handle importing new channels from M3U parser
  const handleImportNewChannels = (newChannels: BroadcastItem[], replace: boolean = false) => {
    if (replace) {
      setChannels(newChannels);
      if (newChannels.length > 0) {
        setActiveChannel(newChannels[0]);
      }
      try {
        localStorage.setItem('freetv_channels_v3', JSON.stringify(newChannels.slice(0, 500)));
      } catch {}
      return;
    }

    setChannels((prev) => {
      const existingUrls = new Set(prev.map((c) => c?.videoUrl).filter(Boolean));
      const freshUnique = newChannels.filter((c) => c && c.videoUrl && !existingUrls.has(c.videoUrl));
      const updated = [...prev, ...freshUnique];
      try {
        localStorage.setItem('freetv_channels_v3', JSON.stringify(updated.slice(0, 500)));
      } catch {}
      return updated;
    });
    if (newChannels.length > 0) {
      setActiveChannel(newChannels[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#141720] flex flex-col font-sans text-[#f2eee9] overflow-x-hidden selection:bg-[#d4af37] selection:text-[#141720]">
      {/* ============================================================== */}
      {/* 1. TOP BAR CONTRACT: STRICT 3-ZONE TELEVISION BROADCAST HEADER */}
      {/* ============================================================== */}
      <header className="bg-[#191d28]/95 backdrop-blur-md border-b border-[#2a2f40] sticky top-0 z-50 px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-2xl gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => setActiveTab('tv')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-[#996515] via-[#d4af37] to-[#fef08a] rounded-xl flex items-center justify-center shadow-lg shadow-[#d4af37]/20 text-[#141720] shrink-0 border border-[#fef08a]/60 group-hover:scale-105 transition-transform">
            <Crown size={18} className="stroke-[2.5]" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
                BENGAL TV
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-[#d4af37] text-black font-black uppercase shadow-sm whitespace-nowrap">
                ডিজিটাল ব্রডকাস্ট
              </span>
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse hidden sm:inline-block" />
            </div>
          </div>
        </div>

        {/* Zone 2: Clean Single-Line Text Navigation Links for Desktop */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold whitespace-nowrap">
          <button
            onClick={() => setActiveTab('tv')}
            className={`transition-colors cursor-pointer py-1 ${
              activeTab === 'tv' 
                ? 'text-[#fbbf24] font-bold border-b-2 border-[#d4af37]' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            লাইভ টিভি প্লেয়ার
          </button>
          <button
            onClick={() => setIsEpgModalOpen(true)}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
          >
            EPG টিভি গাইড
          </button>
          <button
            onClick={() => setIsM3uModalOpen(true)}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5"
          >
            <Upload size={13} className="text-[#fbbf24]" />
            <span>M3U প্লেলিস্ট ও হাব</span>
          </button>
          <button
            onClick={() => setActiveTab('standards')}
            className={`transition-colors cursor-pointer py-1 ${
              activeTab === 'standards' 
                ? 'text-[#fbbf24] font-bold border-b-2 border-[#d4af37]' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            সম্প্রচার মান নিয়ন্ত্রণ
          </button>
          <button
            onClick={() => setActiveTab('federation')}
            className={`transition-colors cursor-pointer py-1 ${
              activeTab === 'federation' 
                ? 'text-[#fbbf24] font-bold border-b-2 border-[#d4af37]' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            ফেডারেশন ম্যাট্রিক্স
          </button>
          <button
            onClick={() => setActiveTab('charter')}
            className={`transition-colors cursor-pointer py-1 ${
              activeTab === 'charter' 
                ? 'text-[#fbbf24] font-bold border-b-2 border-[#d4af37]' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            সংবিধান ও সনদ
          </button>
        </nav>

        {/* Zone 3: Quick Action Utility & Turbifly Domain Link */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsTurbiflyModalOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-[#d4af37] text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
            title="Turbifly Domain: login.turbifly.com"
          >
            <Globe size={13} />
            <span className="hidden sm:inline">Turbifly Login</span>
          </button>
          <button
            onClick={() => setIsM3uModalOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform"
          >
            <Upload size={13} />
            <span className="hidden md:inline">M3U Hub</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN VIEW SWITCHER                                          */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'tv' && (
          <TvViewerConsole
            channels={channels}
            activeChannel={activeChannel}
            onSelectChannel={(ch) => setActiveChannel(ch)}
            onOpenEpgModal={() => setIsEpgModalOpen(true)}
            onOpenM3uModal={() => setIsM3uModalOpen(true)}
            onOpenGovernanceModal={() => setActiveTab('charter')}
          />
        )}
        {activeTab === 'standards' && <BroadcastStandardsMonitor />}
        {activeTab === 'federation' && <FederationMatrix />}
        {activeTab === 'charter' && <ConstitutionViewer />}
      </main>

      {/* ============================================================== */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR                                */}
      {/* ============================================================== */}
      <nav 
        aria-label="Mobile Navigation"
        className="lg:hidden bg-[#191d28] border-t border-[#2a2f40] px-3 py-2 flex items-center justify-around sticky bottom-0 z-40 shadow-2xl"
      >
        <button
          onClick={() => setActiveTab('tv')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'tv' ? 'text-[#fbbf24]' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Tv size={18} />
          <span>টিভি প্লেয়ার</span>
        </button>

        <button
          onClick={() => setIsEpgModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Layers size={18} />
          <span>EPG গাইড</span>
        </button>

        <button
          onClick={() => setIsTurbiflyModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold text-amber-300 hover:text-white transition-colors cursor-pointer"
        >
          <Globe size={18} />
          <span>Turbifly</span>
        </button>

        <button
          onClick={() => setActiveTab('standards')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'standards' ? 'text-[#fbbf24]' : 'text-slate-300 hover:text-white'
          }`}
        >
          <ShieldCheck size={18} />
          <span>মান নিয়ন্ত্রণ</span>
        </button>

        <button
          onClick={() => setActiveTab('charter')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'charter' ? 'text-[#fbbf24]' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Scale size={18} />
          <span>সংবিধান</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* 4. MODALS & CONNECTORS                                         */}
      {/* ============================================================== */}
      {isEpgModalOpen && (
        <EpgGrid
          channels={channels}
          activeChannel={activeChannel}
          onSelectChannel={(ch) => setActiveChannel(ch)}
          onClose={() => setIsEpgModalOpen(false)}
        />
      )}

      {isM3uModalOpen && (
        <M3uXmltvManager
          onImportChannels={handleImportNewChannels}
          onClose={() => setIsM3uModalOpen(false)}
        />
      )}

      {isTurbiflyModalOpen && (
        <TurbiflyDomainHub
          onClose={() => {
            setIsTurbiflyModalOpen(false);
            localStorage.setItem('turbifly_modal_seen', 'true');
          }}
        />
      )}
    </div>
  );
}

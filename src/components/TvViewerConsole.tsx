import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Tv, Radio, Clock, ChevronUp, ChevronDown, ListFilter,
  ShieldCheck, Search, Info, HelpCircle, Layers,
  Compass, ArrowLeft, ArrowRight, Star, RotateCcw, RotateCw,
  FastForward, Rewind, Lock, Settings, Database, HardDrive,
  AlertTriangle, CheckCircle2, History, Smartphone, Monitor,
  RefreshCw, PlayCircle, Globe
} from 'lucide-react';
import { BroadcastItem, ContentCategory, TimeshiftPolicy } from '../types/broadcast';
import UniversalVideoPlayer from './UniversalVideoPlayer';
import BreakingNewsTicker from './BreakingNewsTicker';
import { InMemoryTimeshiftDvr, TimeshiftBufferState } from '../utils/timeshiftBuffer';

interface TvViewerConsoleProps {
  channels: BroadcastItem[];
  activeChannel: BroadcastItem;
  onSelectChannel: (channel: BroadcastItem) => void;
  onOpenEpgModal: () => void;
  onOpenM3uModal: () => void;
  onOpenGovernanceModal: () => void;
}

const CATEGORY_TABS = [
  { id: 'ALL', label: 'সব চ্যানেল (All)' },
  { id: 'FAVORITES', label: '★ প্রিয় চ্যানেল (Favorites)' },
  { id: 'ENTERTAINMENT', label: 'নাটক ও সিরিয়াল (Drama)' },
  { id: 'NEWS', label: 'খবর ও লাইভ বুলেটিন (News)' },
  { id: 'CARTOONS', label: 'বাচ্চাদের কার্টুন (Kids)' },
  { id: 'SPORTS', label: 'খেলাধুলা ও ক্রিকেট (Sports)' },
  { id: 'COOKING', label: 'রান্না ও রেসিপি (Cooking)' },
  { id: 'MUSIC', label: 'গান ও মিউজিক (Music)' },
  { id: 'SPIRITUAL', label: 'ধর্ম ও শান্তি (Spiritual)' },
  { id: 'DOCUMENTARY', label: 'বিজ্ঞান ও বিশ্ব (Science)' },
];

export default function TvViewerConsole({
  channels,
  activeChannel,
  onSelectChannel,
  onOpenEpgModal,
  onOpenM3uModal,
  onOpenGovernanceModal,
}: TvViewerConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dvrRef = useRef<InMemoryTimeshiftDvr | null>(null);

  // Playback & Audio State (Default muted for 100% mobile browser autoplay compliance)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3'>('16:9');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerLimit, setDrawerLimit] = useState<number>(80);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);
  const [showPolicyNotice, setShowPolicyNotice] = useState<boolean>(false);

  // Reset drawer channel slice when searching or changing category
  useEffect(() => {
    setDrawerLimit(80);
  }, [searchQuery, selectedCategory, isDrawerOpen]);

  // Pinned Favorites persisted in LocalStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('open_iptv_favorites');
      return saved ? JSON.parse(saved) : ['ch-channel-i', 'ch-duronto-kids-hd', 'ch-somoy-tv', 'ch-banglar-darpan'];
    } catch {
      return ['ch-channel-i', 'ch-duronto-kids-hd'];
    }
  });

  // Timeshift DVR Engine State (Real In-Memory Buffer in RAM)
  const timeshiftPolicy: TimeshiftPolicy = activeChannel.timeshiftPolicy || {
    allowed: true,
    maxBufferMinutes: 60,
    storagePolicy: 'IN_MEMORY_EPHEMERAL',
    rightsHolderAttribution: 'Standard Community Broadcast License',
  };

  const [dvrState, setDvrState] = useState<TimeshiftBufferState>({
    isCapturing: true,
    isTimeshiftActive: false,
    bufferDurationSec: 0,
    bufferSizeBytes: 0,
    timeshiftOffsetSec: 0,
    maxBufferSec: (timeshiftPolicy.maxBufferMinutes || 60) * 60,
    isAllowed: timeshiftPolicy.allowed,
    rightsAttribution: timeshiftPolicy.rightsHolderAttribution || 'Standard Community Broadcast License',
  });

  // Initialize and update In-Memory DVR when active channel changes
  useEffect(() => {
    if (!dvrRef.current) {
      dvrRef.current = new InMemoryTimeshiftDvr(
        timeshiftPolicy.maxBufferMinutes || 60,
        timeshiftPolicy.allowed,
        timeshiftPolicy.rightsHolderAttribution
      );
    } else {
      dvrRef.current.clear();
      dvrRef.current.updatePolicy(
        timeshiftPolicy.maxBufferMinutes || 60,
        timeshiftPolicy.allowed,
        timeshiftPolicy.rightsHolderAttribution
      );
    }

    const unsubscribe = dvrRef.current.subscribe((state) => {
      setDvrState(state);
    });

    if (timeshiftPolicy.allowed) {
      dvrRef.current.startCapture();
    }

    return () => {
      unsubscribe();
    };
  }, [activeChannel.id, timeshiftPolicy.allowed, timeshiftPolicy.maxBufferMinutes, timeshiftPolicy.rightsHolderAttribution]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (dvrRef.current) {
        dvrRef.current.destroy();
        dvrRef.current = null;
      }
    };
  }, []);

  // Format seconds to MM:SS or HH:MM:SS
  const formatOffset = (secs: number) => {
    if (secs <= 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Automatic first-interaction audio unmute (Hands-free auto-play experience)
  useEffect(() => {
    const handleFirstGesture = () => {
      setIsMuted(false);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  // Auto-scroll active channel in thumb strip into view
  const activeStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeStripRef.current) {
      activeStripRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeChannel.id]);

  // DVR Handlers (Rewind, Forward, Seek, Live Sync, Pause)
  const handleRewind = (seconds: number) => {
    if (!dvrState.isAllowed) {
      setShowPolicyNotice(true);
      return;
    }
    dvrRef.current?.rewind(seconds);
  };

  const handleForward = (seconds: number) => {
    if (!dvrState.isAllowed) return;
    dvrRef.current?.forward(seconds);
  };

  const handleJumpToLive = () => {
    dvrRef.current?.jumpToLive();
    setIsPlaying(true);
  };

  const handleTogglePlayPause = () => {
    if (!dvrState.isAllowed) {
      setIsPlaying((prev) => !prev);
      return;
    }
    const isPausedNow = dvrRef.current?.togglePause();
    setIsPlaying(!isPausedNow);
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Channel switching helper (Delta +/- 1)
  const switchChannelByDelta = useCallback((delta: number) => {
    const currentIndex = channels.findIndex((c) => c.id === activeChannel.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + delta + channels.length) % channels.length;
    onSelectChannel(channels[nextIndex]);
  }, [channels, activeChannel, onSelectChannel]);

  // Keyboard navigation shortcuts for 10-foot remote / PC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handleTogglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleRewind(e.shiftKey ? 30 : 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleForward(e.shiftKey ? 30 : 10);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          handleJumpToLive();
          break;
        case 'm':
        case 'M':
          handleToggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowUp':
          e.preventDefault();
          switchChannelByDelta(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          switchChannelByDelta(1);
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          onOpenEpgModal();
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          setIsDrawerOpen((prev) => !prev);
          break;
        case '?':
          setShowShortcutsHelp((prev) => !prev);
          break;
        case 'Escape':
          setIsDrawerOpen(false);
          setShowShortcutsHelp(false);
          setShowPolicyNotice(false);
          break;
        default:
          if (/^[1-9]$/.test(e.key)) {
            const num = parseInt(e.key, 10);
            const targetChannel = channels.find((c) => (c.channelNumber % 10) === num || String(c.channelNumber).endsWith(e.key));
            if (targetChannel) {
              onSelectChannel(targetChannel);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchChannelByDelta, onOpenEpgModal, isPlaying, dvrState.isAllowed]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const toggleFavorite = (channelId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId];
      try {
        localStorage.setItem('open_iptv_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Filter channels based on selected category and query
  const filteredChannels = channels.filter((c) => {
    let matchesCat = false;
    if (selectedCategory === 'ALL') {
      matchesCat = true;
    } else if (selectedCategory === 'FAVORITES') {
      matchesCat = favorites.includes(c.id);
    } else if (selectedCategory === 'NEWS') {
      matchesCat = c.category === 'NEWS' || c.category === 'LIVE_NEWS';
    } else if (selectedCategory === 'CARTOONS') {
      matchesCat = c.category === 'CARTOONS' || c.category === 'CHILDREN';
    } else if (selectedCategory === 'COOKING') {
      matchesCat = c.category === 'COOKING' || c.category === 'CULTURE';
    } else if (selectedCategory === 'SPIRITUAL') {
      matchesCat = c.category === 'SPIRITUAL' || c.category === 'RELIGION';
    } else {
      matchesCat = c.category === selectedCategory;
    }

    const matchesSearch = !searchQuery.trim() || 
                          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.categoryLabel && c.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          String(c.channelNumber || '').includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-[#141720] text-[#f2eee9] flex flex-col select-none overflow-x-hidden ${
        isFullscreen ? 'h-screen w-screen' : 'min-h-[calc(100vh-64px)]'
      }`}
    >
      {/* ============================================================== */}
      {/* 1. UNIVERSAL RESILIENT VIDEO PLAYER (MOBILE-FIRST 16:9 VIEW)    */}
      {/* ============================================================== */}
      <div className={`relative w-full ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[4/3]'} md:flex-1 md:aspect-auto md:min-h-[460px] max-h-[75vh] bg-black flex items-center justify-center overflow-hidden shrink-0 shadow-2xl transition-all`}>
        <UniversalVideoPlayer
          channel={activeChannel}
          isMuted={isMuted}
          isPlaying={isPlaying}
          timeshiftOffset={dvrState.timeshiftOffsetSec}
          maxBufferSeconds={dvrState.maxBufferSec}
          isTimeshiftAllowed={dvrState.isAllowed}
          onTogglePlayPause={handleTogglePlayPause}
          onToggleMute={handleToggleMute}
          onRewind={handleRewind}
          onForward={handleForward}
          onJumpToLive={handleJumpToLive}
          onSwitchChannel={switchChannelByDelta}
          onFullscreenToggle={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      </div>

      {/* ============================================================== */}
      {/* 1B. LIVE BREAKING NEWS BROADCAST TICKER                        */}
      {/* ============================================================== */}
      <BreakingNewsTicker />

      {/* ============================================================== */}
      {/* 2. IN-MEMORY DVR TIMESHIFT BUFFER BAR & TRANSPORT CONTROLS     */}
      {/* ============================================================== */}
      <div className="bg-[#191d28] border-b border-[#2a2f40] px-3 sm:px-4 py-2.5 flex flex-col gap-2">
        {/* Scrubber Status & Memory Indicator Row */}
        <div className="flex items-center justify-between text-xs font-mono gap-2">
          <div className="flex items-center gap-1.5 text-slate-300 truncate">
            {dvrState.timeshiftOffsetSec === 0 ? (
              <span className="flex items-center gap-1 text-red-500 font-bold shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <span>LIVE</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-bold shrink-0 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                <History size={12} />
                <span>DVR -{formatOffset(dvrState.timeshiftOffsetSec)}</span>
              </span>
            )}
            <span className="text-slate-600">|</span>
            <span className="font-bold text-white truncate text-xs sm:text-sm">{activeChannel.title}</span>
            <span className="text-slate-500 hidden sm:inline">·</span>
            <span className="text-[#fbbf24] shrink-0 text-[11px] sm:text-xs hidden sm:inline">{activeChannel.categoryLabel}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-white/10 rounded text-[10px] text-amber-300 font-mono">
              <Tv size={11} className="text-amber-400" />
              <span>চ্যানেল {activeChannel.channelNumber || '০১'}</span>
            </div>

            {dvrState.timeshiftOffsetSec > 0 ? (
              <button
                onClick={handleJumpToLive}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[10px] flex items-center gap-1 shrink-0 animate-pulse cursor-pointer shadow-lg"
              >
                <Radio size={11} />
                <span>লাইভ সিঙ্ক</span>
              </button>
            ) : (
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                ● লাইভ সম্প্রচার
              </span>
            )}
          </div>
        </div>

        {/* Timeshift Scrub Bar (Visual Buffer Timeline) */}
        {dvrState.isAllowed ? (
          <div className="relative flex flex-col gap-1 pt-0.5">
            <div className="relative w-full flex items-center">
              <input
                type="range"
                min="0"
                max={Math.max(10, dvrState.bufferDurationSec)}
                step="1"
                value={Math.max(0, dvrState.bufferDurationSec - dvrState.timeshiftOffsetSec)}
                onChange={(e) => {
                  const targetProgress = Number(e.target.value);
                  const newOffset = Math.max(0, dvrState.bufferDurationSec - targetProgress);
                  dvrRef.current?.seekOffset(newOffset);
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                title="Drag to rewind live stream from memory buffer"
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-0.5">
              <span>-{formatOffset(dvrState.bufferDurationSec)} (বাফার শুরু)</span>
              <span className="text-amber-300 font-bold">
                {dvrState.timeshiftOffsetSec === 0 ? 'লাইভ সম্প্রচার প্রান্ত' : `বর্তমান অবস্থান: -${formatOffset(dvrState.timeshiftOffsetSec)}`}
              </span>
              <span>LIVE (এখন)</span>
            </div>
          </div>
        ) : (
          <div className="p-1.5 bg-amber-950/20 border border-amber-500/20 rounded-lg text-[10px] font-mono text-amber-300 flex items-center gap-1.5">
            <Lock size={12} />
            <span>সম্প্রচার স্বত্বাধিকারী অনুমতি: এই চ্যানেলের জন্য টাইমশিফ্ট বাফার সংরক্ষিত।</span>
          </div>
        )}

        {/* Mobile Touch Action Button Row (Minimum 44px Touch Targets) */}
        <div className="flex items-center justify-between gap-1.5 pt-1 overflow-x-auto no-scrollbar">
          {/* Channel Prev */}
          <button
            onClick={() => switchChannelByDelta(-1)}
            className="flex-1 min-w-[50px] py-2.5 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-1 cursor-pointer"
            title="Previous Channel (CH -)"
          >
            <ChevronUp size={16} />
            <span className="text-[11px]">CH -</span>
          </button>

          {/* Rewind 30s */}
          <button
            onClick={() => handleRewind(30)}
            disabled={!dvrState.isAllowed}
            className="hidden sm:flex py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-200 items-center justify-center gap-1 cursor-pointer"
            title="Rewind 30s"
          >
            <RotateCcw size={14} />
            <span className="text-[11px]">-30s</span>
          </button>

          {/* Rewind 10s */}
          <button
            onClick={() => handleRewind(10)}
            disabled={!dvrState.isAllowed}
            className="py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-1 cursor-pointer"
            title="Rewind 10s"
          >
            <RotateCcw size={15} />
            <span className="text-[11px]">-10s</span>
          </button>

          {/* Play/Pause */}
          <button
            onClick={handleTogglePlayPause}
            className="py-2.5 px-5 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] text-black font-extrabold rounded-xl shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="Play/Pause"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-black" />}
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => handleForward(10)}
            disabled={!dvrState.isAllowed || dvrState.timeshiftOffsetSec === 0}
            className="py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-1 cursor-pointer"
            title="Forward 10s"
          >
            <RotateCw size={15} />
            <span className="text-[11px]">+10s</span>
          </button>

          {/* Forward 30s */}
          <button
            onClick={() => handleForward(30)}
            disabled={!dvrState.isAllowed || dvrState.timeshiftOffsetSec === 0}
            className="hidden sm:flex py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-200 items-center justify-center gap-1 cursor-pointer"
            title="Forward 30s"
          >
            <RotateCw size={14} />
            <span className="text-[11px]">+30s</span>
          </button>

          {/* Channel Next */}
          <button
            onClick={() => switchChannelByDelta(1)}
            className="flex-1 min-w-[50px] py-2.5 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-1 cursor-pointer"
            title="Next Channel (CH +)"
          >
            <span className="text-[11px]">CH +</span>
            <ChevronDown size={16} />
          </button>

          {/* Aspect Ratio Toggle (16:9 / 4:3) */}
          <button
            onClick={() => setAspectRatio(prev => prev === '16:9' ? '4:3' : '16:9')}
            className="py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-mono font-bold text-amber-300 flex items-center justify-center gap-1 cursor-pointer"
            title="Toggle Aspect Ratio (16:9 / 4:3)"
          >
            <Monitor size={14} />
            <span className="text-[11px]">{aspectRatio}</span>
          </button>

          {/* Mute/Unmute */}
          <button
            onClick={handleToggleMute}
            className="py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/60 rounded-xl text-slate-200 flex items-center justify-center cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-emerald-400" />}
          </button>

          {/* Channel Drawer Toggle */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
              isDrawerOpen 
                ? 'bg-[#d4af37] text-black font-extrabold' 
                : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-200'
            }`}
            title="All Channels"
          >
            <ListFilter size={16} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MOBILE THUMB-FRIENDLY CHANNEL STRIP & CATEGORY FILTER       */}
      {/* ============================================================== */}
      <div className="flex-1 bg-[#141720] p-3 sm:p-4 space-y-3.5">
        {/* IPTV-org Master Hub Banner */}
        <div className="bg-[#191d28] border border-[#2a2f40] rounded-2xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#996515] to-[#fbbf24] flex items-center justify-center text-black font-bold shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">IPTV-org গ্লোবাল মাস্টার প্লেলিস্ট</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  ১১,৩০০+ ফ্রি চ্যানেল
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                https://iptv-org.github.io/iptv/index.m3u থেকে সকল দেশের ফ্রি লাইভ স্ট্রিম ১-ক্লিকে লোড করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenM3uModal}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] text-black font-extrabold rounded-xl text-xs hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Globe size={13} />
              <span>IPTV প্লেলিস্ট ব্রাউজ করুন</span>
            </button>
          </div>
        </div>

        {/* Horizontal Category Pill Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === tab.id 
                  ? 'bg-[#d4af37] text-black font-extrabold shadow-md' 
                  : 'bg-slate-900/80 text-slate-300 border border-white/5 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Thumb-Zapper Horizontal Strip for Mobile */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-white flex items-center gap-2">
              <Tv size={14} className="text-[#fbbf24]" />
              <span>IPTV চ্যানেল তালিকা ({channels.length} টি চ্যানেল)</span>
            </span>
            <div className="flex items-center gap-2.5">
              <button 
                onClick={onOpenM3uModal}
                className="text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg border border-amber-500/30 font-semibold cursor-pointer text-[11px] transition-colors"
                title="১১,৩০০+ IPTV-org চ্যানেল বা কাস্টম M3U যোগ করুন"
              >
                + ১১,০০০+ চ্যানেল লোড করুন
              </button>
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="text-[#fbbf24] hover:underline cursor-pointer font-bold"
              >
                সব দেখুন ({channels.length}) →
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2">
            {filteredChannels.slice(0, 24).map((c) => {
              const isActive = c.id === activeChannel.id;
              return (
                <div
                  key={c.id}
                  ref={isActive ? activeStripRef : undefined}
                  onClick={() => onSelectChannel(c)}
                  className={`w-32 shrink-0 p-2.5 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-b from-[#d4af37]/25 to-black border-[#d4af37] shadow-xl'
                      : 'bg-slate-900/70 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-black/80 border border-white/10 flex items-center justify-center mb-1.5 overflow-hidden">
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Tv size={16} className={isActive ? 'text-[#fbbf24]' : 'text-slate-400'} />
                    )}
                  </div>
                  <span className={`text-[11px] font-bold truncate w-full ${isActive ? 'text-[#fbbf24]' : 'text-white'}`}>
                    {c.title}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                    CH {c.channelNumber || '00'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Info & EPG Current Show Card */}
        <div className="bg-[#191d28] border border-[#2a2f40] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">{activeChannel.title}</span>
              <button
                onClick={() => toggleFavorite(activeChannel.id)}
                className="text-slate-400 hover:text-amber-400 cursor-pointer"
                title="Add to Favorites"
              >
                <Star size={16} className={favorites.includes(activeChannel.id) ? 'fill-amber-400 text-amber-400' : ''} />
              </button>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono">
                ডিজিটাল ব্রডকাস্ট ভেরিফাইড
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">{activeChannel.description}</p>
            {activeChannel.currentProgramTitle && (
              <div className="text-xs text-slate-300 font-mono flex items-center gap-1.5 pt-1">
                <Radio size={12} className="text-red-400 shrink-0" />
                <span className="text-[#fbbf24]">NOW ON-AIR:</span>
                <span>{activeChannel.currentProgramTitle}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenEpgModal}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Layers size={14} />
              <span>EPG Guide</span>
            </button>
            <button
              onClick={onOpenM3uModal}
              className="px-3 py-2 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] text-black font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              + Ingest M3U
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. FULL CHANNEL ZAPPING DRAWER                                 */}
      {/* ============================================================== */}
      {isDrawerOpen && (
        <aside 
          aria-label="Channel Zapping Drawer"
          className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#161a24]/98 backdrop-blur-2xl border-l border-[#2a2f40] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        >
          <div className="p-4 border-b border-[#2a2f40] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv size={18} className="text-[#fbbf24]" />
              <div>
                <h2 className="font-bold text-sm text-white">চ্যানেল তালিকা ({filteredChannels.length} / {channels.length})</h2>
                <span className="text-[10px] text-slate-400">IPTV চ্যানেল ডিরেক্টরি</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenM3uModal();
                }}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                title="M3U প্লেলিস্ট বা নতুন চ্যানেল যোগ করুন"
              >
                <span>+ যোগ করুন</span>
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="চ্যানেলের নাম বা নম্বর দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredChannels.slice(0, drawerLimit).map((c) => {
              const isActive = c.id === activeChannel.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectChannel(c);
                    setIsDrawerOpen(false);
                  }}
                  className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#d4af37] text-black font-bold shadow-lg'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="font-mono text-xs opacity-70 w-8 shrink-0">
                      {c.channelNumber || '00'}
                    </span>
                    <div className="truncate">
                      <div className="text-xs truncate">{c.title}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-black/80' : 'text-slate-400'}`}>
                        {c.categoryLabel || c.category} {c.location ? `• ${c.location}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(c.id);
                      }}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star size={14} className={favorites.includes(c.id) ? (isActive ? 'fill-black text-black' : 'fill-amber-400 text-amber-400') : 'opacity-40'} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredChannels.length > drawerLimit && (
              <div className="p-2 pt-3 pb-6">
                <button
                  onClick={() => setDrawerLimit((prev) => prev + 100)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>আরও ১০০ টি চ্যানেল দেখুন</span>
                  <span className="text-[10px] text-slate-400 font-mono">(অবশিষ্ট {filteredChannels.length - drawerLimit} টি)</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

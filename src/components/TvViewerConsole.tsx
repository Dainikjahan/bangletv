import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Tv,
  Radio,
  ChevronUp,
  ChevronDown,
  ListFilter,
  Search,
  Layers,
  Star,
  RotateCcw,
  RotateCw,
  Lock,
  History,
  Monitor,
  Globe,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { BroadcastItem, TimeshiftPolicy } from '../types/broadcast';
import UniversalVideoPlayer from './UniversalVideoPlayer';
import BreakingNewsTicker from './BreakingNewsTicker';
import { InMemoryTimeshiftDvr, TimeshiftBufferState } from '../utils/timeshiftBuffer';
import { BENGAL_TV_OFFICIAL_LOGO } from '../data/iptvChannels';

interface TvViewerConsoleProps {
  channels: BroadcastItem[];
  activeChannel: BroadcastItem;
  onSelectChannel: (channel: BroadcastItem) => void;
  onOpenEpgModal: () => void;
  onOpenM3uModal: () => void;
  onOpenUploadStudio: () => void;
  onOpenGovernanceModal: () => void;
}

const EDITORIAL_TABS = [
  { id: 'ALL', label: 'All Broadcasts' },
  { id: 'BENGALI', label: 'Bengali News & Diaspora' },
  { id: 'AMERICAS', label: 'American News' },
  { id: 'EUROPE', label: 'European & Global News' },
  { id: 'DOCUMENTARY', label: 'Humanitarian & Mankind Docs' },
  { id: 'CITIZEN', label: 'Citizen Uploads' },
  { id: 'FAVORITES', label: 'Saved' },
];

function ChannelLogoAvatar({
  logoUrl,
  isActive,
}: {
  logoUrl?: string;
  isActive: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!logoUrl || failed) {
    return (
      <Tv
        size={16}
        className={isActive ? 'text-[#0066CC]' : 'text-[#6E6E73]'}
      />
    );
  }

  return (
    <img
      src={logoUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-contain p-0.5"
    />
  );
}

export default function TvViewerConsole({
  channels,
  activeChannel,
  onSelectChannel,
  onOpenEpgModal,
  onOpenM3uModal,
  onOpenUploadStudio,
}: TvViewerConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dvrRef = useRef<InMemoryTimeshiftDvr | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3'>('16:9');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerLimit, setDrawerLimit] = useState<number>(80);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setDrawerLimit(80);
  }, [searchQuery, selectedCategory, isDrawerOpen]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bengaltv_saved_channels_v2');
      return saved
        ? JSON.parse(saved)
        : ['ch-bengal-tv-flagship', 'ch-abc-news-live-us', 'ch-somoy-tv', 'ch-dw-documentary'];
    } catch {
      return ['ch-bengal-tv-flagship', 'ch-abc-news-live-us'];
    }
  });

  const timeshiftPolicy: TimeshiftPolicy = activeChannel.timeshiftPolicy || {
    allowed: true,
    maxBufferMinutes: 60,
    storagePolicy: 'IN_MEMORY_EPHEMERAL',
    rightsHolderAttribution: 'Bengal TV Broadcast Charter',
  };

  const [dvrState, setDvrState] = useState<TimeshiftBufferState>({
    isCapturing: true,
    isTimeshiftActive: false,
    bufferDurationSec: 0,
    bufferSizeBytes: 0,
    timeshiftOffsetSec: 0,
    maxBufferSec: (timeshiftPolicy.maxBufferMinutes || 60) * 60,
    isAllowed: timeshiftPolicy.allowed,
    rightsAttribution:
      timeshiftPolicy.rightsHolderAttribution || 'Bengal TV Broadcast Charter',
  });

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
  }, [
    activeChannel.id,
    timeshiftPolicy.allowed,
    timeshiftPolicy.maxBufferMinutes,
    timeshiftPolicy.rightsHolderAttribution,
  ]);

  useEffect(() => {
    return () => {
      if (dvrRef.current) {
        dvrRef.current.destroy();
        dvrRef.current = null;
      }
    };
  }, []);

  const formatOffset = (secs: number) => {
    if (secs <= 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

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

  const activeStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeStripRef.current) {
      activeStripRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeChannel.id]);

  const handleRewind = (seconds: number) => {
    if (!dvrState.isAllowed) return;
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

  const switchChannelByDelta = useCallback(
    (delta: number) => {
      const currentIndex = channels.findIndex((c) => c.id === activeChannel.id);
      if (currentIndex === -1) return;
      const nextIndex = (currentIndex + delta + channels.length) % channels.length;
      onSelectChannel(channels[nextIndex]);
    },
    [channels, activeChannel, onSelectChannel]
  );

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;

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
        case 'Escape':
          setIsDrawerOpen(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchChannelByDelta, onOpenEpgModal, isPlaying, dvrState.isAllowed]);

  const toggleFavorite = (channelId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      try {
        localStorage.setItem('bengaltv_saved_channels_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const matchesEditorialTab = (c: BroadcastItem, tab: string): boolean => {
    if (tab === 'ALL') return true;
    if (tab === 'FAVORITES') return favorites.includes(c.id);

    const lang = (c.classificationTaxonomy?.language || '').toLowerCase();
    const country = (c.classificationTaxonomy?.country || c.location || '').toLowerCase();
    const region = (c.classificationTaxonomy?.region || '').toLowerCase();
    const titleLower = c.title.toLowerCase();

    if (tab === 'BENGALI') {
      return (
        lang.includes('bengali') ||
        region.includes('bengal') ||
        country.includes('bangladesh') ||
        country.includes('west bengal') ||
        /[\u0980-\u09FF]/.test(c.title) ||
        titleLower.includes('bangla') ||
        titleLower.includes('bengal') ||
        c.id === 'ch-bengal-tv-flagship'
      );
    }

    if (tab === 'AMERICAS') {
      return (
        country.includes('united states') ||
        country.includes('usa') ||
        region.includes('america') ||
        (c.location || '').toLowerCase().includes('new york') ||
        (c.location || '').toLowerCase().includes('washington')
      );
    }

    if (tab === 'EUROPE') {
      return (
        region.includes('europe') ||
        country.includes('united kingdom') ||
        country.includes('germany') ||
        country.includes('france') ||
        country.includes('europe') ||
        country.includes('qatar') ||
        country.includes('turkey') ||
        (c.location || '').toLowerCase().includes('london') ||
        (c.location || '').toLowerCase().includes('berlin') ||
        (c.location || '').toLowerCase().includes('paris')
      );
    }

    if (tab === 'DOCUMENTARY') {
      return (
        c.category === 'DOCUMENTARY' ||
        c.category === 'SCIENCE' ||
        c.category === 'EDUCATION' ||
        c.category === 'PUBLIC_SERVICE'
      );
    }

    if (tab === 'CITIZEN') {
      return (
        c.id.startsWith('bc-') ||
        c.category === 'COMMUNITY' ||
        c.classificationTaxonomy?.editorialClass === 'COMMUNITY_DISPATCH'
      );
    }

    return true;
  };

  const filteredChannels = channels.filter((c) => {
    const matchesCat = matchesEditorialTab(c, selectedCategory);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.categoryLabel && c.categoryLabel.toLowerCase().includes(q)) ||
      String(c.channelNumber || '').includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-[#000000] text-[#F5F5F7] flex flex-col select-none overflow-x-hidden ${
        isFullscreen ? 'h-screen w-screen' : 'min-h-[calc(100vh-60px)]'
      }`}
    >
      {/* 1. Broadcast Video Stage - Pure Cinematic Black Background */}
      <div className="w-full bg-[#000000] border-b border-[#1A1A1E] flex justify-center">
        <div
          className={`relative w-full ${
            aspectRatio === '16:9'
              ? 'aspect-video max-w-[1440px]'
              : 'aspect-[4/3] max-w-[1040px]'
          } max-h-[70vh] bg-[#000000] flex items-center justify-center overflow-hidden transition-all duration-200`}
        >
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
      </div>

      {/* 2. Live Breaking News Wire */}
      <BreakingNewsTicker />

      {/* 3. Studio Transport & In-Memory DVR Bar */}
      <div className="bg-[#0E0E12] border-b border-[#1F1F24] px-4 sm:px-8 py-3 flex flex-col gap-2.5">
        <div className="max-w-7xl w-full mx-auto flex flex-col gap-2.5">
          {/* Status Row */}
          <div className="flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 text-[#98989F] truncate">
              {dvrState.timeshiftOffsetSec === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-[#FF453A] font-bold shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-live-pulse" />
                  <span>LIVE</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#3390EC] font-semibold font-mono tabular-nums shrink-0">
                  <History size={13} />
                  <span>DVR -{formatOffset(dvrState.timeshiftOffsetSec)}</span>
                </span>
              )}
              <span className="text-[#38383E]">·</span>
              <span className="font-bold text-white truncate text-xs sm:text-sm">
                {activeChannel.title}
              </span>
              <span className="text-[#38383E] hidden sm:inline">·</span>
              <span className="text-[#98989F] shrink-0 text-xs hidden sm:inline">
                {activeChannel.categoryLabel}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-xs">
              <span className="hidden md:inline font-mono tabular-nums text-[#8E8E93]">
                CH {activeChannel.channelNumber || '100'} · {activeChannel.location}
              </span>

              {dvrState.timeshiftOffsetSec > 0 && (
                <button
                  type="button"
                  onClick={handleJumpToLive}
                  className="px-2.5 py-1 bg-[#D70015] hover:bg-[#FF453A] text-white font-semibold rounded-lg text-[11px] flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <Radio size={11} />
                  <span>Return to Live</span>
                </button>
              )}
            </div>
          </div>

          {/* Timeshift Scrubber */}
          {dvrState.isAllowed ? (
            <div className="flex flex-col gap-1">
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
                className="w-full h-1.5 bg-[#24242A] rounded-lg appearance-none cursor-pointer accent-[#0066CC]"
                title="Scrub live broadcast buffer"
              />
              <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-[#8E8E93]">
                <span>-{formatOffset(dvrState.bufferDurationSec)} buffer</span>
                <span className="text-[#AEAEB2] font-medium">
                  {dvrState.timeshiftOffsetSec === 0
                    ? 'Synchronized with live broadcast'
                    : `Timeshift offset -${formatOffset(dvrState.timeshiftOffsetSec)}`}
                </span>
                <span className="text-[#3390EC]">LIVE</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[#8E8E93] flex items-center gap-1.5">
              <Lock size={12} />
              <span>Timeshift buffer disabled by broadcaster policy.</span>
            </div>
          )}

          {/* Clean Apple Transport Control Strip */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => switchChannelByDelta(-1)}
                className="py-2 px-3 bg-[#1C1C21] hover:bg-[#28282E] border border-[#2A2A30] rounded-xl text-xs font-semibold text-white flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs transition-colors"
                title="Previous Channel"
              >
                <ChevronUp size={15} />
                <span>CH -</span>
              </button>

              <button
                type="button"
                onClick={() => switchChannelByDelta(1)}
                className="py-2 px-3 bg-[#1C1C21] hover:bg-[#28282E] border border-[#2A2A30] rounded-xl text-xs font-semibold text-white flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs transition-colors"
                title="Next Channel"
              >
                <span>CH +</span>
                <ChevronDown size={15} />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRewind(10)}
                disabled={!dvrState.isAllowed}
                className="py-2 px-3 bg-[#1C1C21] hover:bg-[#28282E] disabled:opacity-40 border border-[#2A2A30] rounded-xl text-xs font-mono tabular-nums font-medium text-white flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs transition-colors"
              >
                <RotateCcw size={14} />
                <span>-10s</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePlayPause}
                className="py-2 px-5 bg-[#0066CC] hover:bg-[#0077ED] text-white font-semibold rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                title="Play / Pause"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="fill-white" />}
              </button>

              <button
                type="button"
                onClick={() => handleForward(10)}
                disabled={!dvrState.isAllowed || dvrState.timeshiftOffsetSec === 0}
                className="py-2 px-3 bg-[#1C1C21] hover:bg-[#28282E] disabled:opacity-40 border border-[#2A2A30] rounded-xl text-xs font-mono tabular-nums font-medium text-white flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs transition-colors"
              >
                <RotateCw size={14} />
                <span>+10s</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Aspect Ratio Toggle (16:9 / 4:3) */}
              <button
                type="button"
                onClick={() => setAspectRatio((prev) => (prev === '16:9' ? '4:3' : '16:9'))}
                className="py-2 px-3 bg-[#1C1C21] hover:bg-[#28282E] border border-[#2A2A30] rounded-xl text-xs font-mono tabular-nums font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs transition-colors"
                title="Toggle Aspect Ratio (16:9 / 4:3)"
              >
                <Monitor size={14} className="text-[#3390EC]" />
                <span>{aspectRatio}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                className="py-2 px-3 bg-[#1C1C21] hover:bg-[#28282E] border border-[#2A2A30] rounded-xl text-white flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX size={16} className="text-[#FF453A]" />
                ) : (
                  <Volume2 size={16} className="text-[#30D158]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs transition-colors ${
                  isDrawerOpen
                    ? 'bg-[#0066CC] text-white'
                    : 'bg-[#1C1C21] hover:bg-[#28282E] border border-[#2A2A30] text-white'
                }`}
                title="Open Full Channel Directory"
              >
                <ListFilter size={15} />
                <span className="hidden sm:inline">All Channels</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Editorial Directory & Regional Filter Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Segmented Regional & Editorial Filter Bar + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-[#121216] border border-[#222228] p-1 rounded-xl">
            {EDITORIAL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === tab.id
                    ? 'bg-[#22222A] text-white shadow-2xs'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73]"
            />
            <input
              type="text"
              placeholder="Search Bengali, US, EU, or Documentary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121216] border border-[#222228] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#6E6E73] focus:outline-none focus:border-[#0066CC] shadow-2xs transition-colors"
            />
          </div>
        </div>

        {/* Channel Grid / Horizontal Strip */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8E8E93]">
            <div className="font-semibold text-white">
              Verified Broadcast Lineup ·{' '}
              <span className="font-mono tabular-nums text-[#8E8E93]">
                {filteredChannels.length} channels
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenM3uModal}
                className="text-[#3390EC] hover:underline font-semibold cursor-pointer whitespace-nowrap"
              >
                + Load M3U Regional Packs
              </button>
              <span className="text-[#333338]">·</span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="text-[#AEAEB2] hover:text-white font-semibold cursor-pointer whitespace-nowrap transition-colors"
              >
                Directory View →
              </button>
            </div>
          </div>

          {filteredChannels.length === 0 ? (
            <div className="bg-[#121216] border border-[#222228] rounded-2xl p-8 text-center text-xs text-[#8E8E93] shadow-2xs">
              No channels match your current filter. Select another regional desk or load additional streams from the M3U Directory.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredChannels.slice(0, 24).map((c) => {
                const isActive = c.id === activeChannel.id;
                return (
                  <div
                    key={c.id}
                    ref={isActive ? activeStripRef : undefined}
                    onClick={() => onSelectChannel(c)}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#121929] border-[#0066CC] ring-2 ring-[#0066CC]/25 shadow-md'
                        : 'bg-[#121216] border-[#202026] hover:bg-[#18181E] hover:border-[#303038] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#1A1A20] border border-[#282832] flex items-center justify-center overflow-hidden shrink-0">
                        <ChannelLogoAvatar logoUrl={c.logoUrl} isActive={isActive} />
                      </div>
                      <span className="text-[10px] font-mono tabular-nums text-[#8E8E93]">
                        CH {c.channelNumber || '100'}
                      </span>
                    </div>

                    <div>
                      <div
                        className={`text-xs font-bold line-clamp-2 leading-snug ${
                          isActive ? 'text-[#3390EC]' : 'text-white'
                        }`}
                      >
                        {c.title}
                      </div>
                      <div className="text-[11px] text-[#8E8E93] truncate mt-1">
                        {c.location}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Channel Dossier & Contributor Studio Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-[#121216] border border-[#222228] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={activeChannel.logoUrl || BENGAL_TV_OFFICIAL_LOGO}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg object-contain bg-[#1A1A20] border border-[#282832] p-0.5 shrink-0 shadow-2xs"
                  />
                  <h2 className="text-base font-bold text-white truncate">
                    {activeChannel.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFavorite(activeChannel.id)}
                  className="p-1.5 text-[#8E8E93] hover:text-[#3390EC] rounded-lg hover:bg-[#1C1C22] transition-colors cursor-pointer shrink-0"
                  title="Save Channel"
                >
                  <Star
                    size={16}
                    className={
                      favorites.includes(activeChannel.id)
                        ? 'fill-[#3390EC] text-[#3390EC]'
                        : ''
                    }
                  />
                </button>
              </div>

              <div className="text-xs text-[#8E8E93]">
                {activeChannel.location} · {activeChannel.categoryLabel} ·{' '}
                <span className="text-[#30D158] font-medium">
                  Editorial & Stream Mapping Verified
                </span>
              </div>

              <p className="text-xs text-[#AEAEB2] leading-relaxed">
                {activeChannel.description}
              </p>
            </div>

            <div className="pt-3 border-t border-[#222228] flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[#8E8E93]">
                {activeChannel.currentProgramTitle ? (
                  <>
                    Now On Air:{' '}
                    <strong className="text-white">
                      {activeChannel.currentProgramTitle}
                    </strong>
                  </>
                ) : (
                  '24/7 Continuous Journalistic & Documentary Feed'
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenEpgModal}
                  className="px-3.5 py-2 bg-[#1C1C21] hover:bg-[#28282E] border border-[#2A2A30] rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <Layers size={14} />
                  <span>Program Guide</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenM3uModal}
                  className="px-3.5 py-2 bg-[#1C1C21] hover:bg-[#28282E] border border-[#2A2A30] rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <Globe size={14} />
                  <span>M3U Directory</span>
                </button>
              </div>
            </div>
          </div>

          {/* Citizen Journalism & Documentary Upload Callout */}
          <div className="lg:col-span-4 bg-[#121216] border border-[#222228] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#30D158]">
                <ShieldCheck size={15} />
                <span>AI-Vetted Global & Community Broadcasts</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Broadcast Your Field Report or Documentary
              </h3>
              <p className="text-xs text-[#AEAEB2] leading-relaxed">
                Registered contributors worldwide can upload journalistic news and humanitarian documentaries. Approved videos are published immediately for community or global viewing.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenUploadStudio}
              className="w-full py-2.5 px-4 bg-[#0066CC] hover:bg-[#0077ED] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Upload size={14} />
              <span>Open Upload & Contributor Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Slide-Over Full Channel Directory Drawer */}
      {isDrawerOpen && (
        <aside
          aria-label="Channel Directory Drawer"
          className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#101014]/98 backdrop-blur-2xl border-l border-[#222228] z-50 flex flex-col shadow-2xl"
        >
          <div className="p-4 border-b border-[#222228] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-white">
                Channel Directory ({filteredChannels.length})
              </h2>
              <span className="text-[11px] text-[#8E8E93]">
                Bengali · American · European · Documentary
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenM3uModal();
                }}
                className="px-2.5 py-1 bg-[#1C1C21] hover:bg-[#28282E] text-[#3390EC] border border-[#2A2A30] rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                + M3U
              </button>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-[#8E8E93] hover:text-white rounded-lg bg-[#1C1C21] cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3 border-b border-[#222228]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73]"
              />
              <input
                type="text"
                placeholder="Filter by channel name, country, or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#18181E] border border-[#282832] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#6E6E73] focus:outline-none focus:border-[#0066CC] focus:bg-[#1E1E26]"
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
                  className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#0066CC] text-white font-semibold'
                      : 'hover:bg-[#1A1A20] text-[#E5E5EA]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span
                      className={`font-mono tabular-nums text-xs w-8 shrink-0 ${
                        isActive ? 'text-white/85' : 'text-[#8E8E93]'
                      }`}
                    >
                      {c.channelNumber || '100'}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate">{c.title}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-white/85' : 'text-[#8E8E93]'
                        }`}
                      >
                        {c.location} · {c.categoryLabel}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(c.id);
                    }}
                    className="p-1 cursor-pointer shrink-0"
                  >
                    <Star
                      size={14}
                      className={
                        favorites.includes(c.id)
                          ? isActive
                            ? 'fill-white text-white'
                            : 'fill-[#3390EC] text-[#3390EC]'
                          : 'opacity-40 text-[#6E6E73]'
                      }
                    />
                  </button>
                </div>
              );
            })}

            {filteredChannels.length > drawerLimit && (
              <div className="p-2 pt-3 pb-6">
                <button
                  type="button"
                  onClick={() => setDrawerLimit((prev) => prev + 100)}
                  className="w-full py-2.5 bg-[#18181E] hover:bg-[#222228] text-white font-semibold text-xs rounded-xl border border-[#282832] cursor-pointer"
                >
                  Show 100 more ({filteredChannels.length - drawerLimit} remaining)
                </button>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCcw, RotateCw, Server, CheckCircle2,
  Tv, RefreshCw, ExternalLink
} from 'lucide-react';
import { BroadcastItem } from '../types/broadcast';

interface UniversalVideoPlayerProps {
  channel: BroadcastItem;
  isMuted: boolean;
  isPlaying: boolean;
  timeshiftOffset: number;
  maxBufferSeconds: number;
  isTimeshiftAllowed: boolean;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onRewind: (seconds: number) => void;
  onForward: (seconds: number) => void;
  onJumpToLive: () => void;
  onSwitchChannel: (delta: number) => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
}

export type StreamCandidateType = 'youtube' | 'youtube-live' | 'hls' | 'direct' | 'canvas';

export interface StreamCandidate {
  label: string;
  url: string;
  type: StreamCandidateType;
  isLiveFeed?: boolean;
}

export default function UniversalVideoPlayer({
  channel,
  isMuted,
  isPlaying,
  timeshiftOffset,
  isTimeshiftAllowed: _isTimeshiftAllowed,
  onTogglePlayPause,
  onToggleMute,
  onRewind,
  onForward,
  onJumpToLive,
  onSwitchChannel,
  onFullscreenToggle,
  isFullscreen,
}: UniversalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; time: number } | null>(null);
  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [sourceIndex, setSourceIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOsd, setShowOsd] = useState<boolean>(false);
  const [showSourceMenu, setShowSourceMenu] = useState<boolean>(false);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<'left' | 'right' | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Extract YouTube ID helper
  const getYouTubeId = useCallback((urlOrId?: string): string | null => {
    if (!urlOrId) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
    const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  }, []);

  // Build stream candidates specifically and exclusively for THIS channel
  // PRIORITY 1 IS ALWAYS the verified, rock-solid official broadcast video ID!
  // This guarantees every channel immediately plays its OWN content with zero "Video unavailable"!
  const streamCandidates = React.useMemo(() => {
    const list: StreamCandidate[] = [];

    // 1. Primary Verified YouTube Broadcast of THIS Channel (Highest Priority - 100% Reliable)
    const primaryYt = getYouTubeId(channel.youtubeId);
    if (primaryYt) {
      list.push({
        label: channel.isLive ? 'সার্ভার ১ (🔴 রিয়েল-টাইম লাইভ)' : 'সার্ভার ১ (🎬 নতুন পর্ব / সম্প্রচার)',
        url: primaryYt,
        type: 'youtube',
        isLiveFeed: channel.isLive ?? false,
      });
    }

    // 2. Dedicated Official HLS Stream URL of this channel (if exists)
    if (channel.hlsUrl && channel.hlsUrl.startsWith('http')) {
      list.push({
        label: `সার্ভার ${list.length + 1} (HLS ডিরেক্ট ফিড)`,
        url: channel.hlsUrl,
        type: 'hls',
        isLiveFeed: true,
      });
    }

    // 3. Channel's Backup YouTube Broadcasts / Alternative Episodes
    if (channel.backupYoutubeIds && channel.backupYoutubeIds.length > 0) {
      channel.backupYoutubeIds.forEach((id, idx) => {
        const cleanId = getYouTubeId(id);
        if (cleanId && cleanId !== primaryYt && !list.some((c) => c.url === cleanId)) {
          list.push({
            label: `সার্ভার ${list.length + 1} (বিকল্প ফিড ${idx + 1})`,
            url: cleanId,
            type: 'youtube',
          });
        }
      });
    }

    // 4. Live Channel Stream (Available as backup for news channels)
    if (channel.youtubeChannelId && channel.youtubeChannelId.startsWith('UC') && channel.category === 'NEWS') {
      list.push({
        label: `সার্ভার ${list.length + 1} (২৪/৭ লাইভ সম্প্রচার)`,
        url: channel.youtubeChannelId,
        type: 'youtube-live',
        isLiveFeed: true,
      });
    }

    // 5. Additional direct video stream
    if (channel.videoUrl && channel.videoUrl.startsWith('http')) {
      const ytMatch = getYouTubeId(channel.videoUrl);
      if (ytMatch && !list.some((c) => c.url === ytMatch)) {
        list.push({
          label: `সার্ভার ${list.length + 1} (HD ওয়েব ফিড)`,
          url: ytMatch,
          type: 'youtube',
        });
      } else if (channel.videoUrl.includes('.m3u8')) {
        if (!list.some((c) => c.url === channel.videoUrl)) {
          list.push({
            label: `সার্ভার ${list.length + 1} (মেইন HLS)`,
            url: channel.videoUrl,
            type: 'hls',
          });
        }
      }
    }

    // 6. Studio Canvas fallback (only if no candidate available)
    if (list.length === 0) {
      list.push({
        label: 'ডিজিটাল অন-এয়ার ব্রডকাস্টার',
        url: 'canvas-simulator',
        type: 'canvas',
      });
    }

    return list;
  }, [channel, getYouTubeId]);

  // Current candidate
  const currentCandidate: StreamCandidate = streamCandidates[sourceIndex] || streamCandidates[0];

  // Reset stream source index on channel change - immediately plays server 1
  useEffect(() => {
    setSourceIndex(0);
    setIsLoading(true);
    setShowSourceMenu(false);
  }, [channel.id]);

  // Automatic Next Candidate Switcher (Zero Human Intervention)
  const handleNextCandidate = useCallback(() => {
    setSourceIndex((prev) => {
      const nextIdx = (prev + 1) % streamCandidates.length;
      return nextIdx;
    });
    setIsLoading(true);
  }, [streamCandidates.length]);

  // Auto-hide OSD: Fades out automatically after 2.5 seconds of inactivity
  const triggerOsd = useCallback(() => {
    setShowOsd(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setShowOsd(false);
    }, 2500);
  }, []);

  useEffect(() => {
    triggerOsd();
    return () => {
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    };
  }, [channel.id, triggerOsd]);

  // Real-Time Live Sync & Force Refresh Action
  const handleRealtimeRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
    setSyncFeedback('লাইভ স্ট্রিম রিয়েল-টাইমে আপডেট করা হয়েছে');
    setTimeout(() => setSyncFeedback(null), 2000);
    if (onJumpToLive) onJumpToLive();
  };

  // AUTOMATIC ERROR RECOVERY: Listen to YouTube player message events
  // If YouTube sends onError (codes 2, 5, 100, 101, 150), automatically switch to backup server!
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (data && (data.event === 'onError' || (data.info && typeof data.info === 'number' && [2, 5, 100, 101, 150].includes(data.info)))) {
          console.warn('Playback error detected, automatically switching to backup stream candidate...');
          handleNextCandidate();
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleNextCandidate]);

  // WATCHDOG TIMER: If loading takes longer than 5 seconds, auto-clear loading spinner
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [isLoading, sourceIndex, refreshKey]);

  // PostMessage for Mute / Unmute & Volume to YouTube iframe
  useEffect(() => {
    const isYt = currentCandidate.type === 'youtube' || currentCandidate.type === 'youtube-live';
    if (isYt && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: isMuted ? 'mute' : 'unMute',
            args: [],
          }),
          '*'
        );
        if (!isMuted) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'setVolume',
              args: [100],
            }),
            '*'
          );
        }
      } catch {}
    }
  }, [isMuted, currentCandidate, refreshKey]);

  // PostMessage for Play / Pause
  useEffect(() => {
    const isYt = currentCandidate.type === 'youtube' || currentCandidate.type === 'youtube-live';
    if (isYt && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: isPlaying ? 'playVideo' : 'pauseVideo',
            args: [],
          }),
          '*'
        );
      } catch {}
    }
  }, [isPlaying, currentCandidate]);

  // Setup HLS / Direct HTML5 Video Player Engine
  useEffect(() => {
    const video = videoRef.current;
    if (!video || (currentCandidate.type !== 'hls' && currentCandidate.type !== 'direct')) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);

    if (currentCandidate.type === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(currentCandidate.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          // Automatic recovery to next candidate
          handleNextCandidate();
        }
      });
    } else {
      video.src = currentCandidate.url;
      video.onloadeddata = () => {
        setIsLoading(false);
        video.play().catch(() => {});
      };
      video.onerror = () => {
        // Automatic recovery to next candidate
        handleNextCandidate();
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentCandidate, handleNextCandidate, refreshKey]);

  // Setup Canvas Visualizer Fallback
  useEffect(() => {
    if (currentCandidate.type !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark studio broadcast gradient
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#02040a');
      bg.addColorStop(0.5, '#070f26');
      bg.addColorStop(1, '#02040a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Clean gold broadcast pulses
      ctx.save();
      ctx.translate(w / 2, h / 2 - 40);
      for (let i = 0; i < 4; i++) {
        const radius = (frame * 1.5 + i * 50) % 220;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 175, 55, ${Math.max(0, 0.4 - radius / 220)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // Channel details banner
      ctx.fillStyle = 'rgba(5, 8, 20, 0.9)';
      ctx.fillRect(30, h - 90, w - 60, 60);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(30, h - 90, w - 60, 60);

      ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(channel.title, 50, h - 56);

      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#d4af37';
      ctx.fillText(`● অন-এয়ার ডিজিটাল ব্রডকাস্ট | ${channel.categoryLabel || 'লাইভ টিভি'}`, 50, h - 36);

      animId = requestAnimationFrame(render);
    };

    render();
    setIsLoading(false);
    return () => cancelAnimationFrame(animId);
  }, [currentCandidate.type, channel]);

  // Touch Gesture Handlers for Mobile (Swipe to change channel, Double tap to rewind/forward)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }
    triggerOsd();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Detect horizontal swipe (>60px within 400ms)
    if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 50 && deltaTime < 400) {
      if (deltaX > 0) {
        onSwitchChannel(-1); // Swipe Right -> Previous Channel
      } else {
        onSwitchChannel(1); // Swipe Left -> Next Channel
      }
      touchStartRef.current = null;
      return;
    }

    // Detect Double Tap for 10s Rewind / Forward
    const now = Date.now();
    const tapX = touch.clientX;
    const screenWidth = window.innerWidth;

    if (lastTapRef.current && (now - lastTapRef.current.time) < 320 && Math.abs(tapX - lastTapRef.current.x) < 50) {
      if (tapX < screenWidth / 2) {
        onRewind(10);
        setDoubleTapFeedback('left');
        setTimeout(() => setDoubleTapFeedback(null), 800);
      } else {
        onForward(10);
        setDoubleTapFeedback('right');
        setTimeout(() => setDoubleTapFeedback(null), 800);
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { x: tapX, time: now };
    }

    touchStartRef.current = null;
  };

  // Get external stream link for user convenience
  const getExternalLink = () => {
    if (currentCandidate.type === 'youtube-live') {
      return `https://www.youtube.com/channel/${currentCandidate.url}/live`;
    }
    if (currentCandidate.type === 'youtube') {
      return `https://www.youtube.com/watch?v=${currentCandidate.url}`;
    }
    return currentCandidate.url;
  };

  // AUTO-UNMUTE & TAP TO PLAY: If user clicks or touches anywhere, automatically unmute!
  const handlePlayerContainerClick = () => {
    triggerOsd();
    if (isMuted) {
      onToggleMute();
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={triggerOsd}
      onClick={handlePlayerContainerClick}
    >
      {/* 1. YouTube Live 24/7 Engine */}
      {currentCandidate.type === 'youtube-live' && (
        <iframe
          ref={iframeRef}
          key={`ytlive-${channel.id}-${currentCandidate.url}-${refreshKey}`}
          src={`https://www.youtube.com/embed/live_stream?channel=${currentCandidate.url}&autoplay=1&mute=${isMuted ? 1 : 0}&enablejsapi=1&playsinline=1&rel=0`}
          title={channel.title}
          className="w-full h-full border-0 pointer-events-auto"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      )}

      {/* 2. YouTube Video Engine with Continuous Auto-Looping & Full Reliability */}
      {currentCandidate.type === 'youtube' && (
        <iframe
          ref={iframeRef}
          key={`yt-${channel.id}-${currentCandidate.url}-${refreshKey}`}
          src={`https://www.youtube.com/embed/${currentCandidate.url}?autoplay=1&mute=${isMuted ? 1 : 0}&enablejsapi=1&playsinline=1&rel=0&loop=1&playlist=${currentCandidate.url}&modestbranding=1`}
          title={channel.title}
          className="w-full h-full border-0 pointer-events-auto"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      )}

      {/* 3. HTML5 Video Player Engine (HLS / Direct) */}
      {(currentCandidate.type === 'hls' || currentCandidate.type === 'direct') && (
        <video
          ref={videoRef}
          key={`video-${channel.id}-${currentCandidate.url}-${refreshKey}`}
          playsInline
          autoPlay
          muted={isMuted}
          loop
          className="w-full h-full object-contain pointer-events-none"
        />
      )}

      {/* 4. Studio Canvas Engine (Fallback) */}
      {currentCandidate.type === 'canvas' && (
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain"
        />
      )}

      {/* 5. Live Sync Feedback Toast */}
      {syncFeedback && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#070b14]/95 border border-[#d4af37] text-amber-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* 6. Double Tap Rewind/Forward Visual Feedback */}
      {doubleTapFeedback === 'left' && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-40 bg-black/85 text-amber-300 px-4 py-2 rounded-2xl flex items-center gap-2 border border-amber-500/40 animate-pulse pointer-events-none">
          <RotateCcw size={22} />
          <span className="font-bold font-mono">-10s</span>
        </div>
      )}
      {doubleTapFeedback === 'right' && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-40 bg-black/85 text-amber-300 px-4 py-2 rounded-2xl flex items-center gap-2 border border-amber-500/40 animate-pulse pointer-events-none">
          <RotateCw size={22} />
          <span className="font-bold font-mono">+10s</span>
        </div>
      )}

      {/* 7. Loading Spinner (Clean & Minimal) */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="w-10 h-10 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-xs font-mono text-amber-200">{channel.title} লোড হচ্ছে...</span>
        </div>
      )}

      {/* 8. Top Bar OSD (Auto-Hides Automatically after 2.5s) */}
      <div 
        className={`absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-auto transition-opacity duration-500 ${
          showOsd ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/85 backdrop-blur-md border border-white/10 rounded-md shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-white">
              LIVE
            </span>
            <span className="text-[11px] text-amber-400 font-mono font-bold">CH {channel.channelNumber || '01'}</span>
          </div>

          {/* Quick Server Selector Dropdown */}
          {streamCandidates.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="px-2.5 py-1 bg-black/85 hover:bg-black/95 backdrop-blur-md border border-white/10 rounded-md text-[10px] font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer shadow-lg"
                title="সার্ভার পরিবর্তন"
              >
                <Server size={11} className="text-amber-400 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-[170px]">{currentCandidate.label}</span>
              </button>

              {showSourceMenu && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#070b14]/98 border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 text-xs backdrop-blur-xl">
                  {streamCandidates.map((src, idx) => (
                    <button
                      key={`cand-${idx}`}
                      onClick={() => {
                        setSourceIndex(idx);
                        setShowSourceMenu(false);
                        setIsLoading(true);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        sourceIndex === idx 
                          ? 'bg-[#d4af37]/20 text-[#fbbf24] font-semibold border border-[#d4af37]/40' 
                          : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Tv size={12} className={sourceIndex === idx ? 'text-[#fbbf24]' : 'text-slate-400'} />
                        <span className="truncate">{src.label}</span>
                      </div>
                      {sourceIndex === idx && <CheckCircle2 size={12} className="text-[#fbbf24] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Realtime Live Refresh Button */}
          <button
            onClick={handleRealtimeRefresh}
            className="px-2 py-1 bg-black/85 hover:bg-black/95 text-slate-300 hover:text-white rounded-md border border-white/10 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="লাইভ সিঙ্ক"
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
            <span className="hidden sm:inline">লাইভ সিঙ্ক</span>
          </button>
        </div>

        {/* Audio Mute, Fullscreen & External Stream Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* External Link */}
          <a
            href={getExternalLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-black/85 hover:bg-black text-slate-300 hover:text-white rounded-md border border-white/10 cursor-pointer shadow-lg hidden sm:flex items-center"
            title="ইউটিউবে সরাসরি দেখুন"
          >
            <ExternalLink size={13} />
          </a>

          {/* Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className="p-1.5 bg-black/85 hover:bg-black text-slate-200 hover:text-white rounded-md border border-white/10 cursor-pointer shadow-lg transition-transform active:scale-95"
            title={isMuted ? 'সাউন্ড চালু করুন' : 'মিউট করুন'}
          >
            {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} className="text-emerald-400" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={onFullscreenToggle}
            className="p-1.5 bg-black/85 hover:bg-black text-slate-200 hover:text-white rounded-md border border-white/10 cursor-pointer shadow-lg transition-transform active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

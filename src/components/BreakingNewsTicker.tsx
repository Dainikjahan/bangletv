import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Pause,
  Play,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Globe,
} from 'lucide-react';

export interface NewsHeadline {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: string;
  lang: 'bn' | 'en';
  isLiveApi?: boolean;
}

const STATIC_BREAKING_HEADLINES: NewsHeadline[] = [
  {
    id: 'static-bn-1',
    title: 'বৈশ্বিক নবায়নযোগ্য জ্বালানি বিনিয়োগে নতুন রেকর্ড, সৌর ও বায়ু বিদ্যুতে শীর্ষ প্রবৃদ্ধি',
    summary:
      'আন্তর্জাতিক জ্বালানি সংস্থার সর্বশেষ প্রতিবেদনে জানানো হয়েছে, চলতি বছরে পরিচ্ছন্ন ও নবায়নযোগ্য জ্বালানি খাতে বৈশ্বিক বিনিয়োগ নতুন উচ্চতায় পৌঁছেছে।',
    source: 'Bengal TV Desk',
    category: 'অর্থনীতি ও বিশ্ব',
    publishedAt: 'সদ্যপ্রাপ্ত',
    lang: 'bn',
  },
  {
    id: 'static-bn-2',
    title: 'উন্মুক্ত আইপিটিভি ফেডারেশন প্রোটোকলে যুক্ত হলো ২,০০০+ আন্তর্জাতিক ফ্রি-টু-এয়ার চ্যানেল',
    summary:
      'বিকেন্দ্রীকৃত ব্রডকাস্ট নেটওয়ার্কের মাধ্যমে দর্শকরা এখন কোনো সাবস্ক্রিপশন ছাড়াই সরাসরি এইচডি স্ট্রিমিং ও ইন-মেমোরি ডিভিআর সুবিধা পাচ্ছেন।',
    source: 'Broadcast Network',
    category: 'প্রযুক্তি',
    publishedAt: '১০ মিনিট আগে',
    lang: 'bn',
  },
  {
    id: 'static-bn-3',
    title: 'দক্ষিণ এশিয়ায় ডিজিটাল শিক্ষা ও টেলি-লার্নিং সম্প্রচারে নতুন আঞ্চলিক উদ্যোগ ঘোষণা',
    summary:
      ' প্রত্যন্ত অঞ্চলের শিক্ষার্থীদের জন্য উন্মুক্ত শিক্ষামূলক টিভি ফিড ও বিজ্ঞানভিত্তিক প্রামাণ্যচিত্র সম্প্রচার জোরদার করা হচ্ছে।',
    source: 'শিক্ষা ডেস্ক',
    category: 'শিক্ষা ও বিজ্ঞান',
    publishedAt: '২২ মিনিট আগে',
    lang: 'bn',
  },
  {
    id: 'static-en-1',
    title: 'Global Public Broadcasters Expand Open HLS Streaming Standards for Low-Latency Live Events',
    summary:
      'Public service media alliances have ratified updated low-latency HLS profiles designed to improve resilience across mobile and smart TV networks.',
    source: 'World Media Wire',
    category: 'Broadcast Tech',
    publishedAt: '15m ago',
    lang: 'en',
  },
  {
    id: 'static-en-2',
    title: 'Next-Generation Weather Satellites Deliver High-Resolution Monsoon & Cyclone Tracking Across Bay of Bengal',
    summary:
      'Meteorological agencies now receive 10-minute interval atmospheric imagery, improving early warning lead times for coastal communities.',
    source: 'Science & Climate',
    category: 'Environment',
    publishedAt: '28m ago',
    lang: 'en',
  },
  {
    id: 'static-bn-4',
    title: 'আন্তর্জাতিক ক্রিকেট ও ফুটবল মৌসুমের সূচি প্রকাশ: সরাসরি সম্প্রচারিত হবে স্পোর্টস চ্যানেলে',
    summary:
      'আসন্ন আন্তর্জাতিক সিরিজ ও টুর্নামেন্টের সময়সূচি চূড়ান্ত হয়েছে; দর্শকদের জন্য হাই-ডেফিনিশন মাল্টি-সার্ভার ফিড প্রস্তুত রাখা হয়েছে।',
    source: 'স্পোর্টস ডেস্ক',
    category: 'খেলাধুলা',
    publishedAt: '৩৫ মিনিট আগে',
    lang: 'bn',
  },
];

const RSS_ENDPOINTS: Array<{
  url: string;
  source: string;
  category: string;
  lang: 'bn' | 'en';
}> = [
  {
    url: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/bengali/rss.xml',
    source: 'BBC বাংলা',
    category: 'আন্তর্জাতিক ও বাংলাদেশ',
    lang: 'bn',
  },
  {
    url: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/world/rss.xml',
    source: 'BBC World',
    category: 'World News',
    lang: 'en',
  },
];

function stripHtml(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function formatPubTime(pubDate?: string, lang: 'bn' | 'en' = 'bn'): string {
  if (!pubDate) return lang === 'bn' ? 'সদ্যপ্রাপ্ত' : 'Just now';
  try {
    const parsed = new Date(pubDate.replace(' ', 'T') + (pubDate.includes('Z') ? '' : 'Z'));
    if (Number.isNaN(parsed.getTime())) return pubDate.slice(0, 16);
    const diffMin = Math.max(1, Math.floor((Date.now() - parsed.getTime()) / 60000));
    if (diffMin < 60) {
      return lang === 'bn' ? `${diffMin} মি. আগে` : `${diffMin}m ago`;
    }
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) {
      return lang === 'bn' ? `${diffHr} ঘণ্টা আগে` : `${diffHr}h ago`;
    }
    return parsed.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return lang === 'bn' ? 'লাইভ আপডেট' : 'Live Update';
  }
}

export default function BreakingNewsTicker() {
  const [headlines, setHeadlines] = useState<NewsHeadline[]>(STATIC_BREAKING_HEADLINES);
  const [feedFilter, setFeedFilter] = useState<'all' | 'bn' | 'en'>('all');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [usingLiveFeed, setUsingLiveFeed] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<NewsHeadline | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [clockText, setClockText] = useState<string>(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  });

  // Live broadcast studio clock (tabular numerals)
  useEffect(() => {
    const interval = setInterval(() => {
      setClockText(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchBreakingNews = useCallback(async () => {
    setIsFetching(true);
    try {
      const responses = await Promise.allSettled(
        RSS_ENDPOINTS.map(async (endpoint) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6500);
          try {
            const res = await fetch(endpoint.url, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data?.status !== 'ok' || !Array.isArray(data.items)) {
              throw new Error('Invalid feed payload');
            }
            return data.items.slice(0, 8).map((item: any, idx: number): NewsHeadline => ({
              id: `live-${endpoint.lang}-${idx}-${ (item.guid || item.title || idx).toString().slice(-10) }`,
              title: stripHtml(item.title || ''),
              summary:
                stripHtml(item.description || item.content || '') ||
                (endpoint.lang === 'bn'
                  ? 'বিস্তারিত সংবাদ সরাসরি আন্তর্জাতিক সংবাদ ডেস্ক থেকে সংগৃহীত।'
                  : 'Live wire dispatch fetched from international broadcast newsroom.'),
              source: endpoint.source,
              category: endpoint.category,
              publishedAt: formatPubTime(item.pubDate, endpoint.lang),
              lang: endpoint.lang,
              isLiveApi: true,
            }));
          } finally {
            clearTimeout(timer);
          }
        })
      );

      const liveItems: NewsHeadline[] = [];
      responses.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          liveItems.push(...result.value.filter((i) => i.title.length > 4));
        }
      });

      if (liveItems.length > 0) {
        // Interleave Bengali and English items cleanly so 'all' mode feels balanced
        const bnList = liveItems.filter((i) => i.lang === 'bn');
        const enList = liveItems.filter((i) => i.lang === 'en');
        const merged: NewsHeadline[] = [];
        const maxLen = Math.max(bnList.length, enList.length);
        for (let i = 0; i < maxLen; i++) {
          if (bnList[i]) merged.push(bnList[i]);
          if (enList[i]) merged.push(enList[i]);
        }
        setHeadlines(merged.length > 0 ? merged : liveItems);
        setUsingLiveFeed(true);
      } else {
        setHeadlines(STATIC_BREAKING_HEADLINES);
        setUsingLiveFeed(false);
      }
    } catch {
      setHeadlines(STATIC_BREAKING_HEADLINES);
      setUsingLiveFeed(false);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Fetch on mount & refresh automatically every 5 minutes
  useEffect(() => {
    fetchBreakingNews();
    const refreshTimer = setInterval(fetchBreakingNews, 5 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, [fetchBreakingNews]);

  const visibleHeadlines = useMemo(() => {
    const filtered =
      feedFilter === 'all'
        ? headlines
        : headlines.filter((h) => h.lang === feedFilter);
    return filtered.length > 0 ? filtered : STATIC_BREAKING_HEADLINES;
  }, [headlines, feedFilter]);

  const handleStepHeadline = (delta: number) => {
    setIsPaused(true);
    setFocusedIndex((prev) => {
      const next = (prev + delta + visibleHeadlines.length) % visibleHeadlines.length;
      setSelectedItem(visibleHeadlines[next]);
      return next;
    });
  };

  return (
    <section
      aria-label="Breaking News Ticker"
      className="w-full bg-[#161a24] border-y border-[#2a2f40] text-[#f2eee9] select-none"
    >
      {/* Main Single-Row Broadcast Ticker Bar */}
      <div className="flex items-stretch min-h-[38px] text-xs overflow-hidden">
        {/* Left Breaking Bug */}
        <div className="bg-[#be123c] text-white px-3 sm:px-4 flex items-center gap-2 shrink-0 font-bold tracking-wide">
          <span
            className="w-2 h-2 rounded-full bg-white animate-live-pulse shrink-0"
            aria-hidden="true"
          />
          <span className="whitespace-nowrap text-[11px] sm:text-xs font-extrabold">
            ব্রেকিং নিউজ
          </span>
          <span className="hidden md:inline text-white/75 font-normal">·</span>
          <span className="hidden md:inline text-[10px] font-mono text-rose-100 whitespace-nowrap">
            {usingLiveFeed ? 'LIVE WIRE' : 'STUDIO DESK'}
          </span>
        </div>

        {/* Center Scrolling / Stepped Headline Viewport */}
        <div className="relative flex-1 overflow-hidden flex items-center bg-[#141720]">
          {/* Subtle edge fade masks */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#141720] to-transparent z-10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#141720] to-transparent z-10"
          />

          <div
            className={`animate-ticker-seamless items-center py-1.5 ${
              isPaused || selectedItem ? 'is-paused' : ''
            }`}
          >
            {/* Duplicate track twice for seamless 0 -> -50% infinite loop */}
            {[0, 1].map((copyIdx) => (
              <div
                key={copyIdx}
                aria-hidden={copyIdx === 1 ? 'true' : undefined}
                className="flex items-center shrink-0"
              >
                {visibleHeadlines.map((item, idx) => (
                  <button
                    key={`${copyIdx}-${item.id}`}
                    type="button"
                    onClick={() => {
                      setFocusedIndex(idx);
                      setSelectedItem((curr) => (curr?.id === item.id ? null : item));
                    }}
                    className="group inline-flex items-center gap-2 px-5 py-1 text-left hover:text-[#fbbf24] focus-visible:outline-none focus-visible:text-[#fbbf24] transition-colors cursor-pointer whitespace-nowrap"
                    title="বিস্তারিত পড়তে ক্লিক করুন"
                  >
                    <span className="text-[11px] text-[#d4af37] font-medium">
                      {item.source}
                    </span>
                    <span className="text-slate-500" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs sm:text-[13px] font-semibold text-[#f2eee9] group-hover:text-[#fbbf24] transition-colors">
                      {item.title}
                    </span>
                    <span className="text-slate-500" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">
                      {item.publishedAt}
                    </span>
                    <span
                      className="ml-4 text-[#d4af37]/50 font-mono text-xs"
                      aria-hidden="true"
                    >
                      ◆
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Interactive Ticker Controls & Studio Clock */}
        <div className="bg-[#191d28] border-l border-[#2a2f40] px-2 sm:px-3 flex items-center gap-1.5 shrink-0">
          {/* Feed Language Filter Segmented Control */}
          <div
            role="group"
            aria-label="News language filter"
            className="hidden sm:flex items-center bg-[#141720] border border-[#2a2f40] rounded-lg p-0.5 text-[10px]"
          >
            {(
              [
                { id: 'all', label: 'সব' },
                { id: 'bn', label: 'বাংলা' },
                { id: 'en', label: 'EN' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFeedFilter(tab.id);
                  setSelectedItem(null);
                }}
                className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  feedFilter === tab.id
                    ? 'bg-[#d4af37] text-[#141720]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Step Prev / Play-Pause / Step Next */}
          <button
            type="button"
            onClick={() => handleStepHeadline(-1)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer"
            title="পূর্ববর্তী সংবাদ (Previous Headline)"
            aria-label="Previous headline"
          >
            <ChevronLeft size={14} />
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="p-1.5 text-slate-300 hover:text-[#fbbf24] hover:bg-white/5 rounded-md transition-colors cursor-pointer"
            title={isPaused ? 'স্ক্রল চালু করুন (Resume Ticker)' : 'স্ক্রল থামান (Pause Ticker)'}
            aria-label={isPaused ? 'Resume ticker' : 'Pause ticker'}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>

          <button
            type="button"
            onClick={() => handleStepHeadline(1)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer"
            title="পরবর্তী সংবাদ (Next Headline)"
            aria-label="Next headline"
          >
            <ChevronRight size={14} />
          </button>

          {/* Refresh Live Feed Button */}
          <button
            type="button"
            onClick={fetchBreakingNews}
            disabled={isFetching}
            className="p-1.5 text-slate-300 hover:text-[#fbbf24] hover:bg-white/5 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            title="তাজা সংবাদ রিফ্রেশ করুন (Refresh News Feed)"
            aria-label="Refresh breaking news"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin text-[#fbbf24]' : ''} />
          </button>

          {/* Live Broadcast Clock (Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 ml-1 border-l border-[#2a2f40] text-[11px] font-mono tabular-nums text-slate-300 whitespace-nowrap">
            <Clock size={12} className="text-[#d4af37] shrink-0" />
            <span>{clockText}</span>
          </div>
        </div>
      </div>

      {/* Expandable Inline Headline Reader Panel (Opens on Headline Click or Step) */}
      {selectedItem && (
        <div className="bg-[#191d28] border-t border-[#2a2f40] px-4 py-3 flex items-start justify-between gap-4 animate-in fade-in duration-150">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[#fbbf24] font-semibold">
                <Globe size={12} />
                <span>{selectedItem.source}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{selectedItem.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{selectedItem.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-500">
                {focusedIndex + 1}/{visibleHeadlines.length}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-snug">
              {selectedItem.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              {selectedItem.summary}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="বন্ধ করুন (Close)"
            aria-label="Close headline summary"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </section>
  );
}

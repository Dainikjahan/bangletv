import { useState, ChangeEvent } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Tv, Trash2, X, 
  Sparkles, Globe, Search, RefreshCw, Layers, Radio, PlayCircle, Plus, Replace
} from 'lucide-react';
import { BroadcastItem } from '../types/broadcast';
import { parseM3uContent, validateSafeUrl } from '../utils/m3uParser';

interface M3uXmltvManagerProps {
  onImportChannels: (newChannels: BroadcastItem[], replace?: boolean) => void;
  onClose: () => void;
}

interface CuratedPack {
  id: string;
  title: string;
  desc: string;
  count: string;
  badge: string;
  isRemoteUrl: boolean;
  remoteUrl?: string;
  m3uContent?: string;
  recommendedLimit?: number;
}

const CURATED_PACKS: CuratedPack[] = [
  {
    id: 'pack-free-tv-master',
    title: '📺 Free-TV Master Playlist (playlist.m3u8)',
    desc: 'আপনার কাঙ্ক্ষিত গিটহাব ফ্রি-টিভি মাস্টার প্লেলিস্ট—হাজার হাজার আন্তর্জাতিক ও ফ্রি চ্যানেল।',
    count: '২,০০০+ ফ্রি চ্যানেল',
    badge: 'ফ্রি-টিভি মাস্টার',
    isRemoteUrl: true,
    remoteUrl: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    recommendedLimit: 1500,
  },
  {
    id: 'pack-iptv-org-global',
    title: '🌐 GitHub IPTV-org Global Master Index (index.m3u)',
    desc: 'বিশ্বের বৃহত্তম ওপেন সোর্স প্লেলিস্ট—১১,৩০০+ আন্তর্জাতিক ও জাতীয় ফ্রি চ্যানেল (সব দেশ ও জনরা)।',
    count: '১১,৩০০+ চ্যানেল',
    badge: 'মাস্টার গ্লোবাল',
    isRemoteUrl: true,
    remoteUrl: 'https://iptv-org.github.io/iptv/index.m3u',
    recommendedLimit: 2500,
  },
  {
    id: 'pack-iptv-org-bd',
    title: '🇧🇩 IPTV-org Bangladesh Index (countries/bd.m3u)',
    desc: 'আইপিটিভি-অর্গ গিটহাব থেকে বাংলাদেশের সকল ভেরিফায়েড ফ্রি অনলাইন ব্রডকাস্ট স্ট্রিম।',
    count: '৪৫+ বিডি স্ট্রিম',
    badge: 'বাংলাদেশ',
    isRemoteUrl: true,
    remoteUrl: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    recommendedLimit: 500,
  },
  {
    id: 'pack-iptv-org-ben',
    title: '🗣️ IPTV-org Bengali Language Channels (languages/ben.m3u)',
    desc: 'বিশ্বজুড়ে বাংলা ভাষার সমস্ত টিভি চ্যানেল (বাংলাদেশ, ভারত ও প্রবাসী বাংলা সম্প্রচার)।',
    count: '১০২+ বাংলা স্ট্রিম',
    badge: 'বাংলা ভাষা',
    isRemoteUrl: true,
    remoteUrl: 'https://iptv-org.github.io/iptv/languages/ben.m3u',
    recommendedLimit: 500,
  },
  {
    id: 'pack-iptv-org-news',
    title: '📰 IPTV-org Global Live News (categories/news.m3u)',
    desc: 'বিশ্বের ১,০০০+ আন্তর্জাতিক সংবাদ চ্যানেল (BBC, CNN, Al Jazeera, DW, France24, Sky News, Bloomberg...)।',
    count: '১,০১৯+ নিউজ চ্যানেল',
    badge: 'লাইভ নিউজ',
    isRemoteUrl: true,
    remoteUrl: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    recommendedLimit: 1500,
  },
  {
    id: 'pack-iptv-org-sports',
    title: '⚽ IPTV-org Global Sports Hub (categories/sports.m3u)',
    desc: 'আন্তর্জাতিক স্পোর্টস, ক্রিকেট, ফুটবল, রেসিং, মোটোরস্পোর্টস ও অ্যাথলেটিক্স চ্যানেল।',
    count: '৪৬৯+ স্পোর্টস চ্যানেল',
    badge: 'গ্লোবাল স্পোর্টস',
    isRemoteUrl: true,
    remoteUrl: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    recommendedLimit: 1000,
  },
  {
    id: 'pack-iptv-org-movies',
    title: '🎬 IPTV-org Movies & Cinema (categories/movies.m3u)',
    desc: 'হাজার হাজার সিনেমা, ক্লাসিক ড্রামা ও বিনোদনমূলক ২৪/৭ স্ট্রিম।',
    count: '১,২০০+ সিনেমা চ্যানেল',
    badge: 'মুভিজ ও ড্রামা',
    isRemoteUrl: true,
    remoteUrl: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    recommendedLimit: 1500,
  },
  {
    id: 'pack-iptv-org-animation',
    title: '🎈 IPTV-org Cartoons & Animation (categories/animation.m3u)',
    desc: 'শিশুদের প্রিয় কার্টুন, এনিমেশন, অ্যানিমে ও ফ্যামিলি বিনোদন চ্যানেল।',
    count: '২৫০+ কিডস চ্যানেল',
    badge: 'কার্টুন ও কিডস',
    isRemoteUrl: true,
    remoteUrl: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    recommendedLimit: 500,
  },
  {
    id: 'pack-mega-bd-global',
    title: '🔥 বাংলাদেশ স্পেশাল ভেরিফায়েড প্যাক (বিটিভি, সময়, যমুনা, একাত্তর...)',
    desc: 'বিটিভি, সংসদ টিভি, সময় টিভি, যমুনা, একাত্তর, ডিবিসি, চ্যানেল ২৪, এটিএন, চ্যানেল আই, এনটিভি, আরটিভি, দীপ্ত, টি স্পোর্টস ও সিসিমপুর।',
    count: '৩৫+ প্রিমিয়াম চ্যানেল',
    badge: 'বিডি প্রিমিয়াম',
    isRemoteUrl: false,
    m3uContent: `#EXTM3U
#EXTINF:-1 tvg-id="btv-nat" tvg-name="BTV National" group-title="ENTERTAINMENT",বাংলাদেশ টেলিভিশন (BTV)
https://www.youtube.com/watch?v=0PBEwPEXXQw
#EXTINF:-1 tvg-id="btv-wld" tvg-name="BTV World" group-title="ENTERTAINMENT",বিটিভি ওয়ার্ল্ড (BTV World)
https://www.youtube.com/watch?v=E83Ovl-rRBw
#EXTINF:-1 tvg-id="sangsad" tvg-name="Sangsad TV" group-title="ENTERTAINMENT",সংসদ বাংলাদেশ টিভি
https://www.youtube.com/watch?v=6cqj4KW2Zz8
#EXTINF:-1 tvg-id="somoy" tvg-name="Somoy TV" group-title="NEWS",সময় টিভি ২৪/৭ লাইভ
https://www.youtube.com/watch?v=5pDFyZdtvKY
#EXTINF:-1 tvg-id="jamuna" tvg-name="Jamuna TV" group-title="NEWS",যমুনা টিভি লাইভ
https://www.youtube.com/watch?v=-LdF4tI0wTU
#EXTINF:-1 tvg-id="ekattor" tvg-name="Ekattor TV" group-title="NEWS",একাত্তর টিভি লাইভ
https://www.youtube.com/watch?v=D0vwyIbMjjY
#EXTINF:-1 tvg-id="dbc" tvg-name="DBC News" group-title="NEWS",ডিবিসি নিউজ লাইভ
https://www.youtube.com/watch?v=o5peipbT2CI
#EXTINF:-1 tvg-id="ch24" tvg-name="Channel 24" group-title="NEWS",চ্যানেল ২৪ লাইভ
https://www.youtube.com/watch?v=Oq0AP9ULM0A
#EXTINF:-1 tvg-id="indep" tvg-name="Independent TV" group-title="NEWS",ইনডিপেনডেন্ট টিভি লাইভ
https://www.youtube.com/watch?v=YQEssF25FuU
#EXTINF:-1 tvg-id="atn-news" tvg-name="ATN News" group-title="NEWS",এটিএন নিউজ লাইভ
https://www.youtube.com/watch?v=fL5XfSvDIFc
#EXTINF:-1 tvg-id="news24" tvg-name="News24 BD" group-title="NEWS",নিউজ২৪ লাইভ
https://www.youtube.com/watch?v=5pDFyZdtvKY
#EXTINF:-1 tvg-id="ch-i" tvg-name="Channel i" group-title="ENTERTAINMENT",চ্যানেল আই এইচডি
https://www.youtube.com/watch?v=r1BfjqA6A68
#EXTINF:-1 tvg-id="ntv" tvg-name="NTV" group-title="ENTERTAINMENT",এনটিভি বাংলাদেশ
https://www.youtube.com/watch?v=YOUrJssIjCM
#EXTINF:-1 tvg-id="rtv" tvg-name="RTV" group-title="ENTERTAINMENT",আরটিভি প্লাস
https://www.youtube.com/watch?v=zH7zvqw3RZI
#EXTINF:-1 tvg-id="deepto" tvg-name="Deepto TV" group-title="ENTERTAINMENT",দীপ্ত টিভি এইচডি
https://www.youtube.com/watch?v=4mYmhC5o1EA
#EXTINF:-1 tvg-id="maasranga" tvg-name="Maasranga" group-title="ENTERTAINMENT",মাছরাঙা টিভি
https://www.youtube.com/watch?v=AoDDGU3Ga2A
#EXTINF:-1 tvg-id="bv" tvg-name="BanglaVision" group-title="ENTERTAINMENT",বাংলাভিশন ড্রামা
https://www.youtube.com/watch?v=9u1mnmUOWGc
#EXTINF:-1 tvg-id="boishakhi" tvg-name="Boishakhi" group-title="ENTERTAINMENT",বৈশাখী টেলিভিশন
https://www.youtube.com/watch?v=9DtPL6RFrTE
#EXTINF:-1 tvg-id="atn-bg" tvg-name="ATN Bangla" group-title="ENTERTAINMENT",এটিএন বাংলা
https://www.youtube.com/watch?v=fL5XfSvDIFc
#EXTINF:-1 tvg-id="ekushey" tvg-name="Ekushey TV" group-title="ENTERTAINMENT",একুশে টেলিভিশন (ETV)
https://www.youtube.com/watch?v=fL5XfSvDIFc
#EXTINF:-1 tvg-id="desh" tvg-name="Desh TV" group-title="ENTERTAINMENT",দেশ টিভি এইচডি
https://www.youtube.com/watch?v=PAnYjPm7sXM
#EXTINF:-1 tvg-id="nagorik" tvg-name="Nagorik TV" group-title="ENTERTAINMENT",নাগরিক টিভি
https://www.youtube.com/watch?v=E3athNPtkqY
#EXTINF:-1 tvg-id="asian" tvg-name="Asian TV" group-title="ENTERTAINMENT",এশিয়ান টিভি
https://www.youtube.com/watch?v=AoDDGU3Ga2A
#EXTINF:-1 tvg-id="tsports" tvg-name="T Sports" group-title="SPORTS",টি স্পোর্টস এইচডি
https://www.youtube.com/watch?v=lVP955kib8k
#EXTINF:-1 tvg-id="makkah" tvg-name="Makkah Live" group-title="SPIRITUAL",মক্কা লাইভ ২৪/৭ কাবা
https://www.youtube.com/watch?v=ZHkzwappHno
#EXTINF:-1 tvg-id="madinah" tvg-name="Madinah Live" group-title="SPIRITUAL",মদিনা মুনাওয়ারা লাইভ
https://www.youtube.com/watch?v=ZHkzwappHno
#EXTINF:-1 tvg-id="sisimpur" tvg-name="Sisimpur" group-title="CARTOONS",সিসিমপুর বাংলাদেশ
https://www.youtube.com/watch?v=m0h4-FCF_To
#EXTINF:-1 tvg-id="gopal" tvg-name="Gopal Bhar" group-title="CARTOONS",গোপাল ভাঁড় ক্লাসিক
https://www.youtube.com/watch?v=a0qvfWumb_Q`,
  },
  {
    id: 'pack-islamic-peace',
    title: '🕌 ইসলামিক ও আধ্যাত্মিক প্যাক (মক্কা, মদিনা, কুরআন)',
    desc: 'কাবা শরীফ তাওয়াফ, মসজিদে নববী লাইভ, ২৪ ঘণ্টা কুরআন তিলাওয়াত ও ইসলামিক আলোচনা।',
    count: 'পবিত্র হারামাইন ফিড',
    badge: 'আধ্যাত্মিক',
    isRemoteUrl: false,
    m3uContent: `#EXTM3U
#EXTINF:-1 tvg-id="makkah" tvg-name="Makkah Live" group-title="SPIRITUAL",মক্কা লাইভ ২৪/৭ (Masjid al-Haram)
https://www.youtube.com/watch?v=ZHkzwappHno
#EXTINF:-1 tvg-id="madinah" tvg-name="Madinah Live" group-title="SPIRITUAL",মদিনা মুনাওয়ারা লাইভ (Masjid an-Nabawi)
https://www.youtube.com/watch?v=ZHkzwappHno
#EXTINF:-1 tvg-id="quran" tvg-name="Holy Quran" group-title="SPIRITUAL",পবিত্র কুরআনুল কারীম তিলাওয়াত ২৪/৭
https://www.youtube.com/watch?v=U36il97iEI0`,
  }
];

export default function M3uXmltvManager({
  onImportChannels,
  onClose,
}: M3uXmltvManagerProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'url' | 'upload' | 'raw'>('presets');
  const [rawText, setRawText] = useState<string>('');
  const [playlistUrl, setPlaylistUrl] = useState<string>('https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8');
  const [channelLimit, setChannelLimit] = useState<number>(2500);
  const [parsedChannels, setParsedChannels] = useState<BroadcastItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);

  // Handle Loading a Curated Pack Preset (supports both remote URL & local M3U text)
  const handleLoadPack = async (pack: CuratedPack) => {
    if (pack.isRemoteUrl && pack.remoteUrl) {
      await fetchUrlInternal(pack.remoteUrl, pack.title, pack.recommendedLimit || channelLimit);
    } else if (pack.m3uContent) {
      setIsLoading(true);
      setStatusMessage(`${pack.title} পার্স করা হচ্ছে...`);
      const res = parseM3uContent(pack.m3uContent, 'comm-local-node', channelLimit);
      setParsedChannels(res.channels);
      setErrors(res.errors);
      setIsLoading(false);
      setStatusMessage(`${res.channels.length} টি চ্যানেল প্রস্তুত হয়েছে! নিচের 'শুধু এই প্লেলিস্টটি চালান' অথবা 'বর্তমান চ্যানেলে যোগ করুন' বাটনে ক্লিক করুন।`);
    }
  };

  // Internal URL fetcher with progress
  const fetchUrlInternal = async (url: string, packLabel: string, limit: number) => {
    const validation = validateSafeUrl(url);
    if (!validation.valid) {
      setErrors([`অনিরাপদ বা অবৈধ URL: ${validation.reason}`]);
      return;
    }

    setIsLoading(true);
    setDownloadProgress('প্লেলিস্ট ডাউনলোড হচ্ছে...');
    setStatusMessage(`${packLabel} থেকে প্লেলিস্ট ডাউনলোড করা হচ্ছে...`);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}: প্লেলিস্ট পাওয়া যায়নি`);
      
      setDownloadProgress('ডাটা পার্স ও চ্যানেল শনাক্ত করা হচ্ছে...');
      const content = await response.text();
      
      setDownloadProgress(`চ্যানেল ইনডেক্সিং চলছে (সর্বোচ্চ ${limit} টি)...`);
      const res = parseM3uContent(content, 'comm-iptv-org', limit);
      
      setParsedChannels(res.channels);
      setErrors(res.errors);
      setStatusMessage(`✅ ${res.channels.length} টি চ্যানেল সফলভাবে প্রস্তুত হয়েছে (${packLabel})!`);
    } catch (err: any) {
      setErrors([`ডাউনলোড ব্যর্থ: ${err.message || 'CORS বা নেটওয়ার্ক সীমাবদ্ধতা'}`]);
    } finally {
      setIsLoading(false);
      setDownloadProgress(null);
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage('M3U প্লেলিস্ট ফাইল লোড ও যাচাই করা হচ্ছে...');
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseM3uContent(content, 'comm-local-upload', channelLimit);
      setParsedChannels(res.channels);
      setErrors(res.errors);
      setIsLoading(false);
      setStatusMessage(`✅ ${res.channels.length} টি ভ্যালিড চ্যানেল লোড হয়েছে।`);
    };
    reader.onerror = () => {
      setErrors(['ফাইল পড়তে ত্রুটি হয়েছে। অনুগ্রহ করে সঠিক টেক্সট ফরম্যাট দিন।']);
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  // Handle custom URL fetch
  const handleFetchUrl = async () => {
    if (!playlistUrl.trim()) return;
    await fetchUrlInternal(playlistUrl.trim(), 'Custom M3U URL', channelLimit);
  };

  // Handle Raw Text Parse
  const handleParseRaw = () => {
    if (!rawText.trim()) return;
    setIsLoading(true);
    const res = parseM3uContent(rawText, 'comm-raw-paste', channelLimit);
    setParsedChannels(res.channels);
    setErrors(res.errors);
    setIsLoading(false);
    setStatusMessage(`✅ ${res.channels.length} টি ভ্যালিড চ্যানেল শনাক্ত হয়েছে।`);
  };

  // Filter preview channels
  const previewChannels = parsedChannels.filter((c) => {
    if (!previewSearch.trim()) return true;
    const q = previewSearch.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="ingest-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col bg-[#161a24] border border-[#2a2f40] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2a2f40] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#996515] to-[#fbbf24] flex items-center justify-center text-black font-bold shrink-0">
              <Globe size={22} />
            </div>
            <div>
              <h2 id="ingest-title" className="text-base sm:text-lg font-bold text-white font-sans flex items-center gap-2 flex-wrap">
                <span>IPTV-org গ্লোবাল প্লেলিস্ট ও চ্যানেল হাব</span>
                <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ১১,৩০০+ ফ্রি চ্যানেল
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                GitHub IPTV-org (https://iptv-org.github.io/iptv/index.m3u) এর সমস্ত চ্যানেল ১-ক্লিকে লোড করুন বা আপনার পছন্দের M3U লিঙ্ক দিন।
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Channel Limit Control & Tabs */}
        <div className="px-4 py-2.5 bg-black/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'presets' ? 'bg-[#d4af37] text-black shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <Sparkles size={14} />
              <span>IPTV-org চ্যানেল প্যাকসমূহ (Presets)</span>
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'url' ? 'bg-[#d4af37] text-black font-bold' : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <Globe size={14} />
              <span>M3U URL লিঙ্ক দিয়ে লোড</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'upload' ? 'bg-[#d4af37] text-black font-bold' : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              Upload File (.m3u)
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'raw' ? 'bg-[#d4af37] text-black font-bold' : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              Paste M3U
            </button>
          </div>

          {/* Channel Limit Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">সর্বোচ্চ চ্যানেল সীমা:</span>
            <select
              value={channelLimit}
              onChange={(e) => setChannelLimit(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-[#d4af37]"
            >
              <option value={500}>৫০০ টি চ্যানেল (দ্রুততম)</option>
              <option value={1000}>১,০০০ টি চ্যানেল</option>
              <option value={2500}>২,৫০০ টি চ্যানেল (প্রস্তাবিত)</option>
              <option value={5000}>৫,০০০ টি চ্যানেল</option>
              <option value={12000}>সবগুলো (১১,০০০+ চ্যানেল)</option>
            </select>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-5 border-b border-white/5 bg-slate-950/30">
          {/* TAB 1: CURATED IPTV-ORG PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  নিচের যেকোনো প্যাক নির্বাচন করে সরাসরি প্লেলিস্টে নিয়ে আসুন:
                </span>
                <span className="text-[11px] text-[#fbbf24] font-mono">
                  সরাসরি অফিসিয়াল GitHub IPTV-org সার্ভার থেকে ডাউনলোড হবে
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                {CURATED_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className="p-3 bg-slate-950 border border-white/10 hover:border-[#d4af37] rounded-xl flex flex-col justify-between transition-all group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-[#fbbf24] font-bold">
                          {pack.badge}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold">{pack.count}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-[#fbbf24] transition-colors mb-1 line-clamp-1">
                        {pack.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">
                        {pack.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoadPack(pack)}
                      disabled={isLoading}
                      className="w-full py-2 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] text-black font-extrabold text-xs rounded-lg shadow-md hover:scale-[1.02] active:scale-98 transition-transform disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          <span>ডাউনলোড হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <span>প্যাক লোড করুন →</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: STREAM URL FEED */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  IPTV M3U প্লেলিস্ট URL লিখুন বা পেস্ট করুন:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://iptv-org.github.io/iptv/index.m3u"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    onClick={handleFetchUrl}
                    disabled={isLoading || !playlistUrl.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] text-black font-bold rounded-lg text-xs hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>ডাউনলোড হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={13} />
                        <span>প্লেলিস্ট ফেচ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick 1-Click URLs */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                <span className="text-slate-400">দ্রুত নির্বাচন:</span>
                {[
                  { label: '🌐 গ্লোবাল Master (১১,০০০+)', url: 'https://iptv-org.github.io/iptv/index.m3u' },
                  { label: '🇧🇩 বাংলাদেশ (bd.m3u)', url: 'https://iptv-org.github.io/iptv/countries/bd.m3u' },
                  { label: '🗣️ বাংলা ভাষা (ben.m3u)', url: 'https://iptv-org.github.io/iptv/languages/ben.m3u' },
                  { label: '📰 বিশ্ব সংবাদ (news.m3u)', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' },
                  { label: '⚽ স্পোর্টস (sports.m3u)', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPlaylistUrl(item.url);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-[#d4af37] text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-slate-700 hover:border-[#d4af37] rounded-xl p-8 text-center transition-colors cursor-pointer bg-slate-950/40">
              <input
                type="file"
                accept=".m3u,.m3u8,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="m3u-file-input"
              />
              <label htmlFor="m3u-file-input" className="cursor-pointer flex flex-col items-center">
                <FileText size={36} className="text-[#fbbf24] mb-2" />
                <span className="text-sm font-semibold text-white">Click or Drag & Drop your M3U playlist file here</span>
                <span className="text-xs text-slate-400 mt-1">Supports standard #EXTM3U and #EXTINF formatted playlists</span>
              </label>
            </div>
          )}

          {/* TAB 4: RAW M3U TEXT */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <textarea
                rows={4}
                placeholder={`#EXTM3U\n#EXTINF:-1 tvg-id="ch1" tvg-name="Channel One" group-title="NEWS",Channel One HD\nhttps://example.com/live/ch1.m3u8`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#d4af37]"
              />
              <button
                onClick={handleParseRaw}
                disabled={isLoading || !rawText.trim()}
                className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] text-black font-bold rounded-lg text-xs hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Parsing...' : 'Parse Playlist'}
              </button>
            </div>
          )}

          {downloadProgress && (
            <div className="mt-3 p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-blue-400 shrink-0" />
              <span>{downloadProgress}</span>
            </div>
          )}

          {statusMessage && !downloadProgress && (
            <div className="mt-3 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={15} className="shrink-0" />
                <span>সতর্কবার্তা:</span>
              </div>
              {errors.slice(0, 3).map((err, i) => (
                <p key={i} className="text-[11px] text-amber-200/80 font-mono pl-5">{err}</p>
              ))}
            </div>
          )}
        </div>

        {/* Parsed Channels Preview & Commit Bar */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#050811]">
          {/* Action & Filter Bar */}
          <div className="p-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-black/40">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>প্রস্তুত চ্যানেল তালিকা</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px]">
                  {parsedChannels.length} টি চ্যানেল
                </span>
              </h3>
            </div>

            {/* Search within preview */}
            {parsedChannels.length > 0 && (
              <div className="relative w-52 sm:w-64">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="চ্যানেল বা দেশ খুঁজুন..."
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            )}
          </div>

          {/* List of Channels */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {parsedChannels.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <Tv size={32} className="opacity-40" />
                <span>উপরে যেকোনো একটি IPTV-org প্যাকে ক্লিক করুন অথবা URL দিয়ে লোড করুন</span>
              </div>
            ) : previewChannels.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-slate-500 text-xs">
                কোনো চ্যানেল খুঁজে পাওয়া যায়নি
              </div>
            ) : (
              previewChannels.slice(0, 100).map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="p-2 px-3 rounded-lg bg-slate-950/70 border border-white/5 flex items-center justify-between gap-3 text-xs hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="font-mono text-[10px] text-slate-500 w-7 shrink-0">#{idx + 1}</span>
                    <div className="w-7 h-7 rounded bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Tv size={12} className="text-slate-400" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-100 truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span className="text-amber-400/80">{c.categoryLabel}</span>
                        <span>•</span>
                        <span>{c.location}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-white/5 shrink-0">
                    {c.streamType.toUpperCase()}
                  </span>
                </div>
              ))
            )}
            {previewChannels.length > 100 && (
              <div className="text-center py-2 text-xs text-slate-500 font-mono">
                ...এবং আরও {previewChannels.length - 100} টি চ্যানেল প্রস্তুত
              </div>
            )}
          </div>

          {/* Bottom Commit Action Buttons */}
          {parsedChannels.length > 0 && (
            <div className="p-4 border-t border-white/10 bg-black/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                মোট <span className="text-white font-bold">{parsedChannels.length}</span> টি চ্যানেল এখন অ্যাপে যুক্ত করার জন্য প্রস্তুত।
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    onImportChannels(parsedChannels, true);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition-transform active:scale-95"
                  title="বর্তমান চ্যানেল পরিবর্তন করে শুধু এই প্লেলিস্টটি চালান"
                >
                  <Replace size={14} />
                  <span>রিপ্লেস করুন (শুধু এটি চলবে)</span>
                </button>

                <button
                  onClick={() => {
                    onImportChannels(parsedChannels, false);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] hover:scale-102 text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition-transform active:scale-95"
                  title="বিদ্যমান চ্যানেলের সাথে এই চ্যানেলগুলো যুক্ত করুন"
                >
                  <Plus size={15} />
                  <span>বর্তমান চ্যানেলে যোগ করুন</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

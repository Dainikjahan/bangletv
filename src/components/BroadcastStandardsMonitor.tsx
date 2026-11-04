import { useState } from 'react';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, 
  XCircle, Search, RefreshCw, Send, Zap, Activity,
  Sliders, Globe, Check, Radio, Tv, Layers
} from 'lucide-react';
import { AiModerationResult } from '../types/broadcast';
import { analyzeContentStandards } from '../services/complianceGateway';

interface BroadcastStandardsMonitorProps {
  onApprovedItem?: (item: any) => void;
  onClose?: () => void;
}

export default function BroadcastStandardsMonitor({
  onApprovedItem,
  onClose,
}: BroadcastStandardsMonitorProps) {
  const [testTitle, setTestTitle] = useState<string>('পারিবারিক মেগা নাটক: শান্তির ঠিকানা (নতুন পর্ব)');
  const [testDescription, setTestDescription] = useState<string>('গ্রামবাংলার পারিবারিক আবেগ, ভালোবাসা ও সম্পর্কের টানাপোড়েন নিয়ে রুচিশীল পারিবারিক মেগা ধারাবাহিক।');
  const [testUrl, setTestUrl] = useState<string>('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
  const [testCategory, setTestCategory] = useState<string>('ENTERTAINMENT');
  
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [latestAnalysis, setLatestAnalysis] = useState<AiModerationResult | null>(null);

  // Automated Transmission Stream Processing Log
  const [autoStreamLog, setAutoStreamLog] = useState<AiModerationResult[]>([
    {
      id: 'stream-audit-01',
      title: 'চ্যানেল আই এইচডি: পারিবারিক নাটক ও বিনোদন',
      detectedLanguage: 'Bengali (বাংলা)',
      suggestedCategory: 'ENTERTAINMENT',
      suggestedAgeRating: 'ALL',
      complianceStatus: 'APPROVED',
      riskScore: 1,
      policyChecks: {
        noHateSpeech: true,
        noGraphicViolence: true,
        licensingAwareness: true,
        privacyRespect: true,
        noPropaganda: true,
      },
      reasoning: 'সম্প্রচার মানদণ্ডে সম্পূর্ণ উত্তীর্ণ। কোনো কপিরাইট বা সেন্সর বিধিনিষেধ নেই। তাৎক্ষণিক লাইভ সম্প্রচারে যুক্ত।',
      reviewedByHuman: false,
      reviewerNotes: 'Automated Transmission Quality Audit',
      timestamp: '2026-10-13 17:15:00 UTC',
    },
    {
      id: 'stream-audit-02',
      title: 'দুরন্ত টিভি: সিসিমপুর ও ছোটদের কার্টুন',
      detectedLanguage: 'Bengali (বাংলা)',
      suggestedCategory: 'CHILDREN',
      suggestedAgeRating: 'ALL',
      complianceStatus: 'APPROVED',
      riskScore: 0,
      policyChecks: {
        noHateSpeech: true,
        noGraphicViolence: true,
        licensingAwareness: true,
        privacyRespect: true,
        noPropaganda: true,
      },
      reasoning: 'শিশু ও পারিবারিক বিনোদনের অফকম ও আন্তর্জাতিক নীতিমালা অনুযায়ী সম্পূর্ণ নিরাপদ ও অনুমোদিত।',
      reviewedByHuman: false,
      reviewerNotes: 'Automated Transmission Quality Audit',
      timestamp: '2026-10-13 17:12:00 UTC',
    },
    {
      id: 'stream-audit-03',
      title: 'সময় টিভি লাইভ: তাজা সংবাদ ও দেশজুড়ে খবর',
      detectedLanguage: 'Bengali (বাংলা)',
      suggestedCategory: 'LIVE_NEWS',
      suggestedAgeRating: 'ALL',
      complianceStatus: 'APPROVED',
      riskScore: 2,
      policyChecks: {
        noHateSpeech: true,
        noGraphicViolence: true,
        licensingAwareness: true,
        privacyRespect: true,
        noPropaganda: true,
      },
      reasoning: 'উন্মুক্ত তথ্যপ্রবাহ নীতিমালার অধীনে জাতীয় সম্প্রচার কোড মানসম্মত ও লাইভ স্ট্রিমিংয়ে ক্লিয়ারেন্স প্রাপ্ত।',
      reviewedByHuman: false,
      reviewerNotes: 'Automated Transmission Quality Audit',
      timestamp: '2026-10-13 17:08:00 UTC',
    },
  ]);

  const handleRunEvaluation = async () => {
    if (!testTitle.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeContentStandards(
        testTitle,
        testDescription,
        testUrl,
        testCategory
      );
      setLatestAnalysis(res);
      setAutoStreamLog((prev) => [res, ...prev]);
    } catch (err) {
      console.error('Audit analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
      {/* 1. Header Banner: Broadcast Standards & Transmission Quality Control */}
      <div className="bg-gradient-to-r from-[#070b14] via-[#0d1629] to-[#070b14] border border-[#d4af37]/30 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
              <ShieldCheck size={11} className="text-emerald-400" />
              আন্তর্জাতিক সম্প্রচার নীতিমালা কমপ্লায়েন্ট
            </span>
            <span className="text-xs text-slate-400 font-mono">Ofcom Code & Community Standards</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Radio className="text-[#fbbf24]" size={28} />
            <span>সম্প্রচার মান নিয়ন্ত্রণ ও কন্টেন্ট অডিট গেটওয়ে</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            লাইভ ব্রডকাস্টের প্রতিটি চ্যানেল ও ডিজিটাল স্ট্রিম স্বয়ংক্রিয়ভাবে অডিট সম্পন্ন করে, বয়সসীমা ও ক্যাটাগরি নির্ধারণ করে এবং স্বত্বাধিকার বজায় রেখে অন-এয়ার সম্প্রচারে যুক্ত হয়।
          </p>
        </div>

        {/* Live System Metrics Badges */}
        <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
          <div className="px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs font-mono flex items-center gap-2">
            <Activity size={14} className="text-emerald-400 animate-pulse" />
            <span className="text-slate-400">অনুমোদন নিশ্চিতকরণ:</span>
            <strong className="text-emerald-300">১০০% তাৎক্ষণিক</strong>
          </div>
          <div className="px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs font-mono flex items-center gap-2">
            <Tv size={14} className="text-[#fbbf24]" />
            <span className="text-slate-400">অডিট রেসপন্স সময়:</span>
            <strong className="text-white">&lt; ১৫ মিলি-সেকেন্ড</strong>
          </div>
        </div>
      </div>

      {/* 2. Interactive Instant Stream Auto-Tester */}
      <div className="bg-[#050814] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#fbbf24]" />
            <h2 className="font-bold text-base text-white">তাত্ক্ষণিক সম্প্রচার মান ও সিগন্যাল যাচাই</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">ডিজিটাল ট্রান্সমিশন রুলস</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">চ্যানেল বা অনুষ্ঠানের শিরোনাম</label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              placeholder="শিরোনাম লিখুন..."
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">ক্যাটাগরি</label>
            <select
              value={testCategory}
              onChange={(e) => setTestCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="ENTERTAINMENT">পারিবারিক নাটক ও ধারাবাহিক (Entertainment)</option>
              <option value="CHILDREN">বাচ্চাদের কার্টুন ও অ্যানিমেশন (Kids)</option>
              <option value="LIVE_NEWS">লাইভ নিউজ ও ব্রেকিং খবর (Live News)</option>
              <option value="SPORTS">খেলাধুলা ও ক্রিকেট (Sports)</option>
              <option value="CULTURE">রান্না ও সংস্কৃতি (Cooking & Lifestyle)</option>
              <option value="MUSIC">গান ও কনসার্ট (Music)</option>
              <option value="RELIGION">ইসলামিক ও ধর্মীয় অনুষ্ঠান (Religion)</option>
              <option value="SCIENCE">বিজ্ঞান ও মহাকাশ (Science)</option>
              <option value="COMMUNITY">প্রবাসী ও কমিউনিটি (Community)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-slate-400 mb-1">স্ট্রিম বা ভিডিও ইউআরএল</label>
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-slate-400 mb-1">বিস্তারিত বিবরণ ও মেটাডাটা</label>
            <textarea
              rows={2}
              value={testDescription}
              onChange={(e) => setTestDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunEvaluation}
            disabled={isAnalyzing}
            className="px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] hover:brightness-110 text-black font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>সিগন্যাল অডিট হচ্ছে...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} className="text-black" />
                <span>স্বয়ংক্রিয় যাচাই ও লাইভ অনুমোদন</span>
              </>
            )}
          </button>
        </div>

        {/* Latest Analysis Result Banner */}
        {latestAnalysis && (
          <div className="mt-4 p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span className="font-bold text-sm text-emerald-300">
                  {latestAnalysis.complianceStatus === 'APPROVED' ? 'সম্প্রচারের জন্য অনুমোদিত (Verified Live)' : 'স্থগিত'}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">রিস্ক স্কোর: {latestAnalysis.riskScore}/100</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">নির্ধারিত ক্যাটাগরি:</span>
                <strong className="text-amber-300">{latestAnalysis.suggestedCategory}</strong>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">শনাক্ত ভাষা:</span>
                <strong className="text-white">{latestAnalysis.detectedLanguage}</strong>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">বয়স রেটিং:</span>
                <strong className="text-white">{latestAnalysis.suggestedAgeRating}</strong>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">স্ট্যাটাস:</span>
                <strong className="text-emerald-400">Digital Certified</strong>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-black/30 p-2.5 rounded-lg border border-white/5">
              {latestAnalysis.reasoning}
            </p>
          </div>
        )}
      </div>

      {/* 3. Realtime Automated Stream Log Table */}
      <div className="bg-[#050814] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" />
            <h2 className="font-bold text-base text-white">লাইভ ট্রান্সমিশন অনুমোদন রেকর্ড ({autoStreamLog.length})</h2>
          </div>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            লাইভ অডিট সক্রিয়
          </span>
        </div>

        <div className="space-y-3">
          {autoStreamLog.map((item) => (
            <div 
              key={item.id}
              className="p-4 bg-slate-950/80 border border-white/5 hover:border-white/15 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{item.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                    {item.complianceStatus}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 border border-amber-500/30 text-amber-300">
                    {item.suggestedCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{item.reasoning}</p>
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                  <span>ভাষা: {item.detectedLanguage}</span>
                  <span>·</span>
                  <span>বয়স: {item.suggestedAgeRating}</span>
                  <span>·</span>
                  <span>{item.reviewerNotes || 'Digital Verified'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                  <Check size={14} />
                  <span>অন-এয়ার লাইভ</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

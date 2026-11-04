import { useState } from 'react';
import { Layers, Clock, Radio, Search, Tv, ChevronRight, X, Play } from 'lucide-react';
import { BroadcastItem, ContentCategory, EpgProgram } from '../types/broadcast';

interface EpgGridProps {
  channels: BroadcastItem[];
  activeChannel: BroadcastItem;
  onSelectChannel: (channel: BroadcastItem) => void;
  onClose: () => void;
}

export default function EpgGrid({
  channels,
  activeChannel,
  onSelectChannel,
  onClose,
}: EpgGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChannels = channels.filter((c) => {
    let matchesCategory = false;
    if (selectedCategory === 'ALL') {
      matchesCategory = true;
    } else if (selectedCategory === 'NEWS' || selectedCategory === 'LIVE_NEWS') {
      matchesCategory = c.category === 'NEWS' || c.category === 'LIVE_NEWS';
    } else if (selectedCategory === 'CARTOONS' || selectedCategory === 'CHILDREN') {
      matchesCategory = c.category === 'CARTOONS' || c.category === 'CHILDREN';
    } else if (selectedCategory === 'COOKING' || selectedCategory === 'CULTURE') {
      matchesCategory = c.category === 'COOKING' || c.category === 'CULTURE';
    } else if (selectedCategory === 'SPIRITUAL' || selectedCategory === 'RELIGION') {
      matchesCategory = c.category === 'SPIRITUAL' || c.category === 'RELIGION';
    } else {
      matchesCategory = c.category === selectedCategory;
    }
    const matchesSearch = !searchQuery.trim() || c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="epg-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col p-4 sm:p-8 animate-in fade-in duration-200"
    >
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col bg-[#070b14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#996515] to-[#fbbf24] flex items-center justify-center text-black font-bold shadow-lg">
              <Layers size={20} />
            </div>
            <div>
              <h2 id="epg-title" className="text-lg sm:text-xl font-bold text-white font-sans flex items-center gap-2">
                Electronic Program Guide (EPG)
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LIVE TIMELINE
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                ২৪ ঘণ্টার স্বয়ংক্রিয় অনুষ্ঠানসূচি ও চ্যানেল তালিকা · সরাসরি ক্লিক করে সম্প্রচারে প্রবেশ করুন
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

        {/* Filter Controls & Search */}
        <div className="p-4 border-b border-white/5 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar text-xs">
            {[
              { id: 'ALL', label: 'সব চ্যানেল (All)' },
              { id: 'ENTERTAINMENT', label: 'নাটক ও মেগা সিরিয়াল (Drama)' },
              { id: 'CHILDREN', label: 'বাচ্চাদের কার্টুন (Kids)' },
              { id: 'LIVE_NEWS', label: 'লাইভ নিউজ (Live News)' },
              { id: 'NEWS', label: 'সংবাদ বুলেটিন (News)' },
              { id: 'SPORTS', label: 'খেলাধুলা ও ক্রিকেট (Sports)' },
              { id: 'CULTURE', label: 'রান্না ও ঐতিহ্য (Cooking)' },
              { id: 'MUSIC', label: 'গান ও মিউজিক (Music)' },
              { id: 'RELIGION', label: 'ইসলামিক ও ধর্মীয় (Spiritual)' },
              { id: 'DOCUMENTARY', label: 'প্রকৃতি ও সিনেমা (Cinema)' },
              { id: 'SCIENCE', label: 'বিজ্ঞান ও মহাকাশ (Science)' },
              { id: 'COMMUNITY', label: 'প্রবাসী ও কমিউনিটি (Diaspora)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search schedule or channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        {/* EPG Timeline Grid Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredChannels.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              কোনো চ্যানেল পাওয়া যায়নি। অনুগ্রহ করে সার্চ বা ক্যাটাগরি পরিবর্তন করুন।
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isActive = channel.id === activeChannel.id;
              const schedule = channel.epgSchedule || [];

              return (
                <div
                  key={channel.id}
                  className={`border rounded-xl p-4 transition-all ${
                    isActive
                      ? 'bg-slate-900/80 border-[#d4af37]/60 shadow-xl'
                      : 'bg-slate-950/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Channel Header Row */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
                        {channel.logoUrl ? (
                          <img src={channel.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Tv size={16} className={isActive ? 'text-[#fbbf24]' : 'text-slate-400'} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{channel.title}</span>
                          <span className="text-[10px] font-mono text-slate-500">CH {channel.channelNumber || '00'}</span>
                          {isActive && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                              CURRENTLY WATCHING
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{channel.location} · {channel.categoryLabel}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectChannel(channel);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] text-black text-xs font-bold rounded-lg flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
                    >
                      <Play size={13} className="fill-black" />
                      <span>Tune In</span>
                    </button>
                  </div>

                  {/* Hourly Schedule Timeline Blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    {schedule.map((prog, idx) => (
                      <div
                        key={prog.id || idx}
                        className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                          prog.isCurrent
                            ? 'bg-amber-500/10 border-amber-500/30 text-white'
                            : 'bg-slate-900/40 border-white/5 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className={prog.isCurrent ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                              {prog.startTime} - {prog.endTime}
                            </span>
                            {prog.isCurrent && (
                              <span className="px-1.5 py-0.5 bg-red-600 text-white font-bold rounded text-[9px]">
                                LIVE
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-xs leading-snug line-clamp-2">
                            {prog.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                            {prog.description}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                          <span>{prog.durationMinutes} mins</span>
                          <span>{prog.rating || 'ALL'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

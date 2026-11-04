import { useState } from 'react';
import { 
  Network, Globe, Shield, CheckCircle2, XCircle, 
  RefreshCw, Radio, Layers, Plus, ArrowUpRight, 
  ExternalLink, Search, SlidersHorizontal, AlertCircle
} from 'lucide-react';
import { CommunityNode, FederationRelationship } from '../types/broadcast';
import { INITIAL_COMMUNITY_NODES } from '../data/federationData';

export default function FederationMatrix() {
  const [nodes, setNodes] = useState<CommunityNode[]>(INITIAL_COMMUNITY_NODES);
  const [filterRel, setFilterRel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<CommunityNode | null>(null);

  // Toggle federation relationship
  const handleUpdateRelationship = (nodeId: string, newRel: FederationRelationship) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, relationship: newRel, lastSync: 'Updated just now' };
      }
      return n;
    }));
  };

  const filteredNodes = nodes.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRel === 'all' ? true : n.relationship === filterRel;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#050b18] border border-[#1a2f5e] rounded-2xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#fbbf24] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Network size={16} />
              <span>Decentralized Community Nodes Matrix • §4, §9 & §10</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ফেডারেশন নোড ও আন্তঃসম্প্রদায় নিয়ন্ত্রণ (Federation Matrix)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Open IPTV Federation-এর অন্তর্ভুক্ত প্রতিটি স্বাধীন কমিউনিটি নোডের স্বেচ্ছাভিত্তিক সংযোগ, ক্যাটাগরি অনুমোদন ও রিভার্সিবল পলিসি কন্ট্রোল সেন্টার।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#081021] border border-[#1a2f5e] p-3 rounded-xl text-center min-w-[120px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Active Nodes</div>
              <div className="text-xl font-bold text-white mt-0.5">{nodes.length}</div>
            </div>
            <div className="bg-[#081021] border border-[#1a2f5e] p-3 rounded-xl text-center min-w-[120px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Core Principle</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">NO FORCED MIXING</div>
            </div>
          </div>
        </div>

        {/* Operational Bar: Search & Filter */}
        <div className="mt-6 pt-5 border-t border-[#1a2f5e] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text"
              placeholder="নোড বা ডোমেইন খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#081021] border border-[#1a2f5e] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#fbbf24]"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto text-xs w-full sm:w-auto pb-1 sm:pb-0">
            {['all', 'ALLOW', 'FOLLOW', 'BLOCK', 'DENY'].map(rel => (
              <button
                key={rel}
                onClick={() => setFilterRel(rel)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterRel === rel 
                    ? 'bg-[#d4af37] text-[#02040a] shadow-sm'
                    : 'bg-[#081021] text-slate-400 border border-[#1a2f5e] hover:text-white'
                }`}
              >
                {rel === 'all' ? 'সব নোড' : rel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredNodes.map(node => (
          <div 
            key={node.id}
            className={`bg-[#081021] border rounded-2xl p-6 transition-all shadow-xl relative ${
              node.isReferenceNode 
                ? 'border-[#d4af37]/60 shadow-[#d4af37]/5 ring-1 ring-[#d4af37]/30' 
                : 'border-[#1a2f5e] hover:border-slate-600'
            }`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    {node.name}
                  </h3>
                  {node.isReferenceNode && (
                    <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-[#fbbf24] text-[#02040a]">
                      REFERENCE NODE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                  <span>{node.domain}</span>
                  <span>•</span>
                  <span>{node.region}</span>
                </div>
              </div>

              {/* Relationship Status Badge */}
              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg uppercase flex items-center gap-1.5 ${
                node.relationship === 'ALLOW' 
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400' 
                  : node.relationship === 'FOLLOW'
                  ? 'bg-blue-950/60 border border-blue-500/40 text-blue-400'
                  : node.relationship === 'BLOCK'
                  ? 'bg-rose-950/60 border border-rose-500/40 text-rose-400'
                  : 'bg-amber-950/60 border border-amber-500/40 text-amber-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  node.relationship === 'ALLOW' ? 'bg-emerald-400' :
                  node.relationship === 'FOLLOW' ? 'bg-blue-400' :
                  node.relationship === 'BLOCK' ? 'bg-rose-400' : 'bg-amber-400'
                }`}></span>
                {node.relationship}
              </span>
            </div>

            {/* Operator info */}
            <div className="mt-4 pt-3 border-t border-[#1a2f5e]/80 text-xs">
              <div className="text-slate-400">
                <span className="text-slate-500 font-mono text-[11px]">ADMIN / OPERATOR: </span>
                <span className="text-slate-200 font-medium">{node.operator}</span>
              </div>
            </div>

            {/* Allowed & Denied Categories */}
            <div className="mt-3 space-y-2">
              <div className="text-[11px]">
                <span className="text-slate-400 font-mono">অনুমোদিত ক্যাটাগরি (§১১): </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {node.allowedCategories.map((c, i) => (
                    <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101e3d] text-slate-300 border border-[#1a2f5e]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {node.deniedCategories.length > 0 && (
                <div className="text-[11px]">
                  <span className="text-rose-400 font-mono">নিষিদ্ধ ক্যাটাগরি: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {node.deniedCategories.map((c, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Active Telemetry & Controls */}
            <div className="mt-5 pt-4 border-t border-[#1a2f5e] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <div>চ্যানেল: <span className="text-white font-bold">{node.totalChannels}</span></div>
                <div>•</div>
                <div>সক্রিয় স্ট্রিম: <span className="text-emerald-400 font-bold">{node.activeStreams}</span></div>
                <div>•</div>
                <div>ট্রাস্ট: <span className="text-[#fbbf24] font-bold">{node.trustScore}%</span></div>
              </div>

              {/* Relationship Action Switcher */}
              <div className="flex items-center gap-1 bg-[#050b18] border border-[#1a2f5e] p-1 rounded-xl">
                <button
                  onClick={() => handleUpdateRelationship(node.id, 'ALLOW')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    node.relationship === 'ALLOW' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="সম্পূর্ণ অনুমোদন"
                >
                  ALLOW
                </button>
                <button
                  onClick={() => handleUpdateRelationship(node.id, 'FOLLOW')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    node.relationship === 'FOLLOW' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="শুধুমাত্র ফলো"
                >
                  FOLLOW
                </button>
                <button
                  onClick={() => handleUpdateRelationship(node.id, 'BLOCK')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    node.relationship === 'BLOCK' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="ব্লক করুন"
                >
                  BLOCK
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Core Rule Banner (§10) */}
      <div className="bg-[#050b18] border border-[#d4af37]/40 rounded-2xl p-5 text-xs text-slate-300 flex items-start gap-3">
        <AlertCircle className="text-[#fbbf24] shrink-0 mt-0.5" size={18} />
        <div>
          <div className="font-bold text-white uppercase font-mono tracking-wider">
            §10 FEDERATION IS NOT REDISTRIBUTION
          </div>
          <p className="mt-1 leading-relaxed text-slate-300">
            ফেডারেশনে মেটাডাটা আবিষ্কারের অর্থ কোনোভাবেই কন্টেন্টের স্বত্ব হস্তান্তর বা অননুমোদিত স্টোরেজ/রি-ডিস্ট্রিবিউশন নয়। কোনো কমিউনিটি যদি ফেডারেশন প্রত্যাহার করে, তবে সাথে সাথে তাদের সমস্ত নতুন স্ট্রিম ডিসকভারি বন্ধ হয়ে যাবে এবং ক্যাশড মেটাডাটা পলিসি অনুযায়ী নিষ্ক্রিয় করা হবে।
          </p>
        </div>
      </div>
    </div>
  );
}

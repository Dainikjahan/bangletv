import { useState } from 'react';
import { 
  Shield, BookOpen, Scale, Award, Users, Lock, 
  CheckCircle2, Search, Globe, ChevronRight, FileText,
  AlertTriangle, ArrowRight, CornerDownRight, Check,
  Sliders, Layers, Sparkles
} from 'lucide-react';

export default function ConstitutionViewer() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [activeSection, setActiveSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const coreInvariants = [
    {
      id: 'inv-1',
      titleEn: 'Community Sovereignty',
      titleBn: 'কমিউনিটির সার্বভৌমত্ব',
      descEn: 'Each community node is independently governed. No centralized ownership of community content or audience.',
      descBn: 'প্রতিটি কমিউনিটি স্বাধীন ও স্বশাসিত। কোনো একক কেন্দ্রীয় সত্ত্বা কমিউনিটির কন্টেন্ট বা দর্শকের মালিকানা দাবি করবে না।',
      sectionRef: '§1 & §67'
    },
    {
      id: 'inv-2',
      titleEn: 'Content Ownership Sovereignty',
      titleBn: 'কন্টেন্ট স্বত্ব ও মালিকানা',
      descEn: 'Content ownership remains with its lawful owner and never transfers merely through federation or streaming.',
      descBn: 'কন্টেন্টের স্বত্ব স্থায়ীভাবে মালিকের থাকবে; ফেডারেশন বা সম্প্রচারের কারণে মালিকানা কখনোই পরিবর্তিত বা হস্তান্তরিত হবে না।',
      sectionRef: '§5 & §68'
    },
    {
      id: 'inv-3',
      titleEn: 'Explicit Distribution Permission',
      titleBn: 'স্পষ্ট বিতরণ অনুমতি',
      descEn: 'No content crosses a community boundary unless explicitly permitted by the owner. Default state is PRIVATE.',
      descBn: 'মালিকের স্পষ্ট অনুমতি ব্যতীত কোনো কন্টেন্ট কমিউনিটি সীমানা অতিক্রম করবে না। ডিফল্ট অবস্থা সর্বদা PRIVATE।',
      sectionRef: '§8 & §69'
    },
    {
      id: 'inv-4',
      titleEn: 'No Forced Community Mixing',
      titleBn: 'বাধ্যতামূলক মিশ্রণ নিষিদ্ধ',
      descEn: 'No user is forced to consume content from a community merely because it federates. Source identity is never hidden.',
      descBn: 'ফেডারেশনের অংশ হওয়ার কারণে কোনো দর্শককে কোনো নির্দিষ্ট কন্টেন্ট দেখতে বাধ্য করা যাবে না। সোর্স আইডেন্টিটি দৃশ্যমান থাকবে।',
      sectionRef: '§10 & §70'
    },
    {
      id: 'inv-5',
      titleEn: 'Reversible Federation',
      titleBn: 'প্রত্যাহারযোগ্য ফেডারেশন',
      descEn: 'Any community can terminate federation at any time. Discovery ceases and authorization is revoked immediately.',
      descBn: 'যেকোনো কমিউনিটি যেকোনো মুহূর্তে ফেডারেশন বন্ধ করতে পারবে; সাথে সাথে নতুন বিতরণ ও ডিসকভারি বন্ধ হয়ে যাবে।',
      sectionRef: '§23 & §71'
    },
    {
      id: 'inv-6',
      titleEn: 'Auditable Privileged Actions',
      titleBn: 'জবাবদিহিতামূলক অডিট ট্রেইল',
      descEn: 'Every administrative action, emergency pause, or moderation decision is attributable and tamper-resistant.',
      descBn: 'প্রতিটি প্রশাসনিক পদক্ষেপ, এমার্জেন্সি পজ বা মডারেশন সিদ্ধান্ত অপরিবর্তনীয় অডিট লগ হিসেবে সংরক্ষিত থাকবে।',
      sectionRef: '§14 & §72'
    }
  ];

  const conflictHierarchy = [
    { rank: 1, title: 'Applicable Law (প্রযোজ্য আইন)', note: 'Strict legal & regulatory compliance in US, UK & international jurisdictions', sectionRef: '§29.1' },
    { rank: 2, title: 'Rights & Licensing (স্বত্ব ও লাইসেন্সিং)', note: 'Copyright, intellectual property & contractual obligations', sectionRef: '§29.2' },
    { rank: 3, title: 'User Privacy & Security (ব্যবহারকারীর গোপনীয়তা ও নিরাপত্তা)', note: 'Zero-trust, encryption, no hidden tracking or data harvesting', sectionRef: '§29.3' },
    { rank: 4, title: 'Community Sovereignty (কমিউনিটি সার্বভৌমত্ব)', note: 'Independent governance, editorial autonomy, and tenant isolation', sectionRef: '§29.4' },
    { rank: 5, title: 'Distribution Permission (বিতরণ অনুমতি)', note: 'Explicit owner permission; default state is PRIVATE', sectionRef: '§29.5' },
    { rank: 6, title: 'Applicable Platform Policy (প্ল্যাটফর্ম নীতিমালা)', note: 'YouTube API, Ofcom, broadcast guidelines compliance', sectionRef: '§29.6' },
    { rank: 7, title: 'Federation Rules (ফেডারেশন নীতিমালা)', note: 'Voluntary connection protocols & discovery exchanges', sectionRef: '§29.7' },
    { rank: 8, title: 'Product Features (প্রোডাক্ট ফিচার)', note: 'UI elements, playout features, convenience tools', sectionRef: '§29.8' },
    { rank: 9, title: 'Growth & Monetization (গ্রোথ ও ব্যবসায়িক কৌশল)', note: 'Subordinated strictly to higher constitutional tiers', sectionRef: '§29.9' }
  ];

  const filteredInvariants = coreInvariants.filter(item => {
    const q = searchQuery.toLowerCase();
    return item.titleBn.toLowerCase().includes(q) ||
           item.titleEn.toLowerCase().includes(q) ||
           item.descBn.toLowerCase().includes(q) ||
           item.descEn.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#050b18] border border-[#172033] rounded-2xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[#fbbf24] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Scale size={16} />
              <span>Core Constitutional Architecture • §§1–79 Complete Text</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
              {lang === 'bn' ? 'ওপেন আইপিটিভি ফেডারেশন সংবিধান ও অপারেটিং মেমোরেন্ডাম' : 'Open IPTV Federation Governance & Operating Memorandum'}
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              {lang === 'bn' 
                ? 'স্বাধীন সম্প্রদায় ও প্রতিষ্ঠানসমূহের নিজস্ব ডিজিটাল সম্প্রচার সার্বভৌমত্ব বজায় রেখে স্বেচ্ছাভিত্তিক আন্তঃসংযোগ নিশ্চিত করার সাংবিধানিক ফ্রেমওয়ার্ক (§১ থেকে §৭৯)।'
                : 'Foundational constitutional framework governing decentralized community sovereignty, voluntary permission-based federation, and explicit content rights (§§1-79).'}
            </p>
          </div>

          {/* Language Toggle & Version Badge */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="bg-[#081021] border border-[#172033] p-1 rounded-xl flex items-center shadow-inner">
              <button
                onClick={() => setLang('bn')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  lang === 'bn' ? 'bg-[#d4af37] text-[#02040a] shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                বাংলা (BN)
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-[#d4af37] text-[#02040a] shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                English (EN)
              </button>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-lg">
              CONSTITUTIONAL LOCK: ACTIVE
            </div>
          </div>
        </div>

        {/* Section Filter Tabs & Live Search */}
        <div className="mt-8 pt-5 border-t border-[#172033] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-semibold">
            {[
              { id: 'all', labelBn: 'সকল অধ্যায়', labelEn: 'All Chapters' },
              { id: 'governance', labelBn: 'কর্তৃত্ব ও শাসন (§৩)', labelEn: 'Governance (§3)' },
              { id: 'invariants', labelBn: 'অপরিবর্তনীয় স্তম্ভ (§২)', labelEn: 'Invariants (§2)' },
              { id: 'layers', labelBn: '৫-স্তরের মডেল (§২)', labelEn: '5-Layer Model' },
              { id: 'conflicts', labelBn: 'বিরোধ নিষ্পত্তি (§২৯)', labelEn: 'Conflict Rules' },
              { id: 'charter', labelBn: 'মৌলিক সনদ (§৩২)', labelEn: 'Charter Statement' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'bg-[#d4af37] text-[#02040a] font-bold shadow-sm'
                    : 'bg-[#081021] text-slate-400 border border-[#172033] hover:text-white'
                }`}
              >
                {lang === 'bn' ? tab.labelBn : tab.labelEn}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'সংবিধানের ধারা খুঁজুন...' : 'Search clauses...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#081021] border border-[#172033] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#fbbf24]"
            />
          </div>
        </div>

        {/* Governance & Authority Separation Card (§3) */}
        {(activeSection === 'all' || activeSection === 'governance') && (
          <div className="mt-6 pt-5 border-t border-[#172033] grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#081021] border border-[#172033] p-5 rounded-2xl flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#fbbf24]/10 border border-[#fbbf24]/30 flex items-center justify-center text-[#fbbf24] shrink-0 mt-0.5">
                <Award size={22} />
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#fbbf24] font-bold uppercase tracking-wider">§3 Patron & Principal Strategic Authority</div>
                <div className="text-base font-extrabold text-white mt-0.5">Anwar Tariq Khan</div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {lang === 'bn' 
                    ? 'প্রকল্পের সামগ্রিক মালিকানা, মূল সম্পদ, বৌদ্ধিক সম্পত্তি এবং মৌলিক কৌশলগত দিকনির্দেশনা ও সর্বোচ্চ সিদ্ধান্তের পূর্ণ কর্তৃত্ব।'
                    : 'Retains ownership, principal assets, intellectual property, long-term strategic direction, and decisions on matters materially affecting fundamental interests.'}
                </p>
                <div className="mt-3 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30 inline-block">
                  AUTHORITY LEVEL: SUPREME STRATEGIC
                </div>
              </div>
            </div>

            <div className="bg-[#081021] border border-[#172033] p-5 rounded-2xl flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Users size={22} />
              </div>
              <div>
                <div className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider">§3 Operational Lead (Implementation Authority)</div>
                <div className="text-base font-extrabold text-white mt-0.5">Sheikh Mehedi Hasan Nadim</div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {lang === 'bn' 
                    ? 'দৈনন্দিন প্রশাসনিক দায়িত্ব, প্রযুক্তিগত অবকাঠামো পরিচালনা, এডিটরিয়াল সমন্বয় ও অনুমোদিত কৌশলগত পরিকল্পনার নিবিড় বাস্তবায়ন।'
                    : 'Delegated operational authority for day-to-day administration, technical infrastructure, broadcast operations, and execution of approved strategy.'}
                </p>
                <div className="mt-3 text-[11px] font-mono text-blue-400 bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-500/30 inline-block">
                  AUTHORITY LEVEL: EXECUTIVE OPERATIONAL
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Non-Negotiable Constitutional Invariants Grid */}
      {(activeSection === 'all' || activeSection === 'invariants') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="text-[#fbbf24]" size={20} />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {lang === 'bn' ? 'অপরিবর্তনীয় সাংবিধানিক স্তম্ভসমূহ (Constitutional Invariants)' : 'Non-Negotiable Constitutional Invariants'}
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">§2 & §§67–73</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvariants.map((inv, idx) => (
              <div 
                key={inv.id}
                className="bg-[#050814] border border-[#172033] hover:border-[#d4af37]/50 rounded-2xl p-5 shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-[#fbbf24] font-bold px-2 py-0.5 rounded bg-[#fbbf24]/10 border border-[#fbbf24]/20">
                    {inv.sectionRef}
                  </span>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#fbbf24] transition-colors">
                  {lang === 'bn' ? inv.titleBn : inv.titleEn}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {lang === 'bn' ? inv.descBn : inv.descEn}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5-Layer Conceptual Model (§2) */}
      {(activeSection === 'all' || activeSection === 'layers') && (
        <section className="bg-[#050814] border border-[#172033] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[#fbbf24]" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              {lang === 'bn' ? '৫-স্তরের আর্কিটেকচারাল মডেল (§২)' : 'The 5-Layer Architectural Model (§2)'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-[#081021] border border-[#172033] p-4 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Layer 01</div>
              <div className="text-xs font-bold text-white">IDENTITY LAYER</div>
              <div className="text-[10px] text-slate-400">Argon2id, OAuth/Passkeys (§4)</div>
            </div>
            <div className="bg-[#081021] border border-[#172033] p-4 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-blue-400 uppercase font-bold">Layer 02</div>
              <div className="text-xs font-bold text-white">COMMUNITY LAYER</div>
              <div className="text-[10px] text-slate-400">Tenant Isolation & Node ID (§4)</div>
            </div>
            <div className="bg-[#081021] border border-[#172033] p-4 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">Layer 03</div>
              <div className="text-xs font-bold text-white">CONTENT & CHANNEL</div>
              <div className="text-[10px] text-slate-400">Taxonomy & Distribution (§5)</div>
            </div>
            <div className="bg-[#081021] border border-[#172033] p-4 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-purple-400 uppercase font-bold">Layer 04</div>
              <div className="text-xs font-bold text-white">FEDERATION LAYER</div>
              <div className="text-[10px] text-slate-400">Opt-In, No Forced Mixing (§9)</div>
            </div>
            <div className="bg-[#081021] border border-[#172033] p-4 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-rose-400 uppercase font-bold">Layer 05</div>
              <div className="text-xs font-bold text-white">VIEWER & PLAYER</div>
              <div className="text-[10px] text-slate-400">Zero Telemetry & Controls (§18)</div>
            </div>
          </div>
        </section>
      )}

      {/* Conflict Hierarchy (§29 & §66) */}
      {(activeSection === 'all' || activeSection === 'conflicts') && (
        <section className="bg-[#050814] border border-[#172033] rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Scale size={18} className="text-[#fbbf24]" />
              <span>{lang === 'bn' ? 'সাংবিধানিক বিরোধ নিষ্পত্তি ক্রমধারা (Conflict Hierarchy - §২৯ ও §৬৬)' : 'Constitutional Conflict Resolution Hierarchy (§29 & §66)'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'bn' 
                ? 'যেকোনো দুটি পরিচালনা নীতি বা ফিচারের মধ্যে মতপার্থক্য তৈরি হলে সর্বোচ্চ স্তর বিজয়ী হবে এবং নিম্ন স্তর স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।'
                : 'Where operational requirements conflict, higher priority levels strictly supersede lower levels.'}
            </p>
          </div>

          <div className="space-y-2">
            {conflictHierarchy.map((item) => (
              <div 
                key={item.rank}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#081021] border border-[#172033] text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#fbbf24]/10 text-[#fbbf24] font-mono font-bold flex items-center justify-center shrink-0 border border-[#fbbf24]/30">
                    {item.rank}
                  </span>
                  <span className="font-bold text-white">{item.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-[11px] hidden sm:inline-block">{item.note}</span>
                  <span className="text-[10px] font-mono text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded">{item.sectionRef}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Foundational Statement (§32 & §78) */}
      {(activeSection === 'all' || activeSection === 'charter') && (
        <section className="bg-gradient-to-r from-[#050814] via-[#081021] to-[#050814] border border-[#d4af37]/40 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/30 text-[#fbbf24] text-xs font-mono font-bold">
              FOUNDATIONAL STATEMENT (§32 & §78)
            </div>
            
            <blockquote className="text-base sm:text-xl font-medium text-white italic leading-relaxed">
              {lang === 'bn' ? (
                <>
                  "Open IPTV Federation-এর উদ্দেশ্য হলো স্বাধীন সম্প্রদায় ও প্রতিষ্ঠানসমূহকে নিজস্ব মিডিয়া অবকাঠামো পরিচালনার সক্ষমতা প্রদান করা এবং একই সঙ্গে একটি উন্মুক্ত, অনুমতিনির্ভর, গোপনীয়তা-সুরক্ষিত, নিরাপদ, আন্তঃকার্যক্ষম ও প্রত্যাহারযোগ্য ফেডারেশন কাঠামোর মাধ্যমে স্বেচ্ছাভিত্তিক সংযোগের সুযোগ সৃষ্টি করা।"
                </>
              ) : (
                <>
                  "Open IPTV Federation exists to enable independent communities to operate their own media infrastructure while connecting voluntarily through an open, permission-based, privacy-preserving, secure, interoperable, and reversible federation model."
                </>
              )}
            </blockquote>

            <div className="pt-2 text-xs font-mono text-[#fbbf24]">
              {lang === 'bn' 
                ? 'অনুসন্ধান ও আবিষ্কারের সুযোগ ভাগ হতে পারে, কিন্তু মালিকানা স্থানীয়ই থাকবে। বিতরণের জন্য স্পষ্ট অনুমতি প্রয়োজন।'
                : 'Discovery may be shared. Ownership remains local. Distribution requires explicit permission. Community sovereignty remains intact.'}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

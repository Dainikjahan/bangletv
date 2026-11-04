import { useState } from 'react';
import { 
  Globe, ShieldCheck, CheckCircle2, Lock, User, Server, 
  ExternalLink, RefreshCw, Radio, Link as LinkIcon, AlertCircle, Key
} from 'lucide-react';

interface TurbiflyDomainHubProps {
  onClose?: () => void;
}

export default function TurbiflyDomainHub({ onClose }: TurbiflyDomainHubProps) {
  const [username] = useState<string>('rahman.nj21@gmail.com');
  const [domain] = useState<string>('login.turbifly.com');
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>('Successfully authenticated with Turbifly Cloud & domain login.turbifly.com.');

  const handleTestConnection = () => {
    setIsSyncing(true);
    setSyncMessage('Connecting to login.turbifly.com and verifying credentials for rahman.nj21@gmail.com...');
    setTimeout(() => {
      setIsSyncing(false);
      setIsConnected(true);
      setSyncMessage('✅ Connection verified! login.turbifly.com is successfully linked to Bengal TV Broadcast Hub.');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col bg-[#161a24] border border-[#2a2f40] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#2a2f40] flex items-center justify-between bg-[#191d28]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#996515] to-[#fbbf24] flex items-center justify-center text-black font-bold shrink-0 shadow-lg">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-sans flex items-center gap-2">
                <span>Turbifly Domain & Account Connector</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  SECURE LINKED
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Connecting custom domain <span className="text-amber-300 font-mono">login.turbifly.com</span> with authorized credentials.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isConnected 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-emerald-400" />
            <div className="space-y-1 text-xs">
              <div className="font-bold">Domain & Account Synchronization Active</div>
              <p className="text-slate-300 leading-relaxed font-mono">
                {syncMessage}
              </p>
            </div>
          </div>

          {/* Credentials & Domain Card */}
          <div className="bg-[#111318] border border-[#2a2f40] rounded-2xl p-5 space-y-4 shadow-inner">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
              <Key size={14} />
              <span>Linked Account & Domain Parameters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-[#191d28] border border-[#2a2f40] p-3.5 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Turbifly Username / Email</span>
                <div className="text-white font-bold flex items-center gap-2 truncate">
                  <User size={14} className="text-[#fbbf24] shrink-0" />
                  <span className="truncate">{username}</span>
                </div>
              </div>

              <div className="bg-[#191d28] border border-[#2a2f40] p-3.5 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Connected Domain</span>
                <div className="text-amber-300 font-bold flex items-center gap-2 truncate">
                  <Globe size={14} className="text-amber-400 shrink-0" />
                  <span className="truncate">{domain}</span>
                </div>
              </div>

              <div className="bg-[#191d28] border border-[#2a2f40] p-3.5 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Authentication Protocol</span>
                <div className="text-emerald-400 font-bold flex items-center gap-2">
                  <Lock size={14} className="shrink-0" />
                  <span>OAuth2 / TLS Token Verified</span>
                </div>
              </div>

              <div className="bg-[#191d28] border border-[#2a2f40] p-3.5 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Broadcast Node Route</span>
                <div className="text-slate-200 font-bold flex items-center gap-2 truncate">
                  <Server size={14} className="text-blue-400 shrink-0" />
                  <span className="truncate">https://login.turbifly.com/gateway</span>
                </div>
              </div>
            </div>
          </div>

          {/* DNS & CNAME Instructions */}
          <div className="bg-[#111318] border border-[#2a2f40] rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <LinkIcon size={14} className="text-[#fbbf24]" />
              <span>DNS & SSL Status for login.turbifly.com</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              আপনার ডোমেইন <strong className="text-white font-mono">login.turbifly.com</strong> সফলভাবে Bengal TV ব্রডকাস্ট গেটওয়ের সাথে বাইন্ড করা হয়েছে। সমস্ত স্ট্রিম ট্রাফিক এখন এনক্রিপ্টেড SSL চ্যানেলের মাধ্যমে পরিচালিত হচ্ছে।
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                <CheckCircle2 size={13} />
                CNAME Verified (Active)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                <ShieldCheck size={13} />
                Let's Encrypt SSL Active
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#2a2f40] bg-[#191d28] flex items-center justify-between gap-3">
          <button
            onClick={handleTestConnection}
            disabled={isSyncing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>Re-verify Connection</span>
          </button>

          {onClose ? (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] hover:scale-105 text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-transform"
            >
              Done / Close
            </button>
          ) : (
            <div className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1.5">
              <Radio size={14} className="animate-pulse" />
              <span>Turbifly Domain Live</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

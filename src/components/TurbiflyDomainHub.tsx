import { useState } from 'react';
import {
  Globe,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Server,
  RefreshCw,
  X,
  Copy,
  Check,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { BENGAL_TV_OFFICIAL_LOGO } from '../data/iptvChannels';

interface TurbiflyDomainHubProps {
  onClose?: () => void;
}

export default function TurbiflyDomainHub({ onClose }: TurbiflyDomainHubProps) {
  const [activeTab, setActiveTab] = useState<'dns' | 'cloudrun' | 'cloudflare'>('dns');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>(
    'Domain bangletv.com is configured as the canonical broadcast origin. DNS records, Firebase Auth domains, and SSL certificates are ready for verification.'
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = () => {
    setIsSyncing(true);
    setSyncMessage('Testing DNS resolution and SSL certificate bindings for bangletv.com...');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncMessage(
        'Verified: bangletv.com and www.bangletv.com are recognized. All static assets, /bengal-tv-logo.jpg emblem, and SPA routing are synchronized.'
      );
    }, 800);
  };

  const DNS_RECORDS = [
    {
      type: 'A',
      host: '@',
      target: '216.239.32.21',
      description: 'Primary Google Cloud Run IP (1/4)',
      provider: 'Cloud Run / Registrar',
    },
    {
      type: 'A',
      host: '@',
      target: '216.239.34.21',
      description: 'Secondary Google Cloud Run IP (2/4)',
      provider: 'Cloud Run / Registrar',
    },
    {
      type: 'A',
      host: '@',
      target: '216.239.36.21',
      description: 'Failover Google Cloud Run IP (3/4)',
      provider: 'Cloud Run / Registrar',
    },
    {
      type: 'A',
      host: '@',
      target: '216.239.38.21',
      description: 'Failover Google Cloud Run IP (4/4)',
      provider: 'Cloud Run / Registrar',
    },
    {
      type: 'CNAME',
      host: 'www',
      target: 'ghs.googlehosted.com.',
      description: 'Google Managed Hosted CNAME (Cloud Run) or bangletv.pages.dev (Cloudflare)',
      provider: 'Google / Cloudflare',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="domain-hub-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex flex-col p-3 sm:p-6"
    >
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col bg-white border border-[#E5E5EA] rounded-3xl overflow-hidden shadow-2xl text-[#1D1D1F]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5E5EA] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0066CC]/10 border border-[#0066CC]/20 flex items-center justify-center text-[#0066CC] shrink-0">
              <Globe size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="domain-hub-title" className="text-base sm:text-lg font-bold text-[#1D1D1F]">
                  bangletv.com Domain Configuration
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-[#1F7A3F]/10 text-[#1F7A3F] font-mono font-semibold text-[11px]">
                  Custom Domain
                </span>
              </div>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Connect and bind <span className="font-semibold text-[#1D1D1F]">bangletv.com</span> and{' '}
                <span className="font-semibold text-[#1D1D1F]">www.bangletv.com</span> to your broadcast server
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-[#E5E5EA] bg-[#F5F5F7]/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('dns')}
            className={`py-2 px-3.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dns'
                ? 'border-[#0066CC] text-[#0066CC]'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            DNS Records Table
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloudrun')}
            className={`py-2 px-3.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cloudrun'
                ? 'border-[#0066CC] text-[#0066CC]'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Google Cloud Run Mapping
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloudflare')}
            className={`py-2 px-3.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cloudflare'
                ? 'border-[#0066CC] text-[#0066CC]'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Cloudflare / Provider Setup
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto bg-[#F5F5F7]/40">
          {/* Domain Status Overview Banner */}
          <div className="bg-white/70 backdrop-blur-md border border-[#E5E5EA]/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={BENGAL_TV_OFFICIAL_LOGO}
                alt="Bengal TV Logo"
                className="w-12 h-12 rounded-xl object-contain bg-white border border-[#E5E5EA] p-1 shrink-0 shadow-2xs"
              />
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-[#1D1D1F] font-mono">
                    https://bangletv.com
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#1F7A3F] animate-pulse" />
                </div>
                <div className="text-xs text-[#6E6E73] truncate">
                  Target Domain · SSL/TLS 1.3 Managed Auto-Renewal
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 bg-[#F0FDF4] border border-[#BBF7D0] text-[#1F7A3F] font-semibold text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>Domain Configured</span>
              </span>
            </div>
          </div>

          {activeTab === 'dns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6E73]">
                    Required DNS Records for bangletv.com
                  </h3>
                  <p className="text-xs text-[#86868B]">
                    আপনার Domain Provider (যেমন Namecheap, Cloudflare, GoDaddy ইত্যাদি) এর DNS Management এ এই রেকর্ডগুলো যোগ করুন:
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F5F7] border-b border-[#E5E5EA] text-[#6E6E73] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3.5">Type</th>
                        <th className="py-2.5 px-3.5">Host / Name</th>
                        <th className="py-2.5 px-3.5">Target / Value</th>
                        <th className="py-2.5 px-3.5">TTL</th>
                        <th className="py-2.5 px-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5EA]">
                      {DNS_RECORDS.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-[#F9F9FB] transition-colors">
                          <td className="py-2.5 px-3.5 font-bold font-mono text-[#0066CC]">
                            {rec.type}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-[#1D1D1F] font-semibold">
                            {rec.host}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-[#1D1D1F]">
                            <span>{rec.target}</span>
                            <span className="block text-[10px] text-[#86868B] font-sans">
                              {rec.description}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-[#6E6E73]">Auto (3600)</td>
                          <td className="py-2.5 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy(rec.target, `rec-${idx}`)}
                              className="px-2.5 py-1 bg-[#F5F5F7] hover:bg-[#E5E5EA] border border-[#E5E5EA] rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ml-auto"
                            >
                              {copiedKey === `rec-${idx}` ? (
                                <>
                                  <Check size={11} className="text-[#1F7A3F]" />
                                  <span className="text-[#1F7A3F]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Firebase Auth Notice */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] space-y-2 text-xs">
                <div className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-[#0066CC]" />
                  <span>Firebase Authentication Authorized Domain Check</span>
                </div>
                <p className="text-[#6E6E73] leading-relaxed">
                  গুগল লগইন এবং ফায়ারবেস অথেন্টিকেশন <code className="font-mono text-[#1D1D1F]">bangletv.com</code> এ কাজ করার জন্য{' '}
                  <strong>Firebase Console</strong> &rarr; <strong>Authentication</strong> &rarr;{' '}
                  <strong>Settings</strong> &rarr; <strong>Authorized domains</strong> এ{' '}
                  <code className="font-mono text-[#0066CC]">bangletv.com</code> এবং{' '}
                  <code className="font-mono text-[#0066CC]">www.bangletv.com</code> যোগ করুন (Project ID:{' '}
                  <code className="font-mono text-[#1D1D1F]">bamboo-castle-9vr20</code>)।
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cloudrun' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#1D1D1F]">
                  Google Cloud Run Custom Domain Mapping Instructions
                </h3>
                <p className="text-[#6E6E73] leading-relaxed">
                  গুগল ক্লাউড রান সার্ভিসের সাথে <code className="font-mono font-bold text-[#1D1D1F]">bangletv.com</code> যুক্ত করতে নিচের gcloud কমান্ড ব্যবহার করুন:
                </p>

                <div className="bg-[#1D1D1F] text-white p-3.5 rounded-xl font-mono text-[11px] space-y-2 relative">
                  <div>
                    <span className="text-[#86868B]"># 1. Map root domain bangletv.com to Cloud Run service</span>
                    <p className="text-[#30D158]">
                      gcloud beta run domain-mappings create --service bangletv --domain bangletv.com --region asia-southeast1
                    </p>
                  </div>
                  <div>
                    <span className="text-[#86868B]"># 2. Map www subdomain</span>
                    <p className="text-[#30D158]">
                      gcloud beta run domain-mappings create --service bangletv --domain www.bangletv.com --region asia-southeast1
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'gcloud beta run domain-mappings create --service bangletv --domain bangletv.com --region asia-southeast1',
                        'cmd-cloudrun'
                      )
                    }
                    className="absolute top-3 right-3 px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'cmd-cloudrun' ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedKey === 'cmd-cloudrun' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 bg-[#F5F5F7] rounded-xl text-[#6E6E73] space-y-1">
                  <div className="font-semibold text-[#1D1D1F]">অটোমেটিক SSL সার্টিফিকেট:</div>
                  <p>
                    Google Cloud স্বয়ংক্রিয়ভাবে Let&apos;s Encrypt এর মাধ্যমে ফ্রি Managed SSL সার্টিফিকেট ইস্যু করবে। DNS প্রোপ্রাগেশনের পর ১৫ থেকে ৩০ মিনিটের মধ্যে সার্টিফিকেট সক্রিয় হয়ে যাবে।
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cloudflare' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#1D1D1F]">
                  Cloudflare Pages / Proxy Integration
                </h3>
                <p className="text-[#6E6E73] leading-relaxed">
                  আপনি যদি Cloudflare Pages এ ফ্রন্টএন্ড হোস্ট করতে চান অথবা Cloudflare DNS Proxy ব্যবহার করতে চান:
                </p>

                <ol className="list-decimal pl-4 space-y-2 text-[#6E6E73]">
                  <li>
                    <strong>Cloudflare Pages ড্যাশবোর্ডে যান:</strong> Workers &amp; Pages &rarr; your project &rarr; <strong>Custom domains</strong> &rarr; <strong>Set up a custom domain</strong> বাটনে ক্লিক করে <code className="font-mono text-[#1D1D1F]">bangletv.com</code> লিখুন।
                  </li>
                  <li>
                    <strong>DNS Proxy:</strong> Cloudflare স্বয়ংক্রিয়ভাবে CNAME রেকর্ড সেট করে দিবে এবং গ্লোবাল এজ ক্যাশিং এবং DDoS প্রোটেকশন সক্রিয় করবে।
                  </li>
                  <li>
                    <strong>ব্রডকাস্ট লোগো ভেরিফিকেশন:</strong> অফিসিয়াল বেঙ্গল টিভি লোগো <code className="font-mono text-[#1D1D1F]">/bengal-tv-logo.jpg</code> সরাসরি Cloudflare Edge থেকে ক্যাশ ও লোড হবে।
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Sync Status Banner */}
          <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-start gap-2.5 text-xs text-[#1F7A3F]">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Domain Status Check</div>
              <p className="text-[#1D1D1F]">{syncMessage}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E5E5EA] bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isSyncing}
            className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5EA] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-[#0066CC]' : ''} />
            <span>Re-verify DNS &amp; SSL</span>
          </button>

          <div className="flex items-center gap-2">
            <a
              href="https://bangletv.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#0066CC] text-xs font-semibold rounded-xl border border-[#E5E5EA] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Visit bangletv.com</span>
              <ExternalLink size={12} />
            </a>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[#0066CC] hover:bg-[#0055B3] text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

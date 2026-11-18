import { useEffect } from 'react';
import { FileCheck2, ExternalLink } from 'lucide-react';
import {
  BroadcastItem,
  getExpiryStatus,
  isVisibleInPublicGuide,
  LicenceType,
  UserRole,
} from '../types/broadcast';

interface RightsLedgerProps {
  items: BroadcastItem[];
  userRole: UserRole;
  onRedirectHome: () => void;
  onApproveReviewItem?: (itemId: string, approvedLicenceType: LicenceType) => void;
}

export default function RightsLedger({
  items,
  userRole,
  onRedirectHome,
  onApproveReviewItem,
}: RightsLedgerProps) {
  const isAuthorized = userRole === 'admin' || userRole === 'editor';

  useEffect(() => {
    if (!isAuthorized) {
      onRedirectHome();
    }
  }, [isAuthorized, onRedirectHome]);

  if (!isAuthorized) {
    return null;
  }

  const visibleCount = items.filter(isVisibleInPublicGuide).length;
  const hiddenCount = items.length - visibleCount;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6 text-[#1D1D1F]">
      {/* Page Header */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-7 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0066CC]/10 border border-[#0066CC]/20 flex items-center justify-center text-[#0066CC] shrink-0">
            <FileCheck2 size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
              Rights Ledger
            </h1>
            <p className="text-xs text-[#6E6E73] mt-1 leading-relaxed">
              Administrative inventory of broadcast rights, licence types (OWNED, PARTNER, PUBLIC), territories, and expiry dates. Items missing a rights holder, valid HTTPS licence URL, or valid future expiry are hidden from the public guide without deletion.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs font-mono tabular-nums">
          <div className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
            <div className="text-[10px] uppercase tracking-wider text-[#86868B]">Total Items</div>
            <div className="text-sm font-bold text-[#1D1D1F]">{items.length}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
            <div className="text-[10px] uppercase tracking-wider text-[#1F7A3F]">Public Guide</div>
            <div className="text-sm font-bold text-[#1F7A3F]">{visibleCount}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#FFF5F5] border border-[#FECACA]">
            <div className="text-[10px] uppercase tracking-wider text-[#D70015]">Hidden</div>
            <div className="text-sm font-bold text-[#D70015]">{hiddenCount}</div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F5F5F7] border-b border-[#E5E5EA] text-[#6E6E73] font-semibold">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">CH</th>
                <th className="py-3 px-4">Broadcast Item</th>
                <th className="py-3 px-4">Rights Holder</th>
                <th className="py-3 px-4 whitespace-nowrap">Licence</th>
                <th className="py-3 px-4">Licence URL</th>
                <th className="py-3 px-4">Territory</th>
                <th className="py-3 px-4 whitespace-nowrap">Expiry</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Public Guide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-[#6E6E73]">
                    No broadcast items loaded.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isVisible = isVisibleInPublicGuide(item);
                  const hasRightsHolder = Boolean(item.rightsHolder?.trim());
                  const hasLicenceUrl = Boolean(item.licenceUrl?.trim());
                  const expiryStatus = getExpiryStatus(item.expiry);
                  const isInReview = item.rightsStatus === 'REVIEW';

                  return (
                    <tr
                      key={item.id}
                      className={isVisible ? 'hover:bg-[#F9F9FB]' : 'bg-[#FFF5F5]/40 hover:bg-[#FFF5F5]/70'}
                    >
                      <td className="py-3 px-4 font-mono tabular-nums text-[#86868B] whitespace-nowrap">
                        {item.channelNumber || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1D1D1F] max-w-[260px]">
                        <div className="truncate" title={item.title}>
                          {item.title}
                        </div>
                        <div className="text-[10px] font-mono text-[#86868B] truncate">
                          {item.id}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        {hasRightsHolder ? (
                          <span className="text-[#1D1D1F]">{item.rightsHolder}</span>
                        ) : (
                          <span className="text-[#D70015] font-semibold">Empty</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {isInReview ? (
                            <>
                              <span className="px-2 py-0.5 rounded-md bg-[#FFF8EB] border border-[#FDE68A] font-mono font-semibold text-[11px] text-[#B45309]">
                                REVIEW{item.requestedLicenceType ? ` (${item.requestedLicenceType})` : ''}
                              </span>
                              {onApproveReviewItem && item.requestedLicenceType && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onApproveReviewItem(item.id, item.requestedLicenceType!)
                                  }
                                  className="px-2 py-0.5 rounded-md bg-[#0066CC] hover:bg-[#0055B3] text-white font-semibold text-[11px] cursor-pointer transition-colors"
                                >
                                  Approve
                                </button>
                              )}
                            </>
                          ) : item.licenceType ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#F5F5F7] border border-[#E5E5EA] font-mono font-semibold text-[11px] text-[#1D1D1F]">
                              {item.licenceType}
                            </span>
                          ) : (
                            <span className="text-[#D70015] font-semibold">Empty</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
                        {hasLicenceUrl ? (
                          <a
                            href={item.licenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#0066CC] hover:underline font-mono text-[11px] max-w-full"
                            title={item.licenceUrl}
                          >
                            <span className="truncate">{item.licenceUrl}</span>
                            <ExternalLink size={11} className="shrink-0" />
                          </a>
                        ) : (
                          <span className="text-[#D70015] font-semibold">Empty</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#6E6E73] whitespace-nowrap">
                        {item.territory || '—'}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono tabular-nums whitespace-nowrap ${
                          expiryStatus.isRedWarning || expiryStatus.isEmptyOrInvalid
                            ? 'text-[#D70015] font-semibold'
                            : 'text-[#1D1D1F]'
                        }`}
                        title={
                          expiryStatus.isExpired
                            ? 'Licence expired'
                            : expiryStatus.isWithin30Days
                            ? 'Licence expires within 30 days'
                            : undefined
                        }
                      >
                        {item.expiry ? (
                          <span>
                            {item.expiry}
                            {expiryStatus.isExpired
                              ? ' (Expired)'
                              : expiryStatus.isWithin30Days
                              ? ' (≤30d)'
                              : ''}
                          </span>
                        ) : (
                          <span className="text-[#D70015] font-semibold">Empty</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isVisible ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#1F7A3F] font-semibold text-[11px]">
                            Visible
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-md bg-[#FFF5F5] border border-[#FECACA] text-[#D70015] font-semibold text-[11px]">
                            Hidden
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

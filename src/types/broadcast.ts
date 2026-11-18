export type ContentCategory = 
  | 'NEWS'
  | 'LIVE_NEWS'
  | 'SPORTS'
  | 'EDUCATION'
  | 'SCIENCE'
  | 'TECHNOLOGY'
  | 'CULTURE'
  | 'DOCUMENTARY'
  | 'ENTERTAINMENT'
  | 'MUSIC'
  | 'RELIGION'
  | 'COMMUNITY'
  | 'PUBLIC_SERVICE'
  | 'CHILDREN'
  | 'CARTOONS'
  | 'COOKING'
  | 'SPIRITUAL'
  | 'OTHER';

export type DistributionScope = 
  | 'PRIVATE'
  | 'COMMUNITY_ONLY'
  | 'FOLLOWERS_ONLY'
  | 'FEDERATION_ALLOWED'
  | 'PUBLIC';

export type FederationRelationship = 
  | 'DISCOVER'
  | 'FOLLOW'
  | 'ALLOW'
  | 'DENY'
  | 'BLOCK'
  | 'UNFOLLOW';

export type StreamProtocol = 'hls' | 'dash' | 'youtube' | 'mp4' | 'direct';

export type LicenceType = 'OWNED' | 'PARTNER' | 'PUBLIC';

export type UserRole = 'viewer' | 'contributor' | 'editor' | 'admin';

export type RightsStatus = 'REVIEW' | 'APPROVED';

export type TimeshiftStoragePolicy = 
  | 'IN_MEMORY_EPHEMERAL' 
  | 'CLIENT_INDEXEDDB' 
  | 'DISABLED_BY_RIGHTSHOLDER';

export interface TimeshiftPolicy {
  allowed: boolean;
  maxBufferMinutes: number; // e.g. 15, 30, 60, 120 minutes
  storagePolicy: TimeshiftStoragePolicy;
  rightsHolderAttribution?: string;
  allowOfflineCache?: boolean;
}

export interface EpgProgram {
  id: string;
  channelId: string;
  title: string;
  description: string;
  startTime: string; // HH:MM or ISO
  endTime: string;
  durationMinutes: number;
  category: ContentCategory;
  rating?: string;
  isCurrent?: boolean;
}

export interface BroadcastItem {
  id: string;
  channelNumber?: number;
  title: string;
  category: ContentCategory | 'breaking' | 'national' | 'citizen' | 'investigative' | 'economy' | 'tech';
  categoryLabel: string;
  reporter?: string;
  location: string;
  duration: number; // in seconds
  videoUrl: string; // HLS .m3u8, direct mp4 or embed
  hlsUrl?: string; // Direct HLS stream URL for HLS.js
  backupStreams?: string[]; // Resilient backup stream URLs
  streamType?: StreamProtocol;
  youtubeId?: string; // YouTube video/live ID for free playout
  backupYoutubeIds?: string[]; // Alternative YouTube video/live IDs for the same channel
  youtubeChannelId?: string; // YouTube Channel ID (UC...) for 24/7 real-time live streaming
  sourceNetwork?: string;
  thumbnailUrl: string;
  logoUrl?: string;
  regulatoryApproved: boolean;
  complianceScore: number;
  uploadedAt: string;
  views: number;
  isLive?: boolean;
  isShort?: boolean;
  description: string;
  openSourceLicense: string;
  currentProgramTitle?: string;
  currentProgramCategory?: string;
  epgSchedule?: EpgProgram[];
  
  // Open IPTV Federation Sovereign Properties
  ownerCommunityId?: string;
  communityName?: string;
  distributionScope?: DistributionScope;
  classificationTaxonomy?: {
    country: string;
    region: string;
    language: string;
    ageClass: 'ALL' | '12+' | '16+' | '18+';
    editorialClass: 'STANDARD' | 'VERIFIED_INVESTIGATIVE' | 'COMMUNITY_DISPATCH';
  };
  contentHash?: string;
  metadataHash?: string;
  federationReversible?: boolean;
  timeshiftPolicy?: TimeshiftPolicy;

  // Rights Ledger Properties
  rightsHolder: string;
  licenceType: LicenceType | '';
  licenceUrl: string;
  territory: string;
  expiry: string;
  rightsStatus?: RightsStatus;
  requestedLicenceType?: LicenceType;
}

const BLOCKED_LICENCE_URL_SUBSTRINGS = ['example.com', 'placeholder', 'test'];

export function parseExpiryDate(expiry?: string): Date | null {
  const trimmed = (expiry || '').trim();
  if (!trimmed) return null;

  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export function getExpiryStatus(expiry?: string): {
  isEmptyOrInvalid: boolean;
  isExpired: boolean;
  isWithin30Days: boolean;
  isRedWarning: boolean;
} {
  const expiryDate = parseExpiryDate(expiry);
  if (!expiryDate) {
    return {
      isEmptyOrInvalid: true,
      isExpired: false,
      isWithin30Days: false,
      isRedWarning: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.floor((expiryDate.getTime() - today.getTime()) / msPerDay);
  const isExpired = daysRemaining < 0;
  const isWithin30Days = daysRemaining >= 0 && daysRemaining <= 30;

  return {
    isEmptyOrInvalid: false,
    isExpired,
    isWithin30Days,
    isRedWarning: isExpired || isWithin30Days,
  };
}

export function isVisibleInPublicGuide(item: BroadcastItem): boolean {
  if (!item.rightsHolder?.trim()) {
    return false;
  }

  const rawLicenceUrl = (item.licenceUrl || '').trim();
  if (!rawLicenceUrl) {
    return false;
  }

  const lowerLicenceUrl = rawLicenceUrl.toLowerCase();
  if (BLOCKED_LICENCE_URL_SUBSTRINGS.some((token) => lowerLicenceUrl.includes(token))) {
    return false;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawLicenceUrl);
  } catch {
    return false;
  }
  if (parsedUrl.protocol !== 'https:') {
    return false;
  }

  const expiryDate = parseExpiryDate(item.expiry);
  if (!expiryDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (expiryDate.getTime() < today.getTime()) {
    return false;
  }

  if (item.rightsStatus === 'REVIEW') {
    return false;
  }

  if (
    item.licenceType !== 'OWNED' &&
    item.licenceType !== 'PARTNER' &&
    item.licenceType !== 'PUBLIC'
  ) {
    return false;
  }

  return true;
}

export interface RegulatoryDeclaration {
  factualAccuracy: boolean;
  noHateSpeechOrDefamation: boolean;
  copyrightClearance: boolean;
  noThirdPartyWatermark: boolean;
  publicInterestCompliance: boolean;
  distributionScopeExplicitConsent: boolean;
  communitySovereigntyAcknowledged: boolean;
}

export interface PlayoutStatus {
  currentProgramId: string;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  quality: '1080p' | '720p' | '480p' | 'auto';
  serverUptime: string;
  activeBitrate: string;
  fps: number;
  droppedFrames: number;
  logoPosition: 'top-right' | 'top-left';
  autoLoopEnabled: boolean;
  emergencyOverrideActive?: boolean;
}

export interface CommunityNode {
  id: string;
  name: string;
  domain: string;
  country: string;
  region: string;
  language: string;
  operator: string;
  relationship: FederationRelationship;
  allowedCategories: string[];
  deniedCategories: string[];
  totalChannels: number;
  activeStreams: number;
  trustScore: number;
  isReferenceNode?: boolean;
  lastSync: string;
}

export interface FederationAuditRecord {
  eventId: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  communityId: string;
  action: string;
  targetResource: string;
  result: 'SUCCESS' | 'DENIED' | 'REVOKED' | 'ISOLATED';
  policyVersion: string;
  signature: string;
}

export interface EmergencyKillSwitchState {
  globalFederationPause: boolean;
  communityFederationPause: boolean;
  channelDisable: boolean;
  streamDisable: boolean;
  userDisable: boolean;
  apiDisable: boolean;
}

export interface AiModerationResult {
  id: string;
  title: string;
  detectedLanguage: string;
  suggestedCategory: ContentCategory;
  suggestedAgeRating: 'ALL' | '12+' | '16+' | '18+';
  complianceStatus: 'APPROVED' | 'FLAGGED_FOR_REVIEW' | 'REJECTED';
  riskScore: number; // 0 to 100
  policyChecks: {
    noHateSpeech: boolean;
    noGraphicViolence: boolean;
    licensingAwareness: boolean;
    privacyRespect: boolean;
    noPropaganda: boolean;
  };
  reasoning: string;
  reviewedByHuman?: boolean;
  reviewerNotes?: string;
  timestamp: string;
}

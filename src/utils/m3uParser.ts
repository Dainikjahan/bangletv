import { BroadcastItem, ContentCategory } from '../types/broadcast';

// Private and reserved IP blocks that are forbidden to access (SSRF prevention)
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^metadata\.google\.internal$/i,
  /^100\.64\./,
  /^::1$/,
];

export function validateSafeUrl(rawUrl: string): { valid: boolean; reason?: string } {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return { valid: false, reason: 'URL cannot be empty' };
  }
  try {
    // Strip trailing VLC/Kodi pipe parameters (e.g., http://stream.m3u8|User-Agent=...)
    const cleanUrl = rawUrl.trim().split('|')[0].trim();
    const url = new URL(cleanUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, reason: `Unsupported protocol: ${url.protocol}` };
    }
    const hostname = url.hostname.toLowerCase();
    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, reason: `Private/internal address blocked for security: ${hostname}` };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Malformed URL' };
  }
}

export function mapGroupToCategory(groupTitle?: string): ContentCategory {
  if (!groupTitle) return 'NEWS';
  const g = groupTitle.toUpperCase();
  if (g.includes('SPORT') || g.includes('CRICKET') || g.includes('FOOTBALL') || g.includes('RACING')) return 'SPORTS';
  if (g.includes('EDU') || g.includes('LEARN') || g.includes('SCHOOL')) return 'EDUCATION';
  if (g.includes('SCI') || g.includes('SPACE') || g.includes('TECH') || g.includes('IT')) return 'SCIENCE';
  if (g.includes('CULT') || g.includes('HERITAGE') || g.includes('HISTORY')) return 'CULTURE';
  if (g.includes('DOC') || g.includes('DISCOVERY') || g.includes('INVESTIGAT') || g.includes('WILD')) return 'DOCUMENTARY';
  if (g.includes('ENT') || g.includes('DRAMA') || g.includes('MOVIE') || g.includes('CINEMA') || g.includes('SERIES') || g.includes('FILM')) return 'ENTERTAINMENT';
  if (g.includes('MUSIC') || g.includes('SONG') || g.includes('BEAT') || g.includes('RADIO')) return 'MUSIC';
  if (g.includes('RELIG') || g.includes('ISLAM') || g.includes('PEACE') || g.includes('QURAN') || g.includes('HARAMAIN') || g.includes('SPIRIT')) return 'RELIGION';
  if (g.includes('COMMUN') || g.includes('LOCAL') || g.includes('REGIONAL') || g.includes('LIFESTYLE')) return 'COMMUNITY';
  if (g.includes('PUBLIC') || g.includes('PARLIAMENT') || g.includes('SANGSAD') || g.includes('GOV')) return 'PUBLIC_SERVICE';
  if (g.includes('KID') || g.includes('CHILD') || g.includes('ANIMATION') || g.includes('CARTOON') || g.includes('BABY')) return 'CHILDREN';
  if (g.includes('LIVE') || g.includes('BREAKING') || g.includes('NEWS') || g.includes('INFO') || g.includes('WEATHER')) return 'NEWS';
  return 'NEWS';
}

export interface ParseM3uResult {
  channels: BroadcastItem[];
  errors: string[];
  totalParsed: number;
}

export function parseM3uContent(
  content: string, 
  communityId: string = 'comm-local-node',
  maxChannels: number = 5000
): ParseM3uResult {
  const lines = content.split(/\r?\n/);
  const channels: BroadcastItem[] = [];
  const errors: string[] = [];

  let pendingHeader: {
    name: string;
    logo?: string;
    groupTitle?: string;
    tvgId?: string;
    language?: string;
    country?: string;
  } | null = null;

  const limit = maxChannels > 0 ? maxChannels : Infinity;

  for (let i = 0; i < lines.length; i++) {
    if (channels.length >= limit) break;
    const raw = lines[i]?.trim();
    if (!raw) continue;

    if (raw.startsWith('#EXTINF:')) {
      // Parse #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Channel Name
      const commaIdx = raw.lastIndexOf(',');
      const displayName = commaIdx !== -1 ? raw.substring(commaIdx + 1).trim() : 'Unnamed Channel';
      const headerProps = commaIdx !== -1 ? raw.substring(0, commaIdx) : raw;

      // Extract attributes cleanly
      const getAttr = (key: string): string | undefined => {
        const match = headerProps.match(new RegExp(`${key}="([^"]*)"`, 'i'));
        return match ? match[1] : undefined;
      };

      pendingHeader = {
        name: displayName || getAttr('tvg-name') || 'IPTV Channel',
        logo: getAttr('tvg-logo'),
        groupTitle: getAttr('group-title'),
        tvgId: getAttr('tvg-id'),
        language: getAttr('tvg-language') || 'Bengali',
        country: getAttr('tvg-country') || 'Bangladesh',
      };
      continue;
    }

    if (raw.startsWith('#')) {
      // Skip comments / metadata tags like #EXTVLCOPT
      continue;
    }

    // Line is a stream URL
    if (pendingHeader && (raw.startsWith('http://') || raw.startsWith('https://'))) {
      const cleanStreamUrl = raw.split('|')[0].trim();
      const validation = validateSafeUrl(cleanStreamUrl);
      if (!validation.valid) {
        if (errors.length < 20) {
          errors.push(`[${pendingHeader.name}] Skipped: ${validation.reason}`);
        }
        pendingHeader = null;
        continue;
      }

      const category = mapGroupToCategory(pendingHeader.groupTitle);
      const isHls = cleanStreamUrl.includes('.m3u8') || cleanStreamUrl.includes('/hls');
      
      // Detect YouTube URL
      const ytMatch = cleanStreamUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      const youtubeId = ytMatch ? ytMatch[1] : undefined;

      channels.push({
        id: `m3u-${channels.length + 1}-${Math.random().toString(36).substring(2, 8)}`,
        channelNumber: channels.length + 1,
        title: pendingHeader.name,
        category,
        categoryLabel: pendingHeader.groupTitle || category,
        location: pendingHeader.country || 'Global Stream',
        duration: 3600,
        videoUrl: cleanStreamUrl,
        youtubeId,
        hlsUrl: isHls ? cleanStreamUrl : undefined,
        streamType: youtubeId ? 'youtube' : (isHls ? 'hls' : 'direct'),
        thumbnailUrl: pendingHeader.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80',
        logoUrl: pendingHeader.logo,
        regulatoryApproved: true,
        complianceScore: 100,
        uploadedAt: 'M3U Ingest Engine',
        views: 1200,
        isLive: true,
        description: `Imported via Open IPTV Federation M3U Engine. ${pendingHeader.groupTitle ? `Category: ${pendingHeader.groupTitle}` : ''} ${pendingHeader.country ? `Country: ${pendingHeader.country}` : ''}`.trim(),
        openSourceLicense: 'Community Ingest License',
        ownerCommunityId: communityId,
        distributionScope: 'COMMUNITY_ONLY',
        classificationTaxonomy: {
          country: pendingHeader.country || 'Global',
          region: 'Local Node',
          language: pendingHeader.language || 'bn',
          ageClass: 'ALL',
          editorialClass: 'STANDARD',
        },
      });

      pendingHeader = null;
    }
  }

  return {
    channels,
    errors,
    totalParsed: channels.length,
  };
}
